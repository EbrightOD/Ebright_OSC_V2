import { useState, useRef, useEffect, useMemo } from 'react';
import { useLockGate } from '../../hooks/usePageGate';

/* ── DEPT DATA ── */
const DEPT = {
  design: {
    name: 'Academy',
    hods: [{
      name: 'Ms. Athirah', role: 'Head of Academy', emoji: '🧑‍🎨', color: '#d42ba8',
      greeting: "Learning is how we grow. Welcome aboard — let's build brilliant minds together.",
      executives: [
        { name: 'Ms. Hamizah', role: 'Academy Executive', emoji: '👩‍🏫', color: '#e43bb8', greeting: "Hi! I'm Hamizah from Academy. Excited to help you shape brilliant young speakers!" },
      ]
    }]
  },
  finance: {
    name: 'Finance',
    hods: [{
      name: 'Ms. Alyaa', role: 'Head of Finance', emoji: '👩‍💼', color: '#2bd47a',
      greeting: "Numbers tell stories. Welcome to Finance — where every ringgit has a purpose and a plan.",
      executives: [
        { name: 'Mr. Faiz', role: 'Finance Executive', emoji: '👨‍💼', color: '#3be48a', greeting: "Hey! I'm Faiz from Finance. Reach out for anything claims, payroll, or expense-related." },
      ]
    }]
  },
  hr: {
    name: 'Human Resources',
    hods: [{
      name: 'Ms. Fazween', role: 'Head of HR',
      useAvatar: true, gender: 'female', color: '#d4a82b',
      greeting: "People are our greatest asset. I'm here to make sure your journey at ebright is nothing short of amazing.",
      executives: [
        { name: 'Ms. Najwa', role: 'HR Executive', emoji: '👩‍💼', color: '#e4b83b', greeting: "Hi! I'm Najwa from HR. Reach out anytime — I'm here to help." },
      ]
    }]
  },
  marketing: {
    name: 'Marketing',
    hods: [{
      name: 'Ms. Fazween', role: 'Head of Marketing',
      useAvatar: true, gender: 'female', color: '#d42b2b',
      greeting: "Growth is our game. Welcome to the squad that turns ideas into movements. Let's make some noise!",
      executives: [
        { name: 'Ms. Didi',     role: 'Executive', emoji: '👩‍💼', color: '#e43535', greeting: "Hi! I'm Didi from Marketing. Let's build something memorable together!" },
        { name: 'Ms. Maizatul', role: 'Executive', emoji: '👩‍💼', color: '#e43535', greeting: "Hi! I'm Maizatul from Marketing. Excited to grow together with you!" },
      ]
    }]
  },
  ops: {
    name: 'Operations',
    hods: [{
      name: 'Ms. Manjeet', role: 'Head of Operations',
      useAvatar: true, gender: 'female', color: '#7a2bd4',
      greeting: "Operations is the backbone of ebright. Behind every smooth experience is our team working tirelessly. Welcome!",
      executives: [
        { name: 'Ms. Hanisah', role: 'Operations Executive', emoji: '👩‍💼', color: '#8a3be4', greeting: "Hi! I'm Hanisah from Operations. I help keep all 27 branches running smoothly — anything you need, just ping." },
      ],
      regionalManagers: [
        {
          name: 'Mr. Irfan', role: 'Regional Manager (Region A)', emoji: '👨‍💼', color: '#8a3be4',
          branches: [
            { branch: 'Anggun City Rawang (AC)', manager: 'TBA' },
            { branch: 'Denai Alam (DA)',         manager: 'Guken' },
            { branch: 'Eco Grandeur (EGR)',      manager: 'Zikry' },
            { branch: 'Klang (KLG)',             manager: 'Niki' },
            { branch: 'Bandar Rimbayu (RBY)',    manager: 'Nureen' },
            { branch: 'Setia Alam (SA)',         manager: 'Ain' },
            { branch: 'Shah Alam (SHA)',         manager: 'Irfan' },
            { branch: 'Subang Taipan (ST)',      manager: 'Qistina' },
            { branch: 'Sungai Buloh (SBY)',      manager: 'TBA' },
          ]
        },
        {
          name: 'Ms. Kirtikha', role: 'Regional Manager (Region B)', emoji: '👩‍💼', color: '#aa4bf4',
          branches: [
            { branch: 'Ampang (AMP)',                  manager: 'Zahid' },
            { branch: 'Bandar Tun Hussein Onn (BTHO)', manager: 'TBA' },
            { branch: 'Danau Kota (DK)',               manager: 'Kirtikha' },
            { branch: 'Desa Sri Hartamas (DSH)',       manager: 'TBA' },
            { branch: 'Kajang TTDI Grove (KTG)',       manager: 'Alif' },
            { branch: 'Kota Damansara (KD)',           manager: 'Suraj' },
            { branch: 'Selayang (SLY)',                manager: 'TBA' },
            { branch: 'Sri Petaling (SP)',             manager: 'Janani' },
            { branch: 'Taman Sri Gombak (TSG)',        manager: 'Ezry' },
          ]
        },
        {
          name: 'Ms. Manjeet', role: 'Regional Manager (Region C)', emoji: '👩‍💼', color: '#c668ff',
          branches: [
            { branch: 'Bandar Baru Bangi (BBB)',      manager: 'Kishantini' },
            { branch: 'Bandar Seri Putra (BSP)',      manager: 'Izzeti' },
            { branch: 'Cyberjaya (CJY)',              manager: 'Hannah' },
            { branch: 'Dataran Puchong Utama (DP)',   manager: 'TBA' },
            { branch: 'Kota Warisan (KW)',            manager: 'Laila' },
            { branch: 'Putrajaya (PJY)',              manager: 'Rafiq' },
            { branch: 'Senawang Taipan (SNT)',        manager: 'TBA' },
            { branch: 'Seremban (SBN)',               manager: 'TBA' },
            { branch: 'Online (ONL)',                 manager: 'Ummu' },
          ]
        },
      ]
    }]
  },
  optimisation: {
    name: 'Optimisation',
    hods: [{
      name: 'Mr. Iqbal', role: 'Head of Optimisation', emoji: '👨‍💻', color: '#2a5fd4',
      greeting: "Welcome to Optimisation! We make everything run faster, smarter, and better. Excited to have you on board!",
      executives: [
        { name: 'Mr. Adam', role: 'Executive', emoji: '👨‍💼', color: '#3a6fe4', greeting: "Hey! I'm Adam from Optimisation. Let's make things better together!" },
        { name: 'Ms. Ying Chen', role: 'Executive', emoji: '👩‍💼', color: '#5a8ff4', greeting: "Hi! I'm Ying Chen, part of the Optimisation team. Great to have you here!" },
      ]
    }]
  }
};

