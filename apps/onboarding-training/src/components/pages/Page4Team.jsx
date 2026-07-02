const STATS = [
  { label: 'Team Since',    value: '2016',      desc: 'Building speakers since day one' },
  { label: 'Team Joiners',  value: '247+',      desc: 'And counting — including you!' },
  { label: 'Branches',      value: '20',        desc: 'Across Klang Valley' },
  { label: 'Departments',   value: '7',         desc: 'Working in sync' },
];

export default function Page4Team() {
  return (
    <section className="bg-eb-walnut-gradient p-8 md:p-12 fade-up min-h-page">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <p className="pixel-eyebrow text-[0.45rem]">▸ THE EBRIGHT TEAM</p>
          <h2 className="pixel-title text-2xl md:text-3xl mt-2"
              style={{ textShadow: '4px 4px 0 var(--red-dark), 8px 8px 0 rgba(0,0,0,.7)' }}>
            MEET YOUR<br/>NEW TEAM
          </h2>
          <p className="text-sm text-eb-soft-lavender font-semibold mt-2">A look at the team you're about to join.</p>
        </div>

        <div className="w-full bg-eb-almond-oil border border-eb-ink/15 rounded-xl min-h-[200px] flex items-center justify-center p-8 relative shadow-[0_12px_32px_rgba(0,0,0,0.40)]">
          <div className="font-pixel text-[0.4rem] text-eb-ink/40 border border-dashed border-eb-ink/25 px-4 py-2 rounded">
            [ TEAM PHOTO PLACEHOLDER ]
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map(s => (
            <div key={s.label} className="bg-eb-almond-oil border border-eb-ink/15 hover:border-eb-plum rounded-lg p-5 transition hover:-translate-y-1 shadow-[0_8px_22px_rgba(0,0,0,0.35)]">
              <div className="text-xs font-bold text-eb-ink-soft uppercase tracking-widest">{s.label}</div>
              <div className="font-pixel text-lg text-eb-plum my-2">{s.value}</div>
              <div className="text-sm text-eb-ink font-semibold">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
