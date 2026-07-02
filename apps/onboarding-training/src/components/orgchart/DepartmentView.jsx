import { useEffect, useState } from 'react';
import { PEOPLE, DEPARTMENTS, REGIONS } from '../../data/constants';

export default function DepartmentView({ deptId, onSelectPerson, onSelectRegion }) {
  const dept = DEPARTMENTS.find(d => d.id === deptId);
  const head = PEOPLE.hods.find(h => h.dept === deptId);
  const execs = PEOPLE.executives.filter(e => e.dept === deptId);
  const isOps = deptId === 'operations';

  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setZoomed(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!dept) return null;

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 overflow-y-auto transition-all duration-500 ${zoomed ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
      {/* HOD Hero Card */}
      {head && (
        <button onClick={() => onSelectPerson(head)}
          className="w-full max-w-md rounded-2xl p-6 md:p-8 text-center hover:scale-105 transition-transform cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${dept.color}, ${dept.color}99)`,
            boxShadow: `0 0 60px ${dept.color}80, inset -4px -4px 12px rgba(0,0,0,0.3)`,
            border: `3px solid ${dept.color}`,
          }}>
          <div className="text-5xl md:text-6xl mb-2">{dept.emoji}</div>
          <p className="font-pixel text-[0.5rem] text-white/85 tracking-widest mb-2">{dept.name.toUpperCase()}</p>
          <h2 className="font-pixel text-base md:text-xl text-white mb-2"
              style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}>
            {head.title} {head.name.toUpperCase()}
          </h2>
          <p className="font-body text-sm text-white/90 font-bold mb-4">{head.role}</p>
          <blockquote className="italic text-sm text-white/85 font-semibold leading-relaxed border-l-2 border-white/40 pl-3 text-left">
            "{head.quote}"
          </blockquote>
          <p className="font-body text-xs mt-4 text-white/70">🔊 Click to view full intro</p>
        </button>
      )}

      {/* Executives row */}
      {execs.length > 0 && (
        <div className="mt-8 w-full max-w-2xl text-center">
          <p className="font-pixel text-[0.45rem] text-eb-yellow mb-3 tracking-widest">▸ TEAM EXECUTIVES</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {execs.map((p, i) => (
              <button key={p.id} onClick={() => onSelectPerson(p)}
                className="bg-eb-card border-eb-border-1 hover:border-white rounded-lg p-3 min-w-[140px] transition hover:scale-105 fade-up"
                style={{ borderColor: dept.color, animationDelay: `${i * 80}ms` }}>
                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl mb-2"
                     style={{ background: dept.color + '40', border: `2px solid ${dept.color}` }}>👤</div>
                <p className="font-bold text-sm text-white">{p.title} {p.name}</p>
                <p className="text-xs text-white/55 font-semibold">{p.role}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Regional Manager pickers (Operations only) */}
      {isOps && (
        <div className="mt-8 w-full max-w-3xl text-center">
          <p className="font-pixel text-[0.45rem] text-eb-yellow mb-3 tracking-widest">▸ DRILL INTO A REGION</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REGIONS.map(r => {
              const branchCount = ['r2', 'r3'].includes(r.id) ? 10 : 0;
              return (
                <button key={r.id} onClick={() => onSelectRegion(r.id)}
                  className="bg-eb-card border-eb-border-1 border-eb-yellow/40 hover:border-eb-yellow rounded-xl p-5 transition hover:scale-105 text-left">
                  <p className="font-pixel text-[0.55rem] text-eb-yellow tracking-widest">▸ {r.name.toUpperCase()}</p>
                  <p className="font-pixel text-base text-white mt-2"
                     style={{ textShadow: '2px 2px 0 var(--red-dark)' }}>
                    {r.manager}
                  </p>
                  <p className="text-sm text-white/55 font-semibold mt-1">ARM: {r.arm}</p>
                  <p className="text-xs text-eb-yellow font-bold mt-2">📍 {branchCount} BRANCHES — CLICK TO EXPLORE ›</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="font-body text-xs text-eb-yellow/70 mt-8 italic">
        ✦ Press ESC or click ‹ BACK to return ✦
      </p>
    </div>
  );
}
