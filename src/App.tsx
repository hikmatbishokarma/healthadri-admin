import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { NavigatorShell } from '@/components/layout/NavigatorShell';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { PatientsPage } from '@/pages/Patients';
import { NavigatorsPage } from '@/pages/Navigators';
import { HospitalsPage } from '@/pages/Hospitals';
import { HospitalFormPage } from '@/pages/HospitalForm';
import { DoctorsPage } from '@/pages/Doctors';
import { DoctorFormPage } from '@/pages/DoctorForm';
import { PlaybooksPage } from '@/pages/Playbooks';
import { SymptomsPage } from '@/pages/Symptoms';
import { RolesPage } from '@/pages/Roles';
import { NavHomePage } from '@/pages/navigator/Home';
import { NavPatientsPage } from '@/pages/navigator/Patients';
import { NavMessagesPage } from '@/pages/navigator/Messages';
import { NavChatPage } from '@/pages/navigator/Chat';
import { NavProfilePage } from '@/pages/navigator/Profile';
import { NavReviewQueuePage } from '@/pages/navigator/ReviewQueue';
import { NavCarePlanUpdatesPage } from '@/pages/navigator/CarePlanUpdates';
import { NavBatchReviewPage } from '@/pages/navigator/BatchReview';
import { NavCarePlanDetailPage } from '@/pages/navigator/CarePlanDetail';
import { NavActiveCarePlansPage } from '@/pages/navigator/ActiveCarePlans';
import { NavFollowUpAlertsPage } from '@/pages/navigator/FollowUpAlerts';
import { NavAdherenceMonitoringPage } from '@/pages/navigator/AdherenceMonitoring';

function RootRedirect() {
  const { user } = useAuth();
  if (user?.role === 'navigator') return <Navigate to="/nav/home" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Super-admin routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="navigators" element={<NavigatorsPage />} />
            <Route path="hospitals" element={<HospitalsPage />} />
            <Route path="hospitals/new" element={<HospitalFormPage />} />
            <Route path="hospitals/:id/edit" element={<HospitalFormPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="doctors/new" element={<DoctorFormPage />} />
            <Route path="doctors/:id/edit" element={<DoctorFormPage />} />
            <Route path="playbooks" element={<PlaybooksPage />} />
            <Route path="symptoms" element={<SymptomsPage />} />
            <Route path="roles" element={<RolesPage />} />
          </Route>

          {/* Navigator routes */}
          <Route
            path="nav"
            element={
              <ProtectedRoute allowedRoles={['navigator']}>
                <NavigatorShell />
              </ProtectedRoute>
            }
          >
            <Route path="home" element={<NavHomePage />} />
            <Route path="patients" element={<NavPatientsPage />} />
            <Route path="care-plan-updates" element={<NavCarePlanUpdatesPage />} />
            <Route path="review-queue" element={<NavReviewQueuePage />} />
            <Route path="review-queue/:batchId" element={<NavBatchReviewPage />} />
            <Route path="active-care-plans" element={<NavActiveCarePlansPage />} />
            <Route path="follow-up-alerts" element={<NavFollowUpAlertsPage />} />
            <Route path="adherence" element={<NavAdherenceMonitoringPage />} />
            <Route path="messages" element={<NavMessagesPage />} />
            <Route path="messages/:patientId" element={<NavChatPage />} />
            <Route path="care-plans/:patientId" element={<NavCarePlanDetailPage />} />
            <Route path="care-plans/:patientId/version/:versionId" element={<NavCarePlanDetailPage />} />
            <Route path="reports" element={<div className="p-6"><h1 className="text-xl font-semibold">Reports</h1><p className="text-sm text-muted-foreground mt-1">Coming soon.</p></div>} />
            <Route path="profile" element={<NavProfilePage />} />
            <Route index element={<Navigate to="home" replace />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
