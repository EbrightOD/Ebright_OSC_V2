export default function Breadcrumb({ path, onNavigate, onBack }) {
  return (
    <div className="absolute top-4 left-4 right-4 z-30 flex items-center gap-3 flex-wrap">
      <button onClick={onBack}
        className="font-pixel text-[0.5rem] text-eb-yellow hover:text-white border border-eb-yellow/40 hover:border-white px-3 py-1.5 rounded bg-black/60">
        ‹ BACK · ESC
      </button>
      <div className="flex items-center gap-1.5 font-pixel text-[0.5rem] text-eb-yellow flex-wrap">
        {path.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate?.(i)}
              className={`${i === path.length - 1 ? 'text-white' : 'text-eb-yellow hover:text-white underline'}`}>
              {item}
            </button>
            {i < path.length - 1 && <span className="text-white/40">›</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
