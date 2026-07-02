import Mascot from './Mascot';

const DAY_COLORS = {
  1: { color: 'var(--ebright-red)' },
  2: { color: '#3a78c8' },
  3: { color: '#2db858' },
};

export default function TrainingSection({
  day,
  eyebrow = '▸ TRAINING',
  title,
  intro,
  bgVariant,           // accepted but ignored — see note below
  mascotMessage,
  children,
}) {
  // NOTE: bgVariant used to switch between purple/blue/green pixel skies.
  // The design system standardises on Deep Walnut on every page except the
  // Welcome screen, so all variants now resolve to the same warm bg. The
  // prop is kept for backwards compatibility.
  const cfg = DAY_COLORS[day] || DAY_COLORS[1];

  return (
    <section className="relative min-h-page px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">
      {/* Soft vignette — subtle plum darkening at the edges so the centred
          content feels lifted. Body gradient shows through everywhere else. */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(212,168,212,0.06) 0%, rgba(26,11,31,0.35) 75%)' }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center gap-5">
        <div
          className="px-4 py-2 font-extrabold text-eb-chalk text-sm rounded-md tracking-wider"
          style={{
            background: cfg.color,
            boxShadow: `0 1px 4px rgba(0,0,0,0.35)`,
          }}
        >
          DAY {day}
        </div>
        <p className="pixel-eyebrow text-xs">{eyebrow}</p>
        <h1 className="pixel-title text-2xl md:text-4xl text-center">
          {title}
        </h1>
        {intro && (
          <p className="text-sm md:text-base text-eb-milk font-semibold text-center max-w-2xl"
             style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>
            {intro}
          </p>
        )}
        {children}
      </div>

      {mascotMessage && <Mascot message={mascotMessage} />}
    </section>
  );
}
