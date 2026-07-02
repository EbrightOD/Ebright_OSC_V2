export const PEOPLE = {
  ceo: { id: 'ceo-001', title: 'Mr.', name: 'Kevin', role: 'Chief Executive Officer' },
  hods: [
    { id: 'hod-001', title: 'Ms.', name: 'Athirah',  role: 'Head of Academy',     dept: 'academy',     emoji: '🎓',
      quote: "Learning is how we grow. Welcome aboard — let's build brilliant minds together." },
    { id: 'hod-002', title: 'Ms.', name: 'Alyaa',    role: 'Head of Finance',     dept: 'finance',     emoji: '📊',
      quote: 'Numbers tell stories. Welcome to Finance — where every ringgit has a purpose.' },
    { id: 'hod-003', title: 'Ms.', name: 'Fazween',  role: 'Head of HR',          dept: 'hr',          emoji: '🧠',
      quote: "People are our greatest asset. I'm here to make sure your journey is amazing." },
    { id: 'hod-004', title: 'Ms.', name: 'Fazween',  role: 'Head of Marketing',   dept: 'marketing',   emoji: '📣',
      quote: 'Growth is our game. Welcome to the squad that turns ideas into movements.' },
    { id: 'hod-005', title: 'Ms.', name: 'Manjeet',  role: 'Head of Operations',  dept: 'operations',  emoji: '⚙️',
      quote: 'Operations is the backbone of ebright. Welcome!' },
    { id: 'hod-006', title: 'Mr.', name: 'Iqbal',    role: 'Head of Optimisation',dept: 'optimisation',emoji: '💻',
      quote: 'We make everything run faster, smarter, and better.' },
  ],
  executives: [
    { id: 'exec-001', title: 'Ms.', name: 'Najwa',    role: 'HR Executive',           dept: 'hr' },
    { id: 'exec-002', title: 'Ms.', name: 'Didi',     role: 'Marketing Executive',    dept: 'marketing' },
    { id: 'exec-003', title: 'Ms.', name: 'Maizatul', role: 'Marketing Executive',    dept: 'marketing' },
    { id: 'exec-004', title: 'Mr.', name: 'Adam',     role: 'Optimisation Executive', dept: 'optimisation' },
    { id: 'exec-005', title: 'Ms.', name: 'Ying Chen',role: 'Optimisation Executive', dept: 'optimisation' },
    { id: 'exec-006', title: 'Ms.', name: 'Hamizah',  role: 'Academy Executive',      dept: 'academy' },
    { id: 'exec-007', title: 'Mr.', name: 'Faiz',     role: 'Finance Executive',      dept: 'finance' },
    { id: 'exec-008', title: 'Ms.', name: 'Hanisah',  role: 'Operations Executive',   dept: 'operations' },
  ],
  regionalManagers: [
    { id: 'rm-001', title: 'Mr.', name: 'Irfan',    role: 'Regional Manager — Region A', region: 'rA' },
    { id: 'rm-002', title: 'Ms.', name: 'Kirtikha', role: 'Regional Manager — Region B', region: 'rB' },
    { id: 'rm-003', title: 'Ms.', name: 'Manjeet',  role: 'Regional Manager — Region C', region: 'rC' },
  ],
};

export const DEPARTMENTS = [
  { id: 'academy',     name: 'Academy',        emoji: '🎓', color: '#f5c518' },
  { id: 'finance',     name: 'Finance',        emoji: '📊', color: '#4ac0a8' },
  { id: 'hr',          name: 'HR',             emoji: '🧠', color: '#a070d0' },
  { id: 'marketing',   name: 'Marketing',      emoji: '📣', color: '#f08840' },
  { id: 'operations',  name: 'Operations',     emoji: '⚙️', color: '#d42b2b' },
  { id: 'optimisation',name: 'Optimisation',   emoji: '💻', color: '#5090e0' },
];

export const REGIONS = [
  { id: 'rA', name: 'Region A', manager: 'Mr. Irfan' },
  { id: 'rB', name: 'Region B', manager: 'Ms. Kirtikha' },
  { id: 'rC', name: 'Region C', manager: 'Ms. Manjeet' },
];

