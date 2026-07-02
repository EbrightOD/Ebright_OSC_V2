import { useEffect, useState } from 'react';
import { QUIZ_QUESTIONS } from '../../data/quizzes';
import GamePanel from '../shared/GamePanel';

export default function MCQQuizModal({ levelId, xp, onComplete, onClose }) {
  const questions = QUIZ_QUESTIONS[levelId] || [];
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[800]">
        <GamePanel
          bgVariant="arena"
          accent="yellow"
          badge="QUIZ PENDING"
          title="COMING SOON"
          body={<>The quiz bank for this level isn't configured yet. Skip ahead to earn the XP and continue your adventure.</>}
          primaryAction={{ label: `▶ Skip & Award +${xp} XP`, onClick: () => onComplete(xp) }}
          secondaryAction={{ label: '✕ Close', onClick: onClose }}
        />
      </div>
    );
  }

  const q = questions[idx];

  const answer = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correctAnswer) setScore(s => s + 1);
  };

  const next = () => {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const pct = score / questions.length;
    const passed = pct >= 0.6;
    if (passed) {
      return <SilentSuccess xp={xp} onComplete={onComplete} />;
    }
    return (
      <div className="fixed inset-0 z-[800]">
        <GamePanel
          bgVariant="fail"
          accent="red"
          badge="TRY AGAIN"
          subtitle="📋 Re-attempt the Quiz"
          title={'NOT QUITE...'}
          body={<>You scored <strong className="text-eb-yellow">{score} / {questions.length}</strong>. You need 60% to pass — review the lesson and have another go.</>}
          primaryAction={{ label: '🔄 RETRY QUIZ', onClick: () => { setIdx(0); setPicked(null); setScore(0); setDone(false); } }}
          secondaryAction={{ label: '✕ Close', onClick: onClose }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[800] flex flex-col items-center justify-center p-6 gap-4"
         style={{
           background:
             'linear-gradient(180deg, var(--deep-plum) 0%, var(--plum) 33%, var(--mid-plum) 66%, var(--light-plum) 100%)',
         }}>
      <div className="font-pixel text-[0.55rem] text-eb-soft-lavender">
        QUESTION {idx + 1} / {questions.length} · NEED 60% TO PASS
      </div>
      <div className="card-dark p-6 max-w-xl w-full">
        <h3 className="text-base font-extrabold text-eb-plum mb-4 leading-relaxed">{q.question}</h3>
        <div className="space-y-2 mb-4">
          {q.options.map((o, i) => {
            const showAnswer = picked !== null;
            const variant = !showAnswer
              ? ''
              : i === q.correctAnswer
                ? 'quiz-option--correct'
                : i === picked
                  ? 'quiz-option--picked-wrong'
                  : 'quiz-option--dim';
            return (
              <button key={i} onClick={() => answer(i)} disabled={picked !== null}
                className={`quiz-option ${variant}`}>
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <>
            <div className="bg-eb-plum/10 border-l-[3px] border-eb-plum rounded-r p-3 text-sm font-semibold text-eb-plum mb-3">
              {picked === q.correctAnswer ? '✓ Correct! ' : '✗ '}{q.explanation}
            </div>
            <button onClick={next} className="btn-pixel font-body w-full">
              {idx < questions.length - 1 ? '▶ Next question' : '▶ See result'}
            </button>
          </>
        )}
      </div>
      <button onClick={onClose} className="text-eb-milk hover:text-eb-soft-lavender text-sm font-bold">Cancel</button>
    </div>
  );
}

function SilentSuccess({ xp, onComplete }) {
  // No celebration screen — fire onComplete so the wrapper page can
  // navigate to the next route immediately.
  useEffect(() => {
    onComplete?.(xp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
