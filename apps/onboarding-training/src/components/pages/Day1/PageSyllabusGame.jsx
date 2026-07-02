import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from '../../shared/Mascot';
import { CLASS_KIT } from './PageSyllabus';
import { useLockGate } from '../../../hooks/usePageGate';

// Position each kit slot inside the classroom scene (% of container).
const SLOT_LAYOUT = {
  whiteboard: { x: 32,  y: 22, w: 36, h: 28, label: 'WHITEBOARD' },
  markers:    { x: 71,  y: 30, w: 14, h: 12, label: 'MARKERS' },
  flashcards: { x: 14,  y: 60, w: 18, h: 16, label: 'FLASHCARDS' },
  workbook:   { x: 38,  y: 70, w: 22, h: 18, label: 'WORKBOOK' },
  speaker:    { x: 66,  y: 60, w: 16, h: 16, label: 'SPEAKER' },
  timer:      { x: 84,  y: 64, w: 12, h: 14, label: 'TIMER' },
};

export default function PageSyllabusGame() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState({}); // { itemId: dataURL }
  const fileRefs = useRef({});

  const onPick = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotos((p) => ({ ...p, [id]: reader.result }));
    reader.onerror = () => {
      // eslint-disable-next-line no-console
      console.error('Could not read kit photo', reader.error);
    };
    reader.readAsDataURL(file);
  };

  const completed = Object.keys(photos).length;
  const total = CLASS_KIT.length;
  const allDone = completed === total;
  useLockGate(allDone, `Upload all ${total} kit items to unlock`);

  return (
    <section className="relative min-h-page px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center gap-5">
        <div
          className="px-4 py-2 font-pixel text-eb-white text-sm"
          style={{
            background: '#d42b2b',
            boxShadow: '0 4px 0 #991f1f',
            clipPath: 'polygon(0 0,95% 0,100% 18%,100% 100%,5% 100%,0 82%)',
          }}
        >
          DAY 1
        </div>
        <p className="pixel-eyebrow text-xs">✦ MINI-GAME ✦</p>
        <h1 className="pixel-title text-2xl md:text-4xl text-center">
          FIND THE MISSING ITEM
        </h1>
        <p className="text-sm md:text-base text-eb-milk font-semibold text-center max-w-2xl">
          Walk to a real classroom. Find each kit item, take a photo of it, then click its dotted outline below to drop the photo in.
        </p>

        {/* Score badge */}
        <div className="font-pixel text-[0.55rem] bg-black/80 border-2 border-eb-yellow text-eb-yellow px-3 py-2 rounded">
          📸 ITEMS PLACED: {completed} / {total}
        </div>

        {/* Side-by-side: classroom (left) + checklist (right) on md+, stack on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 md:gap-5 w-full items-start">
        {/* Classroom scene */}
        <div className="relative w-full aspect-[16/9] bg-[#dcc07a] border-eb-border-2 border-[#7a5028] rounded-lg overflow-hidden shadow-[0_8px_0_rgba(0,0,0,0.4)]">
          {/* Wall trim */}
          <div className="absolute top-0 left-0 right-0 h-[6%] bg-[#c4a84a]" />
          <div className="absolute top-[6%] left-0 right-0 bottom-[40%] bg-[#dcc07a]" />
          {/* Floor */}
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-[#b78a3a]" />
          <div className="absolute left-0 right-0 bottom-[40%] h-[3%] bg-[#7a5028]" />
          {/* Ceiling lights */}
          {[20, 50, 80].map((x) => (
            <div key={x} className="absolute" style={{ top: 0, left: `${x}%` }}>
              <div className="w-6 h-2 bg-[#a09028]" style={{ marginLeft: -12 }} />
              <div className="w-10 h-3 bg-[#fffde0]/80 rounded-full" style={{ marginLeft: -20 }} />
            </div>
          ))}

          {/* Slots */}
          {CLASS_KIT.map((kit) => {
            const slot = SLOT_LAYOUT[kit.id];
            if (!slot) return null;
            const filled = photos[kit.id];
            return (
              <button
                key={kit.id}
                type="button"
                onClick={() => fileRefs.current[kit.id]?.click()}
                className="absolute group"
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  background: filled ? 'transparent' : 'rgba(0,0,0,0.25)',
                  border: filled ? '3px solid #f5c518' : '3px dashed rgba(255,255,255,0.85)',
                  borderRadius: 6,
                  boxShadow: filled ? '0 0 16px rgba(245,197,24,0.55)' : 'inset 0 0 12px rgba(0,0,0,0.35)',
                }}
              >
                {filled ? (
                  <img src={filled} alt={kit.name}
                       className="absolute inset-0 w-full h-full object-cover rounded" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-1 gap-0.5">
                    <span className="text-2xl md:text-3xl">{kit.icon}</span>
                    <span className="font-pixel text-[0.5rem] md:text-[0.6rem] tracking-wider drop-shadow">{slot.label}</span>
                    <span className="text-[0.6rem] md:text-xs font-bold opacity-90">📸 Tap to upload</span>
                  </div>
                )}
                <input
                  ref={(el) => { fileRefs.current[kit.id] = el; }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onPick(kit.id, e.target.files?.[0])}
                />
              </button>
            );
          })}
        </div>

        {/* Item legend — sits on the right of the classroom on md+ */}
        <div className="card-dark p-4 w-full md:sticky md:top-[60px]">
          <p className="font-pixel text-[0.6rem] text-eb-plum mb-3">▸ ITEM CHECKLIST</p>
          <p className="text-[0.65rem] text-eb-ink-soft font-semibold mb-3">Find each item in a real classroom.</p>
          <div className="grid grid-cols-1 gap-2">
            {CLASS_KIT.map((kit) => {
              const done = !!photos[kit.id];
              return (
                <div key={kit.id}
                  className={`flex items-center gap-2 p-2 rounded border-2 ${
                    done
                      ? 'border-eb-green bg-eb-green/15'
                      : 'border-eb-plum/40 bg-eb-parchment'
                  }`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-black shrink-0 ${
                    done
                      ? 'bg-eb-green border-eb-green text-eb-milk'
                      : 'border-eb-plum/50'
                  }`}>
                    {done && '✓'}
                  </div>
                  <span className="text-base shrink-0">{kit.icon}</span>
                  <span className={`text-xs font-bold text-eb-plum ${done ? 'line-through opacity-70' : ''}`}>{kit.name}</span>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        <button
          onClick={() => navigate('/day1/communication')}
          disabled={!allDone}
          className="btn-pixel mt-2 font-body text-base"
        >
          {allDone ? '▶ Continue' : `Upload all ${total} items to continue`}
        </button>
      </div>

      <Mascot message="Find each classroom kit item in real life, snap a photo, then click the dotted outline to slot it back into the scene. Don't forget the speaker and timer!" />
    </section>
  );
}