export const BRANCHES = [
  // Region A — RM Irfan
  { id: 'b-anggun-city',   name: 'Anggun City Rawang',     short: 'AC',   region: 'rA', manager: 'TBA' },
  { id: 'b-denai-alam',    name: 'Denai Alam',             short: 'DA',   region: 'rA', manager: 'Guken' },
  { id: 'b-eco-grandeur',  name: 'Eco Grandeur',           short: 'EGR',  region: 'rA', manager: 'Zikry' },
  { id: 'b-klang',         name: 'Klang',                  short: 'KLG',  region: 'rA', manager: 'Niki' },
  { id: 'b-bandar-rimbayu',name: 'Bandar Rimbayu',         short: 'RBY',  region: 'rA', manager: 'Nureen' },
  { id: 'b-setia-alam',    name: 'Setia Alam',             short: 'SA',   region: 'rA', manager: 'Ain' },
  { id: 'b-shah-alam',     name: 'Shah Alam',              short: 'SHA',  region: 'rA', manager: 'Irfan' },
  { id: 'b-subang-taipan', name: 'Subang Taipan',          short: 'ST',   region: 'rA', manager: 'Qistina' },
  { id: 'b-sungai-buloh',  name: 'Sungai Buloh',           short: 'SBY',  region: 'rA', manager: 'TBA' },
  // Region B — RM Kirtikha
  { id: 'b-ampang',        name: 'Ampang',                 short: 'AMP',  region: 'rB', manager: 'Zahid' },
  { id: 'b-btho',          name: 'Bandar Tun Hussein Onn', short: 'BTHO', region: 'rB', manager: 'TBA' },
  { id: 'b-danau-kota',    name: 'Danau Kota',             short: 'DK',   region: 'rB', manager: 'Kirtikha' },
  { id: 'b-dsh',           name: 'Desa Sri Hartamas',      short: 'DSH',  region: 'rB', manager: 'TBA' },
  { id: 'b-kajang-ttdi',   name: 'Kajang TTDI Grove',      short: 'KTG',  region: 'rB', manager: 'Alif' },
  { id: 'b-kota-damansara',name: 'Kota Damansara',         short: 'KD',   region: 'rB', manager: 'Suraj' },
  { id: 'b-selayang',      name: 'Selayang',               short: 'SLY',  region: 'rB', manager: 'TBA' },
  { id: 'b-sri-petaling',  name: 'Sri Petaling',           short: 'SP',   region: 'rB', manager: 'Janani' },
  { id: 'b-taman-sri-gombak',name: 'Taman Sri Gombak',     short: 'TSG',  region: 'rB', manager: 'Ezry' },
  // Region C — RM Manjeet
  { id: 'b-bandar-baru-bangi', name: 'Bandar Baru Bangi',  short: 'BBB',  region: 'rC', manager: 'Kishantini' },
  { id: 'b-bandar-seri-putra', name: 'Bandar Seri Putra',  short: 'BSP',  region: 'rC', manager: 'Izzeti' },
  { id: 'b-cyberjaya',     name: 'Cyberjaya',              short: 'CJY',  region: 'rC', manager: 'Hannah' },
  { id: 'b-dataran-puchong',name: 'Dataran Puchong Utama', short: 'DP',   region: 'rC', manager: 'TBA' },
  { id: 'b-kota-warisan',  name: 'Kota Warisan',           short: 'KW',   region: 'rC', manager: 'Laila' },
  { id: 'b-putrajaya',     name: 'Putrajaya',              short: 'PJY',  region: 'rC', manager: 'Rafiq' },
  { id: 'b-senawang-taipan',name: 'Senawang Taipan',       short: 'SNT',  region: 'rC', manager: 'TBA' },
  { id: 'b-seremban',      name: 'Seremban',               short: 'SBN',  region: 'rC', manager: 'TBA' },
  { id: 'b-online',        name: 'Online',                 short: 'ONL',  region: 'rC', manager: 'Ummu' },
];

export const BANKS = ['Maybank', 'CIMB', 'Public Bank', 'RHB', 'Hong Leong', 'AmBank', 'Bank Islam', 'Bank Rakyat', 'Other'];

