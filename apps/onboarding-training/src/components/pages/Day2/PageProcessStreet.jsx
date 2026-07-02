import { useNavigate } from 'react-router-dom';
import TrainingSection from '../../shared/TrainingSection';

const STEPS = [
  { n: 1, title: 'Open Process Street',
    desc: 'Log in via app.process.st with your company email.' },
  { n: 2, title: 'Click "+ New Workflow"',
    desc: 'Top-right of the dashboard. Pick a template or start blank.' },
  { n: 3, title: 'Name your workflow',
    desc: 'Use a clear name — e.g. "Branch Daily Open" or "GESE Lesson Plan v3".' },
  { n: 4, title: 'Add tasks in order',
    desc: 'Each task is a step. Drag to reorder, click to add description, files, or form fields.' },
  { n: 5, title: 'Assign people & due dates',
    desc: 'Tag the owner of each task and set a due-date so it appears in their inbox.' },
  { n: 6, title: 'Save & run',
    desc: 'Click "Save" → "Run Workflow" to start it. Each run is a checklist you tick through.' },
];

export default function PageProcessStreet() {
  const navigate = useNavigate();
  return (
    <TrainingSection
      day={2}
      eyebrow="▸ STEP 4 · PROCESS STREET"
      title="PROCESS STREET — CREATE A WORKFLOW"
      intro="Process Street holds every recurring workflow at ebright. Today you'll learn how to build one from scratch."
      mascotMessage="Workflows are how we keep ebright consistent across 27 branches. Build one from scratch — name it, add tasks, assign owners, run it."
    >
      <div className="w-full">
        <p className="font-pixel text-[0.6rem] text-eb-soft-lavender mb-3">▸ HOW TO CREATE A WORKFLOW</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card-dark p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-pixel text-[0.65rem] shrink-0"
                   style={{ background: 'var(--plum)', color: 'var(--parchment)' }}>
                {s.n}
              </div>
              <div>
                <div className="font-black text-sm text-eb-plum">{s.title}</div>
                <p className="text-[0.7rem] text-eb-ink-soft font-semibold mt-1 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-dark px-6 py-4 w-full max-w-3xl">
        <p className="font-pixel text-[0.6rem] text-eb-plum mb-2">⚡ TRY IT</p>
        <p className="text-sm text-eb-ink font-semibold">
          Build a small test workflow now — three tasks, your name as the owner. You'll be expected to create real workflows from your second week onward.
        </p>
      </div>

      <a href="https://app.process.st/login" target="_blank" rel="noopener noreferrer"
         className="text-eb-soft-lavender font-bold underline underline-offset-2 hover:text-eb-red text-sm">
        🔗 Open Process Street
      </a>

      <button onClick={() => navigate('/day2/autocount')} className="btn-pixel font-body text-base">
        ▶ Continue to Autocount Payroll
      </button>
    </TrainingSection>
  );
}
