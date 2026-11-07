/**
 * DBCM Study Material - Interactive Client Application
 * Supports 14 Academic Departments with Major & Minor Tracks
 */

const state = {
  departments: [],
  semesters: [],
  subjects: [],
  selectedDepartment: '', // Step 1: Unselected initially
  browseCategory: 'ug',
  selectedProgramLevel: '', // Top-level program picker: 'UG' | 'PG' | ''
  selectedSemester: '',   // Step 2: Unlocked after department is selected
  selectedTrack: '',      // Step 3: Unlocked after semester is selected
  selectedMinorDept: 'all', // Step 3.5: Inter-department Minor Subject selection
  selectedMdcDept: 'all',   // Step 3.5: Inter-department MDC Subject selection
  searchQuery: '',
  theme: 'light', // Permanent Clean Professional Light Theme
  bookmarks: JSON.parse(localStorage.getItem('dbcm_bookmarks') || '[]'),
  currentSubject: null,
  activeTab: 'overview',
  pyqs: []
};
window.dbcmCurriculum = { departments: [], semesters: [], subjects: [] };

// Target departments with UG & PG selection
const UG_PG_DEPARTMENTS = ['english', 'history', 'polsci', 'sociology'];
function isSpecialUgPgDept(deptId) {
  return UG_PG_DEPARTMENTS.includes(deptId);
}

const PAPER_DEPARTMENTS = {
  bca: { code: 'CS', core: 'MJCS', minor: 'MNCS', mdc: 'MDCS', skill: 'SECS', generic: 'CSG' },
  commerce: { code: 'CM', core: 'MJCM', minor: 'MNCM', mdc: 'MDCM', skill: 'SECM', generic: 'COG' },
  biotech: { code: 'BI', core: 'MJBI', minor: 'MNBI', mdc: 'MDBI', skill: 'SEBI', generic: 'BIG' },
  botany: { code: 'BO', core: 'MJBO', minor: 'MNBO', mdc: 'MDBO', skill: 'SEBO', generic: 'BOG' },
  bsw: { code: 'SW', core: 'MJSW', minor: 'MNSW', mdc: 'MDSW', skill: 'SESW', generic: 'SWG' },
  chemistry: { code: 'CH', core: 'MJCH', minor: 'MNCH', mdc: 'MDCH', skill: 'SECH', generic: 'CHG' },
  economics: { code: 'EC', core: 'MJEC', minor: 'MNEC', mdc: 'MDEC', skill: 'SEEC', generic: 'ECG' },
  education: { code: 'ED', core: 'MJED', minor: 'MNED', mdc: 'MDED', skill: 'SEED', generic: 'EDG' },
  english: { code: 'EN', core: 'MJEN', minor: 'MNEN', mdc: 'MDEN', skill: 'SEEN', generic: 'ENG' },
  history: { code: 'HI', core: 'MJHI', minor: 'MNHI', mdc: 'MDHI', skill: 'SEHI', generic: 'HIG' },
  mathematics: { code: 'MA', core: 'MJMA', minor: 'MNMA', mdc: 'MDMA', skill: 'SEMA', generic: 'MAE' },
  physics: { code: 'PH', core: 'MJPH', minor: 'MNPH', mdc: 'MDPH', skill: 'SEPH', generic: 'PHG' },
  polsci: { code: 'PS', core: 'MJPS', minor: 'MNPS', mdc: 'MDPS', skill: 'SEPS', generic: 'PSG' },
  sociology: { code: 'SO', core: 'MJSO', minor: 'MNSO', mdc: 'MDSO', skill: 'SESO', generic: 'SOG' },
  psychology: { code: 'PY', core: 'MJPY', minor: 'MNPY', mdc: 'MDPY', skill: 'SEPY', generic: 'PYG' },
  zoology: { code: 'ZO', core: 'MJZO', minor: 'MNZO', mdc: 'MDZO', skill: 'SEZO', generic: 'ZOG' }
};

function paperCode(prefix, semester, paperNumber = 1) {
  return `${prefix}${semester}${String(paperNumber).padStart(2, '0')}`;
}

function buildPaperCatalog(source, departments) {
  const subjects = [];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const coreCounts = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2 };
  const placeholder = (id, code, name, semester, track, departmentId = '') => ({
    id, code, name, shortName: name, semester, track, departmentId,
    programLevel: 'UG', year: semester <= 2 ? '1st Year' : semester <= 4 ? '2nd Year' : semester <= 6 ? '3rd Year' : '4th Year',
    credits: 0, scheme: 'Paper title and materials to be added', difficulty: '—',
    passingProbability: '', description: 'Paper code is set. Add the official title and study materials when available.',
    modules: [], impQuestions: [], notes: [], pyqs: [], videos: [], catalogPlaceholder: true
  });

  for (const department of departments) {
    const codes = PAPER_DEPARTMENTS[department.id];
    if (!codes) continue;
    for (const semester of semesters) {
      const expected = coreCounts[semester];
      const core = source.filter(s => s.departmentId === department.id && s.track === 'major' && s.programLevel !== 'PG' && s.semester === semester).slice(0, expected);
      core.forEach((subject, index) => {
        subject.code = paperCode(codes.core, semester, index + 1);
        subject.track = 'major';
        subjects.push(subject);
      });
      for (let index = core.length; index < expected; index++) {
        const code = paperCode(codes.core, semester, index + 1);
        subjects.push(placeholder(`${department.id}-core-${semester}-${index + 1}`, code, `Core Paper ${index + 1} · title to be added`, semester, 'major', department.id));
      }

      if (semester <= 3) {
        const skill = source.find(s => s.departmentId === department.id && s.track === 'skill' && s.semester === semester);
        if (skill) {
          skill.code = paperCode(codes.skill, semester);
          skill.track = 'skill';
          subjects.push(skill);
        } else {
          const code = paperCode(codes.skill, semester);
          subjects.push(placeholder(`${department.id}-skill-${semester}`, code, 'Skill Paper · title to be added', semester, 'skill', department.id));
        }
      }

      const minor = source.filter(s => s.departmentId === department.id && s.track === 'minor' && s.programLevel !== 'PG' && s.semester === semester).slice(0, 1);
      if (minor.length) {
        minor[0].code = paperCode(codes.minor, semester);
        subjects.push(minor[0]);
      } else {
        subjects.push(placeholder(`${department.id}-minor-${semester}`, paperCode(codes.minor, semester), 'Minor Paper · title to be added', semester, 'minor', department.id));
      }
      if (semester <= 3) {
        const mdc = source.find(s => s.departmentId === department.id && s.track === 'mdc' && s.semester === semester);
        if (mdc) { mdc.code = paperCode(codes.mdc, semester); subjects.push(mdc); }
        else subjects.push(placeholder(`${department.id}-mdc-${semester}`, paperCode(codes.mdc, semester), 'MDC Paper · title to be added', semester, 'mdc', department.id));
      }

      subjects.push(placeholder(`generic-${department.id}-${semester}`, paperCode(codes.generic, semester), 'Generic Paper · title to be added', semester, 'generic', department.id));
    }
  }

  for (const semester of semesters) {
    if (semester <= 4) {
      const commonCodes = {
        1: { aec: ['AEEN101', 'AEML101'], vac: ['VAES101', 'VAYG101'] },
        2: { aec: ['AEEN201', 'AEML201'], vac: ['VAES201', 'VAYG201'] },
        3: { aec: ['AEEN301', 'AEML301'], vac: ['VAIC301', 'VADC301'] },
        4: { aec: ['AEEN401', 'AEML401'], vac: ['VAET401', 'VACM401'] }
      }[semester];
      commonCodes.vac.forEach((code, index) => subjects.push(placeholder(`vac-${semester}-${index + 1}`, code, `Value Added Course ${index + 1} · title to be added`, semester, 'vac')));
      commonCodes.aec.forEach((code, index) => subjects.push(placeholder(`aec-${semester}-${index + 1}`, code, `Ability Enhancement Course ${index + 1} · title to be added`, semester, 'aec')));
    }
  }
  subjects.push(...source.filter(subject => subject.programLevel === 'PG'));
  return subjects;
}

// Utility: Lightweight debounce to optimize typing response times
function debounce(fn, wait = 150) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.theme);
  await loadInitialData();
  setupEventListeners();
  renderApp();

  // Support direct linking from breadcrumbs (?dept=bca&sem=1)
  const urlParams = new URLSearchParams(window.location.search);
  const deptParam = urlParams.get('dept') || urlParams.get('department');
  const semParam = urlParams.get('sem') || urlParams.get('semester');
  const programParam = String(urlParams.get('program') || '').toUpperCase();
  if (programParam === 'PG') {
    state.selectedProgramLevel = 'PG';
    state.browseCategory = 'pg';
    renderApp();
  }
  if (deptParam) {
    selectDepartment(deptParam);
    if (semParam) {
      selectSemester(parseInt(semParam, 10));
    }
  }
});

window.addEventListener('storage', event => {
  if (event.key === 'dbcm_contributions' && state.departments.length) {
    loadInitialData().then(renderApp);
  }
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.classList.remove('dark');
  localStorage.setItem('dbcm_theme', 'light');
  if (window.lucide) lucide.createIcons();
}

function toggleTheme() {
  // Theme toggle mode removed; permanent light theme
}
window.toggleTheme = toggleTheme;

// Mobile 3-Line Dropdown Menu Handlers
function toggleMobileMenu(e) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
  }
  const menu = document.getElementById('mobile-dropdown-menu');
  const btn = document.getElementById('mobile-menu-toggle-btn');
  const icon = document.getElementById('mobile-menu-icon');
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    menu.classList.add('flex');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (icon) {
      icon.setAttribute('data-lucide', 'x');
      if (window.lucide) lucide.createIcons();
    }
  } else {
    closeMobileMenu();
  }
}
window.toggleMobileMenu = toggleMobileMenu;

function closeMobileMenu() {
  const menu = document.getElementById('mobile-dropdown-menu');
  const btn = document.getElementById('mobile-menu-toggle-btn');
  const icon = document.getElementById('mobile-menu-icon');
  if (!menu) return;
  menu.classList.add('hidden');
  menu.classList.remove('flex');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (icon) {
    icon.setAttribute('data-lucide', 'menu');
    if (window.lucide) lucide.createIcons();
  }
}
window.closeMobileMenu = closeMobileMenu;

// Close mobile dropdown menu on outside click or Esc
document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobile-dropdown-menu');
  const btn = document.getElementById('mobile-menu-toggle-btn');
  if (!menu || menu.classList.contains('hidden')) return;

  // Don't close if clicked inside the menu or on the toggle button
  if (menu.contains(e.target) || (btn && btn.contains(e.target))) return;
  if (e.target.closest && (e.target.closest('#mobile-dropdown-menu') || e.target.closest('#mobile-menu-toggle-btn'))) return;
  if (e.composedPath && e.composedPath().some(el => el === menu || el === btn)) return;

  closeMobileMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMobileMenu();
    if (typeof closeHomeContributionModal === 'function') {
      closeHomeContributionModal();
    }
  }
});