const DEPT_ORDER = ['design', 'finance', 'hr', 'marketing', 'ops', 'optimisation'];
// All department tiles share the same border colour for a calmer, more
// uniform look. Plum palette: soft-lavender rim on a deep-plum interior.
const DEPT_BORDER = '#D4A8D4';   /* --soft-lavender */
const DEPT_BG     = '#1A0B1F';   /* --deep-plum (matches page bg) */
// Per-person circle background — light chocolate/tan, used for every HOD,
// executive, regional manager, branch manager and the CEO spotlight.
const PERSON_BG   = '#B89576';
const DEPT_VISUALS = {
  design:       { emoji: '🎓', color: DEPT_BORDER },
  finance:      { emoji: '📊', color: DEPT_BORDER },
  hr:           { emoji: '🧠', color: DEPT_BORDER },
  marketing:    { emoji: '📣', color: DEPT_BORDER },
  ops:          { emoji: '⚙️', color: DEPT_BORDER },
  optimisation: { emoji: '💻', color: DEPT_BORDER },
};

/* ── AVATAR SVG ── */
function makeSVGAvatar(size, gender) {
  const s = size, cx = s / 2;
  const headR = s * 0.18, headCY = s * 0.30;
  const bodyRx = s * 0.26, bodyRy = s * 0.22, bodyCY = s * 0.76;
  const hairPath = gender === 'female'
    ? `M${cx - headR * 1.08},${headCY + headR * 0.1}Q${cx - headR * 1.15},${headCY - headR * 1.7} ${cx},${headCY - headR * 1.3}Q${cx + headR * 1.15},${headCY - headR * 1.7} ${cx + headR * 1.08},${headCY + headR * 0.1}Z`
    : `M${cx - headR * 1.02},${headCY + headR * 0.05}Q${cx - headR * 1.06},${headCY - headR * 1.48} ${cx},${headCY - headR * 1.22}Q${cx + headR * 1.06},${headCY - headR * 1.48} ${cx + headR * 1.02},${headCY + headR * 0.05}Z`;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block', overflow: 'visible' }}>
      <path d={hairPath} fill="rgba(255,255,255,0.22)" />
      <circle cx={cx} cy={headCY} r={headR} fill="rgba(255,255,255,0.92)" />
      <ellipse cx={cx} cy={bodyCY} rx={bodyRx} ry={bodyRy} fill="rgba(255,255,255,0.80)" />
    </svg>
  );
}

