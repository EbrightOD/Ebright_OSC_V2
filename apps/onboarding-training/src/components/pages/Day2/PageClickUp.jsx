import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainingSection from '../../shared/TrainingSection';
import ScreenshotUploader from '../../shared/ScreenshotUploader';

export default function PageClickUp() {
  const navigate = useNavigate();
  const [audience, setAudience] = useState('hq'); // 'hq' | 'intern'
  const [proof, setProof] = useState(null);

  return (
    <TrainingSection
      day={2}
      eyebrow="▸ STEP 2 · CLICKUP"
      title="CLICKUP — UPDATING TASKS"
      intro="Learn how to update your daily tasks in ClickUp, then submit proof — HQ posts a screenshot of their dept WhatsApp; interns post their task completion in the intern WhatsApp."
      mascotMessage="ClickUp is your daily mission control. Update your tasks every day. Pick whether you're HQ or an intern below — the proof you submit is different."
    >
      <div className="card-dark p-5 w-full max-w-3xl">
        <p className="font-pixel text-[0.6rem] text-eb-yellow mb-3">▸ HOW TO UPDATE YOUR TASKS</p>
        <ol className="text-sm text-white/80 font-semibold space-y-2 text-left list-decimal list-inside">
          <li>Open ClickUp and go to your assigned space.</li>
          <li>Find each task assigned to you for today.</li>
          <li>Update the status (In Progress → Complete) and add a short comment on what you did.</li>
          <li>For tasks with deliverables, attach the file or link before marking complete.</li>
          <li>Tag your manager with <span className="text-eb-red">@</span> if a task is blocked.</li>
        </ol>
      </div>

      <div className="card-dark p-5 w-full max-w-3xl">
        <p className="font-pixel text-[0.6rem] text-eb-yellow mb-3">▸ I AM A...</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setAudience('hq'); setProof(null); }}
            className={`p-3 border-eb-border-1 rounded-lg text-left transition ${audience === 'hq' ? 'border-eb-red bg-eb-red/10' : 'border-eb-border-1 hover:border-eb-red/50'}`}
          >
            <div className="font-pixel text-[0.55rem] text-eb-yellow mb-1">🏢 HQ STAFF</div>
            <div className="text-xs text-white/75 font-semibold">Take a screenshot of your <span className="text-white">department WhatsApp</span> and submit it there.</div>
          </button>
          <button
            onClick={() => { setAudience('intern'); setProof(null); }}
            className={`p-3 border-eb-border-1 rounded-lg text-left transition ${audience === 'intern' ? 'border-eb-red bg-eb-red/10' : 'border-eb-border-1 hover:border-eb-red/50'}`}
          >
            <div className="font-pixel text-[0.55rem] text-eb-yellow mb-1">🎓 INTERN</div>
            <div className="text-xs text-white/75 font-semibold">Post your task completion update in the <span className="text-white">intern WhatsApp group</span>.</div>
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <ScreenshotUploader
          label={audience === 'hq' ? 'DEPARTMENT WHATSAPP SCREENSHOT' : 'INTERN GROUP UPDATE SCREENSHOT'}
          hint="Screenshot of your WhatsApp post"
          accent="red"
          value={proof}
          onChange={setProof}
        />
      </div>

      <button
        onClick={() => navigate('/day2/library')}
        disabled={!proof}
        className="btn-pixel font-body text-base"
      >
        {proof ? '▶ Continue to Library' : 'Upload screenshot to continue'}
      </button>
    </TrainingSection>
  );
}
