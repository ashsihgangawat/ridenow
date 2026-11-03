import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Cpu } from 'lucide-react';

export const RiderRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { riderToken, riderUser, loading } = useAuth();
  const location = useLocation();

  if (loading && !riderUser && riderToken) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white">
        <Cpu className="w-10 h-10 text-yellow-400 animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Verifying Rider Session...</p>
      </div>
    );
  }

  if (!riderToken || !riderUser) {
    return <Navigate to="/rider/login" state={{ from: location }} replace />;
  }

  const allowedRoles = ['RIDER', 'CUSTOMER'];
  if (!allowedRoles.includes(riderUser.role)) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-white">403 – Rider Portal Access Restricted</h2>
        <p className="text-xs text-neutral-400 mt-2 max-w-md">
          Your current session has role <span className="text-yellow-400 font-mono font-bold">[{riderUser.role}]</span>.
          This portal is reserved strictly for Riders.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/rider/login"
            className="px-4 py-2 bg-yellow-400 text-black font-bold text-xs rounded-xl hover:bg-yellow-300 transition"
          >
            Switch to Rider Account
          </a>
          <a
            href="/"
            className="px-4 py-2 bg-neutral-800 text-white font-bold text-xs rounded-xl hover:bg-neutral-700 transition"
          >
            Portal Directory
          </a>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export const DriverRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { driverToken, driverUser, loading } = useAuth();
  const location = useLocation();

  if (loading && !driverUser && driverToken) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white">
        <Cpu className="w-10 h-10 text-yellow-400 animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Verifying Driver Session...</p>
      </div>
    );
  }

  if (!driverToken || !driverUser) {
    return <Navigate to="/driver/login" state={{ from: location }} replace />;
  }

  if (driverUser.role !== 'DRIVER') {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-white">403 – Driver Portal Access Restricted</h2>
        <p className="text-xs text-neutral-400 mt-2 max-w-md">
          Your current session has role <span className="text-yellow-400 font-mono font-bold">[{driverUser.role}]</span>.
          This portal is reserved strictly for Registered Commercial Driver Partners.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/driver/login"
            className="px-4 py-2 bg-yellow-400 text-black font-bold text-xs rounded-xl hover:bg-yellow-300 transition"
          >
            Switch to Driver Partner
          </a>
          <a
            href="/"
            className="px-4 py-2 bg-neutral-800 text-white font-bold text-xs rounded-xl hover:bg-neutral-700 transition"
          >
            Portal Directory
          </a>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { adminToken, adminUser, loading } = useAuth();
  const location = useLocation();

  if (loading && !adminUser && adminToken) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white">
        <Cpu className="w-10 h-10 text-yellow-400 animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Verifying Admin Clearance...</p>
      </div>
    );
  }

  if (!adminToken || !adminUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'];
  if (!adminRoles.includes(adminUser.role)) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-white">403 – Administrative Access Denied</h2>
        <p className="text-xs text-neutral-400 mt-2 max-w-md">
          Administrative clearance required. Unauthenticated attempts are logged in the security ledger.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/admin/login"
            className="px-4 py-2 bg-yellow-400 text-black font-bold text-xs rounded-xl hover:bg-yellow-300 transition"
          >
            Admin Login
          </a>
          <a
            href="/"
            className="px-4 py-2 bg-neutral-800 text-white font-bold text-xs rounded-xl hover:bg-neutral-700 transition"
          >
            Return to Gateway
          </a>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

