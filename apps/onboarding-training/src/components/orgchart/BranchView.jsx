import { useEffect, useState } from 'react';
import { BRANCHES, REGIONS } from '../../data/constants';

export default function BranchView({ branchId, onSelectPerson }) {
  const branch = BRANCHES.find(b => b.id === branchId);
  const region = branch ? REGIONS.find(r => r.id === branch.region) : null;
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setZoomed(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!branch) return null;

  const manager = {
    title: '',
    name: branch.manager,
    role: 'Branch Manager',
    branch: branch.name,
    quote: `Welcome to ${branch.name} — looking forward to Day 1!`,
    emoji: '👤',
  };

  return (
    <div className={`absolute inset-0 flex items-center justify-center p-6 overflow-y-auto transition-all duration-500 ${zoomed ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
      <div className="w-full max-w-2xl">
        {/* Branch hero */}
        <div className="rounded-2xl p-6 md:p-8 text-center"
             style={{
               background: 'linear-gradient(135deg, #d42b2b, #991f1f)',
               boxShadow: '0 0 60px rgba(212,43,43,0.6), inset -4px -4px 12px rgba(0,0,0,0.3)',
               border: '3px solid #f5c518',
             }}>
          <p className="font-pixel text-[0.55rem] text-eb-yellow tracking-widest mb-2">📍 BRANCH LOCATION</p>
          <h1 className="pixel-title text-xl md:text-3xl mb-2"
              style={{ textShadow: '4px 4px 0 #5a1010' }}>
            {branch.name.toUpperCase()}
          </h1>
          {region && (
            <p className="font-body text-sm text-white/85 font-bold mb-6">
              {region.name} · Reports to {region.manager}
            </p>
          )}

          <button onClick={() => onSelectPerson(manager)}
            className="block mx-auto mb-4 hover:scale-105 transition-transform">
            <div className="w-32 h-32 mx-auto rounded-full mb-3 flex items-center justify-center text-5xl"
                 style={{
                   background: 'radial-gradient(circle at 30% 30%, #f5c518, #c89a00)',
                   border: '3px solid #fff',
                   boxShadow: '0 0 24px rgba(245,197,24,0.5)',
                 }}>
              {branch.manager[0]}
            </div>
            <p className="font-pixel text-base text-white"
               style={{ textShadow: '2px 2px 0 #5a1010' }}>
              {branch.manager.toUpperCase()}
            </p>
            <p className="font-body text-sm text-white/85 font-bold mt-1">Branch Manager</p>
          </button>

          <p className="italic text-sm text-white/85 font-semibold mt-4 max-w-md mx-auto">
            "{manager.quote}"
          </p>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <button className="bg-eb-yellow text-black font-extrabold text-sm px-4 py-2 rounded shadow-pixel">
              📞 Call Branch
            </button>
            <button className="bg-[#25d366] text-black font-extrabold text-sm px-4 py-2 rounded shadow-pixel">
              💬 WhatsApp
            </button>
            <button className="bg-eb-card text-white border-eb-border-1 border-white/30 font-extrabold text-sm px-4 py-2 rounded">
              📧 Email
            </button>
          </div>
        </div>

        {/* Branch staff placeholder */}
        <div className="mt-6 bg-eb-card border border-eb-yellow/30 rounded-xl p-5 text-center">
          <p className="font-pixel text-[0.45rem] text-eb-yellow tracking-widest mb-2">▸ BRANCH TEAM</p>
          <p className="text-sm text-white/55 font-semibold">
            Tutors and admin staff for {branch.name} will be listed here. Connect to your HR system to populate.
          </p>
        </div>

        <p className="font-body text-xs text-eb-yellow/70 mt-6 italic text-center">
          ✦ Press ESC to go back ✦
        </p>
      </div>
    </div>
  );
}
