import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainingSection from '../../shared/TrainingSection';

const REQUIRED_GROUPS = [
  { id: 'general',    name: 'ebright HQ — General',         desc: 'Company-wide announcements.' },
  { id: 'dept',       name: 'Your Department Group',         desc: 'Daily team coordination.' },
  { id: 'branch',     name: 'Your Branch / Office Group',    desc: 'Branch-level updates and schedules.' },
  { id: 'intern',     name: 'Intern Group (interns only)',   desc: 'Logsheet updates and learning support.' },
  { id: 'announce',   name: 'ebright Announcements',         desc: 'CEO and HR-wide notices.' },
];

export default function PageWhatsApp() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState({});

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const allDone = REQUIRED_GROUPS.every((g) => checked[g.id]);

  return (
    <TrainingSection
      day={2}
      eyebrow="▸ STEP 7 · WHATSAPP GROUPS"
      title="WHATSAPP — GROUP CHECK"
      intro="Confirm you have been added to every required ebright WhatsApp group. If a group is missing, message HR right away."
      mascotMessage="Tick off each group as you confirm you're inside it. Anything missing? Message HR — they'll add you within minutes."
    >
      <div className="w-full max-w-3xl">
        <p className="font-pixel text-[0.6rem] text-eb-soft-lavender mb-3">▸ REQUIRED GROUPS</p>
        <ul className="flex flex-col gap-2">
          {REQUIRED_GROUPS.map((g) => {
            const done = !!checked[g.id];
            return (
              <li key={g.id}>
                <button
                  onClick={() => toggle(g.id)}
                  className={`card-dark w-full flex items-start gap-3 p-3 text-left transition hover:-translate-y-0.5 ${done ? 'border-eb-green' : ''}`}
                  style={done ? { borderWidth: '2px', borderColor: 'var(--green)', background: 'rgba(45,184,88,0.15)' } : { borderWidth: '2px', borderColor: 'var(--plum)' }}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center font-black text-xs shrink-0 mt-0.5"
                    style={done
                      ? { background: 'var(--green)', color: 'var(--milk)', border: '2px solid var(--green)' }
                      : { border: '2px solid var(--plum)' }}
                  >
                    {done && '✓'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-black text-sm text-eb-plum ${done ? 'line-through opacity-70' : ''}`}>{g.name}</div>
                    <p className="text-[0.7rem] text-eb-ink-soft font-semibold mt-0.5">{g.desc}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        onClick={() => navigate('/day2/zoom')}
        disabled={!allDone}
        className="btn-pixel font-body text-base"
      >
        {allDone ? '▶ Continue to Zoom' : 'Confirm all groups to continue'}
      </button>
    </TrainingSection>
  );
}
