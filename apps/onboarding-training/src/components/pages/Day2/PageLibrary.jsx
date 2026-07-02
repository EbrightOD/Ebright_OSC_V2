import { useNavigate } from 'react-router-dom';
import TrainingSection from '../../shared/TrainingSection';

const SECTIONS = [
  { icon: '📚', title: 'SOPs',                desc: 'Standard operating procedures for every department and process.' },
  { icon: '❓', title: 'What is an SOP?',     desc: 'Quick intro to what a Standard Operating Procedure is and why every team has them.' },
  { icon: '🛠', title: 'How to Create an SOP', desc: 'Step-by-step on writing a clear, repeatable SOP using the ebright template.' },
  { icon: '📜', title: 'Policies',            desc: 'Company policy documents — leave, conduct, dress code, more.' },
  { icon: '🎬', title: 'Training Videos',     desc: 'Recorded training sessions and walkthroughs you can re-watch.' },
  { icon: '🖼',  title: 'Slide Decks',         desc: 'All presentation decks — Trinity GESE, parent talks, branch ops.' },
  { icon: '✉️', title: 'Email Login',         desc: 'Your company email account credentials live here.' },
  { icon: '📂', title: 'Academic Syllabus',   desc: 'The full GESE 1–9 syllabus and lesson plans.' },
];

export default function PageLibrary() {
  const navigate = useNavigate();
  return (
    <TrainingSection
      day={2}
      eyebrow="▸ STEP 3 · LIBRARY"
      title="LIBRARY — KNOWLEDGE BASE"
      intro="The Library is the single source of truth at ebright. Every SOP, policy, training video, slide deck and email login lives here."
      mascotMessage="When in doubt — Library. Browse the categories below to see what each section holds. You'll come back here every day."
    >
      <div className="w-full">
        <p className="font-pixel text-[0.6rem] text-eb-soft-lavender mb-3">▸ WHAT'S INSIDE</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SECTIONS.map((s) => (
            <div key={s.title} className="card-dark p-3 flex items-start gap-3">
              <div className="text-2xl shrink-0">{s.icon}</div>
              <div>
                <div className="font-black text-sm text-eb-plum">{s.title}</div>
                <p className="text-[0.7rem] text-eb-ink-soft font-semibold mt-1 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-dark p-5 w-full">
        <p className="font-pixel text-[0.6rem] text-eb-plum mb-3">▸ HOW TO FIND RESOURCES</p>
        <ol className="text-sm text-eb-ink font-semibold space-y-2 text-left list-decimal list-inside">
          <li>Open the Library platform (you logged in during Day 1's software introduction).</li>
          <li>Use the top-level categories to navigate: SOPs, Policies, Videos, Slides, etc.</li>
          <li>The search bar accepts keywords — try <span className="text-eb-plum font-extrabold">"GESE 3"</span> or <span className="text-eb-plum font-extrabold">"leave policy"</span>.</li>
          <li>Bookmark the documents you reference often — they'll be your daily companions.</li>
        </ol>
      </div>

      <a href="https://odd3cff16ab85c2-yavxc.com/login/" target="_blank" rel="noopener noreferrer"
         className="text-eb-soft-lavender font-bold underline underline-offset-2 hover:text-eb-red text-sm">
        🔗 Open Library
      </a>

      <button onClick={() => navigate('/day2/process-street')} className="btn-pixel font-body text-base">
        ▶ Continue to Process Street
      </button>
    </TrainingSection>
  );
}