/* ── PERSON NODE ── */
const SIZE_PX = { hod: 88, exec: 70, arm: 56, bm: 44 };
const NODE_DIMS = {
  hod:  { wrap: 'w-[110px] h-[110px]', bg: 'w-[96px] h-[96px]', name: 'text-base', role: 'text-xs' },
  exec: { wrap: 'w-[90px] h-[90px]',   bg: 'w-[80px] h-[80px]', name: 'text-sm',  role: 'text-[0.68rem]' },
  arm:  { wrap: 'w-[78px] h-[78px]',   bg: 'w-[68px] h-[68px]', name: 'text-sm',  role: 'text-[0.63rem]' },
  bm:   { wrap: 'w-[72px] h-[72px]',   bg: 'w-[64px] h-[64px]', name: 'text-xs',  role: 'text-[0.58rem]' },
};

function PersonNode({ size = 'exec', data, onClick }) {
  const dims = NODE_DIMS[size];
  const px = SIZE_PX[size];
  const figureSize = size === 'hod' ? 'text-[3.4rem]' : size === 'exec' ? 'text-[2.6rem]' : size === 'arm' ? 'text-[2.2rem]' : 'text-[2rem]';
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="flex flex-col items-center gap-1 cursor-pointer group">
      <div className={`relative ${dims.wrap} flex items-end justify-center`}>
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${dims.bg} rounded-full transition-shadow group-hover:shadow-[0_0_36px_rgba(255,255,255,0.25)]`}
             style={{ background: PERSON_BG, boxShadow: `0 0 24px rgba(184,149,118,0.35)` }} />
        {data.useAvatar ? (
          <div className="relative z-[2] -mb-1.5">{makeSVGAvatar(px, data.gender || 'male')}</div>
        ) : (
          <div className={`relative z-[2] ${figureSize} leading-none -mb-1`}
               style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
            {data.emoji}
          </div>
        )}
      </div>
      <div className={`font-extrabold text-eb-milk text-center ${dims.name}`}>{data.name}</div>
      <div className={`text-eb-soft-lavender font-bold text-center ${dims.role}`}>{data.role}</div>
    </button>
  );
}

function BMNode({ branch, manager, color, onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="flex flex-col items-center gap-1 cursor-pointer p-1 group">
      <div className="relative w-[72px] h-[72px] flex items-end justify-center">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[64px] h-[64px] rounded-full transition-shadow group-hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
             style={{ background: PERSON_BG, boxShadow: `0 0 12px rgba(184,149,118,0.3)` }} />
        <div className="relative z-[2] text-[2rem] leading-none -mb-0.5"
             style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>👤</div>
      </div>
      <div className="font-extrabold text-eb-milk text-xs text-center max-w-[88px]">{manager}</div>
      <div className="text-[0.58rem] text-eb-soft-lavender font-bold text-center max-w-[88px] leading-snug">{branch}</div>
    </button>
  );
}

/* ── EXPANDABLE SECTION ── */
function ExpandableSection({ open, children }) {
  return (
    <div className={`overflow-hidden transition-[max-height] duration-500 ease w-full flex flex-col items-center ${open ? 'max-h-[9000px]' : 'max-h-0'}`}>
      {children}
    </div>
  );
}

function ExpandButton({ open, onClick, color = 'red' }) {
  const colorCls = color === 'blue'
    ? 'border-[#444] hover:bg-[#2a5fd4] hover:border-[#5a8ff4]'
    : 'border-[#555] hover:bg-eb-red hover:border-eb-red-bright';
  const openCls = color === 'blue' ? 'bg-[#2a5fd4] border-[#5a8ff4]' : 'bg-eb-red border-eb-red-bright';
  const sz = color === 'blue' ? 'w-6 h-6 text-[0.6rem]' : 'w-7 h-7 text-[0.7rem]';
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`mt-2 ${sz} rounded-full bg-eb-surface-3 text-white/60 cursor-pointer flex items-center justify-center transition-all border-eb-border-1 ${colorCls} ${open ? `${openCls} text-white rotate-180` : ''}`}>
      ▼
    </button>
  );
}

/* ── HOD SECTIONS ── */
function StandardHOD({ hod, onPersonClick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center">
      <PersonNode size="hod" data={hod} onClick={() => onPersonClick(hod)} />
      {hod.executives && hod.executives.length > 0 && (
        <>
          <ExpandButton open={open} onClick={() => setOpen(o => !o)} />
          <ExpandableSection open={open}>
            <div className="w-0.5 h-4 bg-eb-soft-lavender mx-auto" />
            <div className="font-pixel text-[0.45rem] text-eb-soft-lavender my-2 tracking-widest">— EXECUTIVES —</div>
            <div className="flex justify-center gap-8 flex-wrap px-4">
              {hod.executives.map(ex => (
                <PersonNode key={ex.name} size="exec" data={ex} onClick={() => onPersonClick(ex)} />
              ))}
            </div>
          </ExpandableSection>
        </>
      )}
    </div>
  );
}

function OpsHOD({ hod, onPersonClick }) {
  const [hodOpen, setHodOpen] = useState(false);
  return (
    <div className="flex flex-col items-center w-full">
      <PersonNode size="hod" data={hod} onClick={() => onPersonClick(hod)} />
      <ExpandButton open={hodOpen} onClick={() => setHodOpen(o => !o)} />
      <ExpandableSection open={hodOpen}>
        {/* Single trunk down from HOD, then a horizontal bar splitting into two sub-branches. */}
        <div className="w-0.5 h-4 bg-eb-soft-lavender mx-auto" />
        <div className="hidden md:block h-0.5 bg-eb-soft-lavender mx-auto" style={{ width: '60%' }} />

        {/* Two sub-branches side by side: Branch Operations (LEFT) | HQ Operations (RIGHT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-2 mt-2">
          {/* LEFT — Branch Operations */}
          <div className="flex flex-col items-center">
            <div className="font-pixel text-[0.55rem] text-eb-soft-lavender mb-3 tracking-widest">▸ BRANCH OPERATIONS</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {hod.regionalManagers.map(rm => (
                <RegionalManagerCard key={rm.name} rm={rm} onPersonClick={onPersonClick} />
              ))}
            </div>
          </div>

          {/* RIGHT — HQ Operations */}
          {hod.executives && hod.executives.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="font-pixel text-[0.55rem] text-eb-soft-lavender mb-3 tracking-widest">▸ HQ OPERATIONS</div>
              <div className="flex justify-center gap-6 flex-wrap pt-2">
                {hod.executives.map(ex => (
                  <PersonNode key={ex.name} size="exec" data={ex} onClick={() => onPersonClick(ex)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>
    </div>
  );
}

function RegionalManagerCard({ rm, onPersonClick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center">
      <PersonNode size="exec" data={rm} onClick={() => onPersonClick(rm, `Welcome! I'm ${rm.name}, ${rm.role}.`)} />
      <ExpandButton open={open} onClick={() => setOpen(o => !o)} color="blue" />
      <ExpandableSection open={open}>
        <div className="w-0.5 h-4 bg-eb-soft-lavender mx-auto" />
        <div className="font-pixel text-[0.45rem] text-eb-soft-lavender my-2 tracking-widest">— BRANCHES —</div>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {rm.branches.map(b => (
            <BMNode key={b.branch} branch={b.branch} manager={b.manager} color={rm.color}
              onClick={() => onPersonClick(
                { name: b.manager, role: `Branch Manager — ${b.branch}`, emoji: '👤', color: rm.color },
                `Hi! I'm ${b.manager}, Branch Manager of ${b.branch}. Welcome to ebright!`
              )}
            />
          ))}
        </div>
      </ExpandableSection>
    </div>
  );
}

