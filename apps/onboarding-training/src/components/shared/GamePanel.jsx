/**
 * GamePanel — shared retro arcade panel for every front/briefing/result screen.
 * Renders a centered double-bordered card with corner brackets, scanline overlay,
 * animated dots in the background, optional chapter badge + title + body + stats + CTA.
 */
export default function GamePanel({
  badge,             // small uppercase pixel chip at the top (e.g. "CHAPTER 1 · DAY 1")
  title,             // big pixel hero text (newlines via \n)
  subtitle,          // optional eyebrow above the title
  body,              // ReactNode — description / mascot bubble
  stats = [],        // [{ label, value }]
  hints = [],        // [{ icon, text }] — small pill chips
  primaryAction,     // { label, onClick, variant?: 'red'|'yellow'|'green' }
  secondaryAction,   // { label, onClick }
  accent = 'red',    // 'red' | 'yellow' | 'green'
  children,          // free-form content above the actions
  bgVariant = 'space', // 'space' | 'arena' | 'celebration' | 'fail'
}) {
  const accents = {
    red:    { primary: '#d42b2b', shadow: '#991f1f', glow: 'rgba(212,43,43,0.6)' },
    yellow: { primary: '#f5c518', shadow: '#c89a00', glow: 'rgba(245,197,24,0.6)' },
    green:  { primary: '#2db858', shadow: '#0a4a18', glow: 'rgba(45,184,88,0.6)' },
  };
  const a = accents[accent] || accents.red;

  const bgStyles = {
    space:        { background: 'radial-gradient(ellipse at 50% 30%, #1a0a1a 0%, #050510 60%, #000 100%)' },
    arena:        { background: 'radial-gradient(ellipse at 50% 50%, #1a1a2e 0%, #0a0a14 60%, #050510 100%)' },
    celebration:  { background: 'radial-gradient(ellipse at 50% 30%, #2a1f08 0%, #050505 70%)' },
    fail:         { background: 'radial-gradient(ellipse at 50% 30%, #2a0a0a 0%, #050505 70%)' },
  };

  return (
    <section className="relative min-h-page w-full flex items-center justify-center px-4 py-8 overflow-hidden fade-up"
             style={bgStyles[bgVariant] || bgStyles.space}>
      {/* Animated star particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute w-0.5 h-0.5 bg-white twinkle"
               style={{ top: `${(i * 17) % 100}%`, left: `${(i * 23) % 100}%`, animationDelay: `${(i * 0.1) % 3}s`, opacity: 0.25 + (i % 5) * 0.15 }} />
        ))}
      </div>

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden
           style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 4px)' }} />

      {/* Outer frame (yellow border) */}
      <div className="relative w-full max-w-2xl"
           style={{ filter: `drop-shadow(0 0 24px ${a.glow})` }}>
        {/* Corner brackets */}
        <CornerBrackets color={a.primary} />

        {/* Inner card */}
        <div className="relative bg-gradient-to-br from-[#15151f] via-[#0d0d18] to-[#0a0a14] border-[3px] rounded-2xl p-6 md:p-8 text-center"
             style={{ borderColor: a.primary, boxShadow: `inset 0 0 32px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.5)` }}>
          {/* Inner accent strip */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 -translate-y-1/2 bg-eb-dark border-eb-border-1 rounded font-pixel text-[0.45rem] tracking-widest"
               style={{ borderColor: a.primary, color: a.primary }}>
            ✦ EBRIGHT ARCADE ✦
          </div>

          {/* Badge */}
          {badge && (
            <p className="font-pixel text-[0.5rem] mt-4 mb-2 tracking-widest"
               style={{ color: a.primary, textShadow: `2px 2px 0 ${a.shadow}` }}>
              ▸ {badge} ▸
            </p>
          )}

          {/* Subtitle */}
          {subtitle && <p className="text-xs text-white/55 font-extrabold uppercase tracking-widest mb-2">{subtitle}</p>}

          {/* Title */}
          {title && (
            <h1 className="font-pixel text-xl md:text-3xl leading-tight mt-3 mb-5"
                style={{
                  color: '#fff',
                  textShadow: `4px 4px 0 ${a.shadow}, 8px 8px 0 rgba(0,0,0,0.7)`,
                }}>
              {title.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
            </h1>
          )}

          {/* Body */}
          {body && (
            <div className="my-4 px-2 md:px-4 text-sm md:text-base text-white/85 font-bold leading-relaxed">
              {body}
            </div>
          )}

          {/* Custom children */}
          {children}

          {/* Stats row */}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mt-5">
              {stats.map((s, i) => (
                <div key={i} className="bg-eb-card border rounded-lg px-3 py-2"
                     style={{ borderColor: a.primary + '60' }}>
                  <div className="font-pixel text-base" style={{ color: a.primary }}>{s.value}</div>
                  <div className="font-pixel text-[0.4rem] text-white/55 mt-1 tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Hints row */}
          {hints.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {hints.map((h, i) => (
                <span key={i} className="bg-white/5 border border-white/15 rounded-full px-3 py-1.5 text-xs text-white/85 font-bold flex items-center gap-1.5">
                  <span>{h.icon}</span>{h.text}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap gap-3 justify-center items-center mt-7">
              {secondaryAction && (
                <button onClick={secondaryAction.onClick}
                  className="px-5 py-3 bg-eb-surface-4 hover:bg-[#3a3a3a] text-white/70 hover:text-white font-bold rounded text-sm">
                  {secondaryAction.label}
                </button>
              )}
              {primaryAction && (
                <button onClick={primaryAction.onClick}
                  className="font-body font-black text-white text-base md:text-lg px-8 py-3.5 rounded-lg cursor-pointer transition-transform active:translate-y-1 bob"
                  style={{
                    background: `linear-gradient(180deg, ${a.primary}, ${a.shadow})`,
                    boxShadow: `0 6px 0 ${a.shadow}, 0 12px 24px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.2)`,
                    border: `2px solid ${a.primary}`,
                  }}>
                  {primaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom corner brackets */}
        <CornerBrackets color={a.primary} bottom />
      </div>
    </section>
  );
}

function CornerBrackets({ color, bottom = false }) {
  return (
    <>
      <span className={`absolute ${bottom ? 'bottom-0' : 'top-0'} left-0 w-6 h-6 border-${bottom ? 'b' : 't'}-[3px] border-l-[3px]`}
            style={{ borderColor: color, transform: bottom ? 'translate(-8px, 8px)' : 'translate(-8px, -8px)' }}/>
      <span className={`absolute ${bottom ? 'bottom-0' : 'top-0'} right-0 w-6 h-6 border-${bottom ? 'b' : 't'}-[3px] border-r-[3px]`}
            style={{ borderColor: color, transform: bottom ? 'translate(8px, 8px)' : 'translate(8px, -8px)' }}/>
    </>
  );
}
