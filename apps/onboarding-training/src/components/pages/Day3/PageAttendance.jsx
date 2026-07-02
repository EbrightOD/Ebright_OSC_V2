import { useState } from 'react';
import TrainingSection from '../../shared/TrainingSection';
import Photobooth from '../../shared/Photobooth';
import { useLockGate } from '../../../hooks/usePageGate';

export default function PageAttendanceDay3() {
  const [strip, setStrip] = useState(null);

  useLockGate(!!strip, 'Print your Day 3 photo strip to unlock');

  return (
    <TrainingSection
      day={3}
      eyebrow="▸ STEP 1 · ATTENDANCE"
      title="ATTENDANCE PHOTOBOOTH"
      intro="Last day! Hop in the kiosk, pick a prop, and let the booth dispense your Day 3 strip."
      mascotMessage="Final day check-in! Step into the booth, pick a prop, hit START CAPTURE — two snaps and your Day 3 strip is in your hands."
    >
      <div className="w-full">
        <Photobooth
          day={3}
          instruction="Last-day check-in — 2 photos & your strip prints"
          onCapture={setStrip}
        />
      </div>
    </TrainingSection>
  );
}