/* ── PERSON MODAL ── */
function PersonModal({ data, greeting, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [playLabel, setPlayLabel] = useState(`Play ${data?.name?.split(' ')[0] || ''}'s Introduction`);
  const playRef = useRef(null);

  useEffect(() => {
    setPlaying(false); setPlayLabel(`Play ${data?.name?.split(' ')[0] || ''}'s Introduction`);
    return () => { if (playRef.current) clearTimeout(playRef.current); };
  }, [data]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false); if (playRef.current) clearTimeout(playRef.current);
    } else {
      setPlaying(true); setPlayLabel('Playing...');
      playRef.current = setTimeout(() => { setPlaying(false); setPlayLabel('✓ Done — play again?'); }, 5000);
    }
  };

  if (!data) return null;
  const bg = PERSON_BG;

  return (
    <div className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 fade-up"
         onClick={onClose}>
      <button onClick={onClose} className="fixed top-4 right-5 w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white text-base flex items-center justify-center z-10">×</button>
      <div className="w-full max-w-md flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-[320px] h-[320px] flex items-end justify-center">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full"
               style={{ background: bg, boxShadow: `0 0 60px ${bg}55` }} />
          {data.useAvatar ? (
            <div className="relative z-[2] -mb-2.5">{makeSVGAvatar(220, data.gender || 'male')}</div>
          ) : (
            <div className="relative z-[2] text-[9.5rem] leading-none -mb-2.5 select-none"
                 style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}>
              {data.emoji || '👤'}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <button onClick={togglePlay}
            className="w-[52px] h-[52px] rounded-full bg-eb-red border-none flex items-center justify-center text-xl text-white cursor-pointer shadow-[0_0_28px_rgba(212,43,43,0.55),0_4px_0_var(--red-dark)] hover:scale-110 transition-transform">
            {playing ? '⏸' : '▶'}
          </button>
          <div className="text-[0.65rem] text-white/40 font-bold">{playLabel}</div>
        </div>
        {playing && (
          <div className="flex items-center gap-1.5 text-xs text-eb-yellow font-bold">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-eb-yellow animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-eb-yellow animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-eb-yellow animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            Now playing...
          </div>
        )}
        <div className="font-extrabold text-xl text-white text-center">{data.name}</div>
        <div className="text-xs text-white/40 font-bold uppercase tracking-wider text-center -mt-2">{data.role} · ebright</div>
        <div className="italic text-sm text-white/70 font-semibold text-center bg-eb-red/[0.07] border-l-[3px] border-eb-red rounded-r-lg p-3 px-4 leading-relaxed w-full">
          "{greeting || data.greeting || 'Hello!'}"
        </div>
      </div>
    </div>
  );
}

