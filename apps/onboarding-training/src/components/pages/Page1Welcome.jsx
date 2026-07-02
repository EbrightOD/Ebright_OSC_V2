import { useNavigate } from 'react-router-dom';
import TutorKnight from '../shared/TutorKnight';

export default function Page1Welcome() {
  const navigate = useNavigate();
  const onGetStarted = () => navigate('/day1/ceo');
  return (
    <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden fade-up">
      {/* Classroom photo background — file at react-version/public/classroom-welcome1.jpg */}
      {/* Image is scaled 200% and shifted left by 50% so only the RIGHT half of the original photo shows — hides the watermark/number that's on the left side */}
      <img
        src="/classroom-welcome1.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: 'pixelated',
          transform: 'scale(1.12)',
          transformOrigin: 'right center',
        }}
      />
      {/* Dark vignette so text reads clearly */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.88) 100%)' }} />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
        <p className="font-bold text-base tracking-[0.15em] uppercase text-eb-milk"
           style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>
          Welcome to <span className="text-eb-soft-lavender">ebright</span>
        </p>
        <h1 className="pixel-title text-3xl md:text-5xl">
          START YOUR<br />INDUCTION<br />TRAINING
        </h1>
        <p className="text-lg font-semibold text-eb-milk"
           style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>
          The most fun and engaging way to begin your journey with us. ✦✦
        </p>
        <button
          onClick={onGetStarted}
          className="mt-2 bob inline-flex items-center gap-2 cursor-pointer hover:scale-[1.03] active:translate-y-[2px] transition"
          style={{
            background: '#CB1B03',          /* Ebright Red */
            color: '#FFFFFF',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            padding: '14px 28px',
            border: 'none',
            borderRadius: '6px',
            boxShadow: '0 6px 0 #8C0000, 0 12px 24px rgba(0,0,0,0.5)',
          }}
        >
          GET STARTED
        </button>
      </div>

      {/* Tutor knight mascot — lowered to bottom of viewport */}
      <div className="fixed bottom-2 right-4 w-16 h-20 z-[999] bob-slow cursor-pointer">
        <TutorKnight className="w-full h-full" />
      </div>
    </section>
  );
}