export const ROLES = [
  { id: 'intern',   icon: '🎓', name: 'INTERN',     desc: 'Short-term learning role' },
  { id: 'part',     icon: '⏰', name: 'PART-TIMER', desc: 'Flexible schedule' },
  { id: 'full',     icon: '💼', name: 'FULL-TIMER', desc: 'Permanent team member' },
];

export const SOFTWARE_LIST = [
  { id: 'library',       name: 'Library',        color: '#f5c518', letter: 'L', tagline: 'Your knowledge base',
    description: 'The Library is where every SOP, policy, training video, and slide deck lives — including your company email login. Always start here.',
    loginUrl: 'https://odd3cff16ab85c2-yavxc.com/login/' },
  { id: 'clickup',       name: 'ClickUp',        color: '#2db858', letter: 'C', tagline: 'Your daily mission control',
    description: 'ClickUp is the hub where every ebright project, task, and deadline lives. Update your daily tasks here.',
    loginUrl: 'https://app.clickup.com/login' },
  { id: 'aone',          name: 'AOne',           color: '#3070d0', letter: 'A', tagline: 'Payroll & HR made simple',
    description: 'AOne handles all things HR — submit leave applications, view your payslips, and claim expenses.',
    loginUrl: 'https://aone.com.my/login' },
  { id: 'process-street',name: 'Process Street', color: '#8838c8', letter: 'P', tagline: 'Your workflow playbook',
    description: 'Process Street holds every workflow and SOP at ebright — from onboarding to operations checklists.',
    loginUrl: 'https://app.process.st/login' },
  { id: 'autocount',     name: 'Autocount Payroll', color: '#e87830', letter: '#', tagline: 'Payroll & claim submissions',
    description: 'Autocount Payroll is where Finance runs payroll and where you submit claims. You will learn how to log in and submit a claim.',
    loginUrl: 'https://payroll.autocountcloud.com' },
  { id: 'zoom',          name: 'Zoom',           color: '#2D8CFF', letter: 'Z', tagline: 'Meetings & training calls',
    description: 'Zoom is how we meet across branches and HQ. Install it on your device and log in with your company email.',
    loginUrl: 'https://zoom.us/signin' },
];

export const PROGRESS_STEPS = [
  { id: 1, label: 'Welcome', matches: ['/'] },
  { id: 3, label: 'Day 1',   matches: ['/day1'] },
  { id: 4, label: 'Day 2',   matches: ['/day2'] },
  { id: 5, label: 'Day 3',   matches: ['/day3'] },
];

export const TRAINING_SEQUENCE = [
  { id: 'd1-ceo',          day: 1, label: 'CEO Introduction',                path: '/day1/ceo' },
  { id: 'd1-team',         day: 1, label: 'Meet the Family',                 path: '/day1/team' },
  { id: 'd1-department',   day: 1, label: 'Department Introduction',         path: '/day1/department' },
  { id: 'd1-dept-game',    day: 1, label: 'Ebright Office Game',             path: '/day1/department-game' },
  { id: 'd1-software',     day: 1, label: 'Software Introduction',           path: '/day1/software' },
  { id: 'd1-software-proof',day: 1, label: 'Proof Screenshot Submission',    path: '/day1/software-proof' },
  { id: 'd1-software-game',day: 1, label: 'Software Racer Game',             path: '/day1/software-game' },
  { id: 'd1-policy',       day: 1, label: 'Policy & Compliance',             path: '/day1/policy' },
  { id: 'd1-policy-game',  day: 1, label: 'Policy Game',                     path: '/day1/policy-game' },
  { id: 'd1-syllabus',     day: 1, label: 'Academic Syllabus',               path: '/day1/syllabus' },
  { id: 'd1-syllabus-game',day: 1, label: 'Find the Missing Item',           path: '/day1/syllabus-game' },
  { id: 'd1-comms',        day: 1, label: 'Basic Communication',             path: '/day1/communication' },
  { id: 'd1-video',        day: 1, label: 'Video Submission Task',           path: '/day1/video' },
  { id: 'd1-tour',         day: 1, label: 'HQ Tour',                         path: '/day1/hq-tour' },
  { id: 'd1-complete',     day: 1, label: 'Day 1 Complete',                  path: '/day1/complete' },

  { id: 'd2-attendance',     day: 2, label: 'Attendance Report',             path: '/day2/attendance' },
  { id: 'd2-library',        day: 2, label: 'Library',                        path: '/day2/library' },
  { id: 'd2-process-street', day: 2, label: 'Process Street',                 path: '/day2/process-street' },
  { id: 'd2-autocount',      day: 2, label: 'Autocount Payroll',              path: '/day2/autocount' },
  { id: 'd2-logsheet',       day: 2, label: 'Logsheet (Interns)',             path: '/day2/logsheet' },
  { id: 'd2-zoom',           day: 2, label: 'Zoom',                           path: '/day2/zoom' },
  { id: 'd2-video',          day: 2, label: 'Video Submission Task',          path: '/day2/video' },
  { id: 'd2-whatsapp',       day: 2, label: 'WhatsApp Groups',                path: '/day2/whatsapp' },
  // ClickUp is the very last task of Day 2 — trainees update their tasks at end-of-day.
  { id: 'd2-clickup',        day: 2, label: 'ClickUp',                        path: '/day2/clickup' },
  { id: 'd2-complete',       day: 2, label: 'Day 2 Complete',                 path: '/day2/complete' },

  { id: 'd3-attendance',   day: 3, label: 'Attendance Report',               path: '/day3/attendance' },
  { id: 'd3-video',        day: 3, label: 'Video Submission Task',           path: '/day3/video' },
  { id: 'd3-complete',     day: 3, label: 'Onboarding Complete',             path: '/day3/complete' },
];

