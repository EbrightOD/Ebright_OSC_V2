import { useEffect, useRef, useState } from 'react';
import { PEOPLE } from '../../data/constants';
import HodSprite from '../shared/HodSprite';
import OfficeRoom from '../shared/OfficeRoom';
import GamePanel from '../shared/GamePanel';

// Map HOD records to sprite ids (lowercased first name)
const HODS = PEOPLE.hods.map(h => ({
  id: h.id,
  spriteId: h.name.toLowerCase(),
  name: `${h.title} ${h.name}`,
  dept: h.dept,
  emoji: h.emoji,
}));

// Muted, warm earth-tone palette per room (no neon). Rooms still differ
// enough to be distinguishable; identity is mainly carried by the label.
const ROOMS_TOP = [
  { id: 'academy',     emoji: '🎓', label: 'ACADEMY',      border: '#D4A82B' }, // mustard
  { id: 'hr',          emoji: '🧠', label: 'HR',           border: '#8E6F8C' }, // dusty plum
  { id: 'finance',     emoji: '📊', label: 'FINANCE',      border: '#6F8A6E' }, // sage
];
const ROOMS_BOT = [
  { id: 'optimisation',emoji: '💻', label: 'OPTIMISATION', border: '#6B829E' }, // muted steel
  { id: 'marketing',   emoji: '📣', label: 'MARKETING',    border: '#B5754C' }, // terracotta
  { id: 'operations',  emoji: '⚙️', label: 'OPERATIONS',   border: '#9E4434' }, // brick
];

