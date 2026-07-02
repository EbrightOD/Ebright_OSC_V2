import { useEffect, useState } from 'react';

/**
 * Sticky bottom continue bar with a lock → unlock animation.
 *
 *   <LockedContinueBar
 *     unlocked={photoUploaded}
 *     lockedHint="🔒 Upload your 8:45 photo to unlock"
 *     label="▶ Submit & Continue"
 *     onContinue={() => navigate('/day2/clickup')}
 *   />
 */
export default function LockedContinueBar({
  unlocked,
  lockedHint = '🔒 Complete this step to unlock',
  label = '▶ Continue',
  onContinue,
}) {
  const [justUnlocked, setJustUnlocked] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    setJustUnlocked(true);
    const t = setTimeout(() => setJustUnlocked(false), 1200);
    return () => clearTimeout(t);
  }, [unlocked]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] backdrop-blur-md border-t-2 border-eb-border-1 px-4 py-4 flex justify-center"
      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.95) 100%)' }}
    >
      <button
        onClick={unlocked ? onContinue : undefined}
        disabled={!unlocked}
        className={`px-8 py-3 font-pixel text-[0.65rem] md:text-[0.75rem] rounded-md transition-colors duration-300 tracking-wider ${
          unlocked
            ? `bg-eb-red text-white hover:bg-eb-red-bright cursor-pointer ${justUnlocked ? 'eb-unlock-pulse' : ''}`
            : 'bg-eb-surface-3 text-white/40 border-eb-border-1 border-eb-border-3 cursor-not-allowed'
        }`}
        style={
          unlocked && !justUnlocked
            ? { boxShadow: '0 6px 0 var(--red-dark), 0 0 24px rgba(212,43,43,0.45)' }
            : undefined
        }
      >
        {unlocked ? label : lockedHint}
      </button>
    </div>
  );
}
