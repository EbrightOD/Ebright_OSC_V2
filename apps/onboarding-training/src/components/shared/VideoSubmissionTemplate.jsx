import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from './Mascot';
import { useLockGate } from '../../hooks/usePageGate';

const DAY_COLORS = {
  1: { color: '#d42b2b', accent: '#991f1f' },
  2: { color: '#3a78c8', accent: '#274f88' },
  3: { color: '#2db858', accent: '#1f7f3d' },
};

export default function VideoSubmissionTemplate({
  day,
  title,
  prompt,
  exampleLabel,
  exampleVideoUrl,    // optional URL of the example clip
  showExample = true,
  nextPath,
  nextLabel = '▶ Submit & Continue',
  mascotMessage,
}) {
  const navigate = useNavigate();
  const cfg = DAY_COLORS[day] || DAY_COLORS[1];
  const fileRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useLockGate(submitted, 'Submit your video to unlock');

  useEffect(() => {
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); };
  }, [videoUrl]);

  const onPick = (file) => {
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setSubmitted(false);
  };

  const onSubmit = () => {
    if (!videoUrl) return;
    setSubmitted(true);
  };

  return (
    <section className="relative min-h-page px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center gap-5">
        <div
          className="px-4 py-2 font-extrabold text-sm rounded-md tracking-wider"
          style={{
            background: 'var(--plum)',
            color: 'var(--parchment)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
          }}
        >
          DAY {day}
        </div>
        <p className="pixel-eyebrow text-xs">▸ VIDEO SUBMISSION</p>
        <h1 className="pixel-title text-2xl md:text-4xl text-center">
          {title.toUpperCase()}
        </h1>
        <p className="text-sm md:text-base text-eb-milk font-semibold text-center max-w-2xl">
          {prompt}
        </p>

        {/* Example Video + Submission — side by side on md+ */}
        <div className={`grid grid-cols-1 ${showExample ? 'md:grid-cols-2' : ''} gap-4 w-full`}>
          {showExample && (
            <div className="card-dark p-4 md:p-5 w-full">
              <p className="font-pixel text-[0.6rem] text-eb-plum mb-3">▸ {exampleLabel || 'EXAMPLE VIDEO'}</p>
              {exampleVideoUrl ? (
                <video src={exampleVideoUrl} controls className="w-full aspect-video bg-black rounded-lg" style={{ border: '2px solid var(--plum)' }} />
              ) : (
                <div
                  className="w-full aspect-video bg-black rounded-lg flex flex-col items-center justify-center gap-2"
                  style={{ border: '2px solid var(--plum)' }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: '#CB1B03', color: 'var(--parchment)', boxShadow: '0 0 24px rgba(203,27,3,0.45)' }}
                  >▶</div>
                  <p className="font-pixel text-[0.55rem]" style={{ color: 'var(--parchment)' }}>EXAMPLE VIDEO</p>
                  <p className="text-xs font-bold" style={{ color: 'rgba(236,227,189,0.65)' }}>Tap to play (placeholder)</p>
                </div>
              )}
            </div>
          )}

          {/* Recording / upload */}
          <div className="card-dark p-4 md:p-5 w-full">
            <p className="font-pixel text-[0.6rem] text-eb-plum mb-3">▸ YOUR VIDEO</p>
            {videoUrl ? (
              <div className="flex flex-col gap-3">
                <video src={videoUrl} controls
                       className="w-full aspect-video bg-black rounded-lg" style={{ border: '2px solid var(--plum)' }} />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 rounded font-bold text-xs transition"
                    style={{ background: 'var(--parchment)', color: 'var(--plum)', border: '2px solid var(--plum)' }}
                  >
                    🔄 Re-record / Re-upload
                  </button>
                  {!submitted ? (
                    <button onClick={onSubmit} className="btn-pixel font-body text-sm">
                      ✓ Submit
                    </button>
                  ) : (
                    <span className="font-pixel text-[0.55rem] px-3 py-2 rounded"
                          style={{ color: 'var(--green)', border: '2px solid var(--green)', background: 'rgba(45,184,88,0.15)' }}>
                      ✓ SUBMITTED
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-video rounded-lg flex flex-col items-center justify-center gap-2 transition hover:brightness-95"
                style={{
                  background: 'rgba(55, 25, 49, 0.06)',
                  border: '3px dashed var(--plum)',
                  color: 'var(--plum)',
                }}
              >
                <div className="text-4xl">📹</div>
                <p className="font-pixel text-[0.6rem]" style={{ color: 'var(--plum)' }}>RECORD OR UPLOAD</p>
                <p className="text-xs font-bold" style={{ color: 'var(--ink-soft)' }}>Tap to use camera or pick a file</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              capture="user"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </div>
        </div>

        {nextPath && (
          <button
            onClick={() => navigate(nextPath)}
            disabled={!submitted}
            className="btn-pixel mt-2 font-body text-base"
          >
            {submitted ? nextLabel : 'Submit your video to continue'}
          </button>
        )}
      </div>

      <Mascot message={mascotMessage} />
    </section>
  );
}
