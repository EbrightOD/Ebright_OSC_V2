import { useEffect, useState } from 'react';
import { BRANCHES, REGIONS } from '../../data/constants';

export default function RegionalBranchesView({ regionId, onSelectBranch }) {
  const region = REGIONS.find(r => r.id === regionId);
  const branches = BRANCHES.filter(b => b.region === regionId);
  const [zoomed, setZoomed] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setZoomed(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!region) return null;
  const regionColor = regionId === 'r2' ? '#5090e0' : '#2db858';

  return (
    <div className={`absolute inset-0 flex flex-col md:flex-row gap-4 p-6 transition-all duration-500 ${zoomed ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
      {/* MAP (left 60% on desktop, top on mobile) */}
      <div className="flex-1 md:w-3/5 bg-gradient-to-br from-[#1a2030] to-[#0a1218] border-eb-border-1 rounded-xl p-4 relative overflow-hidden"
           style={{ borderColor: regionColor }}>
        <div className="absolute inset-0 pointer-events-none"
             style={{
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
               backgroundSize: '24px 24px',
             }}/>
        <p className="font-pixel text-sm text-white text-center mb-3"
           style={{ textShadow: `2px 2px 0 ${regionColor}` }}>
          KLANG VALLEY · {region.name.toUpperCase()}
        </p>
        <p className="text-xs text-white/55 font-bold text-center mb-2">
          Managed by <span className="text-eb-yellow">{region.manager}</span> · ARM: {region.arm}
        </p>

        <div className="absolute inset-4 top-20">
          {branches.map(b => {
            const isHovered = hoveredId === b.id;
            return (
              <button key={b.id}
                onClick={() => onSelectBranch(b.id)}
                onMouseEnter={() => setHoveredId(b.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ left: `${b.x}%`, top: `${b.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-full group cursor-pointer transition-transform hover:scale-125 z-10">
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap font-pixel text-[0.42rem] bg-black/90 px-1.5 py-1 rounded text-white transition ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                  📍 {b.name}
                </div>
                <div className="w-[20px] h-[20px] border-eb-border-1 border-white rounded-tl-full rounded-tr-full rounded-bl-full transform -rotate-45 shadow-lg"
                     style={{ background: regionColor, boxShadow: isHovered ? `0 0 18px ${regionColor}` : '' }}/>
                <div className="w-0.5 h-2 mx-auto -mt-0.5" style={{ background: regionColor }}/>
              </button>
            );
          })}
        </div>
      </div>

      {/* BRANCH LIST (right 40%) */}
      <div className="md:w-2/5 flex flex-col gap-2 max-h-[60vh] md:max-h-none overflow-y-auto">
        <p className="font-pixel text-[0.55rem] text-eb-yellow tracking-widest sticky top-0 bg-eb-dark py-2">
          ▸ {branches.length} BRANCHES
        </p>
        <div className="space-y-2">
          {branches.map((b, i) => (
            <button key={b.id} onClick={() => onSelectBranch(b.id)}
              onMouseEnter={() => setHoveredId(b.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="w-full px-4 py-3 bg-eb-card hover:bg-eb-red/20 border-eb-border-1 hover:border-white rounded-lg font-body text-sm text-white transition text-left flex items-center gap-3 fade-up"
              style={{ borderColor: regionColor + '60', animationDelay: `${i * 40}ms` }}>
              <span className="font-pixel text-[0.5rem] text-eb-yellow w-7">#{String(i + 1).padStart(2, '0')}</span>
              <div className="flex-1">
                <p className="font-bold">{b.name}</p>
                <p className="text-xs text-white/55 font-semibold">BM: {b.manager}</p>
              </div>
              <span className="text-white/40 font-bold text-xs">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
