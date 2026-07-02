export default function PersonModal({ person, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[950] flex items-center justify-center p-4 fade-up"
         onClick={onClose}>
      <div className="bg-gradient-to-br from-[#1a1a26] to-[#0a0a14] border-[3px] border-eb-red rounded-xl p-8 max-w-md w-full text-center"
           onClick={(e) => e.stopPropagation()}>
        <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center text-5xl pulse-pixel"
             style={{
               background: `radial-gradient(circle at 30% 30%, ${person.color || '#d42b2b'}, ${person.color || '#991f1f'})`,
               boxShadow: '0 0 30px rgba(212,43,43,0.4)',
               border: '3px solid #f5c518',
             }}>
          {person.emoji || '👤'}
        </div>
        <h3 className="pixel-title text-base md:text-lg mt-5">
          {person.title} {person.name?.toUpperCase()}
        </h3>
        <p className="text-sm text-eb-yellow font-bold mt-1">{person.role}</p>

        {person.quote && (
          <blockquote className="italic text-white/75 mt-5 border-l-2 border-eb-red pl-3 text-left text-sm">
            "{person.quote}"
          </blockquote>
        )}

        {person.audioUrl && (
          <audio controls className="w-full mt-5">
            <source src={person.audioUrl} type="audio/mpeg" />
          </audio>
        )}

        <div className="flex flex-col gap-1 mt-5 text-left">
          {person.email && <p className="text-xs text-white/65 font-bold">📧 {person.email}</p>}
          {person.phone && <p className="text-xs text-white/65 font-bold">📞 {person.phone}</p>}
          {person.branch && <p className="text-xs text-white/65 font-bold">📍 {person.branch}</p>}
        </div>

        <button onClick={onClose} className="btn-pixel mt-6 font-body w-full">✓ CLOSE</button>
      </div>
    </div>
  );
}
