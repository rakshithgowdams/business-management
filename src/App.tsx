import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TeamLogin from './pages/TeamLogin';
import DashboardLayout from './components/DashboardLayout';
import TeamDashboardLayout from './components/TeamDashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import TeamProtectedRoute from './components/TeamProtectedRoute';
import PermissionGate from './components/PermissionGate';
import { TeamAuthProvider } from './context/TeamAuthContext';
import Home from './pages/dashboard/Home';
import Expenses from './pages/dashboard/Expenses';
import Income from './pages/dashboard/Income';
import Goals from './pages/dashboard/Goals';
import Invoices from './pages/dashboard/invoices/InvoiceList';
import Quotations from './pages/dashboard/quotations/QuotationList';
import AgreementBuilder from './pages/dashboard/agreementbuilder/AgreementBuilder';
import EMITracker from './pages/dashboard/EMITracker';
import Subscriptions from './pages/dashboard/Subscriptions';
import GSTTracker from './pages/dashboard/GSTTracker';
import Settings from './pages/dashboard/Settings';
import UserProfile from './pages/dashboard/UserProfile';
import ProjectsList from './pages/dashboard/projects/ProjectsList';
import ProjectForm from './pages/dashboard/projects/ProjectForm';
import ProjectDetail from './pages/dashboard/projects/ProjectDetail';
import ClientsList from './pages/dashboard/clients/ClientsList';
import ClientForm from './pages/dashboard/clients/ClientForm';
import ClientDetail from './pages/dashboard/clients/ClientDetail';
import EmployeesList from './pages/dashboard/employees/EmployeesList';
import EmployeeForm from './pages/dashboard/employees/EmployeeForm';
import EmployeeDetail from './pages/dashboard/employees/EmployeeDetail';
import PayrollOverview from './pages/dashboard/employees/PayrollOverview';
import OnboardingList from './pages/dashboard/onboarding/OnboardingList';
import OnboardingForm from './pages/dashboard/onboarding/OnboardingForm';
import OnboardingDetail from './pages/dashboard/onboarding/OnboardingDetail';
import WorkTracker from './pages/dashboard/worktracker/WorkTracker';
import TaskDetail from './pages/dashboard/worktracker/TaskDetail';
import Timesheet from './pages/dashboard/worktracker/Timesheet';
import AIIntelligence from './pages/dashboard/ai/AIIntelligence';
import AIHistory from './pages/dashboard/ai/AIHistory';
import HealthScore from './pages/dashboard/healthscore/HealthScore';
import MeetingPrep from './pages/dashboard/meetingprep/MeetingPrep';
import WeeklySummary from './pages/dashboard/weeklysummary/WeeklySummary';
import FollowUps from './pages/dashboard/followups/FollowUps';
import DocumentVault from './pages/dashboard/documents/DocumentVault';
import MarketingStudio from './pages/dashboard/marketing/MarketingStudio';
import SMMAgent from './pages/dashboard/smm/SMMAgent';
import AIUsage from './pages/dashboard/AIUsage';
import TaskManagement from './pages/dashboard/taskmanagement/TaskManagement';
import Messenger from './pages/dashboard/messenger/Messenger';
import TeamsList from './pages/dashboard/teams/TeamsList';
import HRDashboard from './pages/dashboard/hr/HRDashboard';
import DigitalMarketingHub from './pages/dashboard/digitalmarketing/DigitalMarketingHub';
import PipelineHub from './pages/dashboard/pipeline/PipelineHub';
import WebsiteBuilder from './pages/dashboard/websitebuilder/WebsiteBuilder';
import WebsiteLeads from './pages/dashboard/websitebuilder/WebsiteLeads';
import WebsitePublicPreview from './pages/WebsitePublicPreview';
import PWAInstallBanner from './components/PWAInstallBanner';
import OfflineIndicator from './components/OfflineIndicator';

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
      <Route path="employees/:id" element={<PG perm="employees" basePath={basePath}><EmployeeDetail /></PG>} />
      <Route path="employees/:id/edit" element={<PG perm="employees" basePath={basePath}><EmployeeForm /></PG>} />
      <Route path="employees/payroll" element={<PG perm="employees" basePath={basePath}><PayrollOverview /></PG>} />
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
    </>
  );
}

export default function App() {
  return (
    <>
    <PWAInstallBanner />
    <OfflineIndicator />
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
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />
        <Route path="employees/payroll" element={<PayrollOverview />} />
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
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      <Route path="/employee/dashboard" element={<EmployeeDashboard />}>
        {teamRoutes('/employee/dashboard')}
      </Route>

      <Route path="/management/dashboard" element={<ManagementDashboard />}>
        {teamRoutes('/management/dashboard')}
      </Route>

      <Route path="/website/preview/:subdomain" element={<WebsitePublicPreview />} />
    </Routes>
    </>
  );
}
