import { useEffect, useState } from 'react';
import { PEOPLE, DEPARTMENTS } from '../../data/constants';

// Vertical top-down tree: CEO box at top → trunk → "HQ — HEAD OF DEPT" label → bracket → 7 dept circles in a row below.
export default function DepartmentsView({ onSelectDept }) {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHasEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto">
      {/* CEO at top */}
      <div className="flex justify-center">
        <div className="relative w-40 md:w-48 bg-gradient-to-br from-[#3a2010] to-[#1a1020] border-[3px] border-eb-yellow rounded-2xl px-3 py-3 flex flex-col items-center"
             style={{ boxShadow: '0 0 24px rgba(245,197,24,0.4)' }}>
          <span className="text-3xl md:text-4xl">👨‍💼</span>
          <div className="font-pixel text-[0.4rem] bg-eb-yellow text-black px-1.5 py-0.5 rounded mt-1">CEO</div>
          <div className="font-pixel text-[0.5rem] text-white mt-1">{PEOPLE.ceo.title} {PEOPLE.ceo.name.toUpperCase()}</div>
        </div>
      </div>

      {/* Trunk */}
      <div className="w-1 h-8 bg-gradient-to-b from-eb-yellow to-eb-red mx-auto" />

      {/* HOD label */}
      <div className="font-pixel text-[0.55rem] tracking-widest text-eb-yellow bg-eb-yellow/10 border border-eb-yellow/40 px-4 py-2 rounded">
        HQ — HEAD OF DEPT
      </div>

      {/* Trunk down to bracket */}
      <div className="w-1 h-6 bg-eb-yellow/60 mx-auto" />

      {/* Horizontal bracket connector */}
      <div className="relative w-full max-w-5xl">
        <div className="h-1 bg-eb-yellow/60 rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 md:gap-2 mt-0">
          {DEPARTMENTS.map((d, i) => {
            const head = PEOPLE.hods.find(h => h.dept === d.id);
            return (
              <div key={d.id} className="flex flex-col items-center"
                   style={{
                     opacity: hasEntered ? 1 : 0,
                     transform: hasEntered ? 'translateY(0)' : 'translateY(-12px)',
                     transition: `opacity 400ms ease ${i * 80}ms, transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 80}ms`,
                   }}>
                {/* Drop line from bracket */}
                <div className="w-1 h-6 bg-eb-yellow/60" />
                {/* Dept circle */}
                <button onClick={() => onSelectDept(d.id)}
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${d.color}aa, ${d.color}55, #14141f)`,
                    border: `3px solid ${d.color}`,
                    boxShadow: `0 0 20px ${d.color}66, inset -2px -2px 6px rgba(0,0,0,0.3)`,
                  }}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <span className="text-xl md:text-2xl">{d.emoji}</span>
                  <p className="font-pixel text-[0.35rem] mt-0.5 text-white text-center px-1 leading-tight">
                    {d.name.toUpperCase()}
                  </p>
                </button>
                {/* HOD name below circle */}
                {head && (
                  <p className="font-body text-[0.7rem] text-white/70 font-bold mt-2 leading-tight text-center">
                    {head.title} {head.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="font-pixel text-[0.45rem] text-white/35 mt-6">
        ▸ CLICK ANY DEPARTMENT TO DRILL INTO THEIR TEAM
      </p>
    </div>
  );
}
