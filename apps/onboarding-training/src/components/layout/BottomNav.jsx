import { useLocation, useNavigate } from 'react-router-dom';
import { TRAINING_SEQUENCE } from '../../data/constants';
import { usePageGate } from '../../hooks/usePageGate';

const PRE_TRAINING = [
  { path: '/', label: 'Welcome' },
];

const FULL_FLOW = [
  ...PRE_TRAINING,
  ...TRAINING_SEQUENCE.map((s) => ({ path: s.path, label: s.label, day: s.day })),
];

// Paths that should NOT show the BottomNav at all.
const HIDDEN_PATHS = new Set([
  '/', '/day1', '/day1/welcome',
]);

export function isBottomNavHidden(pathname) {
  return HIDDEN_PATHS.has(pathname);
}

// Normalize alias paths so /day1 and /day1/welcome both map to /
function normalize(pathname) {
  if (pathname === '/day1' || pathname === '/day1/welcome') return '/';
  return pathname;
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { unlocked, lockReason, nextHandler, prevHandler } = usePageGate();

  if (HIDDEN_PATHS.has(pathname)) return null;

  const idx = FULL_FLOW.findIndex((s) => s.path === normalize(pathname));
  const safeIdx = Math.max(0, idx);
  const prev = FULL_FLOW[safeIdx - 1];
  const next = FULL_FLOW[safeIdx + 1];
  const current = idx === -1 ? null : FULL_FLOW[safeIdx];

  // If a page has installed handlers, those take precedence over routing.
  const hasNext = !!nextHandler || !!next;
  const nextDisabled = !hasNext || !unlocked;
  const hasPrev = !!prevHandler || !!prev;

  const onPrevClick = () => {
    if (!hasPrev) return;
    if (prevHandler) prevHandler();
    else if (prev) navigate(prev.path);
  };
  const onNextClick = () => {
    if (nextDisabled) return;
    if (nextHandler) nextHandler();
    else if (next) navigate(next.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[190] bg-black/95 backdrop-blur-md border-t border-eb-border-1 flex items-center justify-between px-4 py-2 gap-3">
      <button
        type="button"
        onClick={onPrevClick}
        disabled={!hasPrev}
        title={prevHandler ? 'Previous step' : prev ? `Prev: ${prev.label}` : 'No previous'}
        className="w-9 h-9 font-extrabold text-lg rounded bg-eb-surface-4 text-white/70 hover:bg-eb-border-3 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
      >
        ‹
      </button>
      <span className="text-[0.5rem] md:text-[0.55rem] font-pixel text-eb-yellow tracking-widest text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[55vw]">
        {idx === -1
          ? '—'
          : !unlocked && lockReason
            ? `🔒 ${lockReason}`
            : `${current?.label} · ${safeIdx + 1}/${FULL_FLOW.length}`}
      </span>
      <button
        type="button"
        onClick={onNextClick}
        disabled={nextDisabled}
        title={
          !hasNext
            ? 'No next'
            : !unlocked
              ? (lockReason || 'Complete this page to unlock')
              : nextHandler
                ? 'Next step'
                : `Next: ${next.label}`
        }
        className="w-9 h-9 font-extrabold text-lg rounded bg-eb-red text-white shadow-[0_3px_0_var(--red-dark)] hover:bg-eb-red-bright disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {!hasNext ? '›' : !unlocked ? '🔒' : '›'}
      </button>
    </div>
  );
}
