const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function resetCurriculum() {
  if (!process.argv.includes('--confirm-reset')) {
    throw new Error('This removes all uploaded materials and contributions. Run with --confirm-reset to continue.');
  }

  const backendDir = path.resolve(__dirname, '..');
  const uploadDir = path.resolve(backendDir, process.env.UPLOAD_DIR || './storage/uploads');
  const expectedUploadDir = path.resolve(backendDir, './storage/uploads');
  if (uploadDir !== expectedUploadDir) {
    throw new Error('Reset stopped: UPLOAD_DIR must point to backend/storage/uploads.');
  }

  const curriculumPath = path.resolve(__dirname, '../../frontend/data/curriculum.json');
  const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
  const subjects = curriculum.subjects || [];
  const subjectIds = new Set(subjects.map(subject => subject.id));
  if (!subjects.length || subjectIds.size !== subjects.length) {
    throw new Error('Reset stopped: curriculum is empty or has duplicate subject IDs.');
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'dbcm_app',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dbcm_portal',
    waitForConnections: true,
    connectionLimit: 1,
    charset: 'utf8mb4',
    decimalNumbers: true,
    timezone: 'Z',
    ssl: process.env.DB_SSL === 'true'
      ? { ca: process.env.DB_SSL_CA ? fs.readFileSync(path.resolve(process.env.DB_SSL_CA)) : undefined, rejectUnauthorized: true }
      : undefined
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM contributions');
    await conn.query('DELETE FROM materials');

    for (const department of curriculum.departments || []) {
      await conn.execute(
        'INSERT INTO departments(id,name,code) VALUES(?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),code=VALUES(code)',
        [department.id, department.name, department.code]
      );
    }
    for (const subject of subjects) {
      await conn.execute(
        'INSERT INTO subjects(id,code,name,department_id,program_level,semester,track,credits,syllabus_json) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE code=VALUES(code),name=VALUES(name),department_id=VALUES(department_id),program_level=VALUES(program_level),semester=VALUES(semester),track=VALUES(track),credits=VALUES(credits)',
        [subject.id, subject.code, subject.name, subject.departmentId, (subject.programLevel || 'UG').toUpperCase(), String(subject.semester || ''), subject.track || null, subject.credits || null, null]
      );
    }

    const [existingSubjects] = await conn.query('SELECT id FROM subjects');
    const obsoleteIds = existingSubjects.map(row => row.id).filter(id => !subjectIds.has(id));
    for (const id of obsoleteIds) await conn.execute('DELETE FROM subjects WHERE id=?', [id]);
    await conn.commit();

    let removedFiles = 0;
    for (const entry of await fs.promises.readdir(uploadDir, { withFileTypes: true })) {
      if (!entry.isFile() || entry.name === '.gitkeep') continue;
      const filePath = path.resolve(uploadDir, entry.name);
      if (path.dirname(filePath) !== uploadDir) continue;
      await fs.promises.unlink(filePath);
      removedFiles++;
    }

    console.log(`Curriculum refreshed with ${subjects.length} subjects.`);
    console.log(`Cleared existing materials and contributions; removed ${removedFiles} uploaded files.`);
    console.log(`Removed ${obsoleteIds.length} obsolete subject records.`);
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

resetCurriculum().catch(error => {
  console.error(`Curriculum reset failed${error.code ? ` (${error.code})` : ''}: ${error.message || 'Could not connect to MySQL.'}`);
  process.exitCode = 1;
});
