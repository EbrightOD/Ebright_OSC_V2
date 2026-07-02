import Mascot from '../../shared/Mascot';

const CHANNELS = [
  { id: 'parent',  icon: '👨‍👩‍👧', title: 'Parents',
    desc: 'Lead with their child\'s progress. Always specific, never generic.',
    examples: [
      '"Aiman improved on Trinity GESE Stage 2 — fluency went from 3 to 4 this term."',
      '"Let\'s set up a 10-min call so I can walk you through the next steps."',
    ] },
  { id: 'student', icon: '🎓', title: 'Students',
    desc: 'Encouraging tone. Listen first, correct gently, celebrate small wins.',
    examples: [
      '"Great try! Let\'s say that again, this time louder."',
      '"What part felt tricky? We\'ll work on it together."',
    ] },
  { id: 'walkin',  icon: '🚪', title: 'Walk-ins / New Inquiries',
    desc: 'Warm welcome → understand the child → recommend the right program.',
    examples: [
      '"Welcome! May I know your child\'s age and what level of English they\'re at?"',
      '"Based on what you\'ve shared, our GESE 3 class would be a great fit."',
    ] },
];

const PRINCIPLES = [
  { icon: '👂', title: 'Listen first',          body: 'Hear the parent or student fully before you respond. Diagnose before prescribing.' },
  { icon: '🎯', title: 'Be specific',           body: 'Use real examples — class observations, GESE grades, attendance — not generic praise.' },
  { icon: '🔒', title: 'Keep it private',       body: 'Confidential feedback is shared 1:1, never in group chats or public posts.' },
  { icon: '➡️', title: 'Always offer next step',body: 'Every conversation ends with a clear action: a call, a class, a follow-up date.' },
  { icon: '✋', title: 'Escalate when unsure',  body: 'If a parent is upset or a request is outside your scope — loop in your Branch Manager.' },
  { icon: '😊', title: 'ebright voice',         body: 'Warm, professional, hopeful. We never blame the child or the parent.' },
];

const DOS_DONTS = {
  dos: [
    'Greet by name within the first 10 seconds.',
    'Acknowledge concerns before defending.',
    'Restate the issue in your own words to confirm understanding.',
    'Document the conversation in ClickUp the same day.',
  ],
  donts: [
    'Don\'t make promises about exam scores.',
    'Don\'t criticise other branches, tutors, or competitors.',
    'Don\'t share another student\'s details to make a point.',
    'Don\'t reply to an upset parent over WhatsApp — call them.',
  ],
};

export default function PageCommunication() {
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
          BASIC COMMUNICATION<br />WITH CUSTOMERS
        </h1>
        <p className="text-sm md:text-base text-eb-milk font-semibold text-center max-w-2xl">
          How we speak to parents, students, and walk-ins. Match the tone, mirror the examples — this is the ebright voice.
        </p>

        {/* Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-2">
          {CHANNELS.map((c) => (
            <div key={c.id} className="card-dark p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 pb-2 border-b border-eb-plum/30">
                <div className="text-3xl">{c.icon}</div>
                <h3 className="font-black text-sm md:text-base text-eb-plum">{c.title}</h3>
              </div>
              <p className="text-xs md:text-sm text-eb-ink-soft font-semibold">{c.desc}</p>
              <ul className="flex flex-col gap-2">
                {c.examples.map((ex, i) => (
                  <li key={i} className="text-xs italic text-eb-plum font-semibold border-l-2 border-eb-plum/60 pl-2 leading-snug">
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 6 Principles — each principle is its own Parchment card on the gradient */}
        <div className="w-full">
          <p className="font-pixel text-[0.6rem] text-eb-soft-lavender mb-3">▸ THE 6 PRINCIPLES</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="card-dark p-3 flex items-start gap-3">
                <div className="text-2xl shrink-0">{p.icon}</div>
                <div>
                  <div className="font-black text-sm text-eb-plum">{p.title}</div>
                  <p className="text-[0.7rem] text-eb-ink-soft font-semibold mt-1 leading-snug">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Do / Don't */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="card-dark p-4" style={{ borderColor: 'var(--green)' }}>
            <p className="font-pixel text-[0.6rem] text-eb-green mb-3">✓ DO</p>
            <ul className="space-y-2">
              {DOS_DONTS.dos.map((d, i) => (
                <li key={i} className="flex gap-2 text-xs md:text-sm text-eb-ink font-semibold leading-snug">
                  <span className="text-eb-green shrink-0">✓</span><span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-dark p-4" style={{ borderColor: 'var(--milan-red, #CB1B03)' }}>
            <p className="font-pixel text-[0.6rem] text-eb-ebright-red mb-3">✗ DON'T</p>
            <ul className="space-y-2">
              {DOS_DONTS.donts.map((d, i) => (
                <li key={i} className="flex gap-2 text-xs md:text-sm text-eb-ink font-semibold leading-snug">
                  <span className="text-eb-ebright-red shrink-0">✗</span><span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card-dark px-6 py-4 mt-1 w-full max-w-3xl">
          <p className="font-pixel text-[0.6rem] text-eb-plum mb-2">⚡ WHAT'S NEXT</p>
          <p className="text-sm text-eb-ink font-semibold">
            In the next section, you'll watch an <span className="text-eb-plum font-extrabold">example video</span> of an ebright tutor introducing themselves to a parent — then record your own version mirroring the same tone.
          </p>
        </div>
      </div>

      <Mascot message="The ebright voice is warm, specific, and forward-looking. Listen first, give a real example, end with a clear next step. Never criticise the child or another branch." />
    </section>
  );
}
