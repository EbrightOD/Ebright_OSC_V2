import { PEOPLE } from '../../data/constants';

export default function CompanyView({ onClick, animating }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center fade-up">
      {/* Ripple ring on click */}
      {animating && (
        <span className="absolute w-48 h-48 rounded-full border-eb-border-2 border-eb-yellow"
              style={{ animation: 'ripple-out 600ms ease-out forwards' }}/>
      )}
      <style>{`
        @keyframes ripple-out {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(6); opacity: 0; }
        }
      `}</style>

      <button onClick={onClick} disabled={animating}
        className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform ${animating ? 'scale-110' : 'pulse-pixel hover:scale-105'}`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, #e63535, #d42b2b 60%, #991f1f)',
          boxShadow: '0 0 60px rgba(212,43,43,0.6), inset -4px -4px 12px rgba(0,0,0,0.3), inset 4px 4px 12px rgba(255,255,255,0.15)',
          border: '4px solid #f5c518',
        }}>
        <span className="text-6xl md:text-7xl">👨‍💼</span>
        <p className="font-pixel text-[0.6rem] text-eb-yellow mt-1 px-2 py-0.5 bg-black/40 rounded">CEO</p>
        <p className="font-pixel text-[0.55rem] md:text-[0.65rem] text-white mt-2"
           style={{ textShadow: '2px 2px 0 #5a1010' }}>
          {PEOPLE.ceo.title} {PEOPLE.ceo.name.toUpperCase()}
        </p>
      </button>

      <p className="text-[0.7rem] font-bold text-white/65 mt-6">
        {PEOPLE.ceo.role}
      </p>
      <p className="font-pixel text-[0.5rem] text-eb-yellow mt-8 animate-pulse">
        {animating ? '✦ EXPANDING ✦' : '▸ CLICK CEO TO DRILL DOWN'}
      </p>
    </div>
  );
}
