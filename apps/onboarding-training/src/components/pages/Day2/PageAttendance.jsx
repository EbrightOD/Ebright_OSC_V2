import { useState } from 'react';
import TrainingSection from '../../shared/TrainingSection';
import Photobooth from '../../shared/Photobooth';
import { useLockGate } from '../../../hooks/usePageGate';

export default function PageAttendanceDay2() {
  const [strip, setStrip] = useState(null);

  useLockGate(!!strip, 'Print your Day 2 photo strip to unlock');

  return (
    <TrainingSection
      day={2}
      eyebrow="▸ STEP 1 · ATTENDANCE"
      title="ATTENDANCE PHOTOBOOTH"
      intro="Step into the kiosk. Pick a prop, hit START CAPTURE, and the booth will snap two photos and print your Day 2 strip."
      mascotMessage="Hop into the photobooth! Pick a prop, hit START CAPTURE, smile for two snaps — your Day 2 strip prints and you're checked in."
    >
      <div className="w-full">
        <Photobooth
          day={2}
          instruction="Step into the booth — 2 photos & you're checked in"
          onCapture={setStrip}
        />
      </div>
    </TrainingSection>
  );
}