export const INDUCTION_CHECKLIST = {
  day1: [
    { id: 'd1-1',  label: 'CEO Introduction',                                icon: '🎤' },
    { id: 'd1-2',  label: 'Meet the Family',                                 icon: '👋' },
    { id: 'd1-3',  label: 'Department Introduction',                         icon: '🏢' },
    { id: 'd1-4',  label: 'Department Game — Ebright Office',                icon: '🔦' },
    { id: 'd1-5',  label: 'Software Introduction',                           icon: '💻' },
    { id: 'd1-6',  label: 'Software Game — Racer',                           icon: '🏎' },
    { id: 'd1-7',  label: 'Company Policy & Compliance',                     icon: '📋' },
    { id: 'd1-8',  label: 'Policy & Compliance Game',                        icon: '🎯' },
    { id: 'd1-9',  label: 'Academic Syllabus',                               icon: '📚' },
    { id: 'd1-10', label: 'Syllabus Game — Find the Missing Item',           icon: '🔍' },
    { id: 'd1-11', label: 'Basic Communication with Customers',              icon: '💬' },
    { id: 'd1-12', label: 'Video Submission Task',                           icon: '🎥' },
    { id: 'd1-13', label: 'HQ Tour',                                         icon: '🚶' },
  ],
  day2: [
    { id: 'd2-1', label: 'Attendance Report (8:45 photo)',                   icon: '📸' },
    { id: 'd2-2', label: 'Software Training — ClickUp',                      icon: '✅' },
    { id: 'd2-3', label: 'Software Training — Library',                      icon: '📖' },
    { id: 'd2-4', label: 'Software Training — Process Street',               icon: '🔄' },
    { id: 'd2-5', label: 'Software Training — Autocount Payroll',            icon: '💰' },
    { id: 'd2-6', label: 'Software Training — Logsheet (interns)',           icon: '📝' },
    { id: 'd2-7', label: 'Software Training — WhatsApp groups',              icon: '💚' },
    { id: 'd2-8', label: 'Software Training — Zoom login',                   icon: '🎦' },
    { id: 'd2-9', label: 'Video Submission Task',                            icon: '🎥' },
  ],
  day3: [
    { id: 'd3-1', label: 'Attendance Report (8:45 photo)',                   icon: '📸' },
    { id: 'd3-2', label: 'Video Submission Task',                            icon: '🎥' },
  ],
};

export const COMPANY = {
  name: 'ebright Sdn. Bhd.',
  address: 'No. 21-2 Jalan USJ 10/1D, 47620 Subang Jaya, Selangor',
  email: 'sales@ebright.my',
  phone: '+6016-969 8351',
  tagline: 'Trinity College London Certified · 1,050+ Active Students',
};
