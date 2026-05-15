import { createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RequireAuth } from './components/RequireAuth';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ModulesPage } from './pages/ModulesPage';
import { LeadershipModulePage } from './pages/LeadershipModulePage';
import { OralCommunicationPage } from './pages/OralCommunicationPage';
import { WrittenCommunicationPage } from './pages/WrittenCommunicationPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResultsPage } from './pages/ResultsPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { PretestPage } from './pages/PretestPage';
import { PostestPage } from './pages/PostestPage';
import { RequirePretest } from './components/RequirePretest';

export const router = createBrowserRouter([
  { path: '/', Component: LandingPage },
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  {
    path: '/app',
    Component: RequireAuth,
    children: [{
      Component: AppLayout,
      children: [
      { index: true, Component: DashboardPage },
      { path: 'pretest', Component: PretestPage },
      { path: 'postest', Component: PostestPage },
      // Module routes — blocked until Pretest is completed
      {
        Component: RequirePretest,
        children: [
          { path: 'modules', Component: ModulesPage },
          { path: 'modules/leadership', Component: LeadershipModulePage },
          { path: 'modules/oral', Component: OralCommunicationPage },
          { path: 'modules/written', Component: WrittenCommunicationPage },
        ],
      },
      { path: 'progress', Component: ProgressPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'results', Component: ResultsPage },
      { path: 'admin', Component: AdminReportsPage },
      ],
    }],
  },
]);
