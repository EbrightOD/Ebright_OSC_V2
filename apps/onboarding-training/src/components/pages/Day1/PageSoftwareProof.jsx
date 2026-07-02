import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SOFTWARE_LIST } from '../../../data/constants';
import Mascot from '../../shared/Mascot';
import ScreenshotUploader from '../../shared/ScreenshotUploader';
import { useLockGate, useNavOverride } from '../../../hooks/usePageGate';

const PAGE_SIZE = 3;
const PAGES = [];
for (let i = 0; i < SOFTWARE_LIST.length; i += PAGE_SIZE) {
  PAGES.push(SOFTWARE_LIST.slice(i, i + PAGE_SIZE));
}
const LAST_STEP = PAGES.length - 1;

export default function PageSoftwareProof() {
  const navigate = useNavigate();
  const [proofs, setProofs] = useState({});
  const [step, setStep] = useState(0);

  const collected = SOFTWARE_LIST.filter((s) => proofs[s.id]).length;
  const allDone = collected === SOFTWARE_LIST.length;
  const onLastStep = step === LAST_STEP;

  // Lock only on the final step until every screenshot is in. Earlier
  // steps unlock as soon as you finish that page's 3 uploads.
  const currentPageDone = PAGES[step].every((s) => proofs[s.id]);
  useLockGate(
    onLastStep ? allDone : currentPageDone,
    onLastStep
      ? `Submit all ${SOFTWARE_LIST.length} login screenshots to unlock`
      : `Upload this page's ${PAGE_SIZE} screenshots to continue`,
  );

  // BottomNav arrows step internally until the final page, then advance route.
  const handleNext = useCallback(() => {
    if (step < LAST_STEP) setStep(step + 1);
    else navigate('/day1/software-game');
  }, [step, navigate]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  useNavOverride({
    onNext: handleNext,
    onPrev: step > 0 ? handlePrev : undefined,
  });

  return (
    <section className="relative min-h-page px-4 py-8 overflow-hidden fade-up bg-eb-walnut-gradient">
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,212,0.06) 0%, rgba(26,11,31,0.30) 75%)' }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center gap-5">
        <div
          className="px-4 py-2 font-pixel text-eb-chalk text-sm"
          style={{
            background: 'var(--ebright-red)',
            boxShadow: '0 4px 0 var(--red-dark)',
            clipPath: 'polygon(0 0,95% 0,100% 18%,100% 100%,5% 100%,0 82%)',
          }}
        >
          DAY 1
        </div>
        <p className="pixel-eyebrow text-xs">▸ PROOF SUBMISSION</p>
        <h1 className="pixel-title text-2xl md:text-4xl text-center">
          UPLOAD YOUR LOGIN PROOF
        </h1>
        <p className="text-sm md:text-base text-eb-chalk/85 font-semibold text-center max-w-2xl">
          For each software, click the login link, sign in with your company email, then upload a screenshot of the logged-in screen as proof.
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="font-pixel text-[0.55rem] bg-eb-oak border-2 border-eb-faded-green text-eb-gold px-3 py-2 rounded">
            PAGE {step + 1} / {PAGES.length}
          </div>
          <div className="font-pixel text-[0.55rem] bg-eb-oak border-2 border-eb-red text-eb-red px-3 py-2 rounded">
            📸 LOGINS: {collected} / {SOFTWARE_LIST.length}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          {PAGES[step].map((s) => {
            const isZoom = s.id === 'zoom';
            return (
              <div key={s.id} className="card-dark flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3 pb-2 border-b border-eb-faded-green/50">
                  <div
                    className="w-12 h-12 flex items-center justify-center font-pixel text-base text-eb-chalk shrink-0 rounded-lg"
                    style={{
                      background: s.color,
                      boxShadow: `0 3px 0 ${s.color}99`,
                    }}
                  >
                    {s.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm text-eb-chalk truncate">{s.name}</div>
                    <div className="text-[0.6rem] text-eb-red font-extrabold uppercase tracking-wider mt-0.5 truncate">
                      {s.tagline}
                    </div>
                  </div>
                </div>

                <a
                  href={s.loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded p-2 transition hover:brightness-110 text-[0.6rem]"
                  style={{
                    background: 'var(--deep-plum)',
                    border: '2px solid var(--light-plum)',
                  }}
                >
                  <span className="font-pixel mr-1" style={{ color: 'var(--soft-lavender)' }}>🔗</span>
                  <span className="font-bold underline break-all" style={{ color: 'var(--milk)' }}>{s.loginUrl}</span>
                </a>

                <ScreenshotUploader
                  label={isZoom ? 'INSTALL + LOGIN PROOF' : 'LOGIN SCREENSHOT'}
                  hint={isZoom ? 'Install Zoom + log in, then screenshot' : 'Your logged-in screen'}
                  accent="red"
                  value={proofs[s.id]}
                  onChange={(d) => setProofs((p) => ({ ...p, [s.id]: d }))}
                />
              </div>
            );
          })}
        </div>

        <p className="font-pixel text-[0.5rem] text-eb-gold/80 tracking-widest text-center mt-1">
          {onLastStep
            ? (allDone
                ? '▸ TAP NEXT BELOW TO CONTINUE TO DEVRACER'
                : `▸ UPLOAD ALL ${SOFTWARE_LIST.length} SCREENSHOTS TO UNLOCK NEXT`)
            : (currentPageDone
                ? '▸ TAP NEXT BELOW FOR THE LAST 3 SOFTWARE'
                : `▸ UPLOAD THESE ${PAGE_SIZE} SCREENSHOTS TO UNLOCK NEXT`)}
        </p>
      </div>

      <Mascot message="Three at a time. Log in to each one with your company email, snap a screenshot, then tap the next arrow at the bottom for the remaining three." />
    </section>
  );
}
