import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RacerMinigame from '../../minigames/RacerMinigame';
import Mascot from '../../shared/Mascot';
import { useLockGate } from '../../../hooks/usePageGate';

export default function PageSoftwareGame() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);

  useLockGate(won, 'Finish the DevRacer quiz to unlock');

  if (started) {
    return (
      <RacerMinigame
        onComplete={() => { setWon(true); navigate('/day1/policy'); }}
        onClose={() => setStarted(false)}
      />
    );
  }

  return (
    <section className="relative min-h-page flex items-center justify-center px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-5 text-center">
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
        <h1 className="pixel-title text-2xl md:text-4xl">
          DEVRACER QUIZ
        </h1>
        <p className="text-sm md:text-base text-eb-milk font-semibold max-w-xl">
          Each question pops up before the round starts. Memorise it, then drive into the correct A/B/C/D answer box on the road. 8 questions, 3 lives.
        </p>

        <div className="card-dark px-6 py-5 mt-2 w-full">
          <p className="font-pixel text-[0.6rem] text-eb-plum mb-3">▸ HOW TO PLAY</p>
          <ul className="text-sm text-white/80 font-semibold space-y-1.5 text-left">
            <li>⬅️ ➡️ ⬆️ ⬇️ Use arrow keys (or WASD) to steer</li>
            <li>📋 Read the question popup, then tap to start the round</li>
            <li>🎯 Drive into the box matching the correct answer</li>
            <li>⭐ Star (Mario Kart style) = invincibility + smash rocks for points</li>
            <li>🛢 Oil slick = spin out (no HP lost)</li>
            <li>🪨 Rock = crash and lose 1 HP (you have 3)</li>
            <li>🏁 Answer all 8 questions to win and continue</li>
          </ul>
        </div>

        <button onClick={() => setStarted(true)} className="btn-pixel mt-2 font-body text-base">
          ▶ Start Engine
        </button>
      </div>

      <Mascot message="Read the question popup, steer for the correct A/B/C/D box, dodge rocks. Grab a star to go invincible — Mario Kart style — and smash rocks for bonus points." />
    </section>
  );
}
