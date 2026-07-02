import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from '../../shared/Mascot';

export default function PageHQTour() {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

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
          DAY 1 — FINAL STOP
        </div>
        <p className="pixel-eyebrow text-xs">▸ TRAINING</p>
        <h1 className="pixel-title text-2xl md:text-4xl">
          HQ TOUR
        </h1>
        <p className="text-base md:text-lg text-eb-soft-lavender font-bold max-w-xl">
          Your host will bring you on a tour!
        </p>

        <div className="card-dark px-6 py-5 mt-2 w-full">
          <p className="font-pixel text-[0.6rem] text-eb-yellow mb-3">▸ WHAT TO EXPECT</p>
          <ul className="text-sm text-white/80 font-semibold space-y-2 text-left">
            <li className="flex gap-2"><span className="text-eb-yellow shrink-0">▸</span><span>Meet your host at the receptionist counter.</span></li>
            <li className="flex gap-2"><span className="text-eb-yellow shrink-0">▸</span><span>They'll walk you through every team area, classroom, and key facility.</span></li>
            <li className="flex gap-2"><span className="text-eb-yellow shrink-0">▸</span><span>Ask questions freely — this is your chance to learn the layout.</span></li>
            <li className="flex gap-2"><span className="text-eb-yellow shrink-0">▸</span><span>Once the tour is done, click below to wrap up Day 1.</span></li>
          </ul>
        </div>

        {!confirmed ? (
          <button onClick={() => setConfirmed(true)} className="btn-pixel mt-2 font-body text-base">
            ✓ Tour Completed
          </button>
        ) : (
          <button onClick={() => navigate('/day1/complete')} className="btn-pixel mt-2 font-body text-base">
            ▶ Finish Day 1
          </button>
        )}
      </div>

      <Mascot message="Your host is on the way! Stay near the receptionist counter — they'll show you every corner of HQ. Once you're back, mark the tour complete." />
    </section>
  );
}
