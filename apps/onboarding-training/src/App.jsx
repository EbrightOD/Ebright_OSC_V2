import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PageGateProvider } from './hooks/usePageGate';
import Logo from './components/layout/Logo';
import BottomNav, { isBottomNavHidden } from './components/layout/BottomNav';
import Page1Welcome from './components/pages/Page1Welcome';
import Page3CeoStory from './components/pages/Page3CeoStory';
import Page4Team from './components/pages/Page4Team';
import Page5OrgChart from './components/pages/Page5OrgChart';
import PageDeptGame from './components/pages/Day1/PageDeptGame';
import PageSoftware from './components/pages/Day1/PageSoftware';
import PageSoftwareProof from './components/pages/Day1/PageSoftwareProof';
import PageSoftwareGame from './components/pages/Day1/PageSoftwareGame';
import PagePolicy from './components/pages/Day1/PagePolicy';
import PagePolicyGame from './components/pages/Day1/PagePolicyGame';
import PageSyllabus from './components/pages/Day1/PageSyllabus';
import PageSyllabusGame from './components/pages/Day1/PageSyllabusGame';
import PageCommunication from './components/pages/Day1/PageCommunication';
import PageVideoDay1 from './components/pages/Day1/PageVideo';
import PageHQTour from './components/pages/Day1/PageHQTour';
import PageAttendanceDay2 from './components/pages/Day2/PageAttendance';
import PageClickUp from './components/pages/Day2/PageClickUp';
import PageLibrary from './components/pages/Day2/PageLibrary';
import PageProcessStreet from './components/pages/Day2/PageProcessStreet';
import PageAutocount from './components/pages/Day2/PageAutocount';
import PageLogsheet from './components/pages/Day2/PageLogsheet';
import PageWhatsApp from './components/pages/Day2/PageWhatsApp';
import PageZoom from './components/pages/Day2/PageZoom';
import PageVideoDay2 from './components/pages/Day2/PageVideo';
import PageAttendanceDay3 from './components/pages/Day3/PageAttendance';
import PageVideoDay3 from './components/pages/Day3/PageVideo';
import DayCompletePage from './components/pages/DayCompletePage';
import OnboardingCompletePage from './components/pages/OnboardingCompletePage';

function AppShell() {
  const { pathname } = useLocation();
  // Only reserve room for the BottomNav on routes that actually show it
  const padCls = isBottomNavHidden(pathname) ? 'pb-0' : 'pb-[52px]';
  // No background on the wrapper — body sets the plum gradient and we
  // want it to bleed through every page.
  return (
    <div className={`min-h-screen text-eb-white ${padCls}`}>
      <Logo />
      <Routes>
          <Route path="/" element={<Page1Welcome />} />

          {/* Day 1 */}
          <Route path="/day1"                 element={<Page1Welcome />} />
          <Route path="/day1/welcome"         element={<Page1Welcome />} />
          <Route path="/day1/ceo"             element={<Page3CeoStory />} />
          <Route path="/day1/team"            element={<Page4Team />} />
          <Route path="/day1/department"      element={<Page5OrgChart />} />
          <Route path="/day1/department-game" element={<PageDeptGame />} />
          <Route path="/day1/software"        element={<PageSoftware />} />
          <Route path="/day1/software-proof"  element={<PageSoftwareProof />} />
          <Route path="/day1/software-game"   element={<PageSoftwareGame />} />
          <Route path="/day1/policy"          element={<PagePolicy />} />
          <Route path="/day1/policy-game"     element={<PagePolicyGame />} />
          <Route path="/day1/syllabus"        element={<PageSyllabus />} />
          <Route path="/day1/syllabus-game"   element={<PageSyllabusGame />} />
          <Route path="/day1/communication"   element={<PageCommunication />} />
          <Route path="/day1/video"           element={<PageVideoDay1 />} />
          <Route path="/day1/hq-tour"         element={<PageHQTour />} />
          <Route path="/day1/complete"        element={<DayCompletePage completedDay={1} nextDay={2} nextPath="/day2/attendance" />} />

          {/* Day 2 */}
          <Route path="/day2/attendance"      element={<PageAttendanceDay2 />} />
          <Route path="/day2/clickup"         element={<PageClickUp />} />
          <Route path="/day2/library"         element={<PageLibrary />} />
          <Route path="/day2/process-street"  element={<PageProcessStreet />} />
          <Route path="/day2/autocount"       element={<PageAutocount />} />
          <Route path="/day2/logsheet"        element={<PageLogsheet />} />
          <Route path="/day2/whatsapp"        element={<PageWhatsApp />} />
          <Route path="/day2/zoom"            element={<PageZoom />} />
          <Route path="/day2/video"           element={<PageVideoDay2 />} />
          <Route path="/day2/complete"        element={<DayCompletePage completedDay={2} nextDay={3} nextPath="/day3/attendance" />} />

          {/* Day 3 */}
          <Route path="/day3/attendance"      element={<PageAttendanceDay3 />} />
          <Route path="/day3/video"           element={<PageVideoDay3 />} />
          <Route path="/day3/complete"        element={<OnboardingCompletePage />} />

          <Route path="*" element={<Page1Welcome />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <PageGateProvider>
        <AppShell />
      </PageGateProvider>
    </HashRouter>
  );
}
