import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainingSection from '../../shared/TrainingSection';
import ScreenshotUploader from '../../shared/ScreenshotUploader';

export default function PageLogsheet() {
  const navigate = useNavigate();
  const [isIntern, setIsIntern] = useState(null);
  const [proof, setProof] = useState(null);

  return (
    <TrainingSection
      day={2}
      eyebrow="▸ STEP 6 · LOGSHEET"
      title="LOGSHEET (INTERNS ONLY)"
      intro="Interns receive a personal logsheet. Write your daily report there, then update the intern WhatsApp group every day."
      mascotMessage="If you're an intern, your logsheet is non-negotiable — daily entries, then a quick update in the intern WhatsApp. If you're full-time, you can skip this step."
    >
      {isIntern === null && (
        <div className="w-full max-w-3xl">
          <p className="font-pixel text-[0.6rem] text-eb-soft-lavender mb-3">▸ ARE YOU AN INTERN?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsIntern(true)}
              className="card-dark p-4 text-left hover:-translate-y-1 transition"
              style={{ borderWidth: '2px', borderColor: 'var(--plum)' }}
            >
              <div className="font-pixel text-[0.6rem] text-eb-plum mb-2">🎓 YES</div>
              <p className="text-xs text-eb-ink font-semibold">I'm an intern — show me the logsheet steps.</p>
            </button>
            <button
              onClick={() => setIsIntern(false)}
              className="card-dark p-4 text-left hover:-translate-y-1 transition"
              style={{ borderWidth: '2px', borderColor: 'var(--plum)' }}
            >
              <div className="font-pixel text-[0.6rem] text-eb-plum mb-2">💼 NO</div>
              <p className="text-xs text-eb-ink font-semibold">I'm full-time / part-time — skip this step.</p>
            </button>
          </div>
        </div>
      )}

      {isIntern === true && (
        <>
          <div className="card-dark p-5 w-full">
            <p className="font-pixel text-[0.6rem] text-eb-plum mb-3">▸ DAILY LOGSHEET FLOW</p>
            <ol className="text-sm text-eb-ink font-semibold space-y-2 text-left list-decimal list-inside">
              <li>Open the personal logsheet link sent to you by HR.</li>
              <li>Add today's date as a new row.</li>
              <li>List every task you did today — one line per task, kept short and specific.</li>
              <li>Note any blockers, learnings, or questions for your supervisor.</li>
              <li>Save the logsheet.</li>
              <li>Post a short update in the <span className="text-eb-plum font-extrabold">intern WhatsApp group</span> with what you completed today.</li>
            </ol>
          </div>

          <div className="w-full max-w-2xl">
            <ScreenshotUploader
              label="INTERN GROUP UPDATE SCREENSHOT"
              hint="Screenshot of your daily update post"
              accent="red"
              value={proof}
              onChange={setProof}
            />
          </div>

          <button
            onClick={() => navigate('/day2/whatsapp')}
            disabled={!proof}
            className="btn-pixel font-body text-base"
          >
            {proof ? '▶ Continue to WhatsApp Groups' : 'Upload screenshot to continue'}
          </button>
        </>
      )}

      {isIntern === false && (
        <>
          <div className="card-dark px-6 py-4 w-full max-w-2xl">
            <p className="font-pixel text-[0.6rem] text-eb-plum mb-2">⚡ NOT REQUIRED FOR YOU</p>
            <p className="text-sm text-eb-ink font-semibold">
              Logsheets are intern-only. Full-time and part-time staff use ClickUp + WhatsApp instead.
            </p>
          </div>
          <button onClick={() => navigate('/day2/whatsapp')} className="btn-pixel font-body text-base">
            ▶ Skip to WhatsApp Groups
          </button>
        </>
      )}
    </TrainingSection>
  );
}
