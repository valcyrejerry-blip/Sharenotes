/* Shared local data helpers for the static site. */
(function () {
  let curriculumPromise;
  let contributionDbPromise;
  const contributionObjectUrls = new Map();

  function openContributionDb() {
    if (!contributionDbPromise) {
      contributionDbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error('This browser cannot store contribution files.'));
        const request = indexedDB.open('dbcm-contribution-files', 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('files')) {
            request.result.createObjectStore('files', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not open contribution file storage.'));
      });
    }
    return contributionDbPromise;
  }

  async function saveContributionFile(id, file) {
    const db = await openContributionDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').put({ id, file, fileName: file.name, fileType: file.type });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not save contribution file.'));
      transaction.onabort = () => reject(transaction.error || new Error('Contribution file storage was interrupted.'));
    });
  }

  async function getContributionFile(id) {
    const db = await openContributionDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction('files', 'readonly').objectStore('files').get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Could not read contribution file.'));
    });
  }

  async function deleteContributionFile(id) {
    const db = await openContributionDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not remove contribution file.'));
    });
  }

  async function applyApprovedContributions(subjects, departments) {
    const contributions = JSON.parse(localStorage.getItem('dbcm_contributions') || '[]')
      .filter(item => item.status === 'approved');
    const normalizeCode = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    for (const contribution of contributions) {
      const contributionId = contribution.id;
      const code = normalizeCode(contribution.subjectCode);
      if (!code || !contributionId) continue;

      let subject = subjects.find(item => normalizeCode(item.code) === code);
      if (!subject) {
        const semester = Number.parseInt(contribution.semester, 10) || 1;
        const department = departments.find(item => item.id === contribution.departmentId);
        subject = {
          id: `contribution-subject-${contributionId}`,
          code: contribution.subjectCode,
          name: contribution.subjectName || contribution.subjectCode,
          shortName: contribution.subjectName || contribution.subjectCode,
          departmentId: contribution.departmentId || '',
          departmentName: contribution.department || department?.name || '',
          semester,
          year: contribution.programLevel === 'PG' ? (semester <= 2 ? '1st Year' : '2nd Year') : '',
          programLevel: contribution.programLevel || 'UG',
          track: contribution.paperType || 'major',
          modules: [], notes: [], pyqs: [], videos: [], impQuestions: [],
          description: '', credits: 0, catalogPlaceholder: false
        };
        subjects.push(subject);
      } else if (subject.catalogPlaceholder && contribution.subjectName) {
        subject.name = contribution.subjectName;
        subject.shortName = contribution.subjectName;
        subject.catalogPlaceholder = false;
      }

      const hasContribution = list => list.some(item => item.contributionId === contributionId);
      let fileUrl = contribution.fileData || '';
      if (!fileUrl && contribution.fileStorageId) {
        try {
          if (!contributionObjectUrls.has(contribution.fileStorageId)) {
            const stored = await getContributionFile(contribution.fileStorageId);
            if (stored?.file) contributionObjectUrls.set(contribution.fileStorageId, URL.createObjectURL(stored.file));
          }
          fileUrl = contributionObjectUrls.get(contribution.fileStorageId) || '';
        } catch (error) {
          console.warn('Could not load an approved contribution file.', error);
        }
      }

      if (contribution.category === 'video') {
        subject.videos ||= [];
        if (!hasContribution(subject.videos)) subject.videos.push({
          id: contributionId, contributionId, title: contribution.title,
          url: contribution.videoUrl, channelName: contribution.channelName
        });
      } else if (contribution.category === 'pyq') {
        subject.pyqs ||= [];
        if (!hasContribution(subject.pyqs)) subject.pyqs.push({
          id: contributionId, contributionId, title: contribution.title,
          year: contribution.examYear, session: contribution.session,
          paperType: contribution.title, pdfUrl: fileUrl, fileName: contribution.fileName,
          fileType: String(contribution.fileName || '').split('.').pop().toLowerCase()
        });
      } else {
        subject.notes ||= [];
        if (!hasContribution(subject.notes)) subject.notes.push({
          id: contributionId, contributionId, title: contribution.title,
          topic: contribution.title, module: Number.parseInt(contribution.unit, 10) || undefined,
          unitTitle: contribution.unitTitle || '', pdfUrl: fileUrl, url: fileUrl,
          fileName: contribution.fileName,
          fileType: String(contribution.fileName || '').split('.').pop().toLowerCase(),
          author: contribution.contributorName || 'Student Contribution'
        });
      }
    }

    return subjects;
  }

  async function load() {
    if (!curriculumPromise) {
      curriculumPromise = fetch('./data/curriculum.json').then(response => {
        if (!response.ok) throw new Error(`Could not load curriculum (${response.status})`);
        return response.json();
      }).then(data => {
        const edits = JSON.parse(localStorage.getItem('dbcm_curriculum_edits') || '{}');
        const generated = JSON.parse(localStorage.getItem('dbcm_generated_papers') || '[]');
        const overrides = JSON.parse(localStorage.getItem('dbcm_paper_overrides') || '[]');
        const overrideById = new Map(overrides.map(item => [item.id, item]));
        const sourceSubjects = edits.subjects || data.subjects || [];
        const subjects = sourceSubjects.map(subject => ({ ...subject, ...(overrideById.get(subject.id) || {}) }));
        const knownIds = new Set(subjects.map(subject => subject.id));
        subjects.push(...generated.filter(subject => !knownIds.has(subject.id)));
        return {
          ...data,
          subjects,
          departments: JSON.parse(localStorage.getItem('dbcm_imported_departments') || 'null') || data.departments || [],
          semesters: JSON.parse(localStorage.getItem('dbcm_imported_semesters') || 'null') || data.semesters || []
        };
      });
    }
    return curriculumPromise.then(async data => {
      try {
        const host = window.DBCM_API_BASE || `${location.protocol}//${location.hostname}:3000/api`;
        const response = await fetch(`${host}/public/materials`);
        if (response.ok) {
          const { materials = [] } = await response.json();
          for (const material of materials) {
            const subject = data.subjects.find(item => item.id === material.subjectId);
            if (!subject) continue;
            const listKey = material.category === 'pyqs' ? 'pyqs' : material.category === 'videos' ? 'videos' : material.category === 'syllabus' ? 'syllabusList' : material.category === 'questions' ? 'impQuestions' : 'notes';
            subject[listKey] ||= [];
            if (subject[listKey].some(item => item.id === material.id)) continue;
            const fileUrl = material.pdfUrl ? (material.pdfUrl.startsWith('/') ? `${host.replace(/\/api\/?$/, '')}${material.pdfUrl}` : material.pdfUrl) : '';
            subject[listKey].push({ id: material.id, title: material.title, topic: material.title, author: 'DBCM Faculty', pdfUrl: fileUrl, url: material.externalUrl || fileUrl, fileName: material.fileName, fileSize: material.fileSize, uploadDate: material.createdAt, verified: true });
          }
        }
      } catch (error) { console.warn('Live faculty materials are unavailable; showing the local curriculum.', error); }
      return data;
    });
  }

  function saveSubjects(subjects) {
    localStorage.setItem('dbcm_curriculum_edits', JSON.stringify({ subjects }));
    curriculumPromise = null;
  }

  window.addEventListener('storage', event => {
    if (event.key === 'dbcm_contributions') curriculumPromise = null;
  });

  window.dbcmLocalData = { load, saveSubjects };
  window.dbcmContributionFiles = { save: saveContributionFile, get: getContributionFile, remove: deleteContributionFile };
  window.dbcmLocalData.applyApprovedContributions = applyApprovedContributions;
})();

