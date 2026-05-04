import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
