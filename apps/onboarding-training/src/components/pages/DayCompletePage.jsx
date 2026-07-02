import { useNavigate } from 'react-router-dom';
import Mascot from '../shared/Mascot';

const DAY_COLORS = {
  1: { color: '#d42b2b', accent: '#991f1f', label: 'DAY 1' },
  2: { color: '#3a78c8', accent: '#274f88', label: 'DAY 2' },
  3: { color: '#2db858', accent: '#1f7f3d', label: 'DAY 3' },
};

export default function DayCompletePage({ completedDay, nextDay, nextPath }) {
  const navigate = useNavigate();
  const cfg = DAY_COLORS[completedDay] || DAY_COLORS[1];

  return (
    <section className="relative min-h-page flex items-center justify-center px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-5 text-center">
        <div
          className="px-4 py-2 font-extrabold text-eb-white text-sm rounded-md tracking-wider"
          style={{
            background: cfg.color,
            boxShadow: `0 1px 4px ${cfg.accent}`,
          }}
        >
          {cfg.label} — COMPLETE
        </div>

        <div className="text-6xl md:text-7xl bob-slow">🎉</div>

        <p className="pixel-eyebrow text-xs">★ END OF DAY ★</p>
        <h1 className="pixel-title text-2xl md:text-4xl"
            style={{ textShadow: '4px 4px 0 var(--red-dark), 8px 8px 0 rgba(0,0,0,.7)' }}>
          GREAT JOB!<br />SEE YOU ON DAY {nextDay}
        </h1>
        <p className="text-sm md:text-base text-yellow-300 font-semibold max-w-xl"
           style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>
          You have completed your <span className="text-white">Day {completedDay}</span> training. Take the rest of the day to settle in — you'll continue your <span className="text-white">Day {nextDay}</span> training when you next come in.
        </p>

        <div className="card-dark px-6 py-4 mt-2 w-full max-w-md">
          <p className="font-pixel text-[0.6rem] text-eb-yellow mb-2">⚡ ON DAY {nextDay}</p>
          <p className="text-sm text-white/80 font-semibold text-left">
            Day {nextDay} starts with your <span className="text-eb-yellow">Attendance Report</span> — snap a photo at the receptionist counter at 8:45.
          </p>
        </div>

        <button
          onClick={() => nextPath && navigate(nextPath)}
          disabled={!nextPath}
          className="btn-pixel mt-3 font-body text-base"
        >
          ▶ Start Day {nextDay}
        </button>
      </div>

      <Mascot message={`You've finished Day ${completedDay}! Rest up — I'll see you on Day ${nextDay}, 8:45 sharp at the receptionist counter.`} />
    </section>
  );
}
