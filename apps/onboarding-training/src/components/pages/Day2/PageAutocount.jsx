import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainingSection from '../../shared/TrainingSection';
import ScreenshotUploader from '../../shared/ScreenshotUploader';

const LOGIN_STEPS = [
  'Open the Autocount Payroll login page.',
  'Enter your company email + temporary password (sent by HR).',
  'On first login, set your own password and verify your IC / NRIC.',
  'Land on the dashboard — you should see your name and current month.',
];

const CLAIM_STEPS = [
  'Click "Claims" in the left sidebar.',
  'Click "+ New Claim" — pick the claim category (transport, meal, training, etc.).',
  'Fill in the date, amount, and a short description.',
  'Attach the receipt photo / PDF as supporting evidence.',
  'Submit. Your manager + HR will review and approve.',
];

export default function PageAutocount() {
  const navigate = useNavigate();
  const [proof, setProof] = useState(null);

  return (
    <TrainingSection
      day={2}
      eyebrow="▸ STEP 5 · AUTOCOUNT PAYROLL"
      title="AUTOCOUNT — LOGIN & CLAIMS"
      intro="Learn how to log into Autocount Payroll and submit a claim. Upload a screenshot of your successful login as proof."
      mascotMessage="Autocount handles payroll and claims. Log in once with your company email, then walk through submitting a sample claim. Screenshot your dashboard as proof."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="card-dark p-5">
          <p className="font-pixel text-[0.6rem] text-eb-yellow mb-3">▸ HOW TO LOG IN</p>
          <ol className="text-sm text-white/80 font-semibold space-y-2 text-left list-decimal list-inside">
            {LOGIN_STEPS.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
        <div className="card-dark p-5">
          <p className="font-pixel text-[0.6rem] text-eb-yellow mb-3">▸ HOW TO SUBMIT A CLAIM</p>
          <ol className="text-sm text-white/80 font-semibold space-y-2 text-left list-decimal list-inside">
            {CLAIM_STEPS.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      </div>

      <a href="https://payroll.autocountcloud.com" target="_blank" rel="noopener noreferrer"
         className="text-eb-soft-lavender font-bold underline underline-offset-2 hover:text-eb-red text-sm">
        🔗 Open Autocount Payroll
      </a>

      <div className="w-full max-w-2xl">
        <ScreenshotUploader
          label="LOGIN SCREENSHOT (REQUIRED)"
          hint="Screenshot showing your Autocount dashboard"
          accent="red"
          value={proof}
          onChange={setProof}
        />
      </div>

      <button
        onClick={() => navigate('/day2/logsheet')}
        disabled={!proof}
        className="btn-pixel font-body text-base"
      >
        {proof ? '▶ Continue to Logsheet' : 'Upload login screenshot to continue'}
      </button>
    </TrainingSection>
  );
}