/* ── OVERALL ORG CHART (flat tree view) ── */
function OverallOrgChart() {
  return (
    <div className="w-full overflow-x-auto py-8 px-6 fade-up">
      <div className="min-w-[700px]">
        {/* CEO */}
        <div className="flex justify-center">
          <div className="bg-eb-almond-oil border-2 border-eb-light-plum rounded-2xl px-10 py-4 text-center min-w-[200px] shadow-[0_0_28px_rgba(212,168,212,0.30)]">
            <span className="text-4xl block">👨‍💼</span>
            <span className="font-pixel text-[0.45rem] bg-eb-plum text-eb-milk px-1.5 py-0.5 rounded inline-block mt-1">CEO</span>
            <div className="font-black text-base text-eb-ink mt-1">Mr. Kevin</div>
            <div className="text-[0.6rem] text-white/40 font-bold mt-1">Chief Executive Officer</div>
          </div>
        </div>
        <div className="w-0.5 h-6 bg-eb-soft-lavender mx-auto" />
        <div className="h-0.5 bg-eb-soft-lavender" />
        <div className="flex w-full justify-around items-start">
          {DEPT_ORDER.map(key => {
            const d = DEPT[key], v = DEPT_VISUALS[key];
            return (
              <div key={key} className="flex flex-col items-center min-w-0 px-1"
                   style={{ flex: key === 'ops' ? 2.2 : 1 }}>
                <div className="w-0.5 h-5 bg-eb-soft-lavender mx-auto" />
                <div className="rounded-xl p-3 text-center w-[90%] border-2 bg-eb-almond-oil"
                     style={{ borderColor: DEPT_BORDER }}>
                  <span className="text-2xl block">{v.emoji}</span>
                  <div className="font-extrabold text-[0.68rem] text-eb-ink leading-snug mt-1">{d.name}</div>
                </div>
                <div className="w-full flex flex-col items-center mt-1">
                  {d.hods.map(h => {
                    const directReports = [
                      ...(h.executives || []),
                      ...(key === 'ops' ? (h.regionalManagers || []) : []),
                    ];
                    return (
                      <div key={h.name} className="w-full">
                        {/* HOD */}
                        <div className="w-0.5 h-4 bg-eb-soft-lavender mx-auto" />
                        <div className="bg-eb-almond-oil border border-eb-soft-lavender rounded-lg p-1.5 px-2 text-center w-[90%] mx-auto mb-1">
                          <span className="text-base">{h.emoji || '👤'}</span>
                          <div className="font-extrabold text-[0.7rem] text-eb-ink">{h.name}</div>
                          <div className="text-[0.55rem] text-eb-ink-soft font-bold leading-snug">{h.role}</div>
                        </div>

                        {/* Direct reports — rendered side-by-side under the HOD */}
                        {directReports.length > 0 && (
                          <>
                            <div className="w-0.5 h-3 bg-eb-soft-lavender mx-auto" />
                            {directReports.length > 1 && (
                              <div className="h-0.5 bg-eb-soft-lavender mx-auto" style={{ width: '75%' }} />
                            )}
                            <div className="flex justify-center items-stretch gap-1 px-1 mt-0">
                              {directReports.map(p => (
                                <div key={p.name} className="flex flex-col items-center min-w-0" style={{ flex: '1 1 0' }}>
                                  <div className="w-0.5 h-2 bg-eb-soft-lavender" />
                                  <div className="bg-eb-almond-oil border border-eb-soft-lavender rounded-lg p-1 px-0.5 text-center w-full flex-1 flex flex-col justify-start">
                                    <span className="text-xs">{p.emoji || '👤'}</span>
                                    <div className="font-extrabold text-[0.55rem] text-eb-ink leading-tight">{p.name}</div>
                                    <div className="text-[0.42rem] text-eb-ink-soft font-bold leading-snug">{p.role}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {key === 'ops' && (
                          <div className="bg-eb-almond-oil border border-dashed border-eb-soft-lavender rounded-md py-1 px-2 text-[0.55rem] text-eb-ink font-bold text-center w-[90%] mx-auto mt-1">
                            + 20 Branch Managers
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── REQUIRED PEOPLE: every HOD + every executive across all depts ── */
function collectRequiredPeople() {
  const names = new Set();
  DEPT_ORDER.forEach((key) => {
    DEPT[key].hods.forEach((h) => {
      names.add(h.name);
      (h.executives || []).forEach((e) => names.add(e.name));
    });
  });
  return Array.from(names);
}

/* ── MAIN PAGE ── */
export default function Page5OrgChart() {
  const [orgChartOpen, setOrgChartOpen] = useState(false);
  const [deptRevealed, setDeptRevealed] = useState(false);
  const [activeDept, setActiveDept] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalGreeting, setModalGreeting] = useState(null);
  const [ripples, setRipples] = useState([]);
  const [reviewed, setReviewed] = useState(() => new Set());

  const requiredPeople = useMemo(() => collectRequiredPeople(), []);
  const requiredSet = useMemo(() => new Set(requiredPeople), [requiredPeople]);
  const reviewedRequired = requiredPeople.filter((n) => reviewed.has(n)).length;
  const allReviewed = reviewedRequired === requiredPeople.length;

  useLockGate(allReviewed, `Meet all ${requiredPeople.length} HODs & executives to unlock (${reviewedRequired}/${requiredPeople.length})`);

  const preziRef = useRef(null);
  const hodSectionRef = useRef(null);

  const pageSubtext = orgChartOpen
    ? 'Full overall org chart shown above.'
    : !deptRevealed
      ? 'Click the CEO to meet the whole team 👇'
      : activeDept
        ? `${DEPT[activeDept].name} — tap a person to meet them!`
        : 'Click any department below to meet the Head of Department.';

  const openModal = (data, greetingOverride) => {
    setModalData(data);
    setModalGreeting(greetingOverride || null);
    if (data?.name && requiredSet.has(data.name)) {
      setReviewed((prev) => {
        if (prev.has(data.name)) return prev;
        const next = new Set(prev);
        next.add(data.name);
        return next;
      });
    }
  };

  const closeModal = () => { setModalData(null); setModalGreeting(null); };

  const spawnRipple = (x, y) => {
    const id = Math.random();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 800);
  };

  const handleCeoClick = (e) => {
    if (deptRevealed) {
      openModal({
        name: 'Mr. Kevin', role: 'Chief Executive Officer', emoji: '👨‍💼', color: '#f5c518',
        greeting: 'Welcome to ebright! I am so proud of what this family has built. You are now part of something truly special.'
      });
      return;
    }
    setDeptRevealed(true);
    const cx = e.clientX, cy = e.clientY;
    spawnRipple(cx, cy);
    setTimeout(() => spawnRipple(cx, cy), 200);
    setTimeout(() => spawnRipple(cx, cy), 420);
    setTimeout(() => preziRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  const drillInto = (key) => {
    setActiveDept(key);
    setTimeout(() => hodSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const backToOverview = () => {
    setActiveDept(null);
    setTimeout(() => preziRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const toggleOrg = () => {
    setOrgChartOpen(v => !v);
  };

  return (
    <section className="min-h-page bg-eb-walnut-gradient flex flex-col items-center pb-12 w-full">
      <style>{`
        @keyframes pulseRing { 0%{transform:scale(.85);opacity:.7} 100%{transform:scale(1.5);opacity:0} }
        @keyframes hintBlink { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes hintBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
        @keyframes zoomRipple { 0%{transform:scale(0);opacity:.7} 100%{transform:scale(8);opacity:0} }
      `}</style>

      {/* HEADER */}
      <div className="w-full px-8 py-6 text-center">
        <h2 className="pixel-title text-lg md:text-2xl mb-2">GET TO KNOW<br/>THE TEAM BETTER!</h2>
        <button onClick={toggleOrg}
          className="font-pixel text-[0.52rem] text-eb-milk hover:text-eb-soft-lavender underline underline-offset-4"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
          {orgChartOpen ? '✕ HIDE ORG CHART' : '🗂 VIEW OVERALL ORG CHART'}
        </button>
        <p className="text-sm text-eb-milk font-bold mt-3" style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>{pageSubtext}</p>

        {/* Review progress badge — gates the next button */}
        <div className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full border-eb-border-1 font-pixel text-[0.55rem] tracking-widest ${
          allReviewed
            ? 'border-eb-green text-eb-green bg-eb-green/10'
            : 'border-eb-yellow text-eb-yellow bg-eb-yellow/10'
        }`}>
          {allReviewed ? '✓ ALL TEAM MEMBERS REVIEWED' : `▸ MEET EVERYONE · ${reviewedRequired}/${requiredPeople.length}`}
        </div>
      </div>

      {/* OVERALL ORG CHART */}
      {orgChartOpen && <OverallOrgChart />}

      {/* CEO + PREZI STAGE */}
      {!orgChartOpen && (
        <>
          {/* CEO */}
          <div className="flex flex-col items-center pt-2">
            <button onClick={handleCeoClick}
              className="flex flex-col items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                {[0, 0.75, 1.5].map((delay, i) => (
                  <div key={i}
                    className="absolute -inset-3.5 rounded-full border-2 border-eb-soft-lavender"
                    style={{ animation: `pulseRing 2.2s ease-out infinite ${delay}s`, opacity: 0 }}/>
                ))}
                <div className="relative w-[140px] h-[140px] rounded-full border-4 border-eb-soft-lavender flex items-center justify-center text-7xl group-hover:scale-105 transition-transform"
                     style={{
                       background: 'radial-gradient(circle at 40% 35%, #4E2B48, #1A0B1F)',
                       boxShadow: '0 0 60px rgba(212,168,212,0.35)',
                     }}>
                  👨‍💼
                  <div className="absolute top-2.5 right-2.5 bg-eb-yellow text-black font-pixel text-[0.38rem] font-black px-1.5 py-1 rounded">CEO</div>
                </div>
              </div>
              <div className="font-black text-lg text-eb-milk">Mr. Kevin</div>
              <div className="text-[0.72rem] text-eb-soft-lavender font-bold">Chief Executive Officer</div>
            </button>
            {!deptRevealed && (
              <div className="flex items-center gap-2 bg-eb-yellow/10 border border-eb-yellow/30 rounded-full px-4 py-1.5 text-xs font-extrabold text-eb-yellow mt-2"
                   style={{ animation: 'hintBlink 2s ease-in-out infinite' }}>
                <span style={{ animation: 'hintBounce 1.2s ease-in-out infinite' }}>👇</span>
                Click to meet the team
              </div>
            )}
          </div>

          {/* PREZI STAGE */}
          {deptRevealed && (
            <div ref={preziRef} className="w-full flex flex-col items-center pt-6">
              <div className="w-0.5 h-9 bg-eb-soft-lavender mx-auto"
                   style={{ transition: 'height 0.5s ease' }}/>
              <div className="h-4" />
              <div className="w-full max-w-5xl px-4">
                <div className="relative flex justify-center items-start gap-3 flex-wrap py-2">
                  <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-[calc(100%-140px)] max-w-[880px] h-0.5 bg-eb-soft-lavender hidden md:block" />
                  {DEPT_ORDER.map((key, i) => {
                    const d = DEPT[key], v = DEPT_VISUALS[key];
                    return (
                      <button key={key} onClick={() => drillInto(key)}
                        className="flex flex-col items-center gap-1 cursor-pointer relative z-10 group"
                        style={{
                          opacity: 0,
                          transform: 'scale(0.3) translateY(60px) rotateZ(-4deg)',
                          animation: `preziIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.25 + i * 0.12}s forwards`,
                        }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-eb-soft-lavender z-0 hidden md:block" />
                        <div className="rounded-full w-[88px] h-[88px] flex flex-col items-center justify-center mt-4 border-[3px] relative overflow-hidden transition group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
                             style={{
                               borderColor: DEPT_BORDER,
                               background: DEPT_BG,
                             }}>
                          <span className="text-[2rem] leading-none">{v.emoji}</span>
                        </div>
                        <div className="font-pixel text-[0.55rem] text-eb-milk text-center leading-snug max-w-[90px] mt-1">{d.name}</div>
                        <div className="text-[0.4rem] text-eb-soft-lavender font-bold">Tap →</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <style>{`
                @keyframes preziIn {
                  to { opacity: 1; transform: scale(1) translateY(0) rotateZ(0deg); }
                }
              `}</style>

              {/* HOD SECTION */}
              {activeDept && (
                <div ref={hodSectionRef} className="w-full flex flex-col items-center fade-up">
                  <div className="w-0.5 h-8 bg-eb-soft-lavender mx-auto mt-2" />
                  <div className="px-8 py-2 flex items-center gap-2 text-xs font-bold text-white/35 w-full max-w-5xl">
                    <button onClick={backToOverview}
                      className="bg-eb-surface-3 border border-eb-border-3 hover:border-eb-yellow text-white/60 hover:text-white text-xs font-extrabold px-3 py-1 rounded-full">
                      ← All Depts
                    </button>
                    <span className="text-white/20">›</span>
                    <span className="text-eb-yellow">{DEPT[activeDept].name}</span>
                  </div>
                  <div className="font-pixel text-[0.65rem] text-eb-soft-lavender tracking-widest mb-6 text-center">
                    — {DEPT[activeDept].name.toUpperCase()}
                  </div>
                  <div className="flex justify-center gap-10 flex-wrap px-4 w-full">
                    {DEPT[activeDept].hods.map(hod =>
                      activeDept === 'ops'
                        ? <OpsHOD key={hod.name} hod={hod} onPersonClick={openModal} />
                        : <StandardHOD key={hod.name} hod={hod} onPersonClick={openModal} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* RIPPLES */}
      {ripples.map(r => (
        <div key={r.id} className="fixed z-[300] w-[120px] h-[120px] rounded-full border-[3px] border-eb-yellow pointer-events-none"
             style={{
               left: r.x - 60, top: r.y - 60,
               animation: 'zoomRipple 0.7s ease-out forwards',
             }}/>
      ))}

      {/* MODAL */}
      {modalData && <PersonModal data={modalData} greeting={modalGreeting} onClose={closeModal} />}
    </section>
  );
}
