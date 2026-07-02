import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SOFTWARE_LIST } from '../../../data/constants';
import Mascot from '../../shared/Mascot';
import { useLockGate } from '../../../hooks/usePageGate';

/* Display abbreviations matching the sketch (CU / AP / Z / 📚 / PS / AO).
   Order follows the sketch + reading flow. */
const _SW = Object.fromEntries(SOFTWARE_LIST.map((s) => [s.id, s]));
const TILE_ORDER = [
  { id: 'clickup',        abbr: 'CU', color: _SW.clickup.color },
  { id: 'autocount',      abbr: 'AP', color: _SW.autocount.color },
  { id: 'zoom',           abbr: 'Z',  color: _SW.zoom.color },
  { id: 'library',        icon: '📚', color: _SW.library.color },
  { id: 'process-street', abbr: 'PS', color: _SW['process-street'].color },
  { id: 'aone',           abbr: 'AO', color: _SW.aone.color },
];

export default function PageSoftware() {
  const navigate = useNavigate();
  const [viewedIds, setViewedIds] = useState(() => new Set());
  const [activeId, setActiveId] = useState(null);

  const allViewed = viewedIds.size === TILE_ORDER.length;
  useLockGate(allViewed, `Open all ${TILE_ORDER.length} software cards to unlock`);

  const isUnlocked = (idx) => idx === 0 || viewedIds.has(TILE_ORDER[idx - 1].id);

  const openTile = (tile) => {
    setActiveId(tile.id);
    setViewedIds((prev) => {
      if (prev.has(tile.id)) return prev;
      const next = new Set(prev);
      next.add(tile.id);
      return next;
    });
  };

  const closeModal = () => setActiveId(null);

  const activeTile = activeId ? TILE_ORDER.find((t) => t.id === activeId) : null;
  const activeSoftware = activeId ? _SW[activeId] : null;

  return (
    <section className="relative min-h-page px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,212,0.06) 0%, rgba(26,11,31,0.30) 75%)' }} />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center gap-5">
        <div
          className="px-4 py-2 font-pixel text-eb-chalk text-sm"
          style={{
            background: 'var(--ebright-red)',
            boxShadow: '0 4px 0 var(--red-dark)',
            clipPath: 'polygon(0 0,95% 0,100% 18%,100% 100%,5% 100%,0 82%)',
          }}
        >
          DAY 1
        </div>
        <p className="pixel-eyebrow text-xs">▸ TRAINING</p>
        <h1 className="pixel-title text-2xl md:text-4xl text-center">
          SOFTWARE INTRODUCTION
        </h1>

        <p className="text-sm md:text-base text-eb-chalk/85 font-semibold text-center max-w-2xl">
          Let's get into what the company uses to make the company process easier and faster.
          Tap each tile to read about it — they unlock in order.
        </p>

        <div className="font-pixel text-[0.55rem] bg-eb-oak border-2 border-eb-faded-green text-eb-gold px-3 py-2 rounded">
          ▸ CARDS OPENED: {viewedIds.size} / {TILE_ORDER.length}
        </div>

        {/* Wide 6-tile grid — 3 cols on desktop, 2 on tablet, 1 on mobile.
            Tiles are wide horizontal cards so the page never needs to scroll. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
          {TILE_ORDER.map((tile, idx) => {
            const sw = _SW[tile.id];
            const unlocked = isUnlocked(idx);
            const viewed = viewedIds.has(tile.id);
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => unlocked && openTile(tile)}
                disabled={!unlocked}
                title={unlocked ? `Open ${sw.name}` : `Open the previous card first`}
                className={`relative card-dark flex items-center gap-3 p-4 text-left transition ${
                  unlocked
                    ? 'hover:border-eb-gold hover:-translate-y-1 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                } ${viewed ? 'border-eb-green/70' : ''}`}
              >
                <div
                  className="w-14 h-14 flex items-center justify-center rounded-xl shrink-0 shadow-[0_3px_0_rgba(0,0,0,0.5)] border-[3px] border-black/30"
                  style={{ background: tile.color }}
                >
                  {tile.icon ? (
                    <span className="text-2xl leading-none">{tile.icon}</span>
                  ) : (
                    <span className="font-pixel text-base text-eb-chalk tracking-widest">{tile.abbr}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-base text-eb-ink truncate">{sw.name}</div>
                  <div className="text-[0.65rem] text-eb-plum font-extrabold uppercase tracking-wider mt-0.5 truncate">
                    {sw.tagline}
                  </div>
                </div>
                {viewed ? (
                  <span className="font-pixel text-[0.5rem] text-eb-green border border-eb-green px-1.5 py-0.5 rounded">✓</span>
                ) : unlocked ? (
                  <span className="font-pixel text-[0.5rem] text-eb-plum border border-eb-plum px-1.5 py-0.5 rounded">OPEN</span>
                ) : (
                  <span className="font-pixel text-[0.5rem] text-eb-ink/40 border border-eb-ink/20 px-1.5 py-0.5 rounded">🔒</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="font-pixel text-[0.5rem] text-eb-gold/80 tracking-widest text-center mt-1">
          {allViewed
            ? '▸ TAP NEXT BELOW TO SUBMIT YOUR PROOF SCREENSHOTS'
            : '▸ OPEN EACH CARD IN ORDER TO UNLOCK THE NEXT'}
        </p>
      </div>

      <Mascot message="Tap each tile to read what the software does. They unlock in order — once you've opened all 6, the next button takes you to upload your login screenshots." />

      {/* Software detail modal */}
      {activeTile && activeSoftware && (
        <SoftwareModal tile={activeTile} sw={activeSoftware} onClose={closeModal} />
      )}
    </section>
  );
}

function SoftwareModal({ tile, sw, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 fade-up"
      onClick={onClose}
    >
      <div
        className="card-dark relative w-full max-w-lg p-6 md:p-7 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
          style={{ background: 'var(--deep-plum)', color: 'var(--milk)', border: '1px solid var(--soft-lavender)' }}
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 flex items-center justify-center rounded-xl shrink-0 shadow-[0_4px_0_rgba(0,0,0,0.5)] border-[3px] border-black/30"
            style={{ background: tile.color }}
          >
            {tile.icon ? (
              <span className="text-3xl leading-none">{tile.icon}</span>
            ) : (
              <span className="font-pixel text-xl text-eb-milk tracking-widest">{tile.abbr}</span>
            )}
          </div>
          <div>
            <p className="font-pixel text-[0.5rem] text-eb-plum tracking-widest">▸ SOFTWARE</p>
            <div className="font-black text-xl text-eb-ink">{sw.name}</div>
            <div className="text-[0.7rem] text-eb-mid-plum font-extrabold uppercase tracking-wider mt-0.5">
              {sw.tagline}
            </div>
          </div>
        </div>

        <p className="text-sm text-eb-ink font-semibold leading-relaxed">
          {sw.description}
        </p>

        <a
          href={sw.loginUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg p-3 transition hover:brightness-110"
          style={{
            background: 'var(--deep-plum)',
            border: '2px solid var(--light-plum)',
            color: 'var(--milk)',
          }}
        >
          <p className="font-pixel text-[0.5rem] mb-1.5" style={{ color: 'var(--soft-lavender)' }}>🔗 LOGIN LINK</p>
          <span className="block text-xs font-bold underline underline-offset-2 break-all" style={{ color: 'var(--milk)' }}>
            {sw.loginUrl}
          </span>
        </a>

        <button
          type="button"
          onClick={onClose}
          className="btn-pixel font-body text-sm mt-1 self-end"
        >
          ✓ Got it
        </button>
      </div>
    </div>
  );
}