async function loadInitialData() {
  try {
    const response = await fetch('./data/curriculum.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rawData = await response.json();

      if (rawData) {
        const localEdits = JSON.parse(localStorage.getItem('dbcm_curriculum_edits') || '{}');
        state.departments = (rawData.departments || []).filter(department => PAPER_DEPARTMENTS[department.id]);
        state.semesters = rawData.semesters || [];
        state.subjects = buildPaperCatalog(localEdits.subjects || rawData.subjects || [], state.departments);
        try {
          const { materials = [] } = await window.dbcmApi.publicMaterials();
          for (const material of materials) {
            const subject = state.subjects.find(item => item.id === material.subjectId);
            if (!subject) continue;
            const key = material.category === 'pyqs' ? 'pyqs' : material.category === 'videos' ? 'videos' : material.category === 'syllabus' ? 'syllabusList' : material.category === 'questions' ? 'impQuestions' : 'notes';
            subject[key] ||= [];
            if (!subject[key].some(item => item.id === material.id)) subject[key].push({ id: material.id, contributionId: material.metadata?.contributionId || '', title: material.title, topic: material.title, author: material.metadata?.contributionId ? 'Student Contribution' : 'DBCM Faculty', pdfUrl: material.pdfUrl, url: material.externalUrl || material.pdfUrl, fileName: material.fileName, fileSize: material.fileSize, uploadDate: material.createdAt, verified: true });
          }
        } catch (error) { console.warn('Live materials are unavailable; showing the curriculum copy.', error); }
        if (window.dbcmLocalData?.applyApprovedContributions) {
          await window.dbcmLocalData.applyApprovedContributions(state.subjects, state.departments);
        }
        localStorage.setItem('dbcm_generated_papers', JSON.stringify(state.subjects.filter(subject => subject.catalogPlaceholder)));
        localStorage.setItem('dbcm_paper_overrides', JSON.stringify(state.subjects.map(({ id, code, track }) => ({ id, code, track }))));
        window.dbcmCurriculum = { departments: state.departments, semesters: state.semesters, subjects: state.subjects };

        // Synthesize PYQs list from subjects
        const allPyqs = [];
        for (const s of state.subjects) {
          const dept = (state.departments || []).find(d => d.id === s.departmentId) || { name: s.departmentId, code: (s.departmentId || '').toUpperCase() };
          for (const p of (s.pyqs || [])) {
            allPyqs.push({
              id: `pyq-${s.id}-${(p.session || 'regular').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              subjectId: s.id,
              subjectCode: s.code,
              subjectName: s.name,
              shortName: s.shortName,
              departmentId: s.departmentId,
              departmentName: dept.name,
              departmentCode: dept.code,
              track: s.track || 'major',
              semester: s.semester,
              year: p.year,
              session: p.session,
              paperType: p.paperType,
              totalMarks: p.totalMarks || 80,
              pages: p.pages || 4,
              duration: '3 Hours',
              scheme: s.scheme,
              modules: s.modules,
              impQuestions: s.impQuestions
            });
          }
        }
        state.pyqs = allPyqs;

        // Render stats
        const majorCount = state.subjects.filter(s => (s.track || 'major') === 'major').length;
        const minorCount = state.subjects.filter(s => s.track === 'discipline').length;
        let liveDeptCount = state.departments.length;
        let liveSubjectCount = state.subjects.length;
        try { const {counts=[]}=await window.dbcmApi.publicCounts(); liveDeptCount=counts.filter(c=>Number(c.subject_count)>0).length; liveSubjectCount=counts.reduce((sum,c)=>sum+Number(c.subject_count||0),0); } catch {}
        renderStats({
          departmentsCount: liveDeptCount,
          subjectsCount: liveSubjectCount,
          majorCount,
          minorCount,
          pyqsCount: state.pyqs.length,
          impsCount: state.subjects.reduce((acc, s) => acc + (s.impQuestions ? s.impQuestions.length : 0), 0)
        });
      }
  } catch (staticErr) {
    console.error('[Local Data Error] Failed to load curriculum.json:', staticErr);
  }
}

function setupEventListeners() {
  // Main Search Input with Live Autocomplete Dropdown & Debounce
  const searchInput = document.getElementById('main-search-input');
  const clearBtn = document.getElementById('search-clear-btn');

  const debouncedRenderSubjects = debounce(() => {
    renderSubjects();
  }, 160);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.searchQuery = val;
      const hasVal = val.trim().length > 0;
      if (clearBtn) {
        if (hasVal) {
          clearBtn.classList.remove('hidden');
        } else {
          clearBtn.classList.add('hidden');
        }
      }
      updateChooseDepartmentVisibility(hasVal);
      debouncedRenderSubjects();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearMainSearch();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerSearch();
      }
    });
  }

  // Global Keyboard Shortcuts (Escape & Ctrl+K)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === 'Escape') {
      if (searchInput && (document.activeElement === searchInput || searchInput.value.length > 0)) {
        clearMainSearch();
      }
      closeSearchModal();
      closeSubjectModal();
      closeReaderModal();
      closeBookmarksDrawer();
      closeMobileMenu();
    }
  });

  // Modal Search
  const modalSearchInput = document.getElementById('modal-search-input');
  if (modalSearchInput) {
    modalSearchInput.addEventListener('input', async (e) => {
      const q = e.target.value.trim();
      if (!q) {
        document.getElementById('modal-search-results').innerHTML = '<p class="text-sm text-gray-500 py-6 text-center">Type to search subjects, notes, or question banks across all 16 departments...</p>';
        return;
      }
      const needle = q.toLowerCase();
      const subjects = state.subjects.filter(s => `${s.name} ${s.code} ${s.shortName || ''} ${s.departmentId}`.toLowerCase().includes(needle));
      const impQuestions = state.subjects.flatMap(s => (s.impQuestions || [])
        .filter(item => `${item.question || item.text || item} ${s.name} ${s.code}`.toLowerCase().includes(needle))
        .map(item => ({ ...item, subjectId: s.id, subjectName: s.name, subjectCode: s.code })));
      const notes = state.subjects.flatMap(s => (s.notes || [])
        .filter(item => `${item.title || ''} ${item.name || ''} ${s.name} ${s.code}`.toLowerCase().includes(needle))
        .map(item => ({ ...item, subjectId: s.id, subjectName: s.name, subjectCode: s.code })));
      renderModalSearchResults({ subjects, impQuestions, notes });
    });
  }

  // Track button group horizontal scroll listener & auto-scroller
  const trackButtonsContainer = document.getElementById('track-quick-buttons');
  const trackWrapper = document.getElementById('track-buttons-wrapper');
  if (trackButtonsContainer) {
    trackButtonsContainer.addEventListener('scroll', () => {
      updateTrackScrollButtonState();
    }, { passive: true });

    if (trackWrapper) {
      trackWrapper.addEventListener('mouseenter', () => pauseAutoTrackScroller());
      trackWrapper.addEventListener('mouseleave', () => resumeAutoTrackScroller(2500));
      trackWrapper.addEventListener('touchstart', () => pauseAutoTrackScroller(), { passive: true });
      trackWrapper.addEventListener('touchend', () => resumeAutoTrackScroller(4000), { passive: true });
      trackWrapper.addEventListener('pointerdown', () => pauseAutoTrackScroller());
    }

    startAutoTrackScroller();
  }
  window.addEventListener('resize', () => {
    updateTrackScrollButtonState();
  });

  // Floating Back to Top Button on scroll down
  initBackToTop();
}

// Floating Back to Top Button Handler
function initBackToTop() {
  const btn = document.getElementById('back-to-top-btn');
  if (!btn) return;

  const handleScroll = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY > 280) {
      btn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
    } else {
      btn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      btn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
window.scrollToTop = scrollToTop;

// Automatically hide / show Choose Department section when searching
function updateChooseDepartmentVisibility(isSearching) {
  const deptSection = document.getElementById('choose-department-section');
  if (!deptSection) return;

  if (isSearching) {
    deptSection.classList.add('hidden');
  } else {
    const hasSearch = state.searchQuery && state.searchQuery.trim().length > 0;
    if (!hasSearch) {
      deptSection.classList.remove('hidden');
    }
  }
}
window.updateChooseDepartmentVisibility = updateChooseDepartmentVisibility;

// Clear Search logic
function clearMainSearch() {
  const searchInput = document.getElementById('main-search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  if (searchInput) {
    searchInput.value = '';
    state.searchQuery = '';
    searchInput.focus();
  }
  if (clearBtn) {
    clearBtn.classList.add('hidden');
  }
  updateChooseDepartmentVisibility(false);
  renderSubjects();
}

function triggerSearch() {
  const searchInput = document.getElementById('main-search-input');
  if (searchInput) {
    state.searchQuery = searchInput.value;
    updateChooseDepartmentVisibility(state.searchQuery.trim().length > 0);
    renderSubjects();
    mobileAutoScroll('subjects-section', { delay: 60, topMargin: 10 });
  }
}

function renderStats(stats) {
  const container = document.getElementById('hero-stats-bar');
  if (!container) return;
  container.innerHTML = `
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-500 dark:text-blue-400 shadow-xs">
      <i class="bi bi-buildings text-sm shrink-0"></i>
      <span>${stats.departmentsCount || 16} Academic Departments</span>
    </div>
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-500 dark:text-blue-400 shadow-xs">
      <i class="bi bi-mortarboard text-sm shrink-0"></i>
      <span>${stats.majorCount || 165} Core Papers</span>
    </div>
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-500 dark:text-blue-400 shadow-xs">
      <i class="bi bi-book text-sm shrink-0"></i>
      <span>${stats.minorCount || 112} Discipline Papers</span>
    </div>
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-500 dark:text-blue-400 shadow-xs">
      <i class="bi bi-file-earmark-text text-sm shrink-0"></i>
      <span>${stats.pyqsCount || 984} PYQs</span>
    </div>
  `;
}

function renderApp() {
  renderProgramPicker();
  renderPaperCategoryTabs();
  renderCategoryDepartmentDropdown();
  renderDepartmentChips();
  renderProgramButtons();
  renderTrackButtons();
  renderSemesterPills();
  updateTrackAndSemesterVisibility();
  renderBreadcrumb();
  renderSubjects();
  if (window.lucide) lucide.createIcons();
}

function renderPaperCategoryTabs() {
  const container = document.getElementById('paper-category-tabs');
  if (!container) return;
  const tabs = [
    ['department', 'Core / Major Papers'], ['vac', 'VAC'], ['aec', 'AEC'], ['mdc', 'MDC'], ['minor', 'Minor'], ['generic', 'Generic']
  ];
  container.innerHTML = tabs.map(([id, label]) => `
    <button type="button" role="tab" aria-selected="${state.browseCategory === id}"
      onclick="selectBrowseCategory('${id}')"
      class="rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${state.browseCategory === id
        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'}">${label}</button>
  `).join('');
}

function renderProgramPicker() {
  const picker = document.getElementById('program-picker-section');
  const browser = document.getElementById('program-browser-section');
  const title = document.getElementById('selected-program-title');
  const ugCount = document.getElementById('ug-subject-count');
  const pgCount = document.getElementById('pg-subject-count');
  const pgDepartments = new Set(['english', 'history', 'polsci', 'sociology']);
  const ugDepartmentCount = state.departments.filter(department => PAPER_DEPARTMENTS[department.id]).length;

  if (ugCount) ugCount.textContent = ugDepartmentCount.toLocaleString();
  if (pgCount) pgCount.textContent = state.departments.filter(department => pgDepartments.has(department.id)).length.toLocaleString();
  if (picker) picker.classList.toggle('hidden', !!state.selectedProgramLevel);
  if (browser) browser.classList.toggle('hidden', !state.selectedProgramLevel);
  if (title) title.textContent = state.selectedProgramLevel === 'PG' ? 'Postgraduate (PG)' : 'Undergraduate (UG)';
}

function selectBrowseCategory(category) {
  if (category === 'ug' || category === 'pg') {
    selectProgramLevel(category.toUpperCase());
    return;
  }
  if (!state.selectedProgramLevel) return;
  state.browseCategory = category;
  // Common-paper categories remain inside the selected UG or PG browser.
  state.selectedDepartment = '';
  state.selectedSemester = '';
  state.selectedTrack = '';
  state.selectedMinorDept = 'all';
  state.selectedMdcDept = 'all';
  renderPaperCategoryTabs();
  renderCategoryDepartmentDropdown();
  renderDepartmentChips();
  renderProgramButtons();
  renderSemesterPills();
  renderTrackButtons();
  updateTrackAndSemesterVisibility();
  renderBreadcrumb();
  renderSubjects();
  if (window.lucide) lucide.createIcons();
  if (['department', 'mdc', 'minor', 'generic'].includes(category)) mobileAutoScroll('choose-department-section', { delay: 90, topMargin: 12 });
  else if (!['department'].includes(category)) mobileAutoScroll('semester-selector-section', { delay: 90, topMargin: 12 });
}
window.selectBrowseCategory = selectBrowseCategory;

function renderCategoryDepartmentDropdown() {
  const category = state.browseCategory;
    const isCategoryDepartmentGrid = ['department', 'mdc', 'minor', 'generic'].includes(category);
  const heading = document.getElementById('department-picker-heading');
  const container = document.getElementById('department-chips-container');
  if (!heading || !container) return;

  heading.classList.toggle('hidden', !state.selectedProgramLevel || (!isCategoryDepartmentGrid && !['ug', 'pg'].includes(category)));
  container.classList.toggle('hidden', !state.selectedProgramLevel || (!isCategoryDepartmentGrid && !['ug', 'pg'].includes(category)));
  if (isCategoryDepartmentGrid) {
    const title = heading.querySelector('h2');
    if (title) title.textContent = 'Choose department';
  }
  if (!isCategoryDepartmentGrid) return;

  if (category === 'department') {
    renderDepartmentChips();
    return;
  }

  const isPg = state.selectedProgramLevel === 'PG';
  const departmentIds = [...new Set(state.subjects
    .filter(subject => {
      const track = (subject.track || '').toLowerCase();
      const hasCategory = category === 'mdc'
        ? track === 'mdc'
        : category === 'minor'
          ? track === 'minor'
          : ['generic', 'generic_elective', 'ge'].includes(track);
      return hasCategory && (isPg ? subject.programLevel === 'PG' : subject.programLevel !== 'PG');
    })
    .map(subject => subject.departmentId))];
  const allowedIds = new Set(departmentIds);
  const departments = state.departments.filter(department => allowedIds.has(department.id));
  const visibleDepartments = isPg
    ? departments.filter(department => ['english', 'history', 'polsci', 'sociology'].includes(department.id))
    : departments;
  container.innerHTML = visibleDepartments.map(department => {
    const selected = department.id === state.selectedDepartment;
    return `
      <button type="button" onclick="selectCategoryDepartment('${department.id}')"
        class="dept-card flex flex-col items-start justify-between p-3 sm:p-4 rounded-2xl border text-left cursor-pointer min-h-[76px] sm:min-h-[84px] group active:scale-[0.98] transition-transform ${selected
          ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30 scale-[1.02]'
          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-200'}">
        <div class="flex items-center justify-between w-full mb-1 sm:mb-1.5">
          <span class="dept-code text-sm sm:text-base font-black tracking-wide font-mono ${selected ? 'text-white' : 'text-gray-900 dark:text-white'}">${department.code}</span>
          <i data-lucide="${department.icon || 'book'}" class="dept-icon w-4 h-4 sm:w-5 sm:h-5 ${selected ? 'text-amber-300' : 'text-blue-600 dark:text-gray-400'}"></i>
        </div>
        <span class="dept-name text-xs sm:text-[13px] font-semibold leading-snug line-clamp-2 ${selected ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'}">${department.name}</span>
      </button>`;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function selectCategoryDepartment(departmentId) {
  state.selectedDepartment = departmentId;
  state.selectedSemester = '';
  state.selectedTrack = '';
  state.selectedMinorDept = 'all';
  state.selectedMdcDept = 'all';
  renderCategoryDepartmentDropdown();
  renderDepartmentChips();
  renderSemesterPills();
  updateTrackAndSemesterVisibility();
  renderBreadcrumb();
  renderSubjects();
  if (departmentId) mobileAutoScroll('semester-selector-section', { delay: 90, topMargin: 12 });
}
window.selectCategoryDepartment = selectCategoryDepartment;

function clearProgramSelection() {
  state.selectedProgramLevel = '';
  state.browseCategory = 'ug';
  state.selectedDepartment = '';
  state.selectedSemester = '';
  state.selectedTrack = '';
  state.selectedMinorDept = 'all';
  state.selectedMdcDept = 'all';
  renderDepartmentChips();
  renderApp();
}
window.clearProgramSelection = clearProgramSelection;

// 1. Department Selector (16 Departments in Exactly Two Lines, Alphabetical by Code)
function renderDepartmentChips() {
  const container = document.getElementById('department-chips-container');
  const heading = document.getElementById('department-picker-heading');
  const needsDepartment = !!state.selectedProgramLevel && ['department', 'pg', 'mdc', 'minor', 'generic'].includes(state.browseCategory);
  if (container) container.classList.toggle('hidden', !needsDepartment);
  if (heading) heading.classList.toggle('hidden', !needsDepartment);

  if (state.departments && state.departments.length > 0) {
    state.departments.sort((a, b) => {
      if (a.id === 'bca' || a.code === 'BCA') return -1;
      if (b.id === 'bca' || b.code === 'BCA') return 1;
      return (a.code || '').localeCompare(b.code || '');
    });
  }

  // Populate 16 department cards in responsive grid
  if (container) {
    let visibleDepartments = state.browseCategory === 'pg'
      ? state.departments.filter(d => ['english', 'history', 'polsci', 'sociology'].includes(d.id))
      : state.departments;
    if (state.browseCategory === 'department') {
      const isPg = state.selectedProgramLevel === 'PG';
      const coreDepartments = new Set(state.subjects
        .filter(subject => (subject.track || 'major').toLowerCase() === 'major' && (isPg ? subject.programLevel === 'PG' : subject.programLevel !== 'PG'))
        .map(subject => subject.departmentId));
      visibleDepartments = visibleDepartments.filter(department => coreDepartments.has(department.id));
    }
    if (['minor', 'generic'].includes(state.browseCategory)) {
      const isPg = state.selectedProgramLevel === 'PG';
      const availableIds = new Set(state.subjects
        .filter(subject => {
          const track = (subject.track || '').toLowerCase();
          const hasCategory = state.browseCategory === 'mdc'
            ? track === 'mdc'
            : state.browseCategory === 'minor'
              ? track === 'minor'
              : ['generic', 'generic_elective', 'ge'].includes(track);
          return hasCategory && (isPg ? subject.programLevel === 'PG' : subject.programLevel !== 'PG');
        })
        .map(subject => subject.departmentId));
      visibleDepartments = visibleDepartments.filter(department => availableIds.has(department.id));
    }
    container.innerHTML = visibleDepartments.map((d) => {
      const isSelected = d.id === state.selectedDepartment;
      return `
        <button onclick="${['mdc', 'minor', 'generic', 'department'].includes(state.browseCategory) ? `selectCategoryDepartment('${d.id}')` : `selectDepartment('${d.id}')`}"
          class="dept-card flex flex-col items-start justify-between p-3 sm:p-4 rounded-2xl border text-left cursor-pointer min-h-[76px] sm:min-h-[84px] group active:scale-[0.98] transition-transform
          ${isSelected 
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30 scale-[1.02]' 
            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-200'}">
          <div class="flex items-center justify-between w-full mb-1 sm:mb-1.5">
            <span class="dept-code text-sm sm:text-base font-black tracking-wide font-mono ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}">${d.code}</span>
            <i data-lucide="${d.icon || 'book'}" class="dept-icon w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-amber-300' : 'text-blue-600 dark:text-gray-400'}"></i>
          </div>
          <span class="dept-name text-xs sm:text-[13px] font-semibold leading-snug line-clamp-2 ${isSelected ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'}">${d.name}</span>
        </button>
      `;
    }).join('');
  }
  if (window.lucide) lucide.createIcons();
}

// Mobile-Optimized Smooth Auto-Scroll Helper for Guided Step Selection
function mobileAutoScroll(elementId, options = {}) {
  const delay = typeof options === 'number' ? options : (options.delay ?? 90);
  const topMargin = typeof options === 'object' ? (options.topMargin ?? 12) : 12;

  requestAnimationFrame(() => {
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (!el) return;

      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
      }

      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : (window.innerWidth < 640 ? 56 : 70);
      const rect = el.getBoundingClientRect();
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      const elAbsoluteTop = currentScrollY + rect.top;

      // Position element cleanly below sticky header with topMargin breathing room.
      // Guarantees the section will NEVER be obscured under the header or scrolled too far up!
      const targetY = Math.max(0, Math.round(elAbsoluteTop - headerHeight - topMargin));

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }, delay);
  });
}

function smartScrollTo(elementId, options = {}) {
  mobileAutoScroll(elementId, options);
}

function smoothScrollTo(elementId, delay = 90, offset = 85) {
  mobileAutoScroll(elementId, { delay, topMargin: 12 });
}

function selectDepartment(deptId) {
  state.selectedDepartment = deptId;
  if (state.browseCategory === 'pg') state.selectedProgramLevel = 'PG';
  else if (state.browseCategory === 'ug') state.selectedProgramLevel = 'UG';
  renderProgramPicker();
  state.selectedSemester = '';
  state.selectedTrack = '';
  state.selectedMinorDept = 'all';
  state.selectedMdcDept = 'all';

  const pgNotice = document.getElementById('pg-info-notice');
  if (pgNotice) pgNotice.classList.add('hidden');

  updateTrackAndSemesterVisibility();
  renderDepartmentChips();
  renderProgramButtons();
  renderSemesterPills();
  renderTrackButtons();
  renderBreadcrumb();
  renderSubjects();

  // Mobile-optimized auto-scroll: if special dept (English, History, PolSci, Sociology) scroll to Program Level; else Semester
  if (deptId) {
    const targetSection = state.browseCategory === 'department' && isSpecialUgPgDept(deptId) ? 'program-level-section' : 'semester-selector-section';
    mobileAutoScroll(targetSection, { delay: 90, topMargin: 12 });
  }
}

// 2. Program Level Selector (UG / PG Segmented Buttons like Major and Minor)
function renderProgramButtons() {
  const ugBtn = document.getElementById('quick-btn-ug');
  const pgBtn = document.getElementById('quick-btn-pg');
  const ugChip = document.getElementById('ug-badge-chip');
  const pgChip = document.getElementById('pg-badge-chip');

  if (ugBtn) {
    if (state.selectedProgramLevel === 'UG') {
      ugBtn.className = 'group flex-1 sm:flex-initial justify-center px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40 hover:-translate-y-0.5 active:scale-95 min-h-[34px] sm:min-h-[42px]';
      if (ugChip) ugChip.className = 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-white/25 text-white shadow-xs';
    } else {
      ugBtn.className = 'group flex-1 sm:flex-initial justify-center px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 min-h-[34px] sm:min-h-[42px]';
      if (ugChip) ugChip.className = 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-300';
    }
  }

  if (pgBtn) {
    if (state.selectedProgramLevel === 'PG') {
      pgBtn.className = 'group flex-1 sm:flex-initial justify-center px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40 hover:-translate-y-0.5 active:scale-95 min-h-[34px] sm:min-h-[42px]';
      if (pgChip) pgChip.className = 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-white/25 text-white shadow-xs';
    } else {
      pgBtn.className = 'group flex-1 sm:flex-initial justify-center px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 min-h-[34px] sm:min-h-[42px]';
      if (pgChip) pgChip.className = 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-300';
    }
  }
}

function selectProgramLevel(level) {
  state.selectedProgramLevel = level === 'PG' ? 'PG' : 'UG';
  state.browseCategory = state.selectedProgramLevel.toLowerCase();
  state.selectedDepartment = '';
  state.selectedSemester = '';
  state.selectedTrack = '';
  state.selectedMinorDept = 'all';
  state.selectedMdcDept = 'all';

  const pgNotice = document.getElementById('pg-info-notice');
  if (pgNotice) pgNotice.classList.add('hidden');

  renderProgramPicker();
  renderPaperCategoryTabs();
  renderCategoryDepartmentDropdown();
  renderDepartmentChips();
  renderProgramButtons();
  updateTrackAndSemesterVisibility();
  renderSemesterPills();
  renderTrackButtons();
  renderBreadcrumb();
  renderSubjects();
  if (window.lucide) lucide.createIcons();

  mobileAutoScroll('paper-category-tabs', { delay: 90, topMargin: 12 });
}
window.selectProgramLevel = selectProgramLevel;

function getAvailableMinorSubjects() {
  const isSpecial = isSpecialUgPgDept(state.selectedDepartment);
  const isPg = isSpecial && state.selectedProgramLevel === 'PG';
  const semester = String(state.selectedSemester || '').toLowerCase();
  return state.subjects.filter(subject => {
    if ((subject.track || '').toLowerCase() !== 'minor') return false;
    if (isPg) {
      if (subject.programLevel !== 'PG') return false;
      if (semester.includes('1st') || semester === '1') return subject.year === '1st Year' || Number(subject.semester) === 1 || Number(subject.semester) === 2;
      if (semester.includes('2nd') || semester === '2') return subject.year === '2nd Year' || Number(subject.semester) === 3 || Number(subject.semester) === 4;
      return true;
    }
    return subject.programLevel !== 'PG' && Number(subject.semester) === Number(state.selectedSemester);
  });
}

// 3. Track Selector (Bootstrap Segmented Button Component, Unlocked in Step 3)
function renderTrackButtons() {
  // Calculate count for current department AND semester/year if selected
  let deptSubjects = state.subjects.filter(s =>
    s.departmentId === state.selectedDepartment ||
    (s.branches && s.branches.includes(state.selectedDepartment))
  );

  const isSpecial = isSpecialUgPgDept(state.selectedDepartment);
  const semNum = parseInt(state.selectedSemester, 10);
  const isPgSection = isSpecial && state.selectedProgramLevel === 'PG';

  if (isSpecial && state.selectedProgramLevel) {
    if (state.selectedProgramLevel === 'PG') {
      deptSubjects = deptSubjects.filter(s => s.programLevel === 'PG');
      if (state.selectedSemester === 'MA 1st Semester' || state.selectedSemester === '1st Year') {
        deptSubjects = deptSubjects.filter(s => s.year === '1st Year' || s.year === 1 || s.semester === 1 || s.semester === 2);
      } else if (state.selectedSemester === 'MA 2nd Semester' || state.selectedSemester === '2nd Year') {
        deptSubjects = deptSubjects.filter(s => s.year === '2nd Year' || s.year === 2 || s.semester === 3 || s.semester === 4);
      }
    } else {
      deptSubjects = deptSubjects.filter(s => s.programLevel !== 'PG');
      if (state.selectedSemester && state.selectedSemester !== 'all') {
        deptSubjects = deptSubjects.filter(s => s.semester === semNum);
      }
    }
  } else if (state.selectedSemester && state.selectedSemester !== 'all') {
    deptSubjects = deptSubjects.filter(s => s.semester === semNum);
  }

  // Under NEP 2024, Minor electives are offered across departments for that semester
  const availableMinors = getAvailableMinorSubjects();

  // Under NEP 2024, Multidisciplinary Courses (MDC) are offered across departments
  const availableMdcs = state.subjects.filter(s => {
    const isMdc = (s.track || '').toLowerCase() === 'mdc';
    const matchSem = s.semester === semNum;
    const matchLevel = isPgSection ? s.programLevel === 'PG' : s.programLevel !== 'PG';
    return isMdc && matchSem && matchLevel;
  });

  const majorCount = deptSubjects.filter(s => (s.track || 'major') === 'major').length;
  // If a specific minor department is chosen, count is 1; otherwise show all available minor electives for that semester
  const minorCount = state.selectedTrack === 'minor' && state.selectedMinorDept !== 'all'
    ? availableMinors.filter(s => s.departmentId === state.selectedMinorDept).length
    : availableMinors.length;

  // If a specific MDC department is chosen, count is 1; otherwise show all available MDC courses for that semester
  const mdcCount = (state.selectedTrack === 'mdc' && state.selectedMdcDept && state.selectedMdcDept !== 'all')
    ? 1
    : (availableMdcs.length || deptSubjects.filter(s => (s.track || '').toLowerCase() === 'mdc').length);

  const skillCount = deptSubjects.filter(s => s.track === 'skill' || s.track === 'skill_paper').length;
  const genericCount = deptSubjects.filter(s => (s.track || '').toLowerCase() === 'generic' || (s.track || '').toLowerCase() === 'generic_elective' || (s.track || '').toLowerCase() === 'ge').length;

  // In PG section, rename Major and Minor to Core Paper and Elective Paper
  const majorLabel = document.getElementById('major-track-label');
  const minorLabel = document.getElementById('minor-track-label');
  const mdcLabel = document.getElementById('mdc-track-label');
  const skillLabel = document.getElementById('skill-track-label');
  const genericLabel = document.getElementById('generic-track-label');

  if (majorLabel) majorLabel.textContent = isPgSection ? 'Core Paper' : 'Major';
  if (minorLabel) minorLabel.textContent = 'Discipline Paper';
  if (mdcLabel) mdcLabel.textContent = 'MD';
  if (skillLabel) skillLabel.textContent = 'Skill Paper';
  if (genericLabel) genericLabel.textContent = 'Generic';

  const majorBtn = document.getElementById('quick-btn-major');
  const minorBtn = document.getElementById('quick-btn-minor');
  const mdcBtn = document.getElementById('quick-btn-mdc');
  const skillBtn = document.getElementById('quick-btn-skill');
  const genericBtn = document.getElementById('quick-btn-generic');

  const majorChip = document.getElementById('major-count-chip');
  const minorChip = document.getElementById('minor-count-chip');
  const mdcChip = document.getElementById('mdc-count-chip');
  const skillChip = document.getElementById('skill-count-chip');
  const genericChip = document.getElementById('generic-count-chip');

  if (majorChip) {
    majorChip.textContent = `${majorCount}`;
    majorChip.className = state.selectedTrack === 'major'
      ? 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-white/25 text-white shadow-xs'
      : 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
  }
  if (minorChip) {
    minorChip.textContent = `${minorCount}`;
    minorChip.className = state.selectedTrack === 'minor'
      ? 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-white/25 text-white shadow-xs'
      : 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
  }
  if (mdcChip) {
    mdcChip.textContent = `${mdcCount}`;
    mdcChip.className = state.selectedTrack === 'mdc'
      ? 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-white/25 text-white shadow-xs'
      : 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400';
  }
  if (skillChip) {
    skillChip.textContent = `${skillCount}`;
    skillChip.className = state.selectedTrack === 'skill'
      ? 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-white/25 text-white shadow-xs'
      : 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }
  if (genericChip) {
    genericChip.textContent = `${genericCount}`;
    genericChip.className = state.selectedTrack === 'generic'
      ? 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-white/25 text-white shadow-xs'
      : 'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  }

  // Style buttons based on active track (Bootstrap Button-Group segmented pill style, mobile-optimized touch target)
  if (majorBtn) {
    if (state.selectedTrack === 'major') {
      majorBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    } else {
      majorBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    }
  }

  if (minorBtn) {
    if (state.selectedTrack === 'minor') {
      minorBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30 ring-2 ring-cyan-400/40 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    } else {
      minorBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    }
  }

  if (mdcBtn) {
    if (state.selectedTrack === 'mdc') {
      mdcBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    } else {
      mdcBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    }
  }

  if (skillBtn) {
    if (state.selectedTrack === 'skill') {
      skillBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30 ring-2 ring-amber-400/40 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    } else {
      skillBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    }
  }

  if (genericBtn) {
    if (state.selectedTrack === 'generic') {
      genericBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    } else {
      genericBtn.className = 'group flex-1 sm:flex-initial justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-xl border text-[11px] sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 min-h-[38px] sm:min-h-[42px]';
    }
  }

  if (mdcBtn) mdcBtn.classList.add('hidden');
  if (genericBtn) genericBtn.classList.add('hidden');
  if (minorBtn) minorBtn.classList.toggle('hidden', availableMinors.length === 0);
  if (skillBtn) skillBtn.classList.toggle('hidden', !(semNum >= 1 && semNum <= 2));
  if (majorLabel) majorLabel.textContent = 'Core Paper';

  setTimeout(updateTrackScrollButtonState, 50);
}

// Horizontal scroll navigation for Track Button Group
function scrollTrackButtons(direction = 'right', fromUser = false) {
  const container = document.getElementById('track-quick-buttons');
  if (!container) return;

  if (fromUser) {
    pauseAutoTrackScroller();
    resumeAutoTrackScroller(5000);
  }

  const scrollAmount = 140;
  const isAtEnd = (container.scrollLeft + container.clientWidth) >= (container.scrollWidth - 15);

  if (direction === 'right') {
    if (isAtEnd) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  } else {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  setTimeout(updateTrackScrollButtonState, 350);
}

// Automatic Scroller to the right for Track Button Group (Smooth auto-advance on mobile/overflow)
let trackAutoScrollTimer = null;
let trackAutoScrollResumeTimer = null;
let isTrackAutoScrollPaused = false;

function startAutoTrackScroller() {
  if (trackAutoScrollTimer) return;
  trackAutoScrollTimer = setInterval(() => {
    if (isTrackAutoScrollPaused) return;
    const container = document.getElementById('track-quick-buttons');
    const section = document.getElementById('track-dropdown-section');
    if (!container || !section || section.classList.contains('hidden') || container.offsetParent === null) return;

    // Check if horizontal scrolling is needed
    if (container.scrollWidth <= container.clientWidth + 8) return;

    scrollTrackButtons('right', false);
  }, 3500);
}

function stopAutoTrackScroller() {
  if (trackAutoScrollTimer) {
    clearInterval(trackAutoScrollTimer);
    trackAutoScrollTimer = null;
  }
  if (trackAutoScrollResumeTimer) {
    clearTimeout(trackAutoScrollResumeTimer);
    trackAutoScrollResumeTimer = null;
  }
}

function pauseAutoTrackScroller() {
  isTrackAutoScrollPaused = true;
  if (trackAutoScrollResumeTimer) {
    clearTimeout(trackAutoScrollResumeTimer);
    trackAutoScrollResumeTimer = null;
  }
}

function resumeAutoTrackScroller(delayMs = 4000) {
  if (trackAutoScrollResumeTimer) clearTimeout(trackAutoScrollResumeTimer);
  trackAutoScrollResumeTimer = setTimeout(() => {
    isTrackAutoScrollPaused = false;
  }, delayMs);
}

window.startAutoTrackScroller = startAutoTrackScroller;
window.stopAutoTrackScroller = stopAutoTrackScroller;
window.pauseAutoTrackScroller = pauseAutoTrackScroller;
window.resumeAutoTrackScroller = resumeAutoTrackScroller;

function updateTrackScrollButtonState() {
  const container = document.getElementById('track-quick-buttons');
  const btn = document.getElementById('track-scroll-right-btn');
  const icon = document.getElementById('track-scroll-icon');
  if (!container || !btn) return;

  const hasOverflow = container.scrollWidth > container.clientWidth + 8;
  if (!hasOverflow) {
    btn.classList.add('hidden');
    btn.classList.remove('flex');
    return;
  }

  btn.classList.remove('hidden');
  btn.classList.add('flex');

  const isAtEnd = (container.scrollLeft + container.clientWidth) >= (container.scrollWidth - 15);
  if (icon) {
    if (isAtEnd) {
      icon.setAttribute('data-lucide', 'chevron-left');
      btn.setAttribute('title', 'Scroll back to start');
      btn.setAttribute('aria-label', 'Scroll back to start');
    } else {
      icon.setAttribute('data-lucide', 'chevron-right');
      btn.setAttribute('title', 'Scroll right');
      btn.setAttribute('aria-label', 'Scroll right');
    }
    if (window.lucide) lucide.createIcons();
  }
}
window.scrollTrackButtons = scrollTrackButtons;
window.updateTrackScrollButtonState = updateTrackScrollButtonState;

function selectTrack(track) {
  state.selectedTrack = track;
  if (track !== 'minor') {
    state.selectedMinorDept = 'all';
  }
  if (track !== 'mdc') {
    state.selectedMdcDept = 'all';
  }

  // Pause auto-scroller when user explicitly selects a track
  pauseAutoTrackScroller();
  resumeAutoTrackScroller(6000);

  updateTrackAndSemesterVisibility();
  populateMinorDeptDropdown();
  populateMdcDeptDropdown();
  renderTrackButtons();
  renderBreadcrumb();
  renderSubjects();

  // Scroll active track button into view inside track-quick-buttons
  const activeBtn = document.getElementById(`quick-btn-${track}`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  // Mobile auto-scroll: Keep Major, Minor & Skill Paper buttons comfortably visible at top under sticky header,
  // with filter summary bar and subject cards clearly displayed below!
  if (track) {
    mobileAutoScroll('track-dropdown-section', { delay: 90, topMargin: 8 });
  }
}

// Populate inter-department Minor dropdown menu (NEP 2024 Electives)
function populateMinorDeptDropdown() {
  const wrapper = document.getElementById('minor-dept-dropdown-wrapper');
  const selectEl = document.getElementById('minor-dept-select');
  if (!wrapper || !selectEl) return;

  if (state.selectedTrack !== 'minor' || !['ug', 'department'].includes(state.browseCategory)) {
    wrapper.classList.add('hidden');
    return;
  }
  const semMinors = getAvailableMinorSubjects();
  if (!semMinors.length) {
    wrapper.classList.add('hidden');
    state.selectedMinorDept = 'all';
    return;
  }
  wrapper.classList.remove('hidden');

  // Sort by department name
  semMinors.sort((a, b) => {
    const deptA = (state.departments.find(d => d.id === a.departmentId)?.name || a.departmentId).toLowerCase();
    const deptB = (state.departments.find(d => d.id === b.departmentId)?.name || b.departmentId).toLowerCase();
    return deptA.localeCompare(deptB);
  });

  const departments = [...new Set(semMinors.map(s => s.departmentId))];
  let optionsHtml = `<option value="all">All Departments (${semMinors.length})</option>`;
  departments.forEach(departmentId => {
    const dept = state.departments.find(d => d.id === departmentId || d.code.toLowerCase() === (departmentId || '').toLowerCase());
    const deptName = dept ? dept.name : (departmentId || '').toUpperCase();
    optionsHtml += `<option value="${departmentId}">${deptName} (${semMinors.filter(s => s.departmentId === departmentId).length})</option>`;
  });

  selectEl.innerHTML = optionsHtml;
  if (state.selectedMinorDept && state.selectedMinorDept !== 'all') {
    selectEl.value = state.selectedMinorDept;
  } else {
    selectEl.value = 'all';
  }

  if (window.lucide) lucide.createIcons();
}
window.populateMinorDeptDropdown = populateMinorDeptDropdown;

function handleMinorDeptChange(deptId) {
  state.selectedMinorDept = deptId;
  renderBreadcrumb();
  renderSubjects();
  renderTrackButtons();
}
window.handleMinorDeptChange = handleMinorDeptChange;

// Populate inter-department MDC dropdown menu (NEP 2024 Multidisciplinary Courses)
function populateMdcDeptDropdown() {
  const wrapper = document.getElementById('mdc-dept-dropdown-wrapper');
  const selectEl = document.getElementById('mdc-dept-select');
  if (!wrapper || !selectEl) return;

  if (state.selectedTrack !== 'mdc') {
    wrapper.classList.add('hidden');
    return;
  }

  wrapper.classList.remove('hidden');

  const sem = parseInt(state.selectedSemester, 10);
  const isSpecial = isSpecialUgPgDept(state.selectedDepartment);
  const isPg = isSpecial && state.selectedProgramLevel === 'PG';

  const semMdcs = state.subjects.filter(s => {
    const isMdc = (s.track || '').toLowerCase() === 'mdc';
    const matchLevel = isPg ? s.programLevel === 'PG' : s.programLevel !== 'PG';
    if (!isMdc || !matchLevel) return false;
    return s.semester === sem;
  });

  // Sort by department name
  semMdcs.sort((a, b) => {
    const deptA = (state.departments.find(d => d.id === a.departmentId)?.name || a.departmentId).toLowerCase();
    const deptB = (state.departments.find(d => d.id === b.departmentId)?.name || b.departmentId).toLowerCase();
    return deptA.localeCompare(deptB);
  });

  let optionsHtml = `<option value="all">🌟 All Departments (${semMdcs.length})</option>`;
  semMdcs.forEach(s => {
    const dept = state.departments.find(d => d.id === s.departmentId || d.code.toLowerCase() === (s.departmentId || '').toLowerCase());
    const deptName = dept ? dept.name : (s.departmentId || '').toUpperCase();
    const isSelected = state.selectedMdcDept === s.departmentId ? 'selected' : '';
    optionsHtml += `<option value="${s.departmentId}" ${isSelected}>${deptName}</option>`;
  });

  selectEl.innerHTML = optionsHtml;
  if (state.selectedMdcDept && state.selectedMdcDept !== 'all') {
    selectEl.value = state.selectedMdcDept;
  } else {
    selectEl.value = 'all';
  }

  if (window.lucide) lucide.createIcons();
}
window.populateMdcDeptDropdown = populateMdcDeptDropdown;

function handleMdcDeptChange(deptId) {
  state.selectedMdcDept = deptId;
  renderBreadcrumb();
  renderSubjects();
  renderTrackButtons();
}
window.handleMdcDeptChange = handleMdcDeptChange;

function updateTrackAndSemesterVisibility() {
  const semSection = document.getElementById('semester-selector-section');
  const programSection = document.getElementById('program-level-section');
  const trackSection = document.getElementById('track-dropdown-section');
  const filterSummary = document.getElementById('filter-summary-bar');

  const deptId = state.selectedDepartment;
  const isSpecialDept = isSpecialUgPgDept(deptId);

  if (!state.selectedProgramLevel) {
    if (semSection) semSection.classList.add('hidden');
    if (programSection) programSection.classList.add('hidden');
    if (trackSection) trackSection.classList.add('hidden');
    if (filterSummary) filterSummary.classList.add('hidden');
    return;
  }

  if (['vac', 'aec'].includes(state.browseCategory)) {
    if (programSection) programSection.classList.add('hidden');
    if (semSection) semSection.classList.remove('hidden');
    if (trackSection) trackSection.classList.add('hidden');
    if (filterSummary) filterSummary.classList.add('hidden');
    return;
  }
  if (['generic', 'minor', 'mdc', 'department'].includes(state.browseCategory)) {
    if (programSection) programSection.classList.add('hidden');
    if (semSection) semSection.classList.toggle('hidden', !deptId);
    if (trackSection) trackSection.classList.add('hidden');
    if (filterSummary) filterSummary.classList.add('hidden');
    return;
  }
  if (state.browseCategory === 'pg') {
    if (programSection) programSection.classList.add('hidden');
    if (semSection) semSection.classList.toggle('hidden', !deptId);
    if (trackSection) trackSection.classList.add('hidden');
    if (filterSummary) filterSummary.classList.add('hidden');
    return;
  }
  if (state.browseCategory === 'ug') {
    if (programSection) programSection.classList.add('hidden');
    if (semSection) semSection.classList.toggle('hidden', !deptId);
    if (trackSection) trackSection.classList.toggle('hidden', !(deptId && state.selectedSemester));
    if (filterSummary) filterSummary.classList.toggle('hidden', !(deptId && state.selectedSemester && state.selectedTrack));
    return;
  }

  if (isSpecialDept) {
    // English, History, PolSci, Sociology: Show Program Level section (Buttons like Major/Minor)
    if (programSection) {
      programSection.classList.remove('hidden');
      const deptObj = state.departments.find(d => d.id === deptId);
      const programDeptLabel = document.getElementById('program-dept-label');
      const pgDeptName = document.getElementById('pg-dept-name');
      if (programDeptLabel && deptObj) programDeptLabel.textContent = `${deptObj.name} Degree Level`;
      if (pgDeptName && deptObj) pgDeptName.textContent = deptObj.name;
    }

    // Step 2 (Semester / Year Pills) is visible when user clicks UG OR PG!
    const isProgramLevelSelected = !!state.selectedProgramLevel;
    if (semSection) {
      if (isProgramLevelSelected) semSection.classList.remove('hidden');
      else semSection.classList.add('hidden');
    }

    // Degree Track is unlocked only when program level AND a semester/year are chosen
    const isReadyForTrack = isProgramLevelSelected && !!state.selectedSemester;
    if (trackSection) {
      if (isReadyForTrack) trackSection.classList.remove('hidden');
      else trackSection.classList.add('hidden');
    }

    const isAllSelected = isReadyForTrack && !!state.selectedTrack;
    if (filterSummary) {
      if (isAllSelected) filterSummary.classList.remove('hidden');
      else filterSummary.classList.add('hidden');
    }
  } else {
    // All other 12 departments: Standard Semester Pills workflow
    if (programSection) programSection.classList.add('hidden');
    const pgNotice = document.getElementById('pg-info-notice');
    if (pgNotice) pgNotice.classList.add('hidden');

    const isDeptSelected = !!deptId;
    if (semSection) {
      if (isDeptSelected) semSection.classList.remove('hidden');
      else semSection.classList.add('hidden');
    }

    const isSemSelected = !!(deptId && state.selectedSemester);
    if (trackSection) {
      if (isSemSelected) trackSection.classList.remove('hidden');
      else trackSection.classList.add('hidden');
    }

    const isAllSelected = !!(deptId && state.selectedSemester && state.selectedTrack);
    if (filterSummary) {
      if (isAllSelected) filterSummary.classList.remove('hidden');
      else filterSummary.classList.add('hidden');
    }
  }

  // Ensure Lucide icons render for newly visible sections
  if (window.lucide) {
    lucide.createIcons();
  }
}

// 3. Semester / Academic Year Selector (Bootstrap Nav-Pills Component)
function renderSemesterPills() {
  const container = document.getElementById('semester-pills-container');
  const labelEl = document.getElementById('semester-section-label');
  const badgeEl = document.getElementById('semester-section-badge');
  const iconEl = document.getElementById('semester-section-icon');
  if (!container) return;

  const isSpecial = isSpecialUgPgDept(state.selectedDepartment);
  const isPgCategory = state.browseCategory === 'pg';
  const isPg = isPgCategory || (isSpecial && state.selectedProgramLevel === 'PG');

  if (isPg) {
    if (labelEl) labelEl.textContent = 'Semester';
    if (badgeEl) {
      badgeEl.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 shadow-xs';
    }
    if (iconEl) {
      iconEl.className = 'w-4 h-4 text-purple-600 dark:text-purple-400';
    }

    const pgYears = [
      { id: 'MA 1st Semester', name: 'Sem 1' },
      { id: 'MA 2nd Semester', name: 'Sem 2' }
    ];

    container.innerHTML = pgYears.map(y => {
      const isSelected = state.selectedSemester === y.id || (y.id === 'MA 1st Semester' && state.selectedSemester === '1st Year') || (y.id === 'MA 2nd Semester' && state.selectedSemester === '2nd Year');
      return `
        <button onclick="selectSemester('${y.id}')"
          class="flex-1 sm:flex-initial justify-center min-w-[140px] sm:min-w-0 min-h-[42px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-xs flex items-center gap-2
          ${isSelected 
            ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40 scale-[1.02]' 
            : 'bg-white/90 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-white hover:bg-purple-50/50 dark:hover:bg-white/10 hover:border-purple-400/40'}">
          <i data-lucide="calendar" class="w-4 h-4 ${isSelected ? 'text-white' : 'text-purple-500 dark:text-purple-400'}"></i>
          <span>${y.name}</span>
          ${y.badge ? `<span class="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-500/10 dark:bg-white/10 text-purple-600 dark:text-purple-300'}">${y.badge}</span>` : ''}
        </button>
      `;
    }).join('');

  } else {
    if (labelEl) labelEl.textContent = 'Semester';
    if (badgeEl) {
      badgeEl.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/25 shadow-xs';
    }
    if (iconEl) {
      iconEl.className = 'w-4 h-4 text-blue-500 dark:text-blue-400';
    }

    const sems = state.semesters.map(s => {
      const isSelected = state.selectedSemester === String(s.number);
      return `
        <button onclick="selectSemester('${s.number}')"
          class="flex-1 sm:flex-initial justify-center min-w-[70px] sm:min-w-0 min-h-[42px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-xs flex items-center gap-1.5
          ${isSelected 
            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40 scale-[1.02]' 
            : 'bg-white/90 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50/50 dark:hover:bg-white/10 hover:border-blue-400/40'}">
          <span>Sem ${s.number}</span>
          <span class="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}">${s.year}</span>
        </button>
      `;
    }).join('');
    container.innerHTML = sems;
  }

  if (window.lucide) lucide.createIcons();
}

function selectSemester(sem) {
  state.selectedSemester = sem;

  updateTrackAndSemesterVisibility();
  if (state.selectedTrack === 'minor') {
    populateMinorDeptDropdown();
  } else if (state.selectedTrack === 'mdc') {
    populateMdcDeptDropdown();
  }
  renderSemesterPills();
  renderTrackButtons();
  renderBreadcrumb();
  renderSubjects();

  // Mobile auto-scroll:
  // If track not chosen yet: position semester section near top, keeping both semester pills and track buttons in easy thumb reach!
  // If track already chosen: position track section near top, keeping track buttons and subject cards in clear view!
  if (sem) {
    if (!state.selectedTrack) {
      mobileAutoScroll('semester-selector-section', { delay: 90, topMargin: 8 });
    } else {
      mobileAutoScroll('track-dropdown-section', { delay: 90, topMargin: 8 });
    }
  }
}

// 4. Breadcrumb Indicator
function renderBreadcrumb() {
  const deptEl = document.getElementById('active-dept-summary');
  const trackEl = document.getElementById('active-track-summary');
  const semEl = document.getElementById('active-sem-summary');

  const dept = state.departments.find(d => d.id === state.selectedDepartment);
  if (deptEl) deptEl.textContent = dept ? dept.name : 'No Department Selected';

  if (semEl) {
    if (isSpecialUgPgDept(state.selectedDepartment) && state.selectedProgramLevel) {
      if (state.selectedProgramLevel === 'PG') {
        semEl.textContent = state.selectedSemester 
          ? `PG · ${state.selectedSemester}` 
          : `PG (Select Semester)`;
      } else {
        semEl.textContent = state.selectedSemester 
          ? `UG · Sem ${state.selectedSemester}` 
          : `UG (Select Sem)`;
      }
    } else {
      semEl.textContent = state.selectedSemester ? `Semester ${state.selectedSemester}` : 'Semester Not Selected';
    }
    semEl.className = state.selectedSemester
      ? 'font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20'
      : 'font-bold text-gray-400 px-2 py-0.5 rounded bg-white/10';
  }

  if (trackEl) {
    const isSpecial = isSpecialUgPgDept(state.selectedDepartment);
    const isPg = isSpecial && state.selectedProgramLevel === 'PG';

    if (state.selectedTrack === 'major') {
      trackEl.textContent = 'Core Paper';
      trackEl.className = 'font-bold text-slate-800 dark:text-gray-200 px-2 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs';
    } else if (state.selectedTrack === 'minor') {
      const minorDept = state.departments.find(d => d.id === state.selectedMinorDept);
      const minorLabel = (minorDept && state.selectedMinorDept !== 'all')
        ? `Minor · ${minorDept.name}`
        : 'Minor Electives';
      trackEl.textContent = minorLabel;
      trackEl.className = 'font-bold text-cyan-800 dark:text-cyan-200 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 shadow-xs';
    } else if (state.selectedTrack === 'mdc') {
      const mdcDept = state.departments.find(d => d.id === state.selectedMdcDept);
      const mdcLabel = (mdcDept && state.selectedMdcDept !== 'all')
        ? `MDC · ${mdcDept.name}`
        : 'MDC (All Departments)';
      trackEl.textContent = mdcLabel;
      trackEl.className = 'font-bold text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 shadow-xs';
    } else if (state.selectedTrack === 'skill') {
      trackEl.textContent = 'Skill Paper';
      trackEl.className = 'font-bold text-slate-800 dark:text-gray-200 px-2 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs';
    } else if (state.selectedTrack === 'generic') {
      trackEl.textContent = 'Generic Elective';
      trackEl.className = 'font-bold text-slate-800 dark:text-gray-200 px-2 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs';
    } else if (state.selectedTrack === 'all') {
      trackEl.textContent = 'All Tracks';
      trackEl.className = 'font-bold text-gray-300 px-2 py-0.5 rounded bg-white/10';
    } else {
      trackEl.textContent = isPg ? 'Paper Type Not Selected' : 'Track Not Selected';
      trackEl.className = 'font-bold text-gray-400 px-2 py-0.5 rounded bg-white/10';
    }
  }
}

// 5. Subjects Grid
function renderSubjects() {
  const grid = document.getElementById('subjects-grid');
  const countBadge = document.getElementById('subjects-count-badge');
  if (!grid) return;

  const hasSearch = state.searchQuery && state.searchQuery.trim().length > 0;
  const commonCategory = ['vac', 'aec'].includes(state.browseCategory);
  const pgCategory = state.browseCategory === 'pg';
  updateChooseDepartmentVisibility(hasSearch);

  if (!hasSearch && commonCategory && !state.selectedSemester) {
    if (countBadge) countBadge.textContent = 'Select Semester';
    grid.innerHTML = '<div class="col-span-full py-12 px-4 text-center"><h3 class="text-base sm:text-lg font-bold text-white">Select Semester</h3><p class="text-xs text-gray-400 mt-1">Choose a semester above to view these common papers.</p></div>';
    return;
  }
  if (!hasSearch && pgCategory && !state.selectedDepartment) {
    if (countBadge) countBadge.textContent = 'Choose PG Department';
    grid.innerHTML = '<div class="col-span-full py-12 px-4 text-center"><h3 class="text-base sm:text-lg font-bold text-white">Choose a PG Department</h3><p class="text-xs text-gray-400 mt-1">Select History, English, Political Science, or Sociology above.</p></div>';
    return;
  }
  if (!hasSearch && pgCategory && !state.selectedSemester) {
    if (countBadge) countBadge.textContent = 'Select Semester';
    grid.innerHTML = '<div class="col-span-full py-12 px-4 text-center"><h3 class="text-base sm:text-lg font-bold text-white">Select Semester</h3><p class="text-xs text-gray-400 mt-1">Choose Sem 1 or Sem 2 above.</p></div>';
    return;
  }
  if (!hasSearch && ['department', 'generic', 'minor', 'mdc'].includes(state.browseCategory) && !state.selectedDepartment) {
    const categoryLabel = state.browseCategory === 'department' ? 'Core / Major' : state.browseCategory === 'minor' ? 'Minor' : state.browseCategory === 'mdc' ? 'MDC' : 'Generic';
    if (countBadge) countBadge.textContent = 'Choose Department';
    grid.innerHTML = `<div class="col-span-full py-12 px-4 text-center"><h3 class="text-base sm:text-lg font-bold text-white">Choose Department</h3><p class="text-xs text-gray-400 mt-1">${categoryLabel} papers are grouped by department. Choose one above.</p></div>`;
    return;
  }
  if (!hasSearch && ['department', 'generic', 'minor', 'mdc'].includes(state.browseCategory) && !state.selectedSemester) {
    if (countBadge) countBadge.textContent = 'Select Semester';
    grid.innerHTML = '<div class="col-span-full py-12 px-4 text-center"><h3 class="text-base sm:text-lg font-bold text-white">Select Semester</h3><p class="text-xs text-gray-400 mt-1">Choose a semester above to view the available papers.</p></div>';
    return;
  }

  // RULE: Before department, semester, and track are selected, do not show subjects (unless global search query entered)
  if (!hasSearch && !commonCategory && !pgCategory && !['department', 'generic', 'minor', 'mdc'].includes(state.browseCategory)) {
    if (!state.selectedDepartment) {
      if (countBadge) countBadge.textContent = 'Select Department & Semester';
      grid.innerHTML = `
        <div class="col-span-full py-12 px-4 text-center">
          <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg">
            <i data-lucide="layers" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base sm:text-lg font-bold text-white">Select Academic Department</h3>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const currentDept = state.departments.find(d => d.id === state.selectedDepartment);
    const isSpecialDept = isSpecialUgPgDept(state.selectedDepartment);

    if (isSpecialDept) {
      if (!state.selectedProgramLevel) {
        if (countBadge) countBadge.textContent = 'Select Program Level (UG / PG)';
        grid.innerHTML = `
          <div class="col-span-full py-12 px-4 text-center">
            <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg">
              <i data-lucide="graduation-cap" class="w-7 h-7"></i>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-white">Select Program Level</h3>
            <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">Please choose <strong>Under Graduate (UG)</strong> or <strong>Post Graduate (PG)</strong> using the buttons above for ${currentDept ? currentDept.name : 'this department'}.</p>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }
    }

    if (!state.selectedSemester) {
      const isPg = isSpecialDept && state.selectedProgramLevel === 'PG';
      const promptTitle = isPg ? 'Select Academic Semester' : 'Select Semester';
      const promptSubtitle = isPg 
        ? `Please select <strong>MA 1st Semester</strong> or <strong>MA 2nd Semester</strong> above to view ${currentDept ? currentDept.name : ''} Post Graduate (PG) courses.`
        : `Please choose a semester above to view courses.`;
      const iconName = isPg ? 'graduation-cap' : 'calendar';
      const colorClass = isPg ? 'purple' : 'blue';

      if (countBadge) countBadge.textContent = promptTitle;
      grid.innerHTML = `
        <div class="col-span-full py-12 px-4 text-center">
          <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-${colorClass}-500/10 border border-${colorClass}-500/20 flex items-center justify-center text-${colorClass}-400 shadow-lg">
            <i data-lucide="${iconName}" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base sm:text-lg font-bold text-white">${promptTitle}</h3>
          <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">${promptSubtitle}</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (!state.selectedTrack && ['ug', 'department'].includes(state.browseCategory)) {
      const isPg = isSpecialDept && state.selectedProgramLevel === 'PG';
      const promptTrackTitle = isPg ? 'Choose Paper Type' : 'Choose Degree Track';
      const promptTrackSub = isPg 
        ? 'Select <strong>Core Paper</strong>, <strong>Elective Paper</strong>, or <strong>Skill Paper</strong> above to view available course materials.' 
        : 'Select <strong>Major</strong>, <strong>Minor</strong>, or <strong>Skill Paper</strong> above to view available course materials.';

      if (countBadge) countBadge.textContent = promptTrackTitle;
      grid.innerHTML = `
        <div class="col-span-full py-12 px-4 text-center">
          <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg">
            <i data-lucide="graduation-cap" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base sm:text-lg font-bold text-white">${promptTrackTitle}</h3>
          <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">${promptTrackSub}</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }
  }

  let filtered = state.subjects;

  if (commonCategory) {
    filtered = filtered.filter(s => s.track === state.browseCategory && s.semester === parseInt(state.selectedSemester, 10));
  } else if (pgCategory) {
    filtered = state.subjects.filter(subject => {
      if (subject.programLevel !== 'PG' || subject.departmentId !== state.selectedDepartment) return false;
      if (state.selectedSemester === 'MA 1st Semester' || state.selectedSemester === '1st Year') return subject.year === '1st Year' || Number(subject.semester) === 1 || Number(subject.semester) === 2;
      if (state.selectedSemester === 'MA 2nd Semester' || state.selectedSemester === '2nd Year') return subject.year === '2nd Year' || Number(subject.semester) === 3 || Number(subject.semester) === 4;
      return true;
    });
  } else if (['generic', 'minor', 'mdc'].includes(state.browseCategory)) {
    const category = state.browseCategory;
    const isPg = state.selectedProgramLevel === 'PG';
    filtered = state.subjects.filter(subject => {
      const track = (subject.track || '').toLowerCase();
      const categoryMatches = category === 'generic'
        ? ['generic', 'generic_elective', 'ge'].includes(track)
        : track === category;
      if (!categoryMatches || subject.departmentId !== state.selectedDepartment) return false;
      if (isPg) {
        if (subject.programLevel !== 'PG') return false;
        if (state.selectedSemester === 'MA 1st Semester' || state.selectedSemester === '1st Year') return subject.year === '1st Year' || Number(subject.semester) === 1 || Number(subject.semester) === 2;
        if (state.selectedSemester === 'MA 2nd Semester' || state.selectedSemester === '2nd Year') return subject.year === '2nd Year' || Number(subject.semester) === 3 || Number(subject.semester) === 4;
        return true;
      }
      return subject.programLevel !== 'PG' && Number(subject.semester) === Number(state.selectedSemester);
    });
  } else if (state.browseCategory === 'department') {
    const isPg = state.selectedProgramLevel === 'PG';
    filtered = state.subjects.filter(subject => {
      if (subject.departmentId !== state.selectedDepartment) return false;
      if (isPg) {
        if (subject.programLevel !== 'PG') return false;
        if (state.selectedSemester === 'MA 1st Semester' || state.selectedSemester === '1st Year') return subject.year === '1st Year' || Number(subject.semester) === 1 || Number(subject.semester) === 2;
        if (state.selectedSemester === 'MA 2nd Semester' || state.selectedSemester === '2nd Year') return subject.year === '2nd Year' || Number(subject.semester) === 3 || Number(subject.semester) === 4;
        return true;
      }
      return subject.programLevel !== 'PG' && Number(subject.semester) === Number(state.selectedSemester) && (subject.track || 'major').toLowerCase() === 'major';
    });
  } else if (state.selectedTrack === 'minor') {
    filtered = getAvailableMinorSubjects();
    if (state.selectedMinorDept && state.selectedMinorDept !== 'all') {
      filtered = filtered.filter(s => s.departmentId === state.selectedMinorDept);
    }

  } else if (state.selectedTrack === 'mdc') {
    // Inter-department MDC subjects under NEP 2024
    const isSpecial = isSpecialUgPgDept(state.selectedDepartment);
    const isPg = isSpecial && state.selectedProgramLevel === 'PG';
    const currentSem = parseInt(state.selectedSemester, 10);

    filtered = filtered.filter(s => {
      const isMdc = (s.track || '').toLowerCase() === 'mdc';
      const matchLevel = isPg ? s.programLevel === 'PG' : s.programLevel !== 'PG';
      if (!isMdc || !matchLevel) return false;
      return s.semester === currentSem;
    });

    if (state.selectedMdcDept && state.selectedMdcDept !== 'all') {
      filtered = filtered.filter(s => s.departmentId === state.selectedMdcDept);
    }
  } else {
    // Filter by Department
    if (state.selectedDepartment && state.selectedDepartment !== 'all') {
      filtered = filtered.filter(s =>
        s.departmentId === state.selectedDepartment ||
        (s.branches && s.branches.includes(state.selectedDepartment))
      );
    }

    // Filter by Program Level (for the 4 special departments)
    const isSpecial = isSpecialUgPgDept(state.selectedDepartment);
    if (isSpecial && state.selectedProgramLevel) {
      if (state.selectedProgramLevel === 'PG') {
        filtered = filtered.filter(s => s.programLevel === 'PG');
        if (state.selectedSemester === 'MA 1st Semester' || state.selectedSemester === '1st Year') {
          filtered = filtered.filter(s => s.year === '1st Year' || s.year === 1 || s.semester === 1 || s.semester === 2);
        } else if (state.selectedSemester === 'MA 2nd Semester' || state.selectedSemester === '2nd Year') {
          filtered = filtered.filter(s => s.year === '2nd Year' || s.year === 2 || s.semester === 3 || s.semester === 4);
        }
      } else {
        filtered = filtered.filter(s => s.programLevel !== 'PG');
        if (state.selectedSemester && state.selectedSemester !== 'all') {
          filtered = filtered.filter(s => s.semester === parseInt(state.selectedSemester, 10));
        }
      }
    } else if (state.selectedSemester && state.selectedSemester !== 'all') {
      filtered = filtered.filter(s => s.semester === parseInt(state.selectedSemester, 10));
    }

    // Filter by Track (Major / Minor / Skill / Generic / All)
    if (state.selectedTrack && state.selectedTrack !== 'all') {
      if (state.selectedTrack === 'generic') {
        filtered = filtered.filter(s => {
          const t = (s.track || '').toLowerCase();
          return t === 'generic' || t === 'generic_elective' || t === 'ge';
        });
      } else if (state.selectedTrack === 'skill') {
        filtered = filtered.filter(s => {
          const t = (s.track || '').toLowerCase();
          return t === 'skill' || t === 'skill_paper';
        });
      } else {
        filtered = filtered.filter(s => (s.track || 'major').toLowerCase() === state.selectedTrack.toLowerCase());
      }
    }
  }

  // Filter by Search Query
  if (hasSearch) {
    const q = state.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.shortName && s.shortName.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.track && s.track.toLowerCase().includes(q))
    );
  }

  if (countBadge) {
    const isSpecialDept = isSpecialUgPgDept(state.selectedDepartment);
    const isPg = isSpecialDept && state.selectedProgramLevel === 'PG';
    let trackLabel = state.browseCategory === 'minor' ? 'Minor Papers' : state.browseCategory === 'generic' ? 'Generic Papers' : 'Subjects';
    if (['ug', 'department'].includes(state.browseCategory) && state.selectedTrack === 'major') {
      trackLabel = 'Core Papers';
    } else if (['ug', 'department'].includes(state.browseCategory) && state.selectedTrack === 'minor') {
      trackLabel = 'Discipline Papers';
    } else if (['ug', 'department'].includes(state.browseCategory) && state.selectedTrack === 'mdc') {
      const mdcDept = state.departments.find(d => d.id === state.selectedMdcDept);
      trackLabel = (mdcDept && state.selectedMdcDept !== 'all')
        ? `MDC (${mdcDept.name})`
        : 'MDC Subjects';
    } else if (['ug', 'department'].includes(state.browseCategory) && state.selectedTrack === 'skill') {
      trackLabel = 'Skill Papers';
    }
    countBadge.textContent = `${filtered.length} ${trackLabel} Available`;
  }

  if (filtered.length === 0) {
    const isSpecialDept = isSpecialUgPgDept(state.selectedDepartment);
    const isPg = isSpecialDept && state.selectedProgramLevel === 'PG';
    const toggleHint = isPg 
      ? 'Try switching the academic year or toggling between <strong>Core Paper</strong>, <strong>Elective Paper</strong>, <strong>MDC</strong>, <strong>Skill Paper</strong>, or <strong>Generic</strong> above.'
      : 'Try switching the semester or toggling between <strong>Major</strong>, <strong>Minor</strong>, <strong>MDC</strong>, <strong>Skill Paper</strong>, or <strong>Generic</strong> above.';

    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
          <i data-lucide="book-open" class="w-8 h-8"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-200">No subjects found</h3>
        <p class="text-sm text-gray-400 max-w-md mx-auto mt-1">
          ${toggleHint}
        </p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered.map(subject => {
    return `
      <a href="pages/subject.html?id=${encodeURIComponent(subject.id)}"
        aria-label="Open ${subject.code}: ${subject.name}"
        class="glass-panel min-h-28 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col items-start justify-center gap-3 group animate-fade-in border border-white/10 hover:border-indigo-400/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
        <span class="inline-flex rounded-md px-2 py-1 text-xs font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/20">${subject.code}</span>
        <h3 class="text-sm sm:text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors leading-snug">${subject.name}</h3>
      </a>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openSubjectPage(subjectId, initialTab = 'overview') {
  const tabParam = (initialTab && initialTab !== 'overview') ? `&tab=${encodeURIComponent(initialTab)}` : '';
  window.location.href = `pages/subject.html?id=${encodeURIComponent(subjectId)}${tabParam}`;
}

function openSubjectModal(subjectId, initialTab = 'overview') {
  openSubjectPage(subjectId, initialTab);
}

function closeSubjectModal() {
  const modal = document.getElementById('subject-detail-modal');
  if (modal) modal.classList.add('hidden');
}



// Document Reader Full-Page State
let currentAppPdfBlobUrl = null;

function printReaderPdf() {
  const iframe = document.getElementById('reader-iframe');
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      return;
    } catch (e) {}
  }
  if (currentAppPdfBlobUrl) {
    const w = window.open(currentAppPdfBlobUrl);
    if (w) w.print();
  } else {
    window.print();
  }
}

// Dynamic Multi-Page Verified PDF Document Generator (App / Modal view)
function generateDBCMSubjectPdf(subject, docTitle, fileName) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) return null;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 18;

  function checkPage(needHeight = 22) {
    if (y + needHeight > 272) {
      doc.addPage();
      y = 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${(subject && subject.name) || 'DBCM'} · Verified Document`, 15, 12);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 14, 195, 14);
    }
  }

  const isExam = (docTitle || '').toLowerCase().includes('exam') || (docTitle || '').toLowerCase().includes('pyq') || (docTitle || '').toLowerCase().includes('paper');
  const deptName = subject?.departmentId || 'Academic Department';

  // Top Primary Decorative Bar
  doc.setFillColor(30, 58, 138);
  doc.rect(15, y, 180, 2.5, 'F');
  y += 7;

  // Header Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('DON BOSCO COLLEGE (AUTONOMOUS) MARAM', 105, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Affiliated to Manipur University · NAAC Accredited 'A' Grade · Department of ${deptName}`, 105, y, { align: 'center' });
  y += 7;

  // Title Card Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, y, 180, isExam ? 28 : 26, 2.5, 2.5, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(isExam ? 180 : 30, isExam ? 83 : 58, isExam ? 9 : 138);
  const titleLines = doc.splitTextToSize(docTitle || (subject ? subject.name : 'Study Notes'), 172);
  doc.text(titleLines, 19, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (subject) {
    doc.text(`Course: ${subject.name} (${subject.code}) · Semester ${subject.semester}`, 19, y + 14);
    doc.text(isExam 
      ? `Autonomous Examination Paper · Maximum Marks: 80 · Duration: 3 Hours` 
      : `Autonomous NEP Curriculum · Verified Faculty Lecture Notes & Academic Blueprint`, 19, y + 20);
  } else {
    doc.text(`Don Bosco College Academic Resource · Verified Document`, 19, y + 14);
  }

  if (isExam) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Instructions: Answer all questions as per section guidelines. Figures in brackets indicate full marks.`, 19, y + 25);
    y += 34;

    checkPage(30);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 138);
    doc.text('PART A: CONCEPTUAL & OBJECTIVE QUESTIONS (10 x 2 = 20 MARKS)', 18, y + 5);
    y += 11;

    const partA = [
      `Define the primary objective and architectural scope of ${(subject && subject.name) || 'this course'}.`,
      `State two key differences between core operational mechanisms covered in Unit 1.`,
      `List standard protocols or principles governing this domain.`,
      `Give the formal definition of key term examined in Module 2.`,
      `Outline the computational or analytical complexity of fundamental procedures.`
    ];
    partA.forEach((q, idx) => {
      checkPage(12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const qLines = doc.splitTextToSize(`Q${idx + 1}. ${q} [2 Marks]`, 172);
      doc.text(qLines, 18, y);
      y += (qLines.length * 4.5) + 3;
    });

    checkPage(30);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 138);
    doc.text('PART B: DESCRIPTIVE & ANALYTICAL QUESTIONS (4 x 5 = 20 MARKS)', 18, y + 5);
    y += 11;

    const partB = [
      `Explain the structural framework with appropriate block diagrams or flow models.`,
      `Elaborate the analytical methodology used in solving real-world domain scenarios.`,
      `Critically examine the operational trade-offs discussed in the semester syllabus.`
    ];
    partB.forEach((q, idx) => {
      checkPage(15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const qLines = doc.splitTextToSize(`Q${idx + 6}. ${q} [5 Marks]`, 172);
      doc.text(qLines, 18, y);
      y += (qLines.length * 4.5) + 3;
    });

    checkPage(35);
    doc.setFillColor(254, 243, 199);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(146, 64, 14);
    doc.text('PART C: COMPREHENSIVE CASE STUDY & PROBLEM SOLVING (4 x 10 = 40 MARKS)', 18, y + 5);
    y += 11;

    const partC = (subject && subject.impQuestions && subject.impQuestions.length > 0)
      ? subject.impQuestions.map(q => q.q)
      : [
          `Design and thoroughly evaluate a comprehensive end-to-end implementation for this subject.`,
          `Provide detailed mathematical or procedural proof for core theorems presented in the syllabus.`
        ];
    partC.forEach((q, idx) => {
      checkPage(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const qLines = doc.splitTextToSize(`Q${idx + 9}. ${q} [10 Marks]`, 172);
      doc.text(qLines, 18, y);
      y += (qLines.length * 4.5) + 4;
    });

  } else {
    // Notes Layout
    y += 32;
    const unitMatch = (docTitle || '').match(/unit\s*(\d+)/i);
    const targetUnitNum = unitMatch ? parseInt(unitMatch[1], 10) : null;
    const targetModule = targetUnitNum && subject && subject.modules ? subject.modules.find(m => m.num === targetUnitNum) : null;

    if (targetModule) {
      checkPage(24);
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 58, 138);
      doc.text(`1. UNIT ${targetModule.num} OVERVIEW & LEARNING OBJECTIVES (${targetModule.weightage || '16 Marks'})`, 18, y + 5);
      y += 11;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const unitOverview = targetModule.summary || `Comprehensive theoretical principles, mathematical definitions, and practical methodologies for ${targetModule.title}.`;
      const descLines = doc.splitTextToSize(unitOverview, 172);
      doc.text(descLines, 18, y);
      y += (descLines.length * 4.5) + 6;

      checkPage(30);
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 58, 138);
      doc.text(`2. CORE TOPICS & TECHNICAL FOUNDATIONS`, 18, y + 5);
      y += 11;

      const topics = [
        `Standard Concepts & Nomenclature: Foundational definitions aligned with Don Bosco College Autonomous syllabus standards.`,
        `Architectural Workflows & Frameworks: Key procedural sequences, structural block diagrams, and operational formulas.`,
        `Critical Evaluations & Domain Applications: Applied problem-solving techniques and comparative analysis.`
      ];
      topics.forEach(t => {
        checkPage(14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const lines = doc.splitTextToSize(`• ${t}`, 172);
        doc.text(lines, 18, y);
        y += (lines.length * 4.5) + 3;
      });

      checkPage(30);
      doc.setFillColor(254, 243, 199);
      doc.rect(15, y, 180, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(146, 64, 14);
      doc.text(`3. UNIT ${targetModule.num} HIGH-YIELD PRACTICE QUESTIONS`, 18, y + 5);
      y += 11;

      const unitQuestions = [
        `Define the primary operational objective of ${targetModule.title}. [2 Marks]`,
        `Explain the key principles, structural models, and methodologies of Unit ${targetModule.num} with a labeled diagram. [5 Marks]`,
        `Provide a comprehensive analytical essay and case study evaluation on ${targetModule.title}. [10 Marks]`
      ];
      unitQuestions.forEach((uq, uIdx) => {
        checkPage(14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const qLines = doc.splitTextToSize(`Q${uIdx + 1}. ${uq}`, 172);
        doc.text(qLines, 18, y);
        y += (qLines.length * 4.5) + 3;
      });
    } else {
      if (subject && subject.description) {
        checkPage(24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 58, 138);
        doc.text('1. COURSE OVERVIEW & ACADEMIC SCOPE', 18, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const descLines = doc.splitTextToSize(subject.description, 172);
        doc.text(descLines, 18, y);
        y += (descLines.length * 4.5) + 6;
      }

      if (subject && subject.modules) {
        subject.modules.forEach(m => {
          checkPage(30);
          doc.setFillColor(241, 245, 249);
          doc.rect(15, y, 180, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(30, 58, 138);
          doc.text(`MODULE ${m.num || ''}: ${m.title || 'Curriculum Unit'} (${m.weightage || '15 Marks'})`, 18, y + 5);
          y += 10;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          const summaryLines = doc.splitTextToSize(m.summary || 'Detailed academic concepts, verified definitions, and faculty lecture notes.', 174);
          doc.text(summaryLines, 18, y);
          y += (summaryLines.length * 4.5) + 4;
        });
      }
    }

    if (subject && subject.impQuestions && subject.impQuestions.length > 0) {
      checkPage(35);
      doc.setFillColor(254, 243, 199);
      doc.rect(15, y, 180, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(146, 64, 14);
      doc.text('EXAM PREPARATION: HIGH-YIELD QUESTIONS & MODEL ANSWERS', 18, y + 5);
      y += 10;

      subject.impQuestions.forEach((q, idx) => {
        checkPage(24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Q${idx + 1}. ${q.q} [${q.marks || 10} Marks · ${q.frequency || 'Important'}]`, 18, y);
        y += 5;

        if (q.answerHint) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          const hintLines = doc.splitTextToSize(`Model Answer Key: ${q.answerHint}`, 170);
          doc.text(hintLines, 20, y);
          y += (hintLines.length * 4) + 3;
        }
      });
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Don Bosco College (Autonomous) Maram · Page ${i} of ${totalPages}`, 105, 289, { align: 'center' });
  }

  return doc.output('blob');
}

// Full-Page Document Reader Modal
function openReaderModal(title, subjectName, pdfUrl = null, fileName = null, docType = null) {
  const modal = document.getElementById('document-reader-modal');
  const titleEl = document.getElementById('reader-modal-title');
  const subtitleEl = document.getElementById('reader-modal-subtitle');
  const spinner = document.getElementById('reader-loading-spinner');
  const iframe = document.getElementById('reader-iframe');
  const downloadBtn = document.getElementById('reader-download-btn');

  if (!modal || !iframe) return;

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = `${subjectName} · Don Bosco College (Autonomous) Maram`;

  if (spinner) spinner.classList.remove('hidden');

  if (currentAppPdfBlobUrl) {
    try { URL.revokeObjectURL(currentAppPdfBlobUrl); } catch (e) {}
    currentAppPdfBlobUrl = null;
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const applyPdfUrl = (url, safeName) => {
    iframe.src = url + '#toolbar=1';
    if (downloadBtn) {
      downloadBtn.href = url;
      downloadBtn.download = (safeName || fileName || title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
    }
    setTimeout(() => {
      if (spinner) spinner.classList.add('hidden');
    }, 300);
  };

  if (pdfUrl && pdfUrl.trim() !== '' && pdfUrl !== '#' && !pdfUrl.startsWith('javascript')) {
    applyPdfUrl(pdfUrl, fileName);
  } else {
    // Find subject if available
    const matchedSubject = state.currentSubject || (state.subjects && state.subjects.find(s => s.name === subjectName || s.code === subjectName));
    try {
      const generatedBlob = generateDBCMSubjectPdf(matchedSubject, title, fileName);
      if (generatedBlob) {
        currentAppPdfBlobUrl = URL.createObjectURL(generatedBlob);
        applyPdfUrl(currentAppPdfBlobUrl, fileName || title);
      } else {
        throw new Error('jsPDF generation failed');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      if (spinner) spinner.classList.add('hidden');
    }
  }

  // Synchronize AI Tutor context with current active document
  if (window.setReaderAiDocumentContext) {
    const activeSubj = state.currentSubject || (state.subjects && state.subjects.find(s => s.name === subjectName || s.code === subjectName));
    const type = docType || (/paper|pyq|exam\s*paper/i.test(title) ? 'question-paper' : (fileName ? 'document' : 'syllabus'));
    window.setReaderAiDocumentContext(title, activeSubj, type);
  }

  if (window.lucide) lucide.createIcons();
}

function closeReaderModal() {
  const modal = document.getElementById('document-reader-modal');
  const iframe = document.getElementById('reader-iframe');
  if (modal) modal.classList.add('hidden');
  if (iframe) iframe.src = 'about:blank';
  document.body.style.overflow = '';
  if (window.toggleReaderAiDrawer) {
    window.toggleReaderAiDrawer(false);
  }
  if (currentAppPdfBlobUrl) {
    try { URL.revokeObjectURL(currentAppPdfBlobUrl); } catch (e) {}
    currentAppPdfBlobUrl = null;
  }
}

// Bookmarks logic
function toggleBookmark(subjectId, event) {
  if (event) event.stopPropagation();
  const subject = state.subjects.find(s => s.id === subjectId);
  if (!subject) return;

  const exists = state.bookmarks.some(b => b.id === subjectId);
  if (exists) {
    state.bookmarks = state.bookmarks.filter(b => b.id !== subjectId);
  } else {
    state.bookmarks.push({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      track: subject.track,
      semester: subject.semester
    });
  }

  localStorage.setItem('dbcm_bookmarks', JSON.stringify(state.bookmarks));
  renderSubjects();
  renderBookmarksList();
}

function openBookmarksDrawer() {
  const drawer = document.getElementById('bookmarks-drawer');
  renderBookmarksList();
  if (drawer) drawer.classList.remove('hidden');
}

function closeBookmarksDrawer() {
  const drawer = document.getElementById('bookmarks-drawer');
  if (drawer) drawer.classList.add('hidden');
}

function renderBookmarksList() {
  const container = document.getElementById('bookmarks-list-container');
  if (!container) return;

  if (state.bookmarks.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <i data-lucide="bookmark" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm">No saved bookmarks yet.</p>
        <p class="text-xs text-gray-500 mt-1">Click the bookmark icon on any DBCM subject card to save it for quick review.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = state.bookmarks.map(b => `
    <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between hover:border-amber-400/30 transition-colors">
      <div onclick="openSubjectModal('${b.id}'); closeBookmarksDrawer();" class="cursor-pointer">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="text-xs font-mono font-bold text-amber-400">${b.code}</span>
          <span class="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${b.track === 'minor' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-indigo-500/20 text-indigo-400'}">${b.track || 'major'}</span>
        </div>
        <h4 class="text-sm font-semibold text-white">${b.name}</h4>
        <span class="text-[11px] text-gray-400">Sem ${b.semester}</span>
      </div>
      <button onclick="toggleBookmark('${b.id}')" class="p-1.5 rounded-lg text-amber-400 hover:bg-white/10 cursor-pointer" title="Remove">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

// Search Modal
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('modal-search-input')?.focus();
  }
}

function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) modal.classList.add('hidden');
}

function renderModalSearchResults(data) {
  const container = document.getElementById('modal-search-results');
  if (!container) return;

  const { subjects, impQuestions, notes } = data;
  if (!subjects.length && !impQuestions.length && !notes.length) {
    container.innerHTML = '<p class="text-sm text-gray-500 py-6 text-center">No matching resources found.</p>';
    return;
  }

  let html = '';

  if (subjects.length) {
    html += `
      <div class="mb-4">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">DBCM Subjects (${subjects.length})</h4>
        <div class="space-y-1.5">
          ${subjects.map(s => `
            <div onclick="openSubjectModal('${s.id}'); closeSearchModal();"
              class="p-2.5 rounded-lg bg-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 border border-transparent cursor-pointer flex items-center justify-between text-xs">
              <div>
                <span class="font-semibold text-white">${s.name} (${s.code})</span>
                <span class="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${s.track === 'minor' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-indigo-500/20 text-indigo-300'}">${s.track || 'major'}</span>
              </div>
              <span class="text-gray-400 font-mono">Sem ${s.semester}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (impQuestions.length) {
    html += `
      <div class="mb-4">
        <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">High-Yield Questions (${impQuestions.length})</h4>
        <div class="space-y-1.5">
          ${impQuestions.map(q => `
            <div onclick="openSubjectModal('${q.subjectId}', 'imps'); closeSearchModal();"
              class="p-2.5 rounded-lg bg-white/5 hover:bg-amber-600/20 hover:border-amber-500/30 border border-transparent cursor-pointer text-xs">
              <div class="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                <span class="font-bold text-amber-400">${q.subjectName}</span>
                <span>${q.marks} Marks • ${q.frequency}</span>
              </div>
              <p class="text-white font-medium truncate">${q.question}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (notes.length) {
    html += `
      <div>
        <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Lecture Notes (${notes.length})</h4>
        <div class="space-y-1.5">
          ${notes.map(n => `
            <div onclick="openSubjectModal('${n.subjectId}', 'notes'); closeSearchModal();"
              class="p-2.5 rounded-lg bg-white/5 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent cursor-pointer flex items-center justify-between text-xs">
              <span class="font-semibold text-white">${n.title}</span>
              <span class="text-gray-400 font-mono">${n.pages} Pages</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ==========================================
// HOME PAGE STUDENT RESOURCE CONTRIBUTION MODAL
// ==========================================
let homeSelectedContribFile = null;

function populateHomeContributionDepartments(program, preferredDepartment = '') {
  const deptSelect = document.getElementById('home-contrib-dept');
  if (!deptSelect) return;
  const pgDepartments = new Set(['english', 'history', 'polsci', 'sociology']);
  const departments = program === 'PG'
    ? state.departments.filter(department => pgDepartments.has(department.id))
    : state.departments;
  deptSelect.innerHTML = '<option value="">Select Department...</option>' + departments.map(department => {
    const displayName = department.name.includes('(') ? department.name : `${department.name} (${department.code || department.id.toUpperCase()})`;
    return `<option value="${department.id}">${displayName}</option>`;
  }).join('');
  deptSelect.value = departments.some(department => department.id === preferredDepartment)
    ? preferredDepartment
    : (departments[0]?.id || '');
}

function populateHomeContributionSemesters(program, selectedValue = '') {
  const semSelect = document.getElementById('home-contrib-semester');
  if (!semSelect) return;
  if (program === 'PG') {
    semSelect.innerHTML = '<option value="1">Year 1</option><option value="3">Year 2</option>';
    semSelect.value = selectedValue === '3' ? '3' : '1';
  } else {
    semSelect.innerHTML = Array.from({ length: 8 }, (_, index) =>
      `<option value="${index + 1}">Semester ${index + 1} (Sem ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][index]})</option>`
    ).join('');
    semSelect.value = String(Math.max(1, Math.min(8, Number(selectedValue) || 1)));
  }
}

window.handleHomeContribProgramChange = function (program) {
  const level = String(program || 'UG').toUpperCase() === 'PG' ? 'PG' : 'UG';
  const department = document.getElementById('home-contrib-dept')?.value || state.selectedDepartment;
  populateHomeContributionDepartments(level, department);
  populateHomeContributionSemesters(level, '1');
  window.filterQuickSubjects();
};

window.openHomeContributionModal = function () {
  const modal = document.getElementById('home-contribution-modal');
  if (!modal) return;

  homeSelectedContribFile = null;

  const program = state.selectedProgramLevel || (state.browseCategory === 'pg' ? 'PG' : 'UG');
  const levelSelect = document.getElementById('home-contrib-level');
  if (levelSelect) levelSelect.value = program;
  populateHomeContributionDepartments(program, state.selectedDepartment);

  // Reset inputs
  const nameInput = document.getElementById('home-contrib-subject-name');
  if (nameInput) nameInput.value = '';
  const codeInput = document.getElementById('home-contrib-subject-code');
  if (codeInput) codeInput.value = '';
  const semSelect = document.getElementById('home-contrib-semester');
  populateHomeContributionSemesters(program, '1');
  if (semSelect) semSelect.value = '1';
  const trackSelect = document.getElementById('home-contrib-track');
  if (trackSelect) trackSelect.value = 'major';
  window.filterQuickSubjects();
  const titleInput = document.getElementById('home-contrib-title');
  if (titleInput) titleInput.value = '';
  const authorInput = document.getElementById('home-contrib-author');
  if (authorInput) authorInput.value = '';
  const rollInput = document.getElementById('home-contrib-roll');
  if (rollInput) rollInput.value = '';
  const errBox = document.getElementById('home-contrib-error');
  if (errBox) errBox.classList.add('hidden');
  const pillBox = document.getElementById('home-contrib-file-pill');
  if (pillBox) pillBox.classList.add('hidden');
  const fileInput = document.getElementById('home-contrib-file-input');
  if (fileInput) fileInput.value = '';

  const videoUrlInput = document.getElementById('home-contrib-video-url');
  if (videoUrlInput) videoUrlInput.value = '';
  const channelInput = document.getElementById('home-contrib-channel');
  if (channelInput) channelInput.value = '';
  const noteRadio = document.querySelector('input[name="home-contrib-type"][value="note"]');
  if (noteRadio) noteRadio.checked = true;
  window.toggleHomeContribFields('note');

  const dropzone = document.getElementById('home-contrib-dropzone');
  if (dropzone && !dropzone._dragInit) {
    dropzone._dragInit = true;
    ['dragenter', 'dragover'].forEach(n => {
      dropzone.addEventListener(n, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    ['dragleave', 'drop'].forEach(n => {
      dropzone.addEventListener(n, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt && dt.files && dt.files[0];
      if (file) window.handleHomeContribFileSelect({ target: { files: [file] } });
    });
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (window.lucide) lucide.createIcons();
};

window.closeHomeContributionModal = function () {
  const modal = document.getElementById('home-contribution-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

window.handleHomeContribDeptChange = function (deptId) {
  window.filterQuickSubjects();
};

window.handleQuickSubjectSelect = function (subjCode) {
  if (!subjCode) return;
  const subj = (state.subjects || []).find(s => (s.code || '').toUpperCase() === subjCode.toUpperCase());
  if (!subj) return;

  const nameInput = document.getElementById('home-contrib-subject-name');
  if (nameInput) nameInput.value = subj.name || '';
  const codeInput = document.getElementById('home-contrib-subject-code');
  if (codeInput) codeInput.value = subj.code || '';
  const semSelect = document.getElementById('home-contrib-semester');
  if (semSelect && subj.semester) {
    const isPg = String(subj.programLevel || 'UG').toUpperCase() === 'PG';
    semSelect.value = isPg ? (Number(subj.semester) <= 2 ? '1' : '3') : String(subj.semester);
  }
  const trackSelect = document.getElementById('home-contrib-track');
  if (trackSelect && subj.track) trackSelect.value = subj.track.toLowerCase();
};

window.filterQuickSubjects = function () {
  const deptSelect = document.getElementById('home-contrib-dept');
  const quickSelect = document.getElementById('home-contrib-subject-quick');
  const semSelect = document.getElementById('home-contrib-semester');
  const trackSelect = document.getElementById('home-contrib-track');
  if (!quickSelect) return;

  const deptId = deptSelect ? deptSelect.value : '';
  const semester = semSelect ? semSelect.value : '';
  const track = trackSelect ? trackSelect.value : '';
  const program = (document.getElementById('home-contrib-level')?.value || 'UG').toUpperCase();

  if (!deptId) {
    quickSelect.innerHTML = '<option value="">Select Department first to see subjects...</option>';
    return;
  }

  const deptObj = (state.departments || []).find(d => d.id === deptId || (d.code && d.code.toLowerCase() === deptId.toLowerCase()));
  const deptCode = deptObj ? deptObj.code.toLowerCase() : deptId.toLowerCase();

  const matching = (state.subjects || []).filter(s => {
    if (program === 'PG' ? s.programLevel !== 'PG' : s.programLevel === 'PG') return false;
    const sDept = (s.departmentId || s.department || '').toLowerCase();
    const sCode = (s.code || '').toLowerCase();
    const deptMatch = sDept === deptId.toLowerCase() || sDept === deptCode || sCode.startsWith(deptCode);
    if (!deptMatch) return false;
    if (program === 'PG') {
      const isYearOne = String(semester) === '1';
      const yearMatches = isYearOne
        ? (s.year === '1st Year' || Number(s.semester) <= 2)
        : (s.year === '2nd Year' || Number(s.semester) >= 3);
      if (!yearMatches) return false;
    } else if (semester && s.semester && String(s.semester) !== String(semester)) return false;
    if (track && s.track && s.track.toLowerCase() !== track.toLowerCase()) return false;
    return true;
  });

  const list = matching.length > 0 ? matching : (state.subjects || []).filter(s => {
    if (program === 'PG' ? s.programLevel !== 'PG' : s.programLevel === 'PG') return false;
    const sDept = (s.departmentId || s.department || '').toLowerCase();
    const sCode = (s.code || '').toLowerCase();
    const deptMatches = sDept === deptId.toLowerCase() || sDept === deptCode || sCode.startsWith(deptCode);
    if (program !== 'PG') {
      const semesterMatches = !semester || !s.semester || String(s.semester) === String(semester);
      return deptMatches && semesterMatches;
    }
    const yearMatches = String(semester) === '1'
      ? (s.year === '1st Year' || Number(s.semester) <= 2)
      : (s.year === '2nd Year' || Number(s.semester) >= 3);
    return deptMatches && yearMatches;
  });

  quickSelect.innerHTML = '<option value="">-- Choose an existing subject to autofill or type below --</option>' +
    (list.length
      ? list.map(s => `<option value="${s.code}">${s.code} - ${s.name} (${program === 'PG' ? (s.year || (Number(s.semester) <= 2 ? 'Year 1' : 'Year 2')) : `Sem ${s.semester || '?'}`}, ${(s.track || 'major').toUpperCase()})</option>`).join('')
      : '<option value="" disabled>No listed subjects match these choices. Enter the subject below.</option>');
};

window.toggleHomeContribFields = function (type) {
  const pyqFields = document.getElementById('home-contrib-pyq-fields');
  const videoFields = document.getElementById('home-contrib-video-fields');
  const pdfWrapper = document.getElementById('home-contrib-pdf-wrapper');
  const titleInput = document.getElementById('home-contrib-title');
  const titleLabel = document.getElementById('home-contrib-title-label');

  if (type === 'pyq') {
    if (pyqFields) { pyqFields.classList.remove('hidden'); pyqFields.classList.add('grid'); }
    if (videoFields) { videoFields.classList.add('hidden'); videoFields.classList.remove('grid'); }
    if (pdfWrapper) pdfWrapper.classList.remove('hidden');
    if (titleLabel) titleLabel.textContent = 'Question Paper Title / Exam';
    if (titleInput && (!titleInput.value || titleInput.value.includes('Notes') || titleInput.value.includes('Video') || titleInput.value.includes('Lecture'))) {
      titleInput.placeholder = 'e.g. 2024 End-Semester Regular Exam Paper';
    }
  } else if (type === 'video') {
    if (pyqFields) { pyqFields.classList.add('hidden'); pyqFields.classList.remove('grid'); }
    if (videoFields) { videoFields.classList.remove('hidden'); videoFields.classList.add('grid'); }
    if (pdfWrapper) pdfWrapper.classList.add('hidden');
    if (titleLabel) titleLabel.textContent = 'Video Title / Topic';
    if (titleInput && (!titleInput.value || titleInput.value.includes('Notes') || titleInput.value.includes('Exam Paper'))) {
      titleInput.placeholder = 'e.g. Complete Unit 1-4 Video Lecture Playlist';
    }
  } else {
    // note
    if (pyqFields) { pyqFields.classList.add('hidden'); pyqFields.classList.remove('grid'); }
    if (videoFields) { videoFields.classList.add('hidden'); videoFields.classList.remove('grid'); }
    if (pdfWrapper) pdfWrapper.classList.remove('hidden');
    if (titleLabel) titleLabel.textContent = 'Document Title / Topic';
    if (titleInput && (!titleInput.value || titleInput.value.includes('Exam Paper') || titleInput.value.includes('Video') || titleInput.value.includes('Lecture'))) {
      titleInput.placeholder = 'e.g. Unit 3 Trees & Graphs Detailed Notes';
    }
  }
  if (window.lucide) lucide.createIcons();
};

window.handleHomeContribFileSelect = function (event) {
  const file = event.target.files && event.target.files[0];
  const errBox = document.getElementById('home-contrib-error');
  const errMsg = document.getElementById('home-contrib-error-msg');
  const pillBox = document.getElementById('home-contrib-file-pill');
  const nameEl = document.getElementById('home-contrib-file-name');
  const sizeEl = document.getElementById('home-contrib-file-size');

  if (!file) return;

  if (errBox) errBox.classList.add('hidden');

  // Accept the document types used for student contributions.
  const fileName = (file.name || '').toLowerCase();
  const allowedExtensions = ['.pdf', '.docx', '.ppt', '.pptx'];
  const hasAllowedExtension = allowedExtensions.some(extension => fileName.endsWith(extension));
  if (!hasAllowedExtension) {
    if (errBox && errMsg) {
      errMsg.textContent = 'Choose a PDF, DOCX, PPT, or PPTX file.';
      errBox.classList.remove('hidden');
    }
    if (event.target) event.target.value = '';
    homeSelectedContribFile = null;
    if (pillBox) pillBox.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Keep each contribution document within the 20 MB limit.
  const maxBytes = 20 * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    if (errBox && errMsg) {
      errMsg.textContent = `File size exceeds the 20 MB limit! (Selected: ${sizeMB} MB). Please choose a file up to 20 MB.`;
      errBox.classList.remove('hidden');
    }
    event.target.value = '';
    homeSelectedContribFile = null;
    if (pillBox) pillBox.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
    return;
  }

  homeSelectedContribFile = file;
  if (pillBox && nameEl && sizeEl) {
    nameEl.textContent = file.name;
    sizeEl.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB · ${file.name.split('.').pop().toUpperCase()} Document`;
    pillBox.classList.remove('hidden');
  }

  const titleInput = document.getElementById('home-contrib-title');
  if (titleInput && !titleInput.value.trim()) {
    titleInput.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  if (window.lucide) lucide.createIcons();
};

window.clearHomeContribFile = function () {
  homeSelectedContribFile = null;
  const fileInput = document.getElementById('home-contrib-file-input');
  if (fileInput) fileInput.value = '';
  const pillBox = document.getElementById('home-contrib-file-pill');
  if (pillBox) pillBox.classList.add('hidden');
};

window.submitHomeContribution = async function () {
  const deptSelect = document.getElementById('home-contrib-dept');
  const levelSelect = document.getElementById('home-contrib-level');
  const semSelect = document.getElementById('home-contrib-semester');
  const trackSelect = document.getElementById('home-contrib-track');
  const nameInput = document.getElementById('home-contrib-subject-name');
  const codeInput = document.getElementById('home-contrib-subject-code');
  const titleInput = document.getElementById('home-contrib-title');
  const authorInput = document.getElementById('home-contrib-author');
  const rollInput = document.getElementById('home-contrib-roll');
  const yearInput = document.getElementById('home-contrib-year');
  const sessionInput = document.getElementById('home-contrib-session');
  const errBox = document.getElementById('home-contrib-error');
  const errMsg = document.getElementById('home-contrib-error-msg');
  const submitBtn = document.getElementById('home-contrib-submit-btn');

  const deptId = deptSelect ? deptSelect.value.trim() : '';
  const deptName = (deptSelect && deptSelect.selectedIndex >= 0) ? deptSelect.options[deptSelect.selectedIndex].text : '';
  const programLevel = levelSelect ? levelSelect.value : 'UG';
  const semester = semSelect ? semSelect.value : '1';
  const paperType = trackSelect ? trackSelect.value : 'major';
  const subjectName = nameInput ? nameInput.value.trim() : '';
  const subjectCode = codeInput ? codeInput.value.trim().toUpperCase() : '';
  const author = authorInput ? authorInput.value.trim() : '';
  const roll = rollInput ? rollInput.value.trim() : '';
  const title = titleInput ? titleInput.value.trim() : '';
  const typeRadio = document.querySelector('input[name="home-contrib-type"]:checked');
  const category = typeRadio ? typeRadio.value : 'note';

  if (!deptId) {
    if (errBox && errMsg) {
      errMsg.textContent = 'Please select a Department.';
      errBox.classList.remove('hidden');
    }
    if (deptSelect) deptSelect.focus();
    return;
  }

  if (!subjectName) {
    if (errBox && errMsg) {
      errMsg.textContent = 'Please enter the Subject Name.';
      errBox.classList.remove('hidden');
    }
    if (nameInput) nameInput.focus();
    return;
  }

  if (!subjectCode) {
    if (errBox && errMsg) {
      errMsg.textContent = 'Please enter the Subject Code (e.g. BCA301 or BCOM101).';
      errBox.classList.remove('hidden');
    }
    if (codeInput) codeInput.focus();
    return;
  }

  if (!author) {
    if (errBox && errMsg) {
      errMsg.textContent = 'Please enter your name.';
      errBox.classList.remove('hidden');
    }
    if (authorInput) authorInput.focus();
    return;
  }

  if (!roll) {
    if (errBox && errMsg) {
      errMsg.textContent = 'Please enter your Roll Number.';
      errBox.classList.remove('hidden');
    }
    if (rollInput) rollInput.focus();
    return;
  }

  if (!title) {
    if (errBox && errMsg) {
      errMsg.textContent = 'Please enter a document title or topic.';
      errBox.classList.remove('hidden');
    }
    if (titleInput) titleInput.focus();
    return;
  }

  const videoUrlInput = document.getElementById('home-contrib-video-url');
  const channelInput = document.getElementById('home-contrib-channel');
  const videoUrl = videoUrlInput ? videoUrlInput.value.trim() : '';
  const channelName = channelInput ? channelInput.value.trim() : '';

  if (category === 'video') {
    if (!videoUrl) {
      if (errBox && errMsg) {
        errMsg.textContent = 'Please enter the reference video URL (e.g. YouTube link).';
        errBox.classList.remove('hidden');
      }
      if (videoUrlInput) videoUrlInput.focus();
      return;
    }
  } else {
    if (!homeSelectedContribFile) {
      if (errBox && errMsg) {
        errMsg.textContent = 'Please choose a PDF, DOCX, PPT, or PPTX file up to 20 MB.';
        errBox.classList.remove('hidden');
      }
      return;
    }
  }

  if (errBox) errBox.classList.add('hidden');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>${category === 'video' ? 'Submitting Video Link...' : 'Uploading file (' + (homeSelectedContribFile ? (homeSelectedContribFile.size / (1024 * 1024)).toFixed(1) : '0') + ' MB)...'}</span>
    `;
  }

  try {
    let base64Data = null;
    let backendContributionAccepted = false;
    const contributionId = `contribution-${Date.now()}`;
    if (homeSelectedContribFile) {
      if (window.dbcmContributionFiles?.save) {
        await window.dbcmContributionFiles.save(contributionId, homeSelectedContribFile);
      } else {
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(homeSelectedContribFile);
        });
      }
    }

    const payload = {
      department: deptName,
      departmentId: deptId,
      programLevel: programLevel,
      semester: semester,
      paperType: paperType,
      subjectCode: subjectCode,
      subjectName: subjectName,
      category: category,
      title: title,
      contributorName: author,
      contributorRoll: roll,
      videoUrl: videoUrl,
      channelName: channelName,
      examYear: yearInput ? yearInput.value.trim() : '',
      session: sessionInput ? sessionInput.value.trim() : '',
      fileName: homeSelectedContribFile ? homeSelectedContribFile.name : `${subjectCode}_video_reference.url`,
      fileData: base64Data,
      fileStorageId: homeSelectedContribFile && window.dbcmContributionFiles?.save ? contributionId : '',
      fileSize: homeSelectedContribFile ? `${(homeSelectedContribFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Video URL'
    };

    const contributions = JSON.parse(localStorage.getItem('dbcm_contributions') || '[]');
    contributions.unshift({ ...payload, id: contributionId, status: 'pending', submittedAt: new Date().toISOString() });
    localStorage.setItem('dbcm_contributions', JSON.stringify(contributions));
    if (window.dbcmApi?.submitContribution) {
      try {
        await window.dbcmApi.submitContribution({
          departmentId: deptId, department: deptName, subjectCode, subjectName,
          category: category === 'video' ? 'videos' : category === 'pyq' ? 'pyqs' : 'notes',
          title, description: `${paperType || ''} ${semester || ''}`.trim(),
          submittedByName: author, submittedByEmail: '', externalUrl: videoUrl,
          file: homeSelectedContribFile
        });
        backendContributionAccepted = true;
      } catch (error) { console.warn('Contribution is saved locally because the backend is unavailable:', error); }
    }

    {
      const body = document.getElementById('home-contrib-body');
      if (body) {
        const itemDescription = category === 'video' 
          ? `Reference video link <span class="font-bold text-slate-900 font-mono">"${videoUrl}"</span>`
          : `file <span class="font-bold text-slate-900 font-mono">"${homeSelectedContribFile.name}"</span>`;

        body.innerHTML = `
          <div class="p-6 sm:p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fade-in shadow-xs">
            <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <i data-lucide="check-circle" class="w-7 h-7"></i>
            </div>
            <h4 class="text-base sm:text-lg font-bold text-slate-900">Thank You for Contributing!</h4>
            <p class="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Your ${itemDescription} for <span class="font-bold text-indigo-600">${subjectCode} - ${subjectName}</span> ${backendContributionAccepted ? 'has been sent for department review.' : 'is saved in this browser only because the server is unavailable.'}
            </p>
            <div class="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button onclick="openHomeContributionModal()" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs cursor-pointer shadow-md shadow-indigo-500/20">
                Contribute Another File
              </button>
              <button onclick="closeHomeContributionModal()" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors">
                Close
              </button>
            </div>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
      }
    }
  } catch (err) {
    console.error('Home submission error:', err);
    if (errBox && errMsg) {
      errMsg.textContent = err.message || 'Error occurred while submitting.';
      errBox.classList.remove('hidden');
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <i data-lucide="send" class="w-3.5 h-3.5"></i>
        <span>Submit Contribution</span>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }
};


