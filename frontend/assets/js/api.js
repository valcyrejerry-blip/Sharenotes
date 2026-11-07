(function(){
  const base = window.DBCM_API_BASE || `${location.protocol}//${location.hostname}:3000/api`;
  const origin = base.replace(/\/api\/?$/, '');
  function parseMetadata(value) {
    if (!value || typeof value !== 'string') return value || {};
    try { return JSON.parse(value); } catch { return {}; }
  }
  async function request(path, options={}) {
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
    const response = await fetch(`${base}${path}`,{...options,headers,credentials:'include'});
    const type=response.headers.get('content-type')||'';
    const data=type.includes('application/json')?await response.json():null;
    if(!response.ok)throw new Error(data?.error||`Request failed (${response.status})`);
    return data;
  }
  window.dbcmApi={
    request,login:(username,password,role)=>request('/auth/login',{method:'POST',body:JSON.stringify({username,password,role})}),
    registerTeacher:data=>request('/auth/register',{method:'POST',body:JSON.stringify(data)}),
    changeTeacherPassword:data=>request('/auth/teacher/change-password',{method:'POST',body:JSON.stringify(data)}),
    resetTeacherPassword:data=>request('/auth/teacher/reset-password',{method:'POST',body:JSON.stringify(data)}),
    me:()=>request('/auth/me'),logout:()=>request('/auth/logout',{method:'POST'}),
    teachers:()=>request('/admin/teachers'),createTeacher:data=>request('/admin/teachers',{method:'POST',body:JSON.stringify(data)}),
    issueTeacherPasswordReset:id=>request(`/admin/teachers/${encodeURIComponent(id)}/password-reset-codes`,{method:'POST'}),
    createRegistrationCode:data=>request('/admin/registration-codes',{method:'POST',body:JSON.stringify(data)}),
    subjects:()=>request('/subjects'),counts:()=>request('/subjects/counts'),
    publicMaterials:()=>request('/public/materials').then(data=>({...data,materials:(data.materials||[]).map(m=>({...m,metadata:parseMetadata(m.metadata),pdfUrl:m.pdfUrl?`${origin}${m.pdfUrl}`:null}))})),
    publicCounts:()=>request('/public/counts'),
    myMaterials:()=>request('/materials/mine').then(data=>({...data,materials:(data.materials||[]).map(m=>({...m,pdfUrl:m.pdfUrl?`${origin}${m.pdfUrl}`:null}))})),
    contributions:()=>request('/contributions').then(data=>({...data,contributions:(data.contributions||[]).map(c=>({...c,subjectCode:c.subject_code||c.subjectCode,subjectName:c.subject_name||c.subjectName,fileName:c.file_name||c.fileName,fileUrl:c.stored_name?`${origin}/api/contributions/${encodeURIComponent(c.id)}/file`:c.external_url||c.externalUrl||'',videoUrl:c.external_url||c.externalUrl||'',fileSize:c.file_size?`${(Number(c.file_size)/1024/1024).toFixed(2)} MB`:c.fileSize,contributorName:c.submitted_by_name||c.contributorName,submittedAt:c.created_at||c.submittedAt}))})),
    uploadMaterial:(subjectId,fields,file)=>{const form=new FormData();Object.entries(fields).forEach(([k,v])=>v!==undefined&&v!==null&&String(v)!==''&&form.append(k,String(v)));if(file)form.append('file',file);return request(`/subjects/${encodeURIComponent(subjectId)}/materials`,{method:'POST',body:form});},
    deleteMaterial:id=>request(`/materials/${encodeURIComponent(id)}`,{method:'DELETE'}),
    editMaterial:(id,title)=>request(`/materials/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({title})}),
    uploadAdminMaterial:(subjectId,fields,file)=>{const form=new FormData();Object.entries(fields).forEach(([k,v])=>v!==undefined&&v!==null&&String(v)!==''&&form.append(k,String(v)));if(file)form.append('file',file);return request(`/admin/subjects/${encodeURIComponent(subjectId)}/materials`,{method:'POST',body:form});},
    reviewContribution:(id,status)=>request(`/contributions/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({status})}),
    editContribution:(id,title)=>request(`/contributions/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({title})}),
    deleteContribution:id=>request(`/contributions/${encodeURIComponent(id)}`,{method:'DELETE'})
    ,submitContribution:fields=>{const form=new FormData();Object.entries(fields).forEach(([k,v])=>k!=='file'&&v!==undefined&&v!==null&&String(v)!==''&&form.append(k,String(v)));if(fields.file)form.append('file',fields.file);return request('/contributions',{method:'POST',body:form});}
  };
})();
