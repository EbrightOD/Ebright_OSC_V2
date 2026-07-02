import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BlackoutMinigame from '../../minigames/BlackoutMinigame';
import Mascot from '../../shared/Mascot';
import { useLockGate } from '../../../hooks/usePageGate';

export default function PageDeptGame() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);

  useLockGate(won, 'Finish the Ebright Office game to unlock');

  if (started) {
    return (
      <BlackoutMinigame
        onComplete={() => { setWon(true); navigate('/day1/software'); }}
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
          EBRIGHT OFFICE
        </h1>
        <p className="text-sm md:text-base text-white/70 font-semibold max-w-xl">
          The lights have gone out at HQ! Find each Head of Department in the dark and drop them back into their correct department room.
        </p>

        <div className="card-dark px-6 py-5 mt-2 w-full">
          <p className="font-pixel text-[0.55rem] text-eb-plum mb-3">▸ HOW TO PLAY</p>
          <ul className="text-sm text-eb-ink font-semibold space-y-1.5 text-left">
            <li>🔦 Move your mouse to shine the flashlight</li>
            <li>✋ Click & hold a HOD to pick them up</li>
            <li>🏠 Drop them in their correct department room</li>
          </ul>
        </div>

        <button onClick={() => setStarted(true)} className="btn-pixel mt-2 font-body text-base">
          ▶ Enter the Office
        </button>
      </div>

      <Mascot message="The lights have gone out at HQ! All 6 Heads of Department are wandering around in the dark. Use your flashlight to find them and drag each one back to their correct department room." />
    </section>
  );
}
