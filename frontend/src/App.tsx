import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Gateways & Shared
import { PortalGateway } from './pages/PortalGateway';
import { RiderRoute, DriverRoute, AdminRoute } from './components/RouteGuards';

// Rider Portal
import { RiderLayout } from '../customer/RiderLayout';
import { RiderLogin } from '../customer/RiderLogin';
import { RiderSignup } from '../customer/RiderSignup';
import { CustomerHome } from '../customer/CustomerHome';
import { ActiveRideView } from '../customer/ActiveRideView';
import { RideHistory } from '../customer/RideHistory';
import { CustomerProfile } from '../customer/CustomerProfile';

// Driver Portal
import { DriverLayout } from '../driver/DriverLayout';
import { DriverLogin } from '../driver/DriverLogin';
import { DriverSignup } from '../driver/DriverSignup';
import { DriverDashboard } from '../driver/DriverDashboard';
import { DriverEarnings } from '../driver/DriverEarnings';
import { DriverKyc } from '../driver/DriverKyc';
import { DriverRides } from '../driver/DriverRides';

// Admin Portal
import { AdminLogin } from '../admin/AdminLogin';
import { AdminLayout } from '../admin/AdminLayout';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-sans">
            <Routes>
              {/* Universal Gateway Landing Page */}
              <Route path="/" element={<PortalGateway />} />

              {/* ======================================================== */}
              {/* 1. RIDER PORTAL ROUTES                                    */}
              {/* ======================================================== */}
              <Route path="/rider/login" element={<RiderLogin />} />
              <Route path="/rider/signup" element={<RiderSignup />} />

              {/* Protected Rider Layout & Subroutes */}
              <Route
                path="/rider"
                element={
                  <RiderRoute>
                    <RiderLayout />
                  </RiderRoute>
                }
              >
                <Route index element={<Navigate to="/rider/dashboard" replace />} />
                <Route path="dashboard" element={<CustomerHome />} />
                <Route path="ride/:rideId" element={<ActiveRideView />} />
                <Route path="history" element={<RideHistory />} />
                <Route path="profile" element={<CustomerProfile />} />
              </Route>

              {/* Legacy rider aliases redirected to rider portal */}
              <Route path="/book" element={<Navigate to="/rider/dashboard" replace />} />
              <Route path="/history" element={<Navigate to="/rider/history" replace />} />
              <Route path="/profile" element={<Navigate to="/rider/profile" replace />} />
              <Route path="/ride/:rideId" element={<Navigate to="/rider/dashboard" replace />} />

              {/* ======================================================== */}
              {/* 2. DRIVER PORTAL ROUTES                                   */}
              {/* ======================================================== */}
              <Route path="/driver/login" element={<DriverLogin />} />
              <Route path="/driver/signup" element={<DriverSignup />} />

              {/* Protected Driver Layout & Subroutes */}
              <Route
                path="/driver"
                element={
                  <DriverRoute>
                    <DriverLayout />
                  </DriverRoute>
                }
              >
                <Route index element={<Navigate to="/driver/dashboard" replace />} />
                <Route path="dashboard" element={<DriverDashboard />} />
                <Route path="kyc" element={<DriverKyc />} />
                <Route path="earnings" element={<DriverEarnings />} />
                <Route path="rides" element={<DriverRides />} />
              </Route>

              {/* ======================================================== */}
              {/* 3. ADMIN PORTAL ROUTES                                    */}
              {/* ======================================================== */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Console */}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin"
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
