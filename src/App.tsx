import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { TeamAuthProvider } from './context/TeamAuthContext';
import { PortalThemeProvider } from './context/PortalThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import TeamProtectedRoute from './components/TeamProtectedRoute';
import PermissionGate from './components/PermissionGate';
import PWAInstallBanner from './components/PWAInstallBanner';
import OfflineIndicator from './components/OfflineIndicator';
import NotFound from './components/NotFound';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const TeamLogin = lazy(() => import('./pages/TeamLogin'));
const WebsitePublicPreview = lazy(() => import('./pages/WebsitePublicPreview'));

const DashboardLayout = lazy(() => import('./components/DashboardLayout'));
const TeamDashboardLayout = lazy(() => import('./components/TeamDashboardLayout'));

const Home = lazy(() => import('./pages/dashboard/Home'));
const Expenses = lazy(() => import('./pages/dashboard/Expenses'));
const Income = lazy(() => import('./pages/dashboard/Income'));
const Goals = lazy(() => import('./pages/dashboard/Goals'));
const Invoices = lazy(() => import('./pages/dashboard/invoices/InvoiceList'));
const Quotations = lazy(() => import('./pages/dashboard/quotations/QuotationList'));
const AgreementBuilder = lazy(() => import('./pages/dashboard/agreementbuilder/AgreementBuilder'));
const EMITracker = lazy(() => import('./pages/dashboard/EMITracker'));
const Subscriptions = lazy(() => import('./pages/dashboard/Subscriptions'));
const GSTTracker = lazy(() => import('./pages/dashboard/GSTTracker'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const UserProfile = lazy(() => import('./pages/dashboard/UserProfile'));
const ProjectsList = lazy(() => import('./pages/dashboard/projects/ProjectsList'));
const ProjectForm = lazy(() => import('./pages/dashboard/projects/ProjectForm'));
const ProjectDetail = lazy(() => import('./pages/dashboard/projects/ProjectDetail'));
const ClientsList = lazy(() => import('./pages/dashboard/clients/ClientsList'));
const ClientForm = lazy(() => import('./pages/dashboard/clients/ClientForm'));
const ClientDetail = lazy(() => import('./pages/dashboard/clients/ClientDetail'));
const EmployeesList = lazy(() => import('./pages/dashboard/employees/EmployeesList'));
const EmployeeForm = lazy(() => import('./pages/dashboard/employees/EmployeeForm'));
const EmployeeDetail = lazy(() => import('./pages/dashboard/employees/EmployeeDetail'));
const PayrollOverview = lazy(() => import('./pages/dashboard/employees/PayrollOverview'));
const OnboardingList = lazy(() => import('./pages/dashboard/onboarding/OnboardingList'));
const OnboardingForm = lazy(() => import('./pages/dashboard/onboarding/OnboardingForm'));
const OnboardingDetail = lazy(() => import('./pages/dashboard/onboarding/OnboardingDetail'));
const WorkTracker = lazy(() => import('./pages/dashboard/worktracker/WorkTracker'));
const TaskDetail = lazy(() => import('./pages/dashboard/worktracker/TaskDetail'));
const Timesheet = lazy(() => import('./pages/dashboard/worktracker/Timesheet'));
const AIIntelligence = lazy(() => import('./pages/dashboard/ai/AIIntelligence'));
const AIHistory = lazy(() => import('./pages/dashboard/ai/AIHistory'));
const HealthScore = lazy(() => import('./pages/dashboard/healthscore/HealthScore'));
const MeetingPrep = lazy(() => import('./pages/dashboard/meetingprep/MeetingPrep'));
const WeeklySummary = lazy(() => import('./pages/dashboard/weeklysummary/WeeklySummary'));
const FollowUps = lazy(() => import('./pages/dashboard/followups/FollowUps'));
const DocumentVault = lazy(() => import('./pages/dashboard/documents/DocumentVault'));
const MarketingStudio = lazy(() => import('./pages/dashboard/marketing/MarketingStudio'));
const SMMAgent = lazy(() => import('./pages/dashboard/smm/SMMAgent'));
const AIUsage = lazy(() => import('./pages/dashboard/AIUsage'));
const TaskManagement = lazy(() => import('./pages/dashboard/taskmanagement/TaskManagement'));
const Messenger = lazy(() => import('./pages/dashboard/messenger/Messenger'));
const TeamsList = lazy(() => import('./pages/dashboard/teams/TeamsList'));
const HRDashboard = lazy(() => import('./pages/dashboard/hr/HRDashboard'));
const DigitalMarketingHub = lazy(() => import('./pages/dashboard/digitalmarketing/DigitalMarketingHub'));
const PipelineHub = lazy(() => import('./pages/dashboard/pipeline/PipelineHub'));
const WebsiteBuilder = lazy(() => import('./pages/dashboard/websitebuilder/WebsiteBuilder'));
const WebsiteLeads = lazy(() => import('./pages/dashboard/websitebuilder/WebsiteLeads'));
const PortalList = lazy(() => import('./pages/dashboard/portal/PortalList'));
const PortalManager = lazy(() => import('./pages/dashboard/portal/PortalManager'));
const PasswordVault = lazy(() => import('./pages/dashboard/passwords/PasswordVault'));
const PortalLogin = lazy(() => import('./pages/portal/PortalLogin'));
const PortalView = lazy(() => import('./pages/portal/PortalView'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmployeeLogin() {
  return (
    <TeamAuthProvider>
      <TeamLogin role="employee" />
    </TeamAuthProvider>
  );
}

function ManagementLogin() {
  return (
    <TeamAuthProvider>
      <TeamLogin role="management" />
    </TeamAuthProvider>
  );
}

function EmployeeDashboard() {
  return (
    <TeamAuthProvider>
      <TeamProtectedRoute requiredRole="employee">
        <TeamDashboardLayout basePath="/employee/dashboard" />
      </TeamProtectedRoute>
    </TeamAuthProvider>
  );
}

function ManagementDashboard() {
  return (
    <TeamAuthProvider>
      <TeamProtectedRoute requiredRole="management">
        <TeamDashboardLayout basePath="/management/dashboard" />
      </TeamProtectedRoute>
    </TeamAuthProvider>
  );
}

function PG({ perm, basePath, children }: { perm: string; basePath: string; children: React.ReactNode }) {
  return <PermissionGate permissionKey={perm} basePath={basePath}>{children}</PermissionGate>;
}

function teamRoutes(basePath: string) {
  return (
    <>
      <Route index element={<PG perm="dashboard" basePath={basePath}><Home /></PG>} />
      <Route path="expenses" element={<PG perm="expenses" basePath={basePath}><Expenses /></PG>} />
      <Route path="income" element={<PG perm="income" basePath={basePath}><Income /></PG>} />
      <Route path="goals" element={<PG perm="goals" basePath={basePath}><Goals /></PG>} />
      <Route path="invoices" element={<PG perm="invoices" basePath={basePath}><Invoices /></PG>} />
      <Route path="quotations" element={<PG perm="quotations" basePath={basePath}><Quotations /></PG>} />
      <Route path="agreements" element={<PG perm="agreements" basePath={basePath}><AgreementBuilder /></PG>} />
      <Route path="emi" element={<PG perm="emi" basePath={basePath}><EMITracker /></PG>} />
      <Route path="subscriptions" element={<PG perm="subscriptions" basePath={basePath}><Subscriptions /></PG>} />
      <Route path="gst" element={<PG perm="gst" basePath={basePath}><GSTTracker /></PG>} />
      <Route path="health-score" element={<PG perm="health_score" basePath={basePath}><HealthScore /></PG>} />
      <Route path="meeting-prep" element={<PG perm="meeting_prep" basePath={basePath}><MeetingPrep /></PG>} />
      <Route path="weekly-summary" element={<PG perm="weekly_summary" basePath={basePath}><WeeklySummary /></PG>} />
      <Route path="follow-ups" element={<PG perm="follow_ups" basePath={basePath}><FollowUps /></PG>} />
      <Route path="documents" element={<PG perm="documents" basePath={basePath}><DocumentVault /></PG>} />
      <Route path="projects" element={<PG perm="projects" basePath={basePath}><ProjectsList /></PG>} />
      <Route path="projects/new" element={<PG perm="projects" basePath={basePath}><ProjectForm /></PG>} />
      <Route path="projects/:id" element={<PG perm="projects" basePath={basePath}><ProjectDetail /></PG>} />
      <Route path="projects/:id/edit" element={<PG perm="projects" basePath={basePath}><ProjectForm /></PG>} />
      <Route path="clients" element={<PG perm="clients" basePath={basePath}><ClientsList /></PG>} />
      <Route path="clients/new" element={<PG perm="clients" basePath={basePath}><ClientForm /></PG>} />
      <Route path="clients/:id" element={<PG perm="clients" basePath={basePath}><ClientDetail /></PG>} />
      <Route path="clients/:id/edit" element={<PG perm="clients" basePath={basePath}><ClientForm /></PG>} />
      <Route path="ai-intelligence" element={<PG perm="ai_intelligence" basePath={basePath}><AIIntelligence /></PG>} />
      <Route path="ai-intelligence/history" element={<PG perm="ai_intelligence" basePath={basePath}><AIHistory /></PG>} />
      <Route path="employees" element={<PG perm="employees" basePath={basePath}><EmployeesList /></PG>} />
      <Route path="employees/new" element={<PG perm="employees" basePath={basePath}><EmployeeForm /></PG>} />
      <Route path="employees/payroll" element={<PG perm="employees" basePath={basePath}><PayrollOverview /></PG>} />
      <Route path="employees/:id" element={<PG perm="employees" basePath={basePath}><EmployeeDetail /></PG>} />
      <Route path="employees/:id/edit" element={<PG perm="employees" basePath={basePath}><EmployeeForm /></PG>} />
      <Route path="onboarding" element={<PG perm="onboarding" basePath={basePath}><OnboardingList /></PG>} />
      <Route path="onboarding/new" element={<PG perm="onboarding" basePath={basePath}><OnboardingForm /></PG>} />
      <Route path="onboarding/:id" element={<PG perm="onboarding" basePath={basePath}><OnboardingDetail /></PG>} />
      <Route path="onboarding/:id/edit" element={<PG perm="onboarding" basePath={basePath}><OnboardingForm /></PG>} />
      <Route path="work-tracker" element={<PG perm="work_tracker" basePath={basePath}><WorkTracker /></PG>} />
      <Route path="work-tracker/timesheet" element={<PG perm="work_tracker" basePath={basePath}><Timesheet /></PG>} />
      <Route path="work-tracker/task/:id" element={<PG perm="work_tracker" basePath={basePath}><TaskDetail /></PG>} />
      <Route path="marketing-studio" element={<PG perm="marketing_studio" basePath={basePath}><MarketingStudio /></PG>} />
      <Route path="smm-agent" element={<PG perm="smm_agent" basePath={basePath}><SMMAgent /></PG>} />
      <Route path="ai-usage" element={<PG perm="ai_usage" basePath={basePath}><AIUsage /></PG>} />
      <Route path="task-management" element={<PG perm="task_management" basePath={basePath}><TaskManagement /></PG>} />
      <Route path="teams" element={<PG perm="projects" basePath={basePath}><TeamsList /></PG>} />
      <Route path="hr/*" element={<PG perm="employees" basePath={basePath}><HRDashboard /></PG>} />
      <Route path="digital-marketing/*" element={<PG perm="marketing_studio" basePath={basePath}><DigitalMarketingHub /></PG>} />
      <Route path="pipeline" element={<PG perm="projects" basePath={basePath}><PipelineHub /></PG>} />
      <Route path="messenger" element={<PG perm="messenger" basePath={basePath}><Messenger /></PG>} />
      <Route path="website-builder" element={<PG perm="projects" basePath={basePath}><WebsiteBuilder /></PG>} />
      <Route path="website-leads" element={<PG perm="projects" basePath={basePath}><WebsiteLeads /></PG>} />
      <Route path="client-portal" element={<PG perm="clients" basePath={basePath}><PortalList /></PG>} />
      <Route path="client-portal/:id" element={<PG perm="clients" basePath={basePath}><PortalManager /></PG>} />
      <Route path="password-vault" element={<PG perm="projects" basePath={basePath}><PasswordVault /></PG>} />
      <Route path="*" element={<NotFound />} />
    </>
  );
}

export default function App() {
  return (
    <>
    <PWAInstallBanner />
    <OfflineIndicator />
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/employee" element={<EmployeeLogin />} />
      <Route path="/management" element={<ManagementLogin />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="income" element={<Income />} />
        <Route path="goals" element={<Goals />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="agreements" element={<AgreementBuilder />} />
        <Route path="emi" element={<EMITracker />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="gst" element={<GSTTracker />} />
        <Route path="health-score" element={<HealthScore />} />
        <Route path="meeting-prep" element={<MeetingPrep />} />
        <Route path="weekly-summary" element={<WeeklySummary />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="documents" element={<DocumentVault />} />
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/new" element={<ProjectForm />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/edit" element={<ProjectForm />} />
        <Route path="clients" element={<ClientsList />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />
        <Route path="ai-intelligence" element={<AIIntelligence />} />
        <Route path="ai-intelligence/history" element={<AIHistory />} />
        <Route path="employees" element={<EmployeesList />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/payroll" element={<PayrollOverview />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />
        <Route path="onboarding" element={<OnboardingList />} />
        <Route path="onboarding/new" element={<OnboardingForm />} />
        <Route path="onboarding/:id" element={<OnboardingDetail />} />
        <Route path="onboarding/:id/edit" element={<OnboardingForm />} />
        <Route path="work-tracker" element={<WorkTracker />} />
        <Route path="work-tracker/timesheet" element={<Timesheet />} />
        <Route path="work-tracker/task/:id" element={<TaskDetail />} />
        <Route path="marketing-studio" element={<MarketingStudio />} />
        <Route path="smm-agent" element={<SMMAgent />} />
        <Route path="ai-usage" element={<AIUsage />} />
        <Route path="task-management" element={<TaskManagement />} />
        <Route path="teams" element={<TeamsList />} />
        <Route path="hr/*" element={<HRDashboard />} />
        <Route path="digital-marketing/*" element={<DigitalMarketingHub />} />
        <Route path="pipeline" element={<PipelineHub />} />
        <Route path="messenger" element={<TeamAuthProvider><Messenger /></TeamAuthProvider>} />
        <Route path="website-builder" element={<WebsiteBuilder />} />
        <Route path="website-leads" element={<WebsiteLeads />} />
        <Route path="client-portal" element={<PortalList />} />
        <Route path="client-portal/:id" element={<PortalManager />} />
        <Route path="password-vault" element={<PasswordVault />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/employee/dashboard" element={<EmployeeDashboard />}>
        {teamRoutes('/employee/dashboard')}
      </Route>

      <Route path="/management/dashboard" element={<ManagementDashboard />}>
        {teamRoutes('/management/dashboard')}
      </Route>

      <Route path="/portal/:slug" element={<PortalThemeProvider><PortalLogin /></PortalThemeProvider>} />
      <Route path="/portal/:slug/view" element={<PortalThemeProvider><PortalView /></PortalThemeProvider>} />
      <Route path="/website/preview/:subdomain" element={<WebsitePublicPreview />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    </>
  );
}
