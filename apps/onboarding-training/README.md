# ebright onboarding — React + Vite

Modern rebuild of the gamified ebright induction training platform. The static-HTML version lives one folder up; this React version is a parallel scaffold matching the same 7-page flow.

## Tech Stack

- **React 18 + Vite** — frontend framework + dev server (HMR)
- **Tailwind CSS** — styling (custom theme with `eb-red`, `eb-yellow`, `eb-dark`, etc.)
- **React Router v6** — page routing
- **TanStack React Query** — server state + mutations (form submit, photo upload)
- **Axios** — HTTP client
- **Context + useReducer** — global onboarding state (form data, level progress, XP)

## Run

```bash
cd react-version
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Project Layout

```
src/
  api/            React Query hooks + axios client
  contexts/       OnboardingContext (form data, completed pages, village XP)
  hooks/          useOnboardingState
  data/           constants.js (people, branches, depts, levels, software, banks)
                  quizzes.js (MCQ banks per level + snake quiz)
  components/
    layout/       TopNav · ProgressBar · BottomNav (shared chrome)
    pages/        Page1Welcome → Page7BranchTraining
    shared/       TutorKnight (mascot SVG), reusable UI
    forms/        (TODO) RoleSelector, BranchSelector, PersonalInfo, BankDetails
    minigames/    (TODO) BlackoutMinigame, SnakeQuizGame, InventoryCamera, LearningModal
    quizzes/      (TODO) MCQQuiz
    map/          (TODO) KlangValleyMap, BranchChecklist
    orgchart/     (TODO) OrgChartExplorer (drill-down)
  App.jsx         Routes + layout wrapping
  main.jsx        QueryClientProvider + OnboardingProvider
  index.css       Tailwind + design system + animations
```

## What's Already Built

- ✅ Project scaffolding (Vite, Tailwind, PostCSS)
- ✅ Design system (CSS variables, pixel-art utilities, scanline overlay)
- ✅ Routing + 3 layout components (TopNav, ProgressBar, BottomNav)
- ✅ OnboardingContext + reducer (form, completed pages, village XP)
- ✅ React Query setup (`useSubmitForm`, `useUploadInventoryPhoto`, `useVerifyAccess`)
- ✅ All real ebright data (people with Mr./Ms., 20 branches, 7 depts, 8 village levels, 5 software, MCQ banks)
- ✅ Page 1 (welcome with classroom SVG + tutor knight mascot)
- ✅ Page 2 (form scaffold with role cards, branch + dept dropdowns, all sections)
- ✅ Page 3 (CEO story 50/50)
- ✅ Page 4 (team stats hero)
- ✅ Page 5 (org chart drill-down with person modal)
- ✅ Page 6 (canvas village + avatar select + HUD + level dispatcher stub)
- ✅ Page 7 (branch picker grid + Day 2/3 checklists + completion banner)

## What Still Needs Porting from Static HTML

The full mini-game logic lives in `../page6-village-rpg.html` and `../page6-software-snake.html`:

- 🚧 **BlackoutMinigame.jsx** — port the spotlight + drag mechanic from `startBlackout()` / `boSubmit()` in static page6
- 🚧 **SnakeQuizGame.jsx** — port the two-phase tour + multi-answer quiz arena from `page6-software-snake.html`
- 🚧 **InventoryCamera.jsx** — port the 8-item silhouette + camera capture flow
- 🚧 **MCQQuiz.jsx** — port the 3-question engine with 60% pass + retry
- 🚧 **LearningModal.jsx** — port the watch-or-slides gate
- 🚧 **OrgChartExplorer.jsx** — drill-down tree with ripple animation
- 🚧 **KlangValleyMap.jsx** — SVG map with 20 pins (replace the chip-grid fallback in page7)
- 🚧 **Branch greeting card** — pull manager + region from `BRANCHES`/`PIC_DIRECTORY`

## Backend (optional)

`server/index.js` (Node + Express + Supabase) is in the master prompt. Endpoints:
- `POST /api/submit` — form payload + PIC notification routing
- `POST /api/inventory` — multipart photo upload
- `POST /api/verify-access` — access challenge screenshot bundle

## Environment

Copy `.env.example` → `.env` and configure:

```
VITE_API_URL=http://localhost:3001
VITE_SUBMISSION_ENDPOINT=/api/submit
VITE_VERIFICATION_ENDPOINT=/api/verify-access
VITE_INVENTORY_ENDPOINT=/api/inventory
```