export default function BlackoutMinigame({ onComplete, onClose }) {
  const wrapRef = useRef(null);
  const [phase, setPhase] = useState('office'); // office, result, success
  const [mouse, setMouse] = useState({ x: 400, y: 300 });
  const [lightsOn, setLightsOn] = useState(false);
  const [hodPositions, setHodPositions] = useState([]);
  const [placements, setPlacements] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState(null);

  const scatterHods = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const cy = h / 2;
    const positions = [];
    HODS.forEach(() => {
      let attempts = 0, x, y, ok;
      do {
        x = 60 + Math.random() * (w - 120);
        y = cy - 60 + Math.random() * 120;
        ok = !positions.some(p => Math.hypot(p.x - x, p.y - y) < 60);
        attempts++;
      } while (!ok && attempts < 30);
      positions.push({ x, y });
    });
    setHodPositions(positions);
  };

  useEffect(() => {
    if (phase !== 'office') return;
    scatterHods();
    setPlacements({});
  }, [phase]);

  const onMouseMove = (e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (dragging !== null) {
      setHodPositions(prev => prev.map((p, i) =>
        i === dragging ? { x: e.clientX - rect.left - dragOffset.x, y: e.clientY - rect.top - dragOffset.y } : p
      ));
    }
  };

  const onMouseDown = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(i);
  };

  const onMouseUp = (e) => {
    if (dragging === null) return;
    const dropX = e.clientX, dropY = e.clientY;
    const rooms = wrapRef.current?.querySelectorAll('[data-room]') || [];
    let droppedDept = null, droppedRoom = null;
    rooms.forEach(r => {
      const rect = r.getBoundingClientRect();
      if (dropX >= rect.left && dropX <= rect.right && dropY >= rect.top && dropY <= rect.bottom) {
        droppedDept = r.dataset.room;
        droppedRoom = r;
      }
    });
    if (droppedDept && droppedRoom) {
      const wrapRect = wrapRef.current.getBoundingClientRect();
      const cx = droppedRoom.offsetLeft + droppedRoom.offsetWidth / 2 - 26;
      const cy = droppedRoom.offsetTop + droppedRoom.offsetHeight / 2 - 34;
      setHodPositions(prev => prev.map((p, i) => i === dragging ? { x: cx, y: cy } : p));
      setPlacements(prev => ({ ...prev, [HODS[dragging].id]: droppedDept }));
    } else {
      // return to scatter
      scatterHods();
      setPlacements(prev => {
        const next = { ...prev };
        delete next[HODS[dragging].id];
        return next;
      });
    }
    setDragging(null);
  };

  const placedCount = Object.keys(placements).length;

  // Auto-trigger lights-on the moment all 7 are placed
  useEffect(() => {
    if (phase !== 'office') return;
    if (placedCount !== HODS.length) return;
    // small delay so the final drop animation settles before the flash
    const t = setTimeout(() => {
      let correct = 0;
      HODS.forEach(h => { if (placements[h.id] === h.dept) correct++; });
      setFeedback({ correct, total: HODS.length });
      setPhase('result');
    }, 600);
    return () => clearTimeout(t);
  }, [placedCount, phase, placements]);

  const retry = () => { setFeedback(null); setPhase('office'); };
  const continueToSuccess = () => setPhase('success');

  if (phase === 'office') {
    return (
      <div ref={wrapRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className="fixed inset-0 z-[800] overflow-hidden"
        style={{ cursor: lightsOn ? 'default' : 'none' }}
      >
        {/* Office floor */}
        <div className="absolute inset-0 grid grid-rows-2 gap-3 p-12 bg-eb-walnut-gradient">
          <div className="grid grid-cols-3 gap-3">
            {ROOMS_TOP.map(r => (
              <OfficeRoom key={r.id} id={r.id} emoji={r.emoji} label={r.label} color={r.border} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ROOMS_BOT.map(r => (
              <OfficeRoom key={r.id} id={r.id} emoji={r.emoji} label={r.label} color={r.border} />
            ))}
          </div>
        </div>

        {/* HOD sprites */}
        {hodPositions.map((pos, i) => {
          const hod = HODS[i];
          const placed = placements[hod.id];
          return (
            <div key={hod.id}
              onMouseDown={(e) => onMouseDown(e, i)}
              className="absolute select-none cursor-grab"
              style={{ left: pos.x + 'px', top: pos.y + 'px', cursor: dragging === i ? 'grabbing' : 'grab' }}>
              <div className="bg-black/85 text-white text-[0.42rem] font-pixel px-1.5 py-0.5 rounded mb-0.5 whitespace-nowrap text-center">
                {hod.name}
              </div>
              <div className={`flex justify-center ${placed ? '' : 'bob'}`}>
                <HodSprite id={hod.spriteId} w={44} h={62} />
              </div>
            </div>
          );
        })}

        {/* Spotlight overlay */}
        {!lightsOn && (
          <div className="absolute inset-0 pointer-events-none z-[50]" style={{
            background: 'rgba(0,0,0,0.97)',
            WebkitMaskImage: `radial-gradient(circle 130px at ${mouse.x}px ${mouse.y}px, transparent 0%, transparent 60%, black 100%)`,
            maskImage: `radial-gradient(circle 130px at ${mouse.x}px ${mouse.y}px, transparent 0%, transparent 60%, black 100%)`,
          }} />
        )}

        {/* Cursor torch */}
        {!lightsOn && (
          <div className="absolute pointer-events-none z-[60] text-2xl" style={{ left: mouse.x - 16, top: mouse.y - 16 }}>🔦</div>
        )}

        {/* HUD */}
        <div className="absolute top-4 left-4 right-4 z-[70] flex justify-between pointer-events-none">
          <div className="font-pixel text-xs bg-black/80 border border-eb-yellow text-eb-yellow px-3 py-1.5 rounded">🔦 FIND ALL {HODS.length} HODs</div>
          <div className="font-pixel text-xs bg-black/80 border border-eb-yellow text-eb-yellow px-3 py-1.5 rounded">PLACED: {placedCount} / {HODS.length}</div>
        </div>

        {placedCount === HODS.length && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[75] font-pixel text-[0.55rem] text-eb-yellow bg-black/85 border-eb-border-1 border-eb-yellow px-4 py-2 rounded animate-pulse">
            💡 LIGHTS ON IN 1...
          </div>
        )}
      </div>
    );
  }

  if (phase === 'result' && feedback) {
    return (
      <div className="fixed inset-0 z-[800] overflow-hidden bg-eb-walnut-gradient" style={{ animation: 'flashFade 0.8s forwards' }}>
        <style>{`@keyframes flashFade { 0%{background:#fff;} 30%{background:#fff;} 100%{background:var(--walnut);} }`}</style>

        {/* Office floor — lights ON, rooms now look like real rooms */}
        <div className="absolute inset-0 grid grid-rows-2 gap-3 p-12 pt-24 pb-32 bg-eb-walnut-gradient">
          <div className="grid grid-cols-3 gap-3">
            {ROOMS_TOP.map(r => <ResultRoom key={r.id} room={r} placements={placements} />)}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ROOMS_BOT.map(r => <ResultRoom key={r.id} room={r} placements={placements} />)}
          </div>
        </div>

        {/* Result HUD top */}
        <div className="absolute top-4 left-4 right-4 z-[70] flex justify-between items-center pointer-events-none">
          <div className="font-pixel text-xs bg-black/80 border border-eb-yellow text-eb-yellow px-3 py-1.5 rounded">💡 LIGHTS ON</div>
          <div className="font-pixel text-base bg-black/80 border-eb-border-1 border-eb-yellow text-eb-yellow px-4 py-2 rounded"
               style={{ textShadow: '3px 3px 0 var(--red-dark)' }}>
            SCORE: {feedback.correct} / {feedback.total} ✓
          </div>
        </div>

        {/* Bottom feedback bar */}
        <div className="absolute bottom-4 left-4 right-4 z-[70] flex flex-col items-center gap-3">
          <div className={`bg-black/85 border-eb-border-1 rounded-lg px-5 py-3 max-w-2xl w-full ${(feedback.total - feedback.correct) <= 4 ? 'border-eb-green' : 'border-eb-red'}`}>
            <p className="text-white font-bold text-center text-sm md:text-base">
              {feedback.correct === feedback.total
                ? <>🎉 <strong className="text-eb-green">PERFECT!</strong> All {feedback.total} HODs placed correctly!</>
                : (feedback.total - feedback.correct) <= 4
                  ? <>✓ <strong className="text-eb-green">Good job!</strong> Score: {feedback.correct} / {feedback.total}.</>
                  : <>❌ Too many wrong placements. Try again!</>
              }
            </p>
          </div>
          {(feedback.total - feedback.correct) <= 4 ? (
            <button onClick={continueToSuccess} className="btn-pixel font-body">▶ CONTINUE</button>
          ) : (
            <button onClick={retry} className="btn-pixel font-body">🔄 TRY AGAIN</button>
          )}
        </div>
      </div>
    );
  }

  // success — no celebration screen. Fire onComplete so the wrapper page
  // can navigate to the next route immediately.
  return <SilentSuccess onComplete={onComplete} />;
}

