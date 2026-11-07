const path = require('node:path');
const fs = require('node:fs');
const { randomUUID, createHash, randomBytes } = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const multer = require('multer');
const { z } = require('zod');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT || 3000);
const bindHost = process.env.BIND_HOST || '0.0.0.0';
const prod = process.env.NODE_ENV === 'production';
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
const secret = process.env.JWT_SECRET || '';
if (secret.length < 32 || secret.includes('replace-with')) throw new Error('Set a random JWT_SECRET of at least 32 characters in backend/.env.');
if (!process.env.DB_PASSWORD) throw new Error('Set DB_PASSWORD in backend/.env before starting the API.');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'dbcm_app', password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'dbcm_portal', waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10), queueLimit: 0,
  charset: 'utf8mb4', decimalNumbers: true, timezone: 'Z',
  ssl: process.env.DB_SSL === 'true' ? { ca: process.env.DB_SSL_CA ? fs.readFileSync(path.resolve(process.env.DB_SSL_CA)) : undefined, rejectUnauthorized: true } : undefined
});
const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './storage/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase().slice(0, 10)}`)
  }),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation']);
    if (allowed.has(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Only PDF, PNG, JPG, and DOCX files are allowed.'), { status: 400 }));
  }
});
function sendInlineFile(res, storedName, mimeType, originalName) {
  const safeName = String(originalName || storedName || 'document').replace(/[^a-zA-Z0-9_.-]/g, '_');
  if (mimeType) res.type(mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.sendFile(path.join(uploadDir, path.basename(storedName)));
}

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: frontendOrigin.split(',').map(s => s.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
const passwordResetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api', (req, res, next) => { res.setHeader('Cache-Control','no-store'); next(); });

const sessionCookie = { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true' || prod, sameSite: 'strict', path: '/api', maxAge: 8 * 60 * 60 * 1000 };
const publicUser = user => ({ id:user.id, username:user.username, email:user.email, name:user.display_name, role:user.role, departmentId:user.department_id, departmentName:user.department_name || null, designation:user.designation || '', qualification:user.qualification || '', specialization:user.specialization || '' });
const fail = (res, status, message) => res.status(status).json({ error: message });
async function audit(req, action, entityType, entityId, details = {}) {
  try { await pool.execute('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,ip_address,details) VALUES(?,?,?,?,?,?)',[req.user?.id || null,action,entityType,entityId || null,req.ip,JSON.stringify(details)]); } catch (e) { console.error('Audit write failed:', e.message); }
}
async function auth(req, res, next) {
  try {
    const token = req.cookies.dbcm_session || (req.headers.authorization || '').replace(/^Bearer\s+/i,'');
    if (!token) return fail(res,401,'Please sign in.');
    const claims = jwt.verify(token, secret, { algorithms:['HS256'], issuer:'dbcm-portal', audience:'dbcm-frontend' });
    const [rows] = await pool.execute(`SELECT u.*, d.name AS department_name FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.id=? AND u.is_active=1`,[claims.sub]);
    if (!rows[0]) return fail(res,401,'Account is inactive or missing.');
    req.user = publicUser(rows[0]); next();
  } catch { return fail(res,401,'Session expired. Please sign in again.'); }
}
const adminOnly = (req,res,next) => req.user?.role === 'admin' ? next() : fail(res,403,'Administrator access required.');
const teacherOnly = (req,res,next) => req.user?.role === 'teacher' ? next() : fail(res,403,'Teacher access required.');
async function departmentScope(req,res,next) {
  if (req.user.role === 'admin') return next();
  const subjectId = req.params.subjectId || req.body?.subjectId;
  const contributionId = req.params.contributionId || req.params.id || req.body?.contributionId;
  try {
    if (subjectId) {
      const [rows] = await pool.execute('SELECT department_id FROM subjects WHERE id=?',[subjectId]);
      if (!rows[0]) return fail(res,404,'Subject not found.');
      if (rows[0].department_id !== req.user.departmentId) return fail(res,403,'This subject is outside your department.');
    } else if (contributionId) {
      const [rows] = await pool.execute('SELECT department_id FROM contributions WHERE id=?',[contributionId]);
      if (!rows[0]) return fail(res,404,'Contribution not found.');
      if (rows[0].department_id !== req.user.departmentId) return fail(res,403,'This contribution is outside your department.');
    }
    next();
  } catch (e) { next(e); }
}

app.get('/api/health', async (_req,res) => {
  try { await pool.query('SELECT 1'); res.json({ ok:true, database:'connected' }); }
  catch { res.status(503).json({ ok:false, database:'unavailable' }); }
});

app.post('/api/auth/login', async (req,res,next) => {
  try {
    const body = z.object({ username:z.string().min(1).max(254), password:z.string().min(1).max(200), role:z.enum(['admin','teacher']) }).parse(req.body);
    const login = body.username.trim().toLowerCase();
    const [rows] = await pool.execute('SELECT u.*, d.name AS department_name FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE (LOWER(u.username)=? OR LOWER(u.email)=?) AND u.role=? LIMIT 1',[login,login,body.role]);
    const user = rows[0];
    if (!user || !user.is_active || (user.locked_until && new Date(user.locked_until) > new Date()) || !(await bcrypt.compare(body.password,user.password_hash))) {
      if (user) await pool.execute('UPDATE users SET failed_login_attempts=failed_login_attempts+1, locked_until=IF(failed_login_attempts+1>=8,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 15 MINUTE),locked_until) WHERE id=?',[user.id]);
      await audit(req,'auth.login_failed','user',user?.id,{role:body.role}); return fail(res,401,'Invalid username or password.');
    }
    await pool.execute('UPDATE users SET failed_login_attempts=0,locked_until=NULL WHERE id=?',[user.id]);
    const token = jwt.sign({ role:user.role },secret,{ subject:user.id,algorithm:'HS256',expiresIn:process.env.JWT_EXPIRES_IN || '8h',issuer:'dbcm-portal',audience:'dbcm-frontend' });
    res.cookie('dbcm_session',token,sessionCookie);
    await audit(req,'auth.login','user',user.id,{role:user.role});
    res.json({ user:publicUser(user) });
  } catch(e) { next(e); }
});
app.get('/api/auth/me',auth,(req,res)=>res.json({user:req.user}));
app.post('/api/auth/logout',auth,async(req,res)=>{ await audit(req,'auth.logout','user',req.user.id); res.clearCookie('dbcm_session',{...sessionCookie,maxAge:undefined}); res.json({ok:true}); });
app.post('/api/auth/teacher/change-password',auth,teacherOnly,async(req,res,next)=>{try{const b=z.object({currentPassword:z.string().min(1).max(200),newPassword:z.string().min(12).max(200)}).parse(req.body);const [rows]=await pool.execute("SELECT password_hash FROM users WHERE id=? AND role='teacher' AND is_active=1",[req.user.id]);if(!rows[0]||!(await bcrypt.compare(b.currentPassword,rows[0].password_hash)))return fail(res,400,'Current password is incorrect.');const hash=await bcrypt.hash(b.newPassword,12);await pool.execute("UPDATE users SET password_hash=?,failed_login_attempts=0,locked_until=NULL WHERE id=? AND role='teacher'",[hash,req.user.id]);await audit(req,'teacher.password_change','user',req.user.id);res.json({ok:true});}catch(e){next(e);}});
app.post('/api/auth/teacher/reset-password',passwordResetLimiter,async(req,res,next)=>{const conn=await pool.getConnection();try{const b=z.object({identifier:z.string().trim().min(3).max(254),resetCode:z.string().min(32).max(128),newPassword:z.string().min(12).max(200)}).parse(req.body);const identifier=b.identifier.toLowerCase();const codeParts=b.resetCode.split('.');if(codeParts.length!==3||codeParts[0]!=='RST'||!/^[0-9a-f-]{36}$/i.test(codeParts[1]))return fail(res,400,'The teacher account or reset code is invalid, expired, or already used.');const targetId=codeParts[1];const codeHash=createHash('sha256').update(b.resetCode).digest('hex');const passwordHash=await bcrypt.hash(b.newPassword,12);await conn.beginTransaction();const [codes]=await conn.execute("SELECT r.id,r.used_by user_id FROM registration_codes r JOIN users u ON u.id=r.used_by WHERE u.id=? AND (LOWER(u.username)=? OR LOWER(u.email)=?) AND u.role='teacher' AND u.is_active=1 AND r.department_id=u.department_id AND r.code_hash=? AND r.used_at IS NULL AND r.expires_at>UTC_TIMESTAMP() FOR UPDATE",[targetId,identifier,identifier,codeHash]);if(!codes[0]){await conn.rollback();return fail(res,400,'The teacher account or reset code is invalid, expired, or already used.');}await conn.execute("UPDATE users SET password_hash=?,failed_login_attempts=0,locked_until=NULL WHERE id=? AND role='teacher'",[passwordHash,codes[0].user_id]);await conn.execute('UPDATE registration_codes SET used_at=UTC_TIMESTAMP() WHERE id=?',[codes[0].id]);await conn.commit();await audit(req,'teacher.password_reset','user',codes[0].user_id);res.json({ok:true});}catch(e){await conn.rollback().catch(()=>{});next(e);}finally{conn.release();}});

app.post('/api/auth/register', async(req,res,next)=>{
  const conn=await pool.getConnection();
  try {
    const b=z.object({name:z.string().trim().min(2).max(160),email:z.string().trim().email().max(254),username:z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),password:z.string().min(12).max(200),departmentId:z.string().min(1).max(64),designation:z.string().max(160).optional(),qualification:z.string().max(255).optional(),specialization:z.string().max(255).optional(),registrationCode:z.string().min(16).max(128)}).parse(req.body);
    await conn.beginTransaction();
    const digest=createHash('sha256').update(b.registrationCode).digest('hex');
    const [codes]=await conn.execute('SELECT * FROM registration_codes WHERE code_hash=? AND department_id=? AND used_by IS NULL AND expires_at>UTC_TIMESTAMP() FOR UPDATE',[digest,b.departmentId]);
    if(!codes[0]){await conn.rollback();return fail(res,400,'Registration code is invalid, expired, or already used.');}
    const [dept]=await conn.execute('SELECT id FROM departments WHERE id=?',[b.departmentId]);
    if(!dept[0]){await conn.rollback();return fail(res,400,'Select a valid department.');}
    const id=randomUUID(); const hash=await bcrypt.hash(b.password,12);
    await conn.execute("INSERT INTO users(id,email,username,display_name,password_hash,role,department_id,designation,qualification,specialization) VALUES(?,?,?,?,?,'teacher',?,?,?,?)",[id,b.email.toLowerCase(),b.username,b.name,hash,b.departmentId,b.designation||null,b.qualification||null,b.specialization||null]);
    await conn.execute('UPDATE registration_codes SET used_by=?,used_at=UTC_TIMESTAMP() WHERE id=?',[id,codes[0].id]);
    await conn.commit();
    const [rows]=await pool.execute('SELECT u.*,d.name AS department_name FROM users u JOIN departments d ON d.id=u.department_id WHERE u.id=?',[id]);
    const token=jwt.sign({role:'teacher'},secret,{subject:id,algorithm:'HS256',expiresIn:process.env.JWT_EXPIRES_IN||'8h',issuer:'dbcm-portal',audience:'dbcm-frontend'});
    res.cookie('dbcm_session',token,sessionCookie); await audit(req,'teacher.register','user',id,{departmentId:b.departmentId}); res.status(201).json({user:publicUser(rows[0])});
  } catch(e){await conn.rollback().catch(()=>{}); if(e.code==='ER_DUP_ENTRY') return fail(res,409,'Email or username is already registered.'); next(e);} finally{conn.release();}
});

app.get('/api/admin/teachers',auth,adminOnly,async(_req,res,next)=>{try{const [rows]=await pool.query("SELECT u.id,u.username,u.email,u.display_name,u.role,u.department_id,d.name department_name,u.designation,u.is_active,u.created_at FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.role='teacher' ORDER BY d.name,u.display_name");res.json({teachers:rows});}catch(e){next(e);}});
app.post('/api/admin/teachers',auth,adminOnly,async(req,res,next)=>{try{const b=z.object({name:z.string().trim().min(2).max(160),email:z.string().trim().email().max(254),username:z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),password:z.string().min(12).max(200),departmentId:z.string().min(1).max(64),designation:z.string().max(160).optional(),qualification:z.string().max(255).optional(),specialization:z.string().max(255).optional(),issueRegistrationCode:z.boolean().default(false)}).parse(req.body);const email=b.email.toLowerCase(),username=b.username.toLowerCase();const [matches]=await pool.execute('SELECT LOWER(email)=? AS email_match,LOWER(username)=? AS username_match FROM users WHERE LOWER(email)=? OR LOWER(username)=? LIMIT 1',[email,username,email,username]);if(matches[0]?.username_match)return fail(res,409,'That username is already in use. Choose a different username.');if(matches[0]?.email_match)return fail(res,409,'That email address is already registered.');const id=randomUUID(),hash=await bcrypt.hash(b.password,12);await pool.execute("INSERT INTO users(id,email,username,display_name,password_hash,role,department_id,designation,qualification,specialization) VALUES(?,?,?,?,?,'teacher',?,?,?,?)",[id,email,b.username,b.name,hash,b.departmentId,b.designation||null,b.qualification||null,b.specialization||null]);let code=null;if(b.issueRegistrationCode){code=randomBytes(24).toString('base64url');const hours=Number(process.env.REGISTRATION_CODE_TTL_HOURS||72);await pool.execute('INSERT INTO registration_codes(id,code_hash,department_id,created_by,expires_at) VALUES(?,?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? HOUR))',[randomUUID(),createHash('sha256').update(code).digest('hex'),b.departmentId,req.user.id,hours]);}await audit(req,'teacher.create','user',id,{departmentId:b.departmentId});res.status(201).json({teacher:{id,username:b.username,email,name:b.name,departmentId:b.departmentId},registrationCode:code});}catch(e){if(e.code==='ER_DUP_ENTRY')return fail(res,409,'That email address or username is already in use.');next(e);}});
app.patch('/api/admin/teachers/:id',auth,adminOnly,async(req,res,next)=>{try{const b=z.object({active:z.boolean()}).parse(req.body);const [result]=await pool.execute("UPDATE users SET is_active=? WHERE id=? AND role='teacher'",[b.active,req.params.id]);if(!result.affectedRows)return fail(res,404,'Teacher account not found.');await audit(req,'teacher.update','user',req.params.id,{active:b.active});res.json({ok:true});}catch(e){next(e);}});
app.post('/api/admin/teachers/:id/password-reset-codes',auth,adminOnly,async(req,res,next)=>{try{const [teachers]=await pool.execute("SELECT id,display_name,email,department_id FROM users WHERE id=? AND role='teacher' AND is_active=1",[req.params.id]);if(!teachers[0])return fail(res,404,'Active teacher account not found.');const teacher=teachers[0];const code=`RST.${teacher.id}.${randomBytes(32).toString('base64url')}`;const expiresMinutes=30;await pool.execute('UPDATE registration_codes SET used_at=UTC_TIMESTAMP() WHERE used_by=? AND used_at IS NULL',[teacher.id]);await pool.execute('INSERT INTO registration_codes(id,code_hash,department_id,created_by,expires_at,used_by) VALUES(?,?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? MINUTE),?)',[randomUUID(),createHash('sha256').update(code).digest('hex'),teacher.department_id,req.user.id,expiresMinutes,teacher.id]);await audit(req,'teacher.password_reset_code_issue','user',teacher.id,{expiresMinutes});res.status(201).json({resetCode:code,expiresInMinutes:expiresMinutes,teacher:{id:teacher.id,name:teacher.display_name,email:teacher.email,departmentId:teacher.department_id}});}catch(e){next(e);}});
app.post('/api/admin/registration-codes',auth,adminOnly,async(req,res,next)=>{try{const b=z.object({departmentId:z.string().min(1).max(64),expiresInHours:z.number().int().min(1).max(720).default(72)}).parse(req.body);const code=randomBytes(24).toString('base64url');await pool.execute('INSERT INTO registration_codes(id,code_hash,department_id,created_by,expires_at) VALUES(?,?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? HOUR))',[randomUUID(),createHash('sha256').update(code).digest('hex'),b.departmentId,req.user.id,b.expiresInHours]);res.status(201).json({registrationCode:code});}catch(e){next(e);}});
app.get('/api/subjects',auth,async(req,res,next)=>{try{const where=req.user.role==='teacher'?'WHERE s.department_id=?':'';const params=req.user.role==='teacher'?[req.user.departmentId]:[];const [rows]=await pool.execute(`SELECT s.*,d.name department_name,(SELECT COUNT(*) FROM materials m WHERE m.subject_id=s.id) material_count,(SELECT COUNT(*) FROM materials m WHERE m.subject_id=s.id AND m.category='notes') notes_count,(SELECT COUNT(*) FROM materials m WHERE m.subject_id=s.id AND m.category='pyqs') pyqs_count,(SELECT COUNT(*) FROM contributions c WHERE c.subject_id=s.id AND c.status='pending') pending_contributions FROM subjects s JOIN departments d ON d.id=s.department_id ${where} ORDER BY d.name,s.program_level,s.semester,s.code`,params);res.json({subjects:rows});}catch(e){next(e);}});
app.get('/api/subjects/counts',auth,async(req,res,next)=>{try{const [rows]=await pool.execute(`SELECT d.id department_id,d.name department_name,COUNT(DISTINCT s.id) subject_count,COUNT(DISTINCT m.id) material_count,COUNT(DISTINCT CASE WHEN c.status='pending' THEN c.id END) pending_contribution_count FROM departments d LEFT JOIN subjects s ON s.department_id=d.id LEFT JOIN materials m ON m.subject_id=s.id LEFT JOIN contributions c ON c.subject_id=s.id ${req.user.role==='teacher'?'WHERE d.id=?':''} GROUP BY d.id,d.name ORDER BY d.name`,req.user.role==='teacher'?[req.user.departmentId]:[]);res.json({counts:rows});}catch(e){next(e);}});
app.get('/api/public/materials/:id/file',async(req,res,next)=>{try{const [rows]=await pool.execute('SELECT stored_name,mime_type,file_name FROM materials WHERE id=?',[req.params.id]);if(!rows[0]?.stored_name)return fail(res,404,'File not found.');sendInlineFile(res,rows[0].stored_name,rows[0].mime_type,rows[0].file_name);}catch(e){next(e);}});
app.get('/api/public/counts',async(_req,res,next)=>{try{const [rows]=await pool.query('SELECT d.id department_id,d.name department_name,COUNT(DISTINCT s.id) subject_count,COUNT(DISTINCT m.id) material_count FROM departments d LEFT JOIN subjects s ON s.department_id=d.id LEFT JOIN materials m ON m.subject_id=s.id GROUP BY d.id,d.name ORDER BY d.name');res.json({counts:rows});}catch(e){next(e);}});
app.get('/api/public/materials',async(_req,res,next)=>{try{const [rows]=await pool.query(`SELECT m.id,m.subject_id subjectId,m.category,m.title,m.file_name fileName,m.mime_type mimeType,m.file_size fileSize,m.stored_name storedName,m.external_url externalUrl,m.metadata,m.created_at createdAt FROM materials m JOIN subjects s ON s.id=m.subject_id ORDER BY m.created_at DESC`);res.json({materials:rows.map(m=>({...m,pdfUrl:m.storedName?`/api/public/materials/${m.id}/file`:null}))});}catch(e){next(e);}});
app.post('/api/admin/subjects/sync',auth,adminOnly,async(req,res,next)=>{const conn=await pool.getConnection();try{const b=z.object({subjects:z.array(z.object({id:z.string().min(1).max(128),code:z.string().max(64),name:z.string().max(255),departmentId:z.string().max(64),programLevel:z.enum(['UG','PG']).optional(),semester:z.union([z.string(),z.number()]).optional(),track:z.string().max(64).optional(),credits:z.number().optional(),syllabus: z.any().optional()}).passthrough()).max(5000)}).parse(req.body);await conn.beginTransaction();for(const s of b.subjects){await conn.execute(`INSERT INTO subjects(id,code,name,department_id,program_level,semester,track,credits,syllabus_json) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE code=VALUES(code),name=VALUES(name),department_id=VALUES(department_id),program_level=VALUES(program_level),semester=VALUES(semester),track=VALUES(track),credits=VALUES(credits),syllabus_json=VALUES(syllabus_json)`,[s.id,s.code,s.name,s.departmentId,(s.programLevel||'UG').toUpperCase(),String(s.semester||''),s.track||null,s.credits||null,s.syllabus?JSON.stringify(s.syllabus):null]);}await conn.commit();await audit(req,'subjects.sync','curriculum',null,{count:b.subjects.length});res.json({synced:b.subjects.length});}catch(e){await conn.rollback().catch(()=>{});next(e);}finally{conn.release();}});
app.post('/api/subjects/:subjectId/materials',auth,teacherOnly,departmentScope,upload.single('file'),async(req,res,next)=>{try{const b=z.object({category:z.enum(['notes','syllabus','pyqs','videos','questions']),title:z.string().trim().min(1).max(255),externalUrl:z.string().url().max(2048).optional(),metadata:z.string().optional()}).parse(req.body);if(!req.file&&!b.externalUrl)return fail(res,400,'Upload a file or provide a video URL.');const id=randomUUID();await pool.execute('INSERT INTO materials(id,subject_id,uploaded_by,category,title,file_name,stored_name,mime_type,file_size,external_url,metadata) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[id,req.params.subjectId,req.user.id,b.category,b.title,req.file?.originalname||null,req.file?.filename||null,req.file?.mimetype||null,req.file?.size||null,b.externalUrl||null,b.metadata?JSON.stringify(JSON.parse(b.metadata)):null]);await audit(req,'material.create','material',id,{subjectId:req.params.subjectId,category:b.category});res.status(201).json({material:{id,subjectId:req.params.subjectId,category:b.category,title:b.title,fileName:req.file?.originalname||null,externalUrl:b.externalUrl||null}});}catch(e){if(req.file)fs.promises.unlink(req.file.path).catch(()=>{});next(e);}});
app.post('/api/admin/subjects/:subjectId/materials',auth,adminOnly,upload.single('file'),async(req,res,next)=>{try{const b=z.object({category:z.enum(['notes','syllabus','pyqs','videos','questions']),title:z.string().trim().min(1).max(255),externalUrl:z.string().url().max(2048).optional(),metadata:z.string().optional()}).parse(req.body);const [subjects]=await pool.execute('SELECT id FROM subjects WHERE id=?',[req.params.subjectId]);if(!subjects[0])return fail(res,404,'Subject not found.');if(!req.file&&!b.externalUrl)return fail(res,400,'Upload a file or provide a video URL.');const id=randomUUID();await pool.execute('INSERT INTO materials(id,subject_id,uploaded_by,category,title,file_name,stored_name,mime_type,file_size,external_url,metadata) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[id,req.params.subjectId,req.user.id,b.category,b.title,req.file?.originalname||null,req.file?.filename||null,req.file?.mimetype||null,req.file?.size||null,b.externalUrl||null,b.metadata?JSON.stringify(JSON.parse(b.metadata)):null]);await audit(req,'material.create','material',id,{subjectId:req.params.subjectId,category:b.category});res.status(201).json({material:{id,subjectId:req.params.subjectId,category:b.category,title:b.title}});}catch(e){if(req.file)fs.promises.unlink(req.file.path).catch(()=>{});next(e);}});
app.get('/api/materials/mine',auth,teacherOnly,async(req,res,next)=>{try{const [rows]=await pool.execute("SELECT m.id uploadId,m.id,m.subject_id subjectId,s.code subjectCode,s.name subjectName,s.department_id departmentId,m.category,m.title,m.file_name fileName,m.file_size fileSize,m.external_url videoUrl,m.uploaded_by uploadedBy,DATE_FORMAT(m.created_at,'%d %b %Y') uploadDate,m.metadata FROM materials m JOIN subjects s ON s.id=m.subject_id WHERE s.department_id=? ORDER BY m.created_at DESC",[req.user.departmentId]);res.json({materials:rows.map(m=>({...m,pdfUrl:m.fileName?`/api/public/materials/${m.id}/file`:null}))});}catch(e){next(e);}});
app.get('/api/materials/:id/file',auth,async(req,res,next)=>{try{const [rows]=await pool.execute('SELECT m.stored_name,m.mime_type,m.file_name,s.department_id FROM materials m JOIN subjects s ON s.id=m.subject_id WHERE m.id=?',[req.params.id]);if(!rows[0])return fail(res,404,'File not found.');if(req.user.role==='teacher'&&rows[0].department_id!==req.user.departmentId)return fail(res,403,'This material is outside your department.');if(!rows[0].stored_name)return fail(res,404,'This material has no file.');sendInlineFile(res,rows[0].stored_name,rows[0].mime_type,rows[0].file_name);}catch(e){next(e);}});
app.delete('/api/materials/:id',auth,teacherOnly,async(req,res,next)=>{try{const [rows]=await pool.execute('SELECT m.stored_name,s.department_id FROM materials m JOIN subjects s ON s.id=m.subject_id WHERE m.id=?',[req.params.id]);if(!rows[0])return fail(res,404,'Material not found.');if(rows[0].department_id!==req.user.departmentId)return fail(res,403,'This material is outside your department.');await pool.execute('DELETE FROM materials WHERE id=?',[req.params.id]);if(rows[0].stored_name)fs.promises.unlink(path.join(uploadDir,rows[0].stored_name)).catch(()=>{});await audit(req,'material.delete','material',req.params.id);res.json({ok:true});}catch(e){next(e);}});
app.patch('/api/materials/:id',auth,teacherOnly,async(req,res,next)=>{try{const b=z.object({title:z.string().trim().min(1).max(255)}).parse(req.body);const [result]=await pool.execute('UPDATE materials m JOIN subjects s ON s.id=m.subject_id SET m.title=? WHERE m.id=? AND s.department_id=?',[b.title,req.params.id,req.user.departmentId]);if(!result.affectedRows)return fail(res,404,'Material not found in your department.');await audit(req,'material.update','material',req.params.id);res.json({ok:true});}catch(e){next(e);}});
app.get('/api/contributions',auth,async(req,res,next)=>{try{const scope=req.user.role==='teacher'?'WHERE c.department_id=?':'';const [rows]=await pool.execute(`SELECT c.*,s.code subject_code,s.name subject_name FROM contributions c LEFT JOIN subjects s ON s.id=c.subject_id ${scope} ORDER BY c.created_at DESC`,req.user.role==='teacher'?[req.user.departmentId]:[]);res.json({contributions:rows});}catch(e){next(e);}});
app.get('/api/contributions/:id/file',auth,departmentScope,async(req,res,next)=>{try{const [rows]=await pool.execute('SELECT stored_name,mime_type,file_name,external_url FROM contributions WHERE id=?',[req.params.id]);if(!rows[0])return fail(res,404,'Contribution not found.');if(rows[0].stored_name)return sendInlineFile(res,rows[0].stored_name,rows[0].mime_type,rows[0].file_name);if(rows[0].external_url)return res.redirect(rows[0].external_url);return fail(res,404,'Contribution has no file or link.');}catch(e){next(e);}});
app.post('/api/contributions',rateLimit({windowMs:60*60*1000,limit:20,standardHeaders:'draft-7',legacyHeaders:false}),upload.single('file'),async(req,res,next)=>{try{const b=z.object({subjectId:z.string().max(128).optional(),subjectCode:z.string().max(64).optional(),departmentId:z.string().min(1).max(64),submittedByName:z.string().max(160).optional(),submittedByEmail:z.string().email().max(254).optional().or(z.literal('')),category:z.enum(['notes','syllabus','pyqs','videos','video','pyq','questions']),title:z.string().trim().min(1).max(255),description:z.string().max(5000).optional(),externalUrl:z.string().url().max(2048).optional().or(z.literal(''))}).parse(req.body);let subjectId=b.subjectId||null;if(!subjectId&&b.subjectCode){const [subjects]=await pool.execute('SELECT id FROM subjects WHERE code=? AND department_id=? LIMIT 1',[b.subjectCode,b.departmentId]);subjectId=subjects[0]?.id||null;}const id=randomUUID();const category=b.category==='video'?'videos':b.category==='pyq'?'pyqs':b.category;await pool.execute("INSERT INTO contributions(id,subject_id,department_id,submitted_by_name,submitted_by_email,category,title,description,file_name,stored_name,mime_type,file_size,external_url) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",[id,subjectId,b.departmentId,b.submittedByName||null,b.submittedByEmail||null,category,b.title,b.description||null,req.file?.originalname||null,req.file?.filename||null,req.file?.mimetype||null,req.file?.size||null,b.externalUrl||null]);res.status(201).json({contribution:{id,status:'pending'}});}catch(e){if(req.file)fs.promises.unlink(req.file.path).catch(()=>{});next(e);}});
app.patch('/api/contributions/:id',auth,departmentScope,async(req,res,next)=>{try{if(!['admin','teacher'].includes(req.user.role))return fail(res,403,'Reviewer access required.');const b=z.object({status:z.enum(['approved','rejected']).optional(),title:z.string().trim().min(1).max(255).optional(),reviewNote:z.string().max(1000).optional()}).refine(v=>v.status||v.title).parse(req.body);const scoped=req.user.role==='teacher'?' AND department_id=?':'';if(b.status){const params=[b.status,req.user.id,b.reviewNote||null,req.params.id];if(req.user.role==='teacher')params.push(req.user.departmentId);const [result]=await pool.execute(`UPDATE contributions SET status=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP(),review_note=? WHERE id=?${scoped}`,params);if(!result.affectedRows)return fail(res,404,'Contribution not found.');if(b.status==='approved'){const [items]=await pool.execute('SELECT * FROM contributions WHERE id=?',[req.params.id]);const c=items[0];if(c.subject_id){const materialId=randomUUID();let storedName=c.stored_name;if(storedName){const copyName=`${materialId}${path.extname(storedName)}`;await fs.promises.copyFile(path.join(uploadDir,storedName),path.join(uploadDir,copyName));storedName=copyName;}await pool.execute('INSERT INTO materials(id,subject_id,uploaded_by,category,title,file_name,stored_name,mime_type,file_size,external_url,metadata) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[materialId,c.subject_id,req.user.id,c.category,c.title,c.file_name,storedName,c.mime_type,c.file_size,c.external_url,JSON.stringify({contributionId:c.id})]);}}await audit(req,`contribution.${b.status}`,'contribution',req.params.id);}if(b.title){const params=[b.title,req.params.id];if(req.user.role==='teacher')params.push(req.user.departmentId);await pool.execute(`UPDATE contributions SET title=? WHERE id=?${scoped}`,params);}res.json({ok:true});}catch(e){next(e);}});
app.delete('/api/contributions/:id',auth,departmentScope,async(req,res,next)=>{try{if(!['admin','teacher'].includes(req.user.role))return fail(res,403,'Reviewer access required.');const scoped=req.user.role==='teacher'?' AND department_id=?':'';const params=[req.params.id];if(req.user.role==='teacher')params.push(req.user.departmentId);const [rows]=await pool.execute(`SELECT stored_name FROM contributions WHERE id=?${scoped}`,params);if(!rows[0])return fail(res,404,'Contribution not found.');await pool.execute('DELETE FROM contributions WHERE id=?',[req.params.id]);if(rows[0].stored_name)fs.promises.unlink(path.join(uploadDir,rows[0].stored_name)).catch(()=>{});await audit(req,'contribution.delete','contribution',req.params.id);res.json({ok:true});}catch(e){next(e);}});

// Bootstrap from the frontend curriculum on first install, then create the initial admin.
async function bootstrap(){
  const curriculumPath=path.resolve(__dirname,'../../frontend/data/curriculum.json');
  if(fs.existsSync(curriculumPath)){
    const data=JSON.parse(fs.readFileSync(curriculumPath,'utf8'));
    for(const d of data.departments||[])await pool.execute('INSERT INTO departments(id,name,code) VALUES(?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),code=VALUES(code)',[d.id,d.name,d.code]);
    for(const s of data.subjects||[])await pool.execute('INSERT INTO subjects(id,code,name,department_id,program_level,semester,track,credits,syllabus_json) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE code=VALUES(code),name=VALUES(name),department_id=VALUES(department_id),program_level=VALUES(program_level),semester=VALUES(semester),track=VALUES(track),credits=VALUES(credits)',[s.id,s.code,s.name,s.departmentId,(s.programLevel||'UG').toUpperCase(),String(s.semester||''),s.track||null,s.credits||null,null]);
  }
  const username=process.env.ADMIN_USERNAME||'admin';const email=(process.env.ADMIN_EMAIL||'admin@dbcmaram.ac.in').toLowerCase();const password=process.env.ADMIN_INITIAL_PASSWORD||'';
  if(!password||password.length<12||password.includes('replace-before'))throw new Error('Set a unique ADMIN_INITIAL_PASSWORD (12+ characters) before starting.');
  const [existing]=await pool.execute("SELECT id FROM users WHERE role='admin' LIMIT 1");
  if(!existing.length){const id=randomUUID();await pool.execute("INSERT INTO users(id,email,username,display_name,password_hash,role) VALUES(?,?,?,?,?,'admin')",[id,email,username,process.env.ADMIN_NAME||'DBCM Administrator',await bcrypt.hash(password,12)]);console.log(`Bootstrapped administrator account: ${username}`);}
}

app.use('/uploads',auth,async(req,res,next)=>{try{const name=path.basename(req.path);const [m]=await pool.execute('SELECT s.department_id FROM materials m JOIN subjects s ON s.id=m.subject_id WHERE m.stored_name=? UNION ALL SELECT department_id FROM contributions WHERE stored_name=? LIMIT 1',[name,name]);if(req.user.role==='teacher'&&m[0]?.department_id!==req.user.departmentId)return fail(res,403,'This upload is outside your department.');next();}catch(e){next(e);}});
if(fs.existsSync(path.resolve(__dirname,'../../frontend')))app.use(express.static(path.resolve(__dirname,'../../frontend')));
app.use((err,_req,res,_next)=>{if(err instanceof z.ZodError)return res.status(400).json({error:'Invalid request.',details:err.issues.map(i=>({field:i.path.join('.'),message:i.message}))});console.error(err);res.status(err.status||500).json({error:err.status?err.message:'Server error.'});});

bootstrap().then(()=>app.listen(port,bindHost,()=>console.log(`DBCM API and frontend available at http://localhost:${port} (LAN: http://<computer-ip>:${port})`))).catch(error=>{console.error('Backend startup failed:',error);process.exit(1);});
