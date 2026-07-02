import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainingSection from '../../shared/TrainingSection';
import ScreenshotUploader from '../../shared/ScreenshotUploader';

export default function PageZoom() {
  const navigate = useNavigate();
  const [proof, setProof] = useState(null);

  return (
    <TrainingSection
      day={2}
      eyebrow="▸ STEP 8 · ZOOM"
      title="ZOOM — LOGIN VERIFICATION"
      intro="Log in to Zoom using your company email — HQ or branch — then submit a screenshot of your logged-in dashboard as proof."
      mascotMessage="By now Zoom should already be installed on your device (you did this on Day 1). Log in with your ebright email and snap the dashboard."
    >
      <div className="card-dark p-5 w-full max-w-3xl">
        <p className="font-pixel text-[0.6rem] text-eb-yellow mb-3">▸ HOW TO LOG IN</p>
        <ol className="text-sm text-white/80 font-semibold space-y-2 text-left list-decimal list-inside">
          <li>Open the Zoom app on your device (or the web client).</li>
          <li>Click <span className="text-eb-red">"Sign In"</span>.</li>
          <li>Use your company email — <span className="text-white">HQ or branch office</span> — and your set password.</li>
          <li>Once you're on the home / meetings screen, screenshot the page.</li>
          <li>Upload the screenshot below as proof.</li>
        </ol>
      </div>

      <a href="https://zoom.us/signin" target="_blank" rel="noopener noreferrer"
         className="text-eb-soft-lavender font-bold underline underline-offset-2 hover:text-eb-red text-sm">
        🔗 Open Zoom Sign-In
      </a>

      <div className="w-full max-w-2xl">
        <ScreenshotUploader
          label="ZOOM LOGIN SCREENSHOT (REQUIRED)"
          hint="Screenshot showing your logged-in Zoom dashboard"
          accent="red"
          value={proof}
          onChange={setProof}
        />
      </div>

      <button
        onClick={() => navigate('/day2/video')}
        disabled={!proof}
        className="btn-pixel font-body text-base"
      >
        {proof ? '▶ Continue to Video Submission' : 'Upload login screenshot to continue'}
      </button>
    </TrainingSection>
  );
}
