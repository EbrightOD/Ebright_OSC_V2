import { useLocation } from 'react-router-dom';
import { PROGRESS_STEPS } from '../../data/constants';

function isMatch(pathname, step) {
  return step.matches.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(m + '/')));
}

export default function ProgressBar() {
  const { pathname } = useLocation();
  const activeIdx = PROGRESS_STEPS.findIndex((s) => isMatch(pathname, s));
  const idx = activeIdx === -1 ? 0 : activeIdx;

  return (
    <div className="fixed top-0 left-0 right-0 z-[190] bg-[#1a1a1a] border-b border-eb-border-1 pl-[152px] pr-8 py-2.5 flex items-center gap-2 overflow-x-auto">
      {PROGRESS_STEPS.map((step, i) => {
        const isActive = i === idx;
        const isDone = i < idx;
        const cls = isActive ? 'text-white' : isDone ? 'text-white/60' : 'text-white/35';
        const pipBg = isActive ? 'bg-eb-red border-eb-red-bright' : isDone ? 'bg-eb-red-dark border-eb-red' : 'bg-eb-surface-4 border-eb-border-3';
        return (
          <div key={step.id} className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-2 ${cls} text-[0.65rem] font-bold whitespace-nowrap`}>
              <div className={`${pipBg} w-6 h-6 rounded-full border-eb-border-1 flex items-center justify-center text-[0.6rem] font-extrabold text-white shrink-0`}>
                {step.id}
              </div>
              <span>{step.label}</span>
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded min-w-[10px] max-w-[40px] ${isDone ? 'bg-eb-red-dark' : 'bg-eb-surface-4'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
