import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Account from './pages/Account';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Hostels from './pages/Hostels';
import Rooms from './pages/Rooms';
import Requests from './pages/Requests';
import Allocations from './pages/Allocations';
import Fees from './pages/Fees';
import Payments from './pages/Payments';
import Maintenance from './pages/Maintenance';
import Occupancy from './pages/Occupancy';
import Reports from './pages/Reports';
import Users from './pages/Users';
import SystemPage from './pages/System';
import MyRequest from './pages/student/MyRequest';
import MyFees from './pages/student/MyFees';
import MyMaintenance from './pages/student/MyMaintenance';
import Profile from './pages/student/Profile';

const adminRoles = ['SYSTEM_ADMIN', 'HOSTEL_ADMIN'];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="account" element={<Account />} />
        <Route path="students" element={<ProtectedRoute roles={adminRoles}><Students /></ProtectedRoute>} />
        <Route path="hostels" element={<ProtectedRoute roles={adminRoles}><Hostels /></ProtectedRoute>} />
        <Route path="rooms" element={<ProtectedRoute roles={adminRoles}><Rooms /></ProtectedRoute>} />
        <Route path="requests" element={<ProtectedRoute roles={adminRoles}><Requests /></ProtectedRoute>} />
        <Route path="allocations" element={<ProtectedRoute roles={adminRoles}><Allocations /></ProtectedRoute>} />
        <Route path="fees" element={<ProtectedRoute roles={adminRoles}><Fees /></ProtectedRoute>} />
        <Route path="payments" element={<ProtectedRoute roles={adminRoles}><Payments /></ProtectedRoute>} />
        <Route path="maintenance" element={<ProtectedRoute roles={adminRoles}><Maintenance /></ProtectedRoute>} />
        <Route path="occupancy" element={<ProtectedRoute roles={adminRoles}><Occupancy /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={adminRoles}><Reports /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['SYSTEM_ADMIN']}><Users /></ProtectedRoute>} />
        <Route path="system" element={<ProtectedRoute roles={['SYSTEM_ADMIN']}><SystemPage /></ProtectedRoute>} />
        <Route path="my-request" element={<ProtectedRoute roles={['STUDENT']}><MyRequest /></ProtectedRoute>} />
        <Route path="my-fees" element={<ProtectedRoute roles={['STUDENT']}><MyFees /></ProtectedRoute>} />
        <Route path="my-maintenance" element={<ProtectedRoute roles={['STUDENT']}><MyMaintenance /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute roles={['STUDENT']}><Profile /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
