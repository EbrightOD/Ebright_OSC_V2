import Mascot from '../../shared/Mascot';

const LEVELS = [
  { code: 'GESE 1', label: 'Initial Stage',         age: '6–7 yrs',   focus: 'Greetings, colours, numbers, basic Q&A.' },
  { code: 'GESE 2', label: 'Initial Stage',         age: '7–8 yrs',   focus: 'Family, school, hobbies, simple stories.' },
  { code: 'GESE 3', label: 'Initial Stage',         age: '8–10 yrs',  focus: 'Daily routines, opinions, picture talk.' },
  { code: 'GESE 4', label: 'Elementary Stage',      age: '10–12 yrs', focus: 'Future plans, comparisons, narratives.' },
  { code: 'GESE 5', label: 'Elementary Stage',      age: '11–13 yrs', focus: 'Topic talk, structured discussion.' },
  { code: 'GESE 6', label: 'Intermediate Stage',    age: '12–14 yrs', focus: 'Listening tasks, opinion exchange.' },
  { code: 'GESE 7', label: 'Intermediate Stage',    age: '13–15 yrs', focus: 'Hypothetical situations, debate.' },
  { code: 'GESE 8', label: 'Intermediate Stage',    age: '14–16 yrs', focus: 'Abstract topics, fluency.' },
  { code: 'GESE 9', label: 'Advanced Stage',        age: '15+ yrs',   focus: 'Discourse management, complex topics.' },
];

const CLASS_KIT = [
  { id: 'whiteboard', icon: '📋', name: 'Whiteboard',          purpose: 'For drilling vocabulary & writing prompts' },
  { id: 'markers',    icon: '🖊',  name: 'Whiteboard Markers',  purpose: 'Black, blue, red — always have spares' },
  { id: 'flashcards', icon: '🃏', name: 'Flashcards',          purpose: 'Vocabulary drilling for younger learners' },
  { id: 'workbook',   icon: '📒', name: 'Student Workbook',    purpose: 'Per level — distributed in lesson 1' },
  { id: 'speaker',    icon: '🔊', name: 'Speaker',             purpose: 'For listening tasks & GESE recordings' },
  { id: 'timer',      icon: '⏱',  name: 'Timer',               purpose: 'Used during exam practice rounds' },
];

export default function PageSyllabus() {
  return (
    <section className="relative min-h-page px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center gap-5">
        <div
          className="px-4 py-2 font-pixel text-eb-white text-sm"
          style={{
            background: '#d42b2b',
            boxShadow: '0 4px 0 #991f1f',
            clipPath: 'polygon(0 0,95% 0,100% 18%,100% 100%,5% 100%,0 82%)',
          }}
        >
          DAY 1
        </div>
        <p className="pixel-eyebrow text-xs">▸ TRAINING</p>
        <h1 className="pixel-title text-2xl md:text-4xl text-center">
          ACADEMIC SYLLABUS
        </h1>
        <p className="text-sm md:text-base text-eb-milk font-semibold text-center max-w-2xl">
          ebright follows the Trinity GESE syllabus — 9 graded levels of spoken English. Each lesson runs on a standard classroom kit.
        </p>

        {/* Section: Trinity GESE levels — section title on the gradient,
            each level is its own Parchment card. */}
        <div className="w-full">
          <p className="font-pixel text-[0.6rem] text-eb-soft-lavender mb-3">▸ TRINITY GESE LEVELS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LEVELS.map((l) => (
              <div key={l.code} className="card-dark p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-pixel text-[0.55rem] text-eb-plum">{l.code}</span>
                  <span className="text-[0.6rem] text-eb-ink-soft font-bold uppercase tracking-wider">{l.age}</span>
                </div>
                <div className="font-black text-sm text-eb-plum">{l.label}</div>
                <p className="text-[0.7rem] text-eb-ink-soft font-semibold mt-1 leading-snug">{l.focus}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Standard classroom kit */}
        <div className="w-full">
          <p className="font-pixel text-[0.6rem] text-eb-soft-lavender mb-3">▸ STANDARD CLASSROOM KIT</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CLASS_KIT.map((it) => (
              <div key={it.id} className="card-dark p-3 flex items-start gap-3">
                <div className="text-2xl shrink-0">{it.icon}</div>
                <div>
                  <div className="font-black text-sm text-eb-plum">{it.name}</div>
                  <p className="text-[0.7rem] text-eb-ink-soft font-semibold mt-1 leading-snug">{it.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-dark px-6 py-4 mt-1 w-full max-w-3xl">
          <p className="font-pixel text-[0.6rem] text-eb-plum mb-2">⚡ WHAT'S NEXT</p>
          <p className="text-sm text-eb-ink font-semibold">
            In the <span className="text-eb-plum font-extrabold">Find the Missing Item</span> game, you'll walk into a real classroom and photograph each kit item to drop it back into the scene.
          </p>
        </div>
      </div>

      <Mascot message="ebright runs the Trinity GESE syllabus across 9 levels. Memorise the standard classroom kit list — you'll need to find each item in a real classroom for the next mini-game." />
    </section>
  );
}

export { CLASS_KIT };
