/**
 * Don Bosco College (Autonomous) Maram
 * Teacher Directory, Authentication & Upload Management Module
 * Supports 80-100 College Faculty Across 16 Academic Departments
 */

(function () {
  'use strict';

  // Master Roster of ~86 DBCM Faculty Members Across 16 Departments
  const DBCM_DEFAULT_TEACHERS = [
    // 1. Computer Science (BCA) - 6 Faculty Members
    {
      id: 'tch-bca-001',
      name: 'Mr. John Britto',
      departmentId: 'bca',
      departmentName: 'Computer Science (BCA)',
      designation: 'Associate Professor & IQAC Coordinator',
      email: 'john.britto@dbcmaram.ac.in',
      qualification: 'M.Sc., M.Phil (Computer Science)',
      specialization: 'Database Management Systems, Systems Analysis & Software Architecture',
      avatar: 'assets/images/sir-britto-iqac.png',
      role: 'HOD',
      phone: '+91 94360 22101'
    },
    {
      id: 'tch-bca-002',
      name: 'Dr. Athanasius Jojo',
      departmentId: 'bca',
      departmentName: 'Computer Science (BCA)',
      designation: 'Associate Professor',
      email: 'athanasius.jojo@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D. (Computer Science)',
      specialization: 'Data Structures, Operating Systems & Network Security',
      avatar: 'assets/images/athanasius-jojo.png',
      role: 'Faculty',
      phone: '+91 94360 22102'
    },
    {
      id: 'tch-bca-003',
      name: 'Mr. Manuel Bhelwa',
      departmentId: 'bca',
      departmentName: 'Computer Science (BCA)',
      designation: 'Assistant Professor & Tech Lead',
      email: 'manuel.bhelwa@dbcmaram.ac.in',
      qualification: 'MCA, M.Tech (CSE)',
      specialization: 'Web Technologies, Full Stack Engineering & Cloud Architecture',
      avatar: 'assets/images/manuel-bhelwa.png',
      role: 'Faculty',
      phone: '+91 94360 22103'
    },
    {
      id: 'tch-bca-004',
      name: 'Ms. Priya Sharma',
      departmentId: 'bca',
      departmentName: 'Computer Science (BCA)',
      designation: 'Assistant Professor',
      email: 'priya.sharma@dbcmaram.ac.in',
      qualification: 'M.Tech (CSE), UGC-NET',
      specialization: 'Object Oriented Programming with Java, Python & AI',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22104'
    },
    {
      id: 'tch-bca-005',
      name: 'Mr. Ronald Soren',
      departmentId: 'bca',
      departmentName: 'Computer Science (BCA)',
      designation: 'Assistant Professor',
      email: 'ronald.soren@dbcmaram.ac.in',
      qualification: 'MCA, UGC-NET',
      specialization: 'Computer Networks, Cyber Security & Mobile App Development',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22105'
    },
    {
      id: 'tch-bca-006',
      name: 'Ms. Catherine Mary',
      departmentId: 'bca',
      departmentName: 'Computer Science (BCA)',
      designation: 'Lecturer & Lab Instructor',
      email: 'catherine.mary@dbcmaram.ac.in',
      qualification: 'M.Sc. (Information Technology)',
      specialization: 'Digital Logic Design, Computer Fundamentals & Office Automation',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22106'
    },

    // 2. Commerce (B.Com) - 6 Faculty Members
    {
      id: 'tch-com-001',
      name: 'Dr. K.V. Thomas',
      departmentId: 'commerce',
      departmentName: 'Commerce (B.Com)',
      designation: 'Professor & Head of Department',
      email: 'kv.thomas@dbcmaram.ac.in',
      qualification: 'M.Com, M.Phil, Ph.D.',
      specialization: 'Financial Accounting, Auditing & Corporate Governance',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 22201'
    },
    {
      id: 'tch-com-002',
      name: 'Dr. George Mathew',
      departmentId: 'commerce',
      departmentName: 'Commerce (B.Com)',
      designation: 'Associate Professor',
      email: 'george.mathew@dbcmaram.ac.in',
      qualification: 'M.Com, Ph.D.',
      specialization: 'Financial Management, Banking & Investment Analysis',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22202'
    },
    {
      id: 'tch-com-003',
      name: 'Mr. Alex Varghese',
      departmentId: 'commerce',
      departmentName: 'Commerce (B.Com)',
      designation: 'Assistant Professor',
      email: 'alex.varghese@dbcmaram.ac.in',
      qualification: 'M.Com, UGC-NET',
      specialization: 'Income Tax Law, GST & Indirect Taxation Systems',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22203'
    },
    {
      id: 'tch-com-004',
      name: 'Ms. Regina Paul',
      departmentId: 'commerce',
      departmentName: 'Commerce (B.Com)',
      designation: 'Assistant Professor',
      email: 'regina.paul@dbcmaram.ac.in',
      qualification: 'M.Com, MBA',
      specialization: 'Cost Accounting, Management Accounting & E-Commerce',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22204'
    },
    {
      id: 'tch-com-005',
      name: 'Mr. David Anthony',
      departmentId: 'commerce',
      departmentName: 'Commerce (B.Com)',
      designation: 'Assistant Professor',
      email: 'david.anthony@dbcmaram.ac.in',
      qualification: 'M.Com, UGC-NET',
      specialization: 'Company Law, Principles of Marketing & Entrepreneurship',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22205'
    },
    {
      id: 'tch-com-006',
      name: 'Ms. Sunita Toppo',
      departmentId: 'commerce',
      departmentName: 'Commerce (B.Com)',
      designation: 'Lecturer',
      email: 'sunita.toppo@dbcmaram.ac.in',
      qualification: 'M.Com',
      specialization: 'Business Mathematics, Statistics & Business Communication',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22206'
    },

    // 3. Biotechnology (BBT) - 5 Faculty Members
    {
      id: 'tch-bio-001',
      name: 'Dr. Rosemary Soreng',
      departmentId: 'biotech',
      departmentName: 'Biotechnology (BBT)',
      designation: 'Associate Professor & HOD',
      email: 'rosemary.soreng@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D. in Biotechnology',
      specialization: 'Molecular Biology, Genetic Engineering & Applied Genomics',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 22301'
    },
    {
      id: 'tch-bio-002',
      name: 'Dr. Joseph K.',
      departmentId: 'biotech',
      departmentName: 'Biotechnology (BBT)',
      designation: 'Associate Professor',
      email: 'joseph.k@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D.',
      specialization: 'Microbiology, Immunology & Fermentation Technology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22302'
    },
    {
      id: 'tch-bio-003',
      name: 'Ms. Ananya Das',
      departmentId: 'biotech',
      departmentName: 'Biotechnology (BBT)',
      designation: 'Assistant Professor',
      email: 'ananya.das@dbcmaram.ac.in',
      qualification: 'M.Sc. Biotech, CSIR-NET',
      specialization: 'Cell Biology, Enzymology & Clinical Biochemistry',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22303'
    },
    {
      id: 'tch-bio-004',
      name: 'Mr. Linus Ekka',
      departmentId: 'biotech',
      departmentName: 'Biotechnology (BBT)',
      designation: 'Assistant Professor',
      email: 'linus.ekka@dbcmaram.ac.in',
      qualification: 'M.Sc. Biotech, GATE',
      specialization: 'Bioinformatics, Recombinant DNA & Computational Biology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22304'
    },
    {
      id: 'tch-bio-005',
      name: 'Ms. Teresa Minz',
      departmentId: 'biotech',
      departmentName: 'Biotechnology (BBT)',
      designation: 'Lecturer & Bio-Lab Incharge',
      email: 'teresa.minz@dbcmaram.ac.in',
      qualification: 'M.Sc. Biotechnology',
      specialization: 'Plant Tissue Culture, Bioethics & Environmental Biotechnology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22305'
    },

    // 4. Botany - 5 Faculty Members
    {
      id: 'tch-bot-001',
      name: 'Dr. S.K. Sharma',
      departmentId: 'botany',
      departmentName: 'Botany',
      designation: 'Professor & Head of Department',
      email: 'sk.sharma@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D. in Botany',
      specialization: 'Plant Taxonomy, Angiosperm Systematics & Biodiversity Ecology',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 22401'
    },
    {
      id: 'tch-bot-002',
      name: 'Dr. Mary Goretti',
      departmentId: 'botany',
      departmentName: 'Botany',
      designation: 'Associate Professor',
      email: 'mary.goretti@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D.',
      specialization: 'Plant Physiology, Biochemistry & Photosynthetic Metabolism',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22402'
    },
    {
      id: 'tch-bot-003',
      name: 'Mr. Albert Tirkey',
      departmentId: 'botany',
      departmentName: 'Botany',
      designation: 'Assistant Professor',
      email: 'albert.tirkey@dbcmaram.ac.in',
      qualification: 'M.Sc. Botany, CSIR-NET',
      specialization: 'Algology, Mycology & Plant Pathology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22403'
    },
    {
      id: 'tch-bot-004',
      name: 'Ms. Philomena Kerketta',
      departmentId: 'botany',
      departmentName: 'Botany',
      designation: 'Assistant Professor',
      email: 'philomena.kerketta@dbcmaram.ac.in',
      qualification: 'M.Sc., B.Ed.',
      specialization: 'Bryophytes, Pteridophytes & Gymnosperm Anatomy',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22404'
    },
    {
      id: 'tch-bot-005',
      name: 'Mr. Dominic Savio',
      departmentId: 'botany',
      departmentName: 'Botany',
      designation: 'Lecturer & Herbarium Incharge',
      email: 'dominic.savio@dbcmaram.ac.in',
      qualification: 'M.Sc. Botany',
      specialization: 'Plant Anatomy, Embryology & Economic Botany',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22405'
    },

    // 5. Social Work (BSW) - 6 Faculty Members
    {
      id: 'tch-bsw-001',
      name: 'Fr. Dr. Jose Thomas SDB',
      departmentId: 'bsw',
      departmentName: 'Social Work (BSW)',
      designation: 'Vice Principal & Professor of Social Work',
      email: 'jose.thomas@dbcmaram.ac.in',
      qualification: 'MSW, Ph.D. in Social Work',
      specialization: 'Social Research Methodology, Community Action & Youth Leadership',
      avatar: 'assets/images/rev-fr-josekutty-thomas.png',
      role: 'HOD',
      phone: '+91 94360 22501'
    },
    {
      id: 'tch-bsw-002',
      name: 'Dr. Agnes Dungdung',
      departmentId: 'bsw',
      departmentName: 'Social Work (BSW)',
      designation: 'Associate Professor & Field Work Director',
      email: 'agnes.dungdung@dbcmaram.ac.in',
      qualification: 'MSW, Ph.D.',
      specialization: 'Community Organization, Social Action & Rural Development',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22502'
    },
    {
      id: 'tch-bsw-003',
      name: 'Mr. Paul Barla',
      departmentId: 'bsw',
      departmentName: 'Social Work (BSW)',
      designation: 'Assistant Professor',
      email: 'paul.barla@dbcmaram.ac.in',
      qualification: 'MSW, UGC-NET',
      specialization: 'Medical & Psychiatric Social Work, Mental Health Counseling',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22503'
    },
    {
      id: 'tch-bsw-004',
      name: 'Ms. Elizabeth Toppo',
      departmentId: 'bsw',
      departmentName: 'Social Work (BSW)',
      designation: 'Assistant Professor',
      email: 'elizabeth.toppo@dbcmaram.ac.in',
      qualification: 'MSW, UGC-NET',
      specialization: 'Social Casework, Child Welfare & Family Dynamics',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22504'
    },
    {
      id: 'tch-bsw-005',
      name: 'Mr. Francis Xaxa',
      departmentId: 'bsw',
      departmentName: 'Social Work (BSW)',
      designation: 'Assistant Professor',
      email: 'francis.xaxa@dbcmaram.ac.in',
      qualification: 'MSW, M.Phil',
      specialization: 'Social Group Work, Tribal Rights & Human Rights Advocacy',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22505'
    },
    {
      id: 'tch-bsw-006',
      name: 'Ms. Clara Beck',
      departmentId: 'bsw',
      departmentName: 'Social Work (BSW)',
      designation: 'Lecturer & Field Practicum Coordinator',
      email: 'clara.beck@dbcmaram.ac.in',
      qualification: 'MSW',
      specialization: 'Social Policy, Legislation & NGO Management',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22506'
    },

    // 6. Chemistry - 5 Faculty Members
    {
      id: 'tch-chm-001',
      name: 'Dr. Michael Kujur',
      departmentId: 'chemistry',
      departmentName: 'Chemistry',
      designation: 'Associate Professor & HOD',
      email: 'michael.kujur@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D. in Organic Chemistry',
      specialization: 'Reaction Mechanisms, Stereochemistry & Organic Spectroscopy',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 22601'
    },
    {
      id: 'tch-chm-002',
      name: 'Dr. Bernadette Tirkey',
      departmentId: 'chemistry',
      departmentName: 'Chemistry',
      designation: 'Associate Professor',
      email: 'bernadette.tirkey@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D.',
      specialization: 'Physical Chemistry, Thermodynamics & Chemical Kinetics',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22602'
    },
    {
      id: 'tch-chm-003',
      name: 'Mr. Robert Lakra',
      departmentId: 'chemistry',
      departmentName: 'Chemistry',
      designation: 'Assistant Professor',
      email: 'robert.lakra@dbcmaram.ac.in',
      qualification: 'M.Sc. Chemistry, UGC-NET',
      specialization: 'Inorganic Chemistry, Coordination Complexes & Organometallics',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22603'
    },
    {
      id: 'tch-chm-004',
      name: 'Ms. Sneha Kullu',
      departmentId: 'chemistry',
      departmentName: 'Chemistry',
      designation: 'Assistant Professor',
      email: 'sneha.kullu@dbcmaram.ac.in',
      qualification: 'M.Sc., GATE',
      specialization: 'Analytical Chemistry, Electrochemistry & Polymer Science',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22604'
    },
    {
      id: 'tch-chm-005',
      name: 'Mr. Peter Minz',
      departmentId: 'chemistry',
      departmentName: 'Chemistry',
      designation: 'Lecturer & Laboratory Instructor',
      email: 'peter.minz@dbcmaram.ac.in',
      qualification: 'M.Sc. Chemistry',
      specialization: 'Quantum Chemistry, Green Chemical Synthesis & Lab Safety',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22605'
    },

    // 7. Economics - 5 Faculty Members
    {
      id: 'tch-eco-001',
      name: 'Dr. Antony Raj',
      departmentId: 'economics',
      departmentName: 'Economics',
      designation: 'Professor & Head of Department',
      email: 'antony.raj@dbcmaram.ac.in',
      qualification: 'M.A., Ph.D. in Economics',
      specialization: 'Macroeconomic Analysis, Public Finance & Fiscal Economics',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 22701'
    },
    {
      id: 'tch-eco-002',
      name: 'Ms. Veronica Kispotta',
      departmentId: 'economics',
      departmentName: 'Economics',
      designation: 'Associate Professor',
      email: 'veronica.kispotta@dbcmaram.ac.in',
      qualification: 'M.A., M.Phil (Economics)',
      specialization: 'Microeconomic Theory, Welfare Economics & Consumer Behavior',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22702'
    },
    {
      id: 'tch-eco-003',
      name: 'Mr. James Toppo',
      departmentId: 'economics',
      departmentName: 'Economics',
      designation: 'Assistant Professor',
      email: 'james.toppo@dbcmaram.ac.in',
      qualification: 'M.A. Economics, UGC-NET',
      specialization: 'Indian Economy, Development Economics & Agrarian Studies',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22703'
    },
    {
      id: 'tch-eco-004',
      name: 'Ms. Jacinta Tigga',
      departmentId: 'economics',
      departmentName: 'Economics',
      designation: 'Assistant Professor',
      email: 'jacinta.tigga@dbcmaram.ac.in',
      qualification: 'M.A., UGC-NET',
      specialization: 'Econometrics, Mathematical Economics & Quantitative Methods',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22704'
    },
    {
      id: 'tch-eco-005',
      name: 'Mr. Stephen Soreng',
      departmentId: 'economics',
      departmentName: 'Economics',
      designation: 'Lecturer',
      email: 'stephen.soreng@dbcmaram.ac.in',
      qualification: 'M.A. Economics',
      specialization: 'International Trade, Banking Institutions & Financial Markets',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22705'
    },

    // 8. Education - 5 Faculty Members
    {
      id: 'tch-edu-001',
      name: 'Dr. Sr. Margaret Mary',
      departmentId: 'education',
      departmentName: 'Education',
      designation: 'Associate Professor & HOD',
      email: 'margaret.mary@dbcmaram.ac.in',
      qualification: 'M.A. Edu, M.Ed., Ph.D.',
      specialization: 'Philosophical & Sociological Foundations of Modern Education',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 22801'
    },
    {
      id: 'tch-edu-002',
      name: 'Mr. Patrick Bilung',
      departmentId: 'education',
      departmentName: 'Education',
      designation: 'Assistant Professor',
      email: 'patrick.bilung@dbcmaram.ac.in',
      qualification: 'M.Ed., UGC-NET',
      specialization: 'Educational Psychology, Learning Theories & Student Guidance',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22802'
    },
    {
      id: 'tch-edu-003',
      name: 'Ms. Monica Kindo',
      departmentId: 'education',
      departmentName: 'Education',
      designation: 'Assistant Professor',
      email: 'monica.kindo@dbcmaram.ac.in',
      qualification: 'M.A. Education, UGC-NET',
      specialization: 'Curriculum Design, Pedagogical Evaluation & Assessment',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22803'
    },
    {
      id: 'tch-edu-004',
      name: 'Mr. Charles Bage',
      departmentId: 'education',
      departmentName: 'Education',
      designation: 'Assistant Professor',
      email: 'charles.bage@dbcmaram.ac.in',
      qualification: 'M.Ed., M.Phil',
      specialization: 'Educational Administration, Planning & School Supervision',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22804'
    },
    {
      id: 'tch-edu-005',
      name: 'Ms. Philomina Toppo',
      departmentId: 'education',
      departmentName: 'Education',
      designation: 'Lecturer',
      email: 'philomina.toppo@dbcmaram.ac.in',
      qualification: 'M.Ed.',
      specialization: 'Educational Technology, Inclusive Education & Values Teaching',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22805'
    },

    // 9. English - 7 Faculty Members
    {
      id: 'tch-eng-001',
      name: 'Fr. Dr. K.O. Sebastian SDB',
      departmentId: 'english',
      departmentName: 'English',
      designation: 'Principal & Professor of English Literature',
      email: 'principal@dbcmaram.ac.in',
      qualification: 'M.A., Ph.D. in English Literature',
      specialization: 'Shakespearean Studies, Classical Drama & Educational Governance',
      avatar: 'assets/images/rev-fr-dr-ko-sebastian.png',
      role: 'Principal',
      phone: '+91 94360 22901'
    },
    {
      id: 'tch-eng-002',
      name: 'Dr. Grace Baxla',
      departmentId: 'english',
      departmentName: 'English',
      designation: 'Associate Professor & Head of Department',
      email: 'grace.baxla@dbcmaram.ac.in',
      qualification: 'M.A., M.Phil, Ph.D.',
      specialization: 'British Romanticism, Victorian Poetry & Literary Criticism',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 22902'
    },
    {
      id: 'tch-eng-003',
      name: 'Mr. Xavier Tirkey',
      departmentId: 'english',
      departmentName: 'English',
      designation: 'Assistant Professor',
      email: 'xavier.tirkey@dbcmaram.ac.in',
      qualification: 'M.A. English, UGC-NET',
      specialization: 'Postcolonial Literature, Subaltern Voices & Cultural Studies',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22903'
    },
    {
      id: 'tch-eng-004',
      name: 'Ms. Anita Topno',
      departmentId: 'english',
      departmentName: 'English',
      designation: 'Assistant Professor',
      email: 'anita.topno@dbcmaram.ac.in',
      qualification: 'M.A. English, UGC-NET',
      specialization: 'Linguistics, English Phonetics, ELT & Modern Grammar',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22904'
    },
    {
      id: 'tch-eng-005',
      name: 'Mr. Clement Kujur',
      departmentId: 'english',
      departmentName: 'English',
      designation: 'Assistant Professor',
      email: 'clement.kujur@dbcmaram.ac.in',
      qualification: 'M.A. English, M.Phil',
      specialization: 'American Literature, Modernist Fiction & 20th Century Drama',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22905'
    },
    {
      id: 'tch-eng-006',
      name: 'Ms. Beatrice Ekka',
      departmentId: 'english',
      departmentName: 'English',
      designation: 'Assistant Professor',
      email: 'beatrice.ekka@dbcmaram.ac.in',
      qualification: 'M.A. English, UGC-NET',
      specialization: 'Indian Writing in English, Diaspora Narratives & Women Writers',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22906'
    },
    {
      id: 'tch-eng-007',
      name: 'Mr. Justin Lakra',
      departmentId: 'english',
      departmentName: 'English',
      designation: 'Lecturer',
      email: 'justin.lakra@dbcmaram.ac.in',
      qualification: 'M.A. English',
      specialization: 'Communicative English, Academic Writing & Workplace Skills',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 22907'
    },

    // 10. History - 5 Faculty Members
    {
      id: 'tch-his-001',
      name: 'Dr. Vincent Minz',
      departmentId: 'history',
      departmentName: 'History',
      designation: 'Professor & Head of Department',
      email: 'vincent.minz@dbcmaram.ac.in',
      qualification: 'M.A., Ph.D. in History',
      specialization: 'Ancient Indian Civilizations, Epigraphy & Vedic Polity',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 23001'
    },
    {
      id: 'tch-his-002',
      name: 'Mr. Raymond Kindo',
      departmentId: 'history',
      departmentName: 'History',
      designation: 'Associate Professor',
      email: 'raymond.kindo@dbcmaram.ac.in',
      qualification: 'M.A., M.Phil',
      specialization: 'Medieval India, Delhi Sultanate, Mughal Administration & Art',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23002'
    },
    {
      id: 'tch-his-003',
      name: 'Ms. Martha Tirkey',
      departmentId: 'history',
      departmentName: 'History',
      designation: 'Assistant Professor',
      email: 'martha.tirkey@dbcmaram.ac.in',
      qualification: 'M.A. History, UGC-NET',
      specialization: 'Modern Indian History, Colonial Economy & Freedom Movement',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23003'
    },
    {
      id: 'tch-his-004',
      name: 'Mr. Nicholas Kerketta',
      departmentId: 'history',
      departmentName: 'History',
      designation: 'Assistant Professor',
      email: 'nicholas.kerketta@dbcmaram.ac.in',
      qualification: 'M.A. History, UGC-NET',
      specialization: 'World Civilizations, European Renaissance & World Wars Era',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23004'
    },
    {
      id: 'tch-his-005',
      name: 'Ms. Scholastica Toppo',
      departmentId: 'history',
      departmentName: 'History',
      designation: 'Lecturer',
      email: 'scholastica.toppo@dbcmaram.ac.in',
      qualification: 'M.A. History',
      specialization: 'Historiography, Historical Methodology & Regional Tribal History',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23005'
    },

    // 11. Physics - 5 Faculty Members
    {
      id: 'tch-phy-001',
      name: 'Dr. Thomas Beck',
      departmentId: 'physics',
      departmentName: 'Physics',
      designation: 'Associate Professor & HOD',
      email: 'thomas.beck@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D. in Physics',
      specialization: 'Solid State Physics, Condensed Matter & Crystallography',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 23101'
    },
    {
      id: 'tch-phy-002',
      name: 'Dr. Gabriel Kujur',
      departmentId: 'physics',
      departmentName: 'Physics',
      designation: 'Associate Professor',
      email: 'gabriel.kujur@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D.',
      specialization: 'Optics, Laser Physics, Quantum Mechanics & Spectroscopy',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23102'
    },
    {
      id: 'tch-phy-003',
      name: 'Mr. Emmanuel Tirkey',
      departmentId: 'physics',
      departmentName: 'Physics',
      designation: 'Assistant Professor',
      email: 'emmanuel.tirkey@dbcmaram.ac.in',
      qualification: 'M.Sc. Physics, CSIR-NET',
      specialization: 'Classical Mechanics, Electrodynamics & Special Relativity',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23103'
    },
    {
      id: 'tch-phy-004',
      name: 'Ms. Stella Minz',
      departmentId: 'physics',
      departmentName: 'Physics',
      designation: 'Assistant Professor',
      email: 'stella.minz@dbcmaram.ac.in',
      qualification: 'M.Sc. Physics, GATE',
      specialization: 'Analog & Digital Electronics, Microprocessor Interfacing',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23104'
    },
    {
      id: 'tch-phy-005',
      name: 'Mr. Philip Xalxo',
      departmentId: 'physics',
      departmentName: 'Physics',
      designation: 'Lecturer & Physics Lab Head',
      email: 'philip.xalxo@dbcmaram.ac.in',
      qualification: 'M.Sc. Physics',
      specialization: 'Thermodynamics, Statistical Physics & Nuclear Radiation',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23105'
    },

    // 12. Political Science - 6 Faculty Members
    {
      id: 'tch-pol-001',
      name: 'Dr. Lawrence Lakra',
      departmentId: 'polsci',
      departmentName: 'Political Science',
      designation: 'Professor & Head of Department',
      email: 'lawrence.lakra@dbcmaram.ac.in',
      qualification: 'M.A., Ph.D. in Political Science',
      specialization: 'Political Philosophy, Western Thinkers & Modern Ideologies',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 23201'
    },
    {
      id: 'tch-pol-002',
      name: 'Ms. Dorothy Kindo',
      departmentId: 'polsci',
      departmentName: 'Political Science',
      designation: 'Associate Professor',
      email: 'dorothy.kindo@dbcmaram.ac.in',
      qualification: 'M.A., M.Phil',
      specialization: 'Indian Constitutional Framework, Federalism & Judiciary',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23202'
    },
    {
      id: 'tch-pol-003',
      name: 'Mr. Bernard Topno',
      departmentId: 'polsci',
      departmentName: 'Political Science',
      designation: 'Assistant Professor',
      email: 'bernard.topno@dbcmaram.ac.in',
      qualification: 'M.A. Pol Sci, UGC-NET',
      specialization: 'International Relations, Strategic Geopolitics & Foreign Policy',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23203'
    },
    {
      id: 'tch-pol-004',
      name: 'Ms. Irene Bilung',
      departmentId: 'polsci',
      departmentName: 'Political Science',
      designation: 'Assistant Professor',
      email: 'irene.bilung@dbcmaram.ac.in',
      qualification: 'M.A. Pol Sci, UGC-NET',
      specialization: 'Public Administration, Bureaucratic Reforms & Policy Making',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23204'
    },
    {
      id: 'tch-pol-005',
      name: 'Mr. Andrew Soreng',
      departmentId: 'polsci',
      departmentName: 'Political Science',
      designation: 'Assistant Professor',
      email: 'andrew.soreng@dbcmaram.ac.in',
      qualification: 'M.A. Pol Sci',
      specialization: 'Comparative Political Systems, Political Sociology & Parties',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23205'
    },
    {
      id: 'tch-pol-006',
      name: 'Ms. Cecilia Barla',
      departmentId: 'polsci',
      departmentName: 'Political Science',
      designation: 'Lecturer',
      email: 'cecilia.barla@dbcmaram.ac.in',
      qualification: 'M.A. Political Science',
      specialization: 'Human Rights Jurisprudence, United Nations & Global Treaties',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23206'
    },

    // 13. Sociology - 5 Faculty Members
    {
      id: 'tch-soc-001',
      name: 'Dr. Benedict Minz',
      departmentId: 'sociology',
      departmentName: 'Sociology',
      designation: 'Associate Professor & HOD',
      email: 'benedict.minz@dbcmaram.ac.in',
      qualification: 'M.A., Ph.D. in Sociology',
      specialization: 'Classical Sociological Thinkers, Social Theory & Stratification',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 23301'
    },
    {
      id: 'tch-soc-002',
      name: 'Ms. Angela Kujur',
      departmentId: 'sociology',
      departmentName: 'Sociology',
      designation: 'Associate Professor',
      email: 'angela.kujur@dbcmaram.ac.in',
      qualification: 'M.A., M.Phil',
      specialization: 'Sociology of Indian Society, Caste, Kinship & Marriage Systems',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23302'
    },
    {
      id: 'tch-soc-003',
      name: 'Mr. Lucas Beck',
      departmentId: 'sociology',
      departmentName: 'Sociology',
      designation: 'Assistant Professor',
      email: 'lucas.beck@dbcmaram.ac.in',
      qualification: 'M.A. Sociology, UGC-NET',
      specialization: 'Rural & Urban Sociology, Agrarian Dynamics & Migration',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23303'
    },
    {
      id: 'tch-soc-004',
      name: 'Ms. Pauline Tirkey',
      departmentId: 'sociology',
      departmentName: 'Sociology',
      designation: 'Assistant Professor',
      email: 'pauline.tirkey@dbcmaram.ac.in',
      qualification: 'M.A. Sociology, UGC-NET',
      specialization: 'Social Research Methodology, Gender Studies & Social Change',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23304'
    },
    {
      id: 'tch-soc-005',
      name: 'Mr. Richard Ekka',
      departmentId: 'sociology',
      departmentName: 'Sociology',
      designation: 'Lecturer',
      email: 'richard.ekka@dbcmaram.ac.in',
      qualification: 'M.A. Sociology',
      specialization: 'Tribal Sociology, Social Movements & Population Studies',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23305'
    },

    // 14. Zoology - 5 Faculty Members
    {
      id: 'tch-zoo-001',
      name: 'Dr. Christopher Toppo',
      departmentId: 'zoology',
      departmentName: 'Zoology',
      designation: 'Professor & Head of Department',
      email: 'christopher.toppo@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D. in Zoology',
      specialization: 'Non-Chordate Phylogeny, Comparative Anatomy & Parasitology',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 23401'
    },
    {
      id: 'tch-zoo-002',
      name: 'Dr. Juliana Kispotta',
      departmentId: 'zoology',
      departmentName: 'Zoology',
      designation: 'Associate Professor',
      email: 'juliana.kispotta@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D.',
      specialization: 'Animal Physiology, Endocrinology & Neurobiology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23402'
    },
    {
      id: 'tch-zoo-003',
      name: 'Mr. Fabian Kerketta',
      departmentId: 'zoology',
      departmentName: 'Zoology',
      designation: 'Assistant Professor',
      email: 'fabian.kerketta@dbcmaram.ac.in',
      qualification: 'M.Sc. Zoology, CSIR-NET',
      specialization: 'Cell Biology, Genetics & Molecular Evolutionary Zoology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23403'
    },
    {
      id: 'tch-zoo-004',
      name: 'Ms. Maria Goretti',
      departmentId: 'zoology',
      departmentName: 'Zoology',
      designation: 'Assistant Professor',
      email: 'maria.goretti@dbcmaram.ac.in',
      qualification: 'M.Sc., M.Phil',
      specialization: 'Developmental Biology, Embryology & Immunology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23404'
    },
    {
      id: 'tch-zoo-005',
      name: 'Mr. Benjamin Minz',
      departmentId: 'zoology',
      departmentName: 'Zoology',
      designation: 'Lecturer & Museum Incharge',
      email: 'benjamin.minz@dbcmaram.ac.in',
      qualification: 'M.Sc. Zoology',
      specialization: 'Ecology, Wildlife Conservation & Economic Entomology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23405'
    },

    // 15. Mathematics - 5 Faculty Members
    {
      id: 'tch-mat-001',
      name: 'Dr. Alphonsus Tirkey',
      departmentId: 'mathematics',
      departmentName: 'Mathematics',
      designation: 'Associate Professor & HOD',
      email: 'alphonsus.tirkey@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D. in Mathematics',
      specialization: 'Real Analysis, Complex Analysis & Metric Spaces',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 23501'
    },
    {
      id: 'tch-mat-002',
      name: 'Mr. Simon Soreng',
      departmentId: 'mathematics',
      departmentName: 'Mathematics',
      designation: 'Associate Professor',
      email: 'simon.soreng@dbcmaram.ac.in',
      qualification: 'M.Sc., M.Phil',
      specialization: 'Abstract Algebra, Group Theory, Ring Theory & Linear Algebra',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23502'
    },
    {
      id: 'tch-mat-003',
      name: 'Ms. Rita Kindo',
      departmentId: 'mathematics',
      departmentName: 'Mathematics',
      designation: 'Assistant Professor',
      email: 'rita.kindo@dbcmaram.ac.in',
      qualification: 'M.Sc. Mathematics, CSIR-NET',
      specialization: 'Differential Equations, Multivariable Calculus & Vector Analysis',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23503'
    },
    {
      id: 'tch-mat-004',
      name: 'Mr. Denis Bilung',
      departmentId: 'mathematics',
      departmentName: 'Mathematics',
      designation: 'Assistant Professor',
      email: 'denis.bilung@dbcmaram.ac.in',
      qualification: 'M.Sc. Mathematics, GATE',
      specialization: 'Numerical Methods, Operations Research & Linear Programming',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23504'
    },
    {
      id: 'tch-mat-005',
      name: 'Ms. Agatha Lakra',
      departmentId: 'mathematics',
      departmentName: 'Mathematics',
      designation: 'Lecturer',
      email: 'agatha.lakra@dbcmaram.ac.in',
      qualification: 'M.Sc. Mathematics',
      specialization: 'Probability, Mathematical Statistics & Discrete Mathematics',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23505'
    },

    // 16. Psychology - 5 Faculty Members
    {
      id: 'tch-psy-001',
      name: 'Dr. Roseline Dungdung',
      departmentId: 'psychology',
      departmentName: 'Psychology',
      designation: 'Associate Professor & HOD',
      email: 'roseline.dungdung@dbcmaram.ac.in',
      qualification: 'M.Sc., Ph.D. in Psychology',
      specialization: 'Clinical Psychology, Diagnostic Psychopathology & Psychotherapy',
      avatar: null,
      role: 'HOD',
      phone: '+91 94360 23601'
    },
    {
      id: 'tch-psy-002',
      name: 'Mr. Martin Beck',
      departmentId: 'psychology',
      departmentName: 'Psychology',
      designation: 'Associate Professor',
      email: 'martin.beck@dbcmaram.ac.in',
      qualification: 'M.A., M.Phil in Psychology',
      specialization: 'Cognitive Psychology, Memory, Attention & Perception Models',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23602'
    },
    {
      id: 'tch-psy-003',
      name: 'Ms. Euphrasia Toppo',
      departmentId: 'psychology',
      departmentName: 'Psychology',
      designation: 'Assistant Professor',
      email: 'euphrasia.toppo@dbcmaram.ac.in',
      qualification: 'M.Sc. Psychology, UGC-NET',
      specialization: 'Social Psychology, Group Dynamics & Behavioral Counseling',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23603'
    },
    {
      id: 'tch-psy-004',
      name: 'Mr. Gerald Xaxa',
      departmentId: 'psychology',
      departmentName: 'Psychology',
      designation: 'Assistant Professor',
      email: 'gerald.xaxa@dbcmaram.ac.in',
      qualification: 'M.A. Psychology, UGC-NET',
      specialization: 'Developmental Psychology, Child Behavior & Adolescent Health',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23604'
    },
    {
      id: 'tch-psy-005',
      name: 'Ms. Genevieve Kujur',
      departmentId: 'psychology',
      departmentName: 'Psychology',
      designation: 'Lecturer & Psychometric Lab Head',
      email: 'genevieve.kujur@dbcmaram.ac.in',
      qualification: 'M.Sc. Psychology',
      specialization: 'Psychological Assessment, Testing Tools & Experimental Psychology',
      avatar: null,
      role: 'Faculty',
      phone: '+91 94360 23605'
    }
  ];

  // Helper: Get pastel avatar colors from name
  function getAvatarColors(name) {
    const palette = [
      { bg: '#dbeafe', text: '#1d4ed8' }, // Blue
      { bg: '#dcfce7', text: '#15803d' }, // Green
      { bg: '#f3e8ff', text: '#7e22ce' }, // Purple
      { bg: '#ffedd5', text: '#c2410c' }, // Orange
      { bg: '#fee2e2', text: '#b91c1c' }, // Red
      { bg: '#ccfbf1', text: '#0f766e' }, // Teal
      { bg: '#fef3c7', text: '#b45309' }, // Amber
      { bg: '#fce7f3', text: '#be185d' }  // Pink
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palette.length;
    return palette[index];
  }

  // Helper: Get initials
  function getInitials(name) {
    const clean = name.replace(/^(Rev\.|Fr\.|Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.|Sr\.)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'DB';
  }

  // Return all teachers (merging built-in roster and any custom teachers)
  function getAllTeachers() {
    try {
      const custom = JSON.parse(localStorage.getItem('dbcm_custom_teachers') || '[]');
      return [...DBCM_DEFAULT_TEACHERS, ...custom];
    } catch (e) {
      return DBCM_DEFAULT_TEACHERS;
    }
  }

  // Find teacher by ID
  function getTeacherById(id) {
    if (!id) return null;
    return getAllTeachers().find(t => t.id === id) || null;
  }

  // Filter teachers by department
  function getTeachersByDept(deptId) {
    if (!deptId || deptId === 'all') return getAllTeachers();
    return getAllTeachers().filter(t => t.departmentId === deptId);
  }

  // Search teachers by keyword
  function searchTeachers(query, deptId = 'all') {
    let list = getTeachersByDept(deptId);
    if (!query || !query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.departmentName.toLowerCase().includes(q) ||
      (t.specialization && t.specialization.toLowerCase().includes(q)) ||
      (t.qualification && t.qualification.toLowerCase().includes(q))
    );
  }

  // Current logged in teacher
  function getCurrentTeacher() {
    try {
      const saved = localStorage.getItem('dbcm_teacher_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Refresh with latest from roster if possible
        const full = getTeacherById(parsed.id);
        return full || parsed;
      }
    } catch (e) {
      console.warn('Error reading teacher session', e);
    }
    return null;
  }

  // Set logged in teacher
  function setCurrentTeacher(teacher) {
    if (!teacher) {
      localStorage.removeItem('dbcm_teacher_session');
    } else {
      localStorage.setItem('dbcm_teacher_session', JSON.stringify({
        id: teacher.id,
        name: teacher.name,
        departmentId: teacher.departmentId,
        departmentName: teacher.departmentName,
        designation: teacher.designation,
        email: teacher.email,
        avatar: teacher.avatar || null,
        loginTime: new Date().toISOString()
      }));
    }
    window.dispatchEvent(new CustomEvent('dbcm:teacher-auth', { detail: { teacher } }));
    syncHeaderTeacherUI();
  }

  // Logout
  function logoutTeacher() {
    localStorage.removeItem('dbcm_teacher_session');
    window.dispatchEvent(new CustomEvent('dbcm:teacher-auth', { detail: { teacher: null } }));
    syncHeaderTeacherUI();
  }

  // Get uploads recorded by teacher
  function getTeacherUploads(teacherId = null) {
    try {
      const all = JSON.parse(localStorage.getItem('dbcm_teacher_uploads') || '[]');
      if (teacherId) {
        return all.filter(u => u.teacherId === teacherId);
      }
      return all;
    } catch (e) {
      return [];
    }
  }

  // Save an upload made by a teacher
  async function saveTeacherUpload(meta, fileBlobOrDataUrl = null) {
    const teacher = getCurrentTeacher() || meta.teacher;
    if (!teacher) throw new Error('A teacher must be logged in to upload materials.');

    const uploadId = `tch-up-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let fileStorageId = null;
    let effectivePdfUrl = meta.pdfUrl || '';

    // If a File object is passed, save to IndexedDB
    const isFileOrBlob = (typeof File !== 'undefined' && fileBlobOrDataUrl instanceof File) ||
                         (typeof Blob !== 'undefined' && fileBlobOrDataUrl instanceof Blob);
    if (isFileOrBlob) {
      fileStorageId = `dbcm-file-${uploadId}`;
      if (window.dbcmContributionFiles?.save) {
        try {
          await window.dbcmContributionFiles.save(fileStorageId, fileBlobOrDataUrl);
          effectivePdfUrl = URL.createObjectURL(fileBlobOrDataUrl);
        } catch (e) {
          console.warn('Could not store in IndexedDB, fallback to Data URL', e);
        }
      }
      // If small file, read as data URL for persistent offline viewing
      if (fileBlobOrDataUrl.size < 2.5 * 1024 * 1024 && (!effectivePdfUrl || effectivePdfUrl.startsWith('blob:'))) {
        try {
          const reader = new FileReader();
          effectivePdfUrl = await new Promise(res => {
            reader.onload = () => res(reader.result);
            reader.onerror = () => res(effectivePdfUrl);
            reader.readAsDataURL(fileBlobOrDataUrl);
          });
        } catch (err) {
          console.warn('DataURL generation failed:', err);
        }
      }
    } else if (typeof fileBlobOrDataUrl === 'string' && fileBlobOrDataUrl.trim()) {
      effectivePdfUrl = fileBlobOrDataUrl;
    }

    // Now update curriculum subject in localStorage
    const localCurriculum = await window.dbcmLocalData.load();
    const subjects = localCurriculum.subjects || [];
    const targetSubject = subjects.find(s => s.id === meta.subjectId || s.code === meta.subjectCode);

    if (!targetSubject) {
      throw new Error(`Target subject not found: ${meta.subjectCode || meta.subjectId}`);
    }

    const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const resourceItem = {
      id: uploadId,
      title: meta.title || `${targetSubject.code} ${meta.category.toUpperCase()}`,
      author: teacher.name,
      uploadedBy: teacher.name,
      teacherId: teacher.id,
      teacherDept: teacher.departmentName,
      teacherDesignation: teacher.designation,
      uploadDate: todayDate,
      uploadTime: formattedTime,
      verified: true,
      facultyVerified: true,
      fileStorageId: fileStorageId,
      pdfUrl: effectivePdfUrl || '#',
      fileName: meta.fileName || `${targetSubject.code}_Material.pdf`,
      fileSize: meta.fileSize || '1.8 MB',
      fileType: meta.fileType || 'pdf'
    };

    // Attach based on category
    if (meta.category === 'syllabus') {
      targetSubject.syllabusPdfUrl = effectivePdfUrl;
      targetSubject.syllabusFileName = resourceItem.fileName;
      targetSubject.syllabusFileSize = resourceItem.fileSize;
      targetSubject.syllabusList = targetSubject.syllabusList || [];
      targetSubject.syllabusList.push(resourceItem);
    } else if (meta.category === 'notes') {
      resourceItem.module = Number(meta.unit) || 1;
      resourceItem.unit = Number(meta.unit) || 1;
      resourceItem.unitTitle = meta.unitTitle || `Unit ${resourceItem.module}`;
      resourceItem.topic = meta.title;
      resourceItem.pages = meta.pages || 24;
      resourceItem.reads = 1;
      targetSubject.notes = targetSubject.notes || [];
      targetSubject.notes.push(resourceItem);
    } else if (meta.category === 'pyqs') {
      resourceItem.year = meta.year || 'Summer 2025';
      resourceItem.session = meta.year || 'Summer 2025';
      resourceItem.paperType = meta.title;
      resourceItem.totalMarks = Number(meta.marks) || 80;
      resourceItem.pages = meta.pages || 4;
      targetSubject.pyqs = targetSubject.pyqs || [];
      targetSubject.pyqs.push(resourceItem);
    } else if (meta.category === 'videos') {
      resourceItem.url = meta.videoUrl || '';
      resourceItem.channelName = meta.channelName || `${teacher.name} · DBCM`;
      targetSubject.videos = targetSubject.videos || [];
      targetSubject.videos.push(resourceItem);
    } else if (meta.category === 'questions') {
      resourceItem.unit = Number(meta.unit) || 1;
      targetSubject.impQuestions = targetSubject.impQuestions || [];
      targetSubject.impQuestions.push(resourceItem);
    }

    // Save updated subjects
    window.dbcmLocalData.saveSubjects(subjects);

    // Record in dbcm_teacher_uploads
    const logItem = {
      uploadId,
      teacherId: teacher.id,
      teacherName: teacher.name,
      departmentId: teacher.departmentId,
      departmentName: teacher.departmentName,
      subjectId: targetSubject.id,
      subjectCode: targetSubject.code,
      subjectName: targetSubject.name,
      category: meta.category,
      title: resourceItem.title,
      unit: meta.unit || null,
      unitTitle: meta.unitTitle || null,
      fileName: resourceItem.fileName,
      fileSize: resourceItem.fileSize,
      fileStorageId: fileStorageId,
      pdfUrl: effectivePdfUrl,
      videoUrl: meta.videoUrl || null,
      uploadDate: todayDate,
      uploadTime: formattedTime,
      verified: true
    };

    const currentUploads = getTeacherUploads();
    currentUploads.unshift(logItem);
    localStorage.setItem('dbcm_teacher_uploads', JSON.stringify(currentUploads));

    return logItem;
  }

  // Delete an upload
  async function deleteTeacherUpload(uploadId) {
    const uploads = getTeacherUploads();
    const item = uploads.find(u => u.uploadId === uploadId);
    if (!item) return false;

    // Remove from teacher logs
    const remaining = uploads.filter(u => u.uploadId !== uploadId);
    localStorage.setItem('dbcm_teacher_uploads', JSON.stringify(remaining));

    // Remove file from IndexedDB if stored
    if (item.fileStorageId && window.dbcmContributionFiles?.remove) {
      try {
        await window.dbcmContributionFiles.remove(item.fileStorageId);
      } catch (e) {
        console.warn('Could not remove file from IndexedDB', e);
      }
    }

    // Remove from curriculum
    const localCurriculum = await window.dbcmLocalData.load();
    const subjects = localCurriculum.subjects || [];
    const targetSubject = subjects.find(s => s.id === item.subjectId || s.code === item.subjectCode);

    if (targetSubject) {
      if (item.category === 'notes' && targetSubject.notes) {
        targetSubject.notes = targetSubject.notes.filter(n => n.id !== uploadId);
      } else if (item.category === 'pyqs' && targetSubject.pyqs) {
        targetSubject.pyqs = targetSubject.pyqs.filter(p => p.id !== uploadId);
      } else if (item.category === 'videos' && targetSubject.videos) {
        targetSubject.videos = targetSubject.videos.filter(v => v.id !== uploadId);
      } else if (item.category === 'questions' && targetSubject.impQuestions) {
        targetSubject.impQuestions = targetSubject.impQuestions.filter(q => q.id !== uploadId);
      } else if (item.category === 'syllabus') {
        if (targetSubject.syllabusList) {
          targetSubject.syllabusList = targetSubject.syllabusList.filter(s => s.id !== uploadId);
        }
        if (targetSubject.syllabusFileName === item.fileName) {
          targetSubject.syllabusPdfUrl = '';
          targetSubject.syllabusFileName = '';
        }
      }
      window.dbcmLocalData.saveSubjects(subjects);
    }

    return true;
  }

  // Admin Authentication Helpers
  function getCurrentAdmin() {
    try {
      const saved = localStorage.getItem('dbcm_admin_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading admin session', e);
    }
    return null;
  }

  function setCurrentAdmin(adminData) {
    if (!adminData) {
      localStorage.removeItem('dbcm_admin_session');
    } else {
      localStorage.setItem('dbcm_admin_session', JSON.stringify({
        username: adminData.username || 'admin',
        name: adminData.name || 'Academic Administrator',
        role: 'admin',
        loginTime: new Date().toISOString()
      }));
    }
    window.dispatchEvent(new CustomEvent('dbcm:admin-auth', { detail: { admin: adminData } }));
    syncHeaderTeacherUI();
  }

  function logoutAdmin() {
    localStorage.removeItem('dbcm_admin_session');
    window.dispatchEvent(new CustomEvent('dbcm:admin-auth', { detail: { admin: null } }));
    syncHeaderTeacherUI();
  }

  // Header UI Sync for unified Teacher/ Admin button & legacy buttons
  function syncHeaderTeacherUI() {
    const currentTeacher = getCurrentTeacher();
    const currentAdmin = getCurrentAdmin();

    // Unified Teacher/ Admin Button
    const unifiedBtn = document.getElementById('teacher-admin-btn');
    const unifiedLabel = document.getElementById('teacher-admin-label');
    const mobileUnifiedBtn = document.getElementById('mobile-teacher-admin-btn');
    const mobileUnifiedLabel = document.getElementById('mobile-teacher-admin-label');

    if (unifiedBtn) {
      if (currentTeacher) {
        unifiedBtn.href = 'pages/teacher.html';
        unifiedBtn.className = 'px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm min-h-[38px] sm:min-h-[40px] group';
        unifiedBtn.title = `Signed in as ${currentTeacher.name} (${currentTeacher.departmentName}) · Click to open Teacher Dashboard`;
        if (unifiedLabel) {
          unifiedLabel.innerHTML = `<span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span class="max-w-[130px] truncate">${currentTeacher.name.replace(/^(Rev\.|Fr\.|Dr\.|Prof\.|Mr\.|Ms\.)\s*/, '')} (Teacher)</span></span>`;
        }
      } else if (currentAdmin) {
        unifiedBtn.href = 'pages/admin.html';
        unifiedBtn.className = 'px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-400/50 text-indigo-200 hover:text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm min-h-[38px] sm:min-h-[40px] group';
        unifiedBtn.title = 'Administrator Console Active · Click to open Admin Dashboard';
        if (unifiedLabel) {
          unifiedLabel.innerHTML = '<span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span><span>Admin Dashboard</span></span>';
        }
      } else {
        unifiedBtn.href = 'pages/login.html';
        unifiedBtn.className = 'px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-indigo-600/20 hover:from-emerald-600/35 hover:to-indigo-600/35 border border-emerald-500/30 hover:border-emerald-500/50 text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm min-h-[38px] sm:min-h-[40px] group';
        unifiedBtn.title = 'Teacher/ Admin Portal · Access Faculty & Admin Dashboards';
        if (unifiedLabel) {
          unifiedLabel.textContent = 'Teacher/ Admin';
        }
      }
    }

    if (mobileUnifiedBtn) {
      if (currentTeacher) {
        mobileUnifiedBtn.href = 'pages/teacher.html';
        if (mobileUnifiedLabel) mobileUnifiedLabel.innerHTML = `<span class="flex items-center gap-1.5 text-emerald-300"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>${currentTeacher.name} (Teacher)</span>`;
      } else if (currentAdmin) {
        mobileUnifiedBtn.href = 'pages/admin.html';
        if (mobileUnifiedLabel) mobileUnifiedLabel.innerHTML = '<span class="flex items-center gap-1.5 text-amber-300"><span class="w-2 h-2 rounded-full bg-amber-400"></span>Admin Dashboard</span>';
      } else {
        mobileUnifiedBtn.href = 'pages/login.html';
        if (mobileUnifiedLabel) mobileUnifiedLabel.textContent = 'Teacher/ Admin';
      }
    }

    // Backwards Compatibility with legacy buttons if present
    const desktopTeacherBtn = document.getElementById('teacher-nav-btn');
    const desktopTeacherLabel = document.getElementById('teacher-nav-label');
    const mobileTeacherBtn = document.getElementById('teacher-nav-btn-mobile');
    const mobileTeacherLabel = document.getElementById('teacher-nav-label-mobile');
    const desktopAdminBtn = document.getElementById('admin-btn');
    const desktopAdminLabel = document.getElementById('admin-btn-label');
    const mobilePortalBtn = document.getElementById('mobile-admin-login-link');
    const mobilePortalLabel = document.getElementById('mobile-admin-login-label');

    if (desktopTeacherBtn) {
      desktopTeacherBtn.href = currentTeacher ? 'pages/teacher.html' : 'pages/login.html?role=teacher';
      if (desktopTeacherLabel) desktopTeacherLabel.textContent = currentTeacher ? currentTeacher.name : 'Teacher Login';
    }
    if (mobileTeacherBtn) {
      mobileTeacherBtn.href = currentTeacher ? 'pages/teacher.html' : 'pages/login.html?role=teacher';
      if (mobileTeacherLabel) mobileTeacherLabel.textContent = currentTeacher ? currentTeacher.name : 'Teacher Login';
    }
    if (desktopAdminBtn) {
      desktopAdminBtn.href = currentTeacher ? 'pages/teacher.html' : currentAdmin ? 'pages/admin.html' : 'pages/login.html?role=teacher';
      if (desktopAdminLabel) desktopAdminLabel.textContent = currentTeacher ? 'Teacher Dashboard' : currentAdmin ? 'Admin Dashboard' : 'Teacher';
      desktopAdminBtn.title = currentTeacher ? 'Open Teacher Dashboard' : currentAdmin ? 'Open Admin Dashboard' : 'Teacher Login; choose Admin on the login page for administrator access';
    }
    if (mobilePortalBtn) {
      mobilePortalBtn.href = currentTeacher ? 'pages/teacher.html' : currentAdmin ? 'pages/admin.html' : 'pages/login.html?role=teacher';
      if (mobilePortalLabel) mobilePortalLabel.textContent = currentTeacher ? 'Teacher Dashboard' : currentAdmin ? 'Admin Dashboard' : 'Teacher';
    }
  }

  // Auto-init on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncHeaderTeacherUI);
  } else {
    syncHeaderTeacherUI();
  }

  // Export to global window object
  window.dbcmTeachers = {
    DEFAULT_TEACHERS: DBCM_DEFAULT_TEACHERS,
    getAllTeachers,
    getTeacherById,
    getTeachersByDept,
    searchTeachers,
    getCurrentTeacher,
    setCurrentTeacher,
    logoutTeacher,
    getCurrentAdmin,
    setCurrentAdmin,
    logoutAdmin,
    getTeacherUploads,
    saveTeacherUpload,
    deleteTeacherUpload,
    getAvatarColors,
    getInitials,
    syncHeaderTeacherUI
  };
})();
