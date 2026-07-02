import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MCQQuizModal from '../../minigames/MCQQuizModal';
import Mascot from '../../shared/Mascot';
import { useLockGate } from '../../../hooks/usePageGate';

export default function PagePolicyGame() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);

  useLockGate(won, 'Finish the Policy quiz to unlock');

  if (started) {
    return (
      <MCQQuizModal
        levelId={1}
        xp={20}
        onComplete={() => { setWon(true); navigate('/day1/syllabus'); }}
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
          POLICY & COMPLIANCE
        </h1>
        <p className="text-sm md:text-base text-eb-milk font-semibold max-w-xl">
          Multiple-choice quiz on the policies you just read. You need <span className="text-white">60%</span> to pass.
        </p>

        <div className="card-dark px-6 py-5 mt-2 w-full">
          <p className="font-pixel text-[0.6rem] text-eb-plum mb-3">▸ HOW TO PLAY</p>
          <ul className="text-sm text-white/80 font-semibold space-y-1.5 text-left">
            <li>📋 8 questions covering every policy area</li>
            <li>✅ Pick the best answer — feedback shown immediately</li>
            <li>🏆 60% or higher passes you to the next section</li>
            <li>🔄 Below 60%? Retry the quiz from the top</li>
          </ul>
        </div>

        <button onClick={() => setStarted(true)} className="btn-pixel mt-2 font-body text-base">
          ▶ Start Quiz
        </button>
      </div>

      <Mascot message="Let's see how well you remember the policies. Eight quick multiple-choice questions — score 60% or better to pass." />
    </section>
  );
}
