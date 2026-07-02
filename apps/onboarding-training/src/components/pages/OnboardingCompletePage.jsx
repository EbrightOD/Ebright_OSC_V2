import Mascot from '../shared/Mascot';
import { useOnboardingState } from '../../hooks/useOnboardingState';

export default function OnboardingCompletePage() {
  const { state } = useOnboardingState();
  const avatar = state.villageProgress.selectedAvatar;

  return (
    <section className="relative min-h-page flex items-center justify-center px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-5 text-center">
        <div className="text-7xl md:text-8xl bob-slow" style={{ filter: 'drop-shadow(0 0 18px rgba(245,197,24,0.8))' }}>
          🏆
        </div>

        <div
          className="px-4 py-2 font-extrabold text-eb-dark text-sm rounded-md tracking-wider"
          style={{
            background: '#f5c518',
            boxShadow: '0 1px 4px #c89a00',
          }}
        >
          ★ ALL 3 DAYS COMPLETE ★
        </div>

        <p className="pixel-eyebrow text-xs">▸ THE TEAM WELCOMES YOU</p>
        <h1 className="pixel-title text-2xl md:text-4xl"
            style={{ textShadow: '4px 4px 0 var(--red-dark), 8px 8px 0 rgba(0,0,0,.7)' }}>
          INDUCTION TRAINING<br />COMPLETE
        </h1>
        <p className="text-sm md:text-base text-yellow-300 font-semibold max-w-xl"
           style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>
          {avatar ? (
            <>Congratulations <span className="text-white">{avatar.name}</span>! </>
          ) : (
            <>Congratulations! </>
          )}
          You've finished every Day 1, Day 2 and Day 3 task. You're officially part of the ebright team.
        </p>

        <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-2">
          <div className="card-dark px-3 py-3 text-center">
            <div className="font-pixel text-[0.55rem] text-eb-yellow mb-1">DAYS</div>
            <div className="font-black text-lg text-white">3 / 3</div>
          </div>
          <div className="card-dark px-3 py-3 text-center">
            <div className="font-pixel text-[0.55rem] text-eb-yellow mb-1">GAMES</div>
            <div className="font-black text-lg text-white">4</div>
          </div>
          <div className="card-dark px-3 py-3 text-center">
            <div className="font-pixel text-[0.55rem] text-eb-yellow mb-1">VIDEOS</div>
            <div className="font-black text-lg text-white">3</div>
          </div>
        </div>

        <div className="card-dark px-6 py-4 mt-2 w-full max-w-md">
          <p className="font-pixel text-[0.6rem] text-eb-yellow mb-2">⚡ WHAT'S NEXT</p>
          <p className="text-sm text-white/80 font-semibold text-left">
            Your Branch Manager will reach out with your full schedule. Welcome to the team — we can't wait to see you build, teach, and grow with us.
          </p>
        </div>

      </div>

      <Mascot message={`That's a wrap${avatar ? `, ${avatar.name}` : ''}! You've completed all 3 days of induction. Welcome aboard — the ebright team is glad to have you.`} />
    </section>
  );
}
