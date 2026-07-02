import Mascot from '../../shared/Mascot';

const POLICIES = [
  { id: 'conduct',     icon: '🤝', title: 'Code of Conduct',
    points: [
      'Treat every student, parent and colleague with respect.',
      'No discrimination, harassment, or bullying — zero tolerance.',
      'Represent ebright professionally inside and outside the branch.',
    ] },
  { id: 'attendance',  icon: '⏰', title: 'Attendance & Punctuality',
    points: [
      'Be at your branch 15 minutes before your first class.',
      'Notify your manager at least 24 hours ahead if you cannot make a shift.',
      'Photo-attendance at the receptionist counter at 8:45 (Days 2 & 3 onwards).',
    ] },
  { id: 'dress',       icon: '👔', title: 'Dress Code',
    points: [
      'Wear the ebright polo / smart casual on teaching days.',
      'Closed-toe shoes; no slippers, sandals, or ripped denim.',
      'Hair tidy, accessories minimal — you are the role model in the classroom.',
    ] },
  { id: 'confidential',icon: '🔒', title: 'Confidentiality & Data Protection',
    points: [
      'Never share student photos, names or progress publicly.',
      'No screenshots of internal systems on personal devices.',
      'Parent feedback stays between Branch Manager and parent.',
    ] },
  { id: 'harassment',  icon: '🛑', title: 'Anti-Harassment & Safeguarding',
    points: [
      'Always teach with the classroom door open or visible.',
      'Never be alone with a single student in a closed room.',
      'Report any concern immediately to your Branch Manager or HR.',
    ] },
  { id: 'phones',      icon: '📵', title: 'Phone & Social Media',
    points: [
      'Phones on silent and away during class.',
      'No posting about ebright internals or students on personal accounts.',
      'Use only the official ebright social channels for branch content.',
    ] },
  { id: 'leave',       icon: '🌴', title: 'Leave Policy',
    points: [
      'Full-time staff: 12 casual / annual leave days per year.',
      'Submit leave requests via AOne at least 3 working days in advance.',
      'Medical leave requires an MC submitted within 48 hours.',
    ] },
  { id: 'performance', icon: '📈', title: 'Performance Standards',
    points: [
      'Hit your minimum teaching hours and class prep checklists weekly.',
      'Keep ClickUp updated within 24 hours of completing tasks.',
      'Termly review with your Branch Manager — feedback both ways.',
    ] },
];

export default function PagePolicy() {
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
          COMPANY POLICY<br />& COMPLIANCE
        </h1>
        <p className="text-sm md:text-base text-eb-milk font-semibold text-center max-w-2xl">
          The ground rules that keep ebright safe, fair, and professional. Read each policy carefully — the next mini-game will test you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-2">
          {POLICIES.map((p) => (
            <div key={p.id} className="card-dark p-4 md:p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3 pb-3 border-b border-eb-border-1">
                <div className="text-3xl">{p.icon}</div>
                <h3 className="font-black text-base md:text-lg text-white">{p.title}</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {p.points.map((pt, i) => (
                  <li key={i} className="flex gap-2 text-xs md:text-sm text-white/80 font-semibold leading-snug">
                    <span className="text-eb-yellow shrink-0">▸</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="card-dark px-6 py-4 mt-1 w-full max-w-3xl">
          <p className="font-pixel text-[0.6rem] text-eb-yellow mb-2">⚡ WHAT'S NEXT</p>
          <p className="text-sm text-white/80 font-semibold">
            The <span className="text-eb-red">Policy & Compliance Game</span> will quiz you on the rules above. You need 60% to pass.
          </p>
        </div>
      </div>

      <Mascot message="These policies aren't just paperwork — they protect you, your students, and the ebright family. Memorise the leave days, attendance rules, and confidentiality standards before the next quiz." />
    </section>
  );
}
