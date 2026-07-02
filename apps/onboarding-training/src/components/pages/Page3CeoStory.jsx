import { useEffect, useState } from 'react';
import { PEOPLE } from '../../data/constants';
import TrainingSection from '../shared/TrainingSection';
import { useLockGate } from '../../hooks/usePageGate';

// Mock CEO video — duration in seconds. Sets the lock timer.
const VIDEO_DURATION = 8;

export default function Page3CeoStory() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0 → 100
  const [completed, setCompleted] = useState(false);

  // Gate: locked until the video has been fully watched
  useLockGate(completed, 'Watch the CEO video to unlock');

  // Tick progress while playing
  useEffect(() => {
    if (!playing || completed) return;
    const step = 100 / (VIDEO_DURATION * 4);
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + step;
        if (next >= 100) {
          clearInterval(id);
          setPlaying(false);
          setCompleted(true);
          return 100;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [playing, completed]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (completed) return;
    setPlaying((p) => !p);
  };

  const secondsLeft = Math.max(0, Math.ceil(VIDEO_DURATION - (progress / 100) * VIDEO_DURATION));

  return (
    <TrainingSection
      day={1}
      eyebrow="▸ MEET OUR CEO"
      title="FROM ONE STUDENT TO 1,050+"
      intro="Press play and watch the CEO's full message — the next button unlocks the moment the video finishes."
      mascotMessage="Press play and watch the CEO's full message — the next button unlocks the moment the video finishes."
    >
      {/* One wide unified card — video LEFT, story RIGHT */}
      <div className="card-dark p-6 md:p-8 w-full max-w-6xl flex flex-col gap-6">
        {/* CEO header row */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3a1a1a] to-[#2a1010] border-[3px] border-eb-red flex items-center justify-center text-5xl pulse-pixel shrink-0">
            👨‍💼
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-pixel text-[0.5rem] text-eb-red-bright tracking-widest mb-1">▸ MEET OUR CEO</p>
            <p className="font-black text-2xl text-eb-chalk">{PEOPLE.ceo.title} {PEOPLE.ceo.name}</p>
            <p className="text-sm text-eb-chalk/60 font-semibold">{PEOPLE.ceo.role}</p>
          </div>
        </div>

        {/* Side-by-side: video LEFT, description RIGHT */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Video */}
          <div className="flex flex-col gap-3">
            <div
              className={`w-full aspect-video border-2 rounded-lg relative overflow-hidden ${
                completed ? 'border-eb-green' : 'border-eb-faded-green'
              } ${!completed ? 'cursor-pointer' : ''}`}
              onClick={togglePlay}
              style={{
                background: completed
                  ? 'linear-gradient(135deg, #0a2a14 0%, #062010 100%)'
                  : playing
                    ? 'radial-gradient(circle at 50% 60%, #2a1010 0%, #050505 80%)'
                    : '#000',
              }}
            >
              {playing && !completed && (
                <>
                  <div className="absolute inset-0 opacity-40"
                       style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 4px)' }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="text-7xl bob-slow">👨‍💼</div>
                    <p className="font-pixel text-[0.5rem] text-eb-gold tracking-widest">▶ PLAYING</p>
                  </div>
                </>
              )}
              {completed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="text-7xl">✅</div>
                  <p className="font-pixel text-[0.55rem] text-eb-green tracking-widest">VIDEO COMPLETED</p>
                </div>
              )}
              {!playing && !completed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: '#CB1B03', color: 'var(--parchment)', boxShadow: '0 0 28px rgba(203,27,3,0.55)' }}
                  >▶</div>
                </div>
              )}
              {(playing || completed) && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/70">
                  <div
                    className={`h-full transition-all ${completed ? 'bg-eb-green' : 'bg-eb-red'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              {!playing && !completed && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[0.65rem] text-eb-chalk/40 font-bold">
                  🔊 Click to play
                </span>
              )}
            </div>

            {/* Status line under the video */}
            <p className="text-xs font-bold text-center">
              {completed ? (
                <span className="text-eb-green">✓ You watched the CEO's full message</span>
              ) : playing ? (
                <span className="text-eb-gold">⏱ Watching… {secondsLeft}s remaining</span>
              ) : (
                <span className="text-eb-chalk/55">🔒 Watch the full video to unlock the next step</span>
              )}
            </p>
          </div>

          {/* Description — beside the video */}
          <div className="flex flex-col gap-3 justify-center">
            <p className="pixel-eyebrow text-[0.45rem]">▸ ORIGIN STORY</p>
            <p className="text-base leading-relaxed text-eb-ink font-semibold text-justify hyphens-auto">
              Ebright started in 2016 with a single goal: make world-class public speaking accessible to every Malaysian child.
              Today we serve <span className="text-eb-plum font-extrabold">1,050+ active students</span> across 20 Klang Valley branches, all certified by Trinity College London.
              We don't just teach speaking — we build the kind of voice every student carries with them for life.
            </p>
            <blockquote className="border-l-[3px] border-eb-plum bg-eb-plum/[0.08] p-3.5 rounded-r italic text-eb-ink font-bold mt-1 text-justify">
              "We don't just teach speaking. We build confident humans."
            </blockquote>
          </div>
        </div>
      </div>
    </TrainingSection>
  );
}