function SilentSuccess({ onComplete }) {
  useEffect(() => {
    onComplete?.(20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ResultRoom({ room, placements }) {
  const placedHere = HODS.filter(h => placements[h.id] === room.id);
  const allCorrect = placedHere.length > 0 && placedHere.every(h => h.dept === room.id);
  const anyWrong = placedHere.some(h => h.dept !== room.id);
  const ringClass = allCorrect ? 'ring-4 ring-eb-green ring-opacity-70' :
                    anyWrong ? 'ring-4 ring-eb-red ring-opacity-70' : '';
  return (
    <OfficeRoom id={room.id} emoji={room.emoji} label={room.label} color={room.border} ringClass={ringClass}>
      {placedHere.map(h => {
        const ok = h.dept === room.id;
        return (
          <div key={h.id} className="flex flex-col items-center px-0.5">
            <div className={`flex items-center justify-center rounded px-0.5 ${ok ? 'border-eb-border-1 border-eb-green bg-eb-green/10' : 'border-eb-border-1 border-eb-red bg-eb-red/10'}`}>
              <HodSprite id={h.spriteId} w={44} h={62} />
            </div>
            <span className={`font-pixel text-[0.4rem] mt-0.5 ${ok ? 'text-eb-green' : 'text-eb-red-bright'}`}>
              {ok ? '✓' : '✗'} {h.name.split(' ')[1]}
            </span>
          </div>
        );
      })}
    </OfficeRoom>
  );
}
