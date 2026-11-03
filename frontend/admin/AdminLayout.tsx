import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { AdminMap } from '../src/components/maps/AdminMap';
import {
  LayoutDashboard,
  Users,
  Car,
  FileCheck,
  Shield,
  Navigation,
  DollarSign,
  CreditCard,
  Percent,
  Tag,
  AlertTriangle,
  MessageSquare,
  Star,
  Bell,
  BarChart3,
  UserCheck,
  Settings,
  Cpu,
  History,
  LogOut,
  Search,
  CheckCircle,
  XCircle,
  Download,
  Plus,
  RefreshCw,
  Lock
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { adminUser: user, adminToken: token, adminLogout: logout, adminLogin } = useAuth();
  const [activeModule, setActiveModule] = useState<string>('dashboard');

  // Admin login form states if not logged in
  const [adminEmail, setAdminEmail] = useState('admin@ridenow.in');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [fareConfigs, setFareConfigs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [commissionStats, setCommissionStats] = useState<any>(null);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [apiConfig, setApiConfig] = useState<any>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  // Action states
  const [newCommissionRate, setNewCommissionRate] = useState('15');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Interactive Modals States
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('20');
  const [newPromoMaxDisc, setNewPromoMaxDisc] = useState('100');
  const [newPromoMinAmount, setNewPromoMinAmount] = useState('100');

  const [showResolveComplaint, setShowResolveComplaint] = useState(false);
  const [activeComplaintId, setActiveComplaintId] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('Admin@123');
  const [newAdminRole, setNewAdminRole] = useState('OPERATIONS_ADMIN');
  const [newAdminDept, setNewAdminDept] = useState('Operations');

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [activeRefundRideId, setActiveRefundRideId] = useState('');

  // Chat Safety Audit State
  const [showChatAudit, setShowChatAudit] = useState(false);
  const [activeChatAudit, setActiveChatAudit] = useState<any>(null);
  const [loadingChatAudit, setLoadingChatAudit] = useState(false);

  const handleOpenChatAudit = async (rideId: string) => {
    setLoadingChatAudit(true);
    setShowChatAudit(true);
    try {
      const res = await apiFetch(`/api/chat/admin/${rideId}/audit`);
      if (res.success) {
        setActiveChatAudit(res);
      } else {
        alert(res.message || 'Failed to fetch chat audit');
        setShowChatAudit(false);
      }
    } catch (e: any) {
      alert(e.message);
      setShowChatAudit(false);
    } finally {
      setLoadingChatAudit(false);
    }
  };
  const [refundAmount, setRefundAmount] = useState('100');
  const [refundReason, setRefundReason] = useState('Customer dispute resolution');

  // Fetch helper
  const apiFetch = async (path: string, options: any = {}) => {
    return fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    }).then(res => res.json());
  };

  const loadCurrentModuleData = async () => {
    if (!token) return;
    try {
      if (activeModule === 'dashboard') {
        const res = await apiFetch('/api/admin/dashboard/stats');
        if (res.success) setStats(res.stats);
      } else if (activeModule === 'customers') {
        const res = await apiFetch('/api/admin/customers');
        if (res.success) setCustomers(res.customers);
      } else if (activeModule === 'drivers') {
        const res = await apiFetch('/api/admin/drivers');
        if (res.success) setDrivers(res.drivers);
      } else if (activeModule === 'verification') {
        const res = await apiFetch('/api/admin/verifications/pending');
        if (res.success) setPendingVerifications(res.pendingVerifications);
      } else if (activeModule === 'vehicles') {
        const res = await apiFetch('/api/admin/vehicles');
        if (res.success) setVehicles(res.vehicles);
      } else if (activeModule === 'rides') {
        const res = await apiFetch('/api/admin/rides');
        if (res.success) setRides(res.rides);
      } else if (activeModule === 'live_tracking') {
        const res = await apiFetch('/api/admin/live-tracking');
        if (res.success) setLiveTelemetry(res);
      } else if (activeModule === 'fare_management') {
        const res = await apiFetch('/api/admin/fare-configurations');
        if (res.success) setFareConfigs(res.fareConfigurations);
      } else if (activeModule === 'payments') {
        const res = await apiFetch('/api/admin/payments');
        if (res.success) setPayments(res.payments);
      } else if (activeModule === 'commission') {
        const res = await apiFetch('/api/admin/commission');
        if (res.success) {
          setCommissionStats(res);
          setNewCommissionRate(res.currentRatePercent.toString());
        }
      } else if (activeModule === 'promos') {
        const res = await apiFetch('/api/admin/promos');
        if (res.success) setPromoCodes(res.promoCodes);
      } else if (activeModule === 'complaints' || activeModule === 'driver_complaints') {
        const res = await apiFetch('/api/admin/complaints');
        if (res.success) setComplaints(res.complaints);
      } else if (activeModule === 'reviews') {
        const res = await apiFetch('/api/admin/reviews');
        if (res.success) setReviews(res.reviews);
      } else if (activeModule === 'analytics') {
        const res = await apiFetch('/api/admin/analytics');
        if (res.success) setAnalytics(res);
      } else if (activeModule === 'admin_users') {
        const res = await apiFetch('/api/admin/users');
        if (res.success) setAdminUsers(res.adminUsers);
      } else if (activeModule === 'settings') {
        const res = await apiFetch('/api/admin/settings');
        if (res.success) setSystemSettings(res.settings);
      } else if (activeModule === 'api_config') {
        const res = await apiFetch('/api/admin/api-config');
        if (res.success) setApiConfig(res.configurations);
      } else if (activeModule === 'audit_logs') {
        const res = await apiFetch('/api/admin/audit-logs');
        if (res.success) setAuditLogs(res.auditLogs);
      }
    } catch (e) {
      console.warn('Admin load error:', e);
    }
  };

  useEffect(() => {
    loadCurrentModuleData();
  }, [activeModule, token]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await adminLogin(adminEmail, adminPassword);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // If user is not logged in as Admin, show Enterprise Admin Login form
  const isAdmin = user && ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(user.role);
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070709] cyber-circuit-bg flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-[#0e0e13]/95 backdrop-blur-2xl border-2 border-yellow-400/40 rounded-3xl p-8 shadow-neon-yellow space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 text-black font-black rounded-2xl flex items-center justify-center mx-auto text-xl shadow-neon-yellow-sm border border-yellow-400/40">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">RideNow Enterprise Portal</h2>
            <p className="text-xs text-neutral-400">Restricted to Super Admins & Operations Staff</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-semibold shadow-md">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Admin Email Address</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Master Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-[11px] text-neutral-400 space-y-1">
              <p>Demo Super Admin: <strong className="text-white">admin@ridenow.in</strong></p>
              <p>Password: <strong className="text-white">Admin@123</strong></p>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-black py-3.5 rounded-2xl text-sm transition shadow-neon-yellow border border-yellow-400/50"
            >
              {loginLoading ? 'Authenticating Core...' : 'Enter Admin Control Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 20 Enterprise Sidebar Modules
  const modules = [
    { id: 'dashboard', name: '1. Dashboard', icon: LayoutDashboard },
    { id: 'customers', name: '2. Customers Management', icon: Users },
    { id: 'drivers', name: '3. Drivers Management', icon: Car },
    { id: 'verification', name: '4. Driver Verification (KYC)', icon: FileCheck },
    { id: 'vehicles', name: '5. Vehicles Management', icon: Car },
    { id: 'rides', name: '6. Ride Management', icon: Navigation },
    { id: 'live_tracking', name: '7. Live Ride Tracking', icon: Navigation },
    { id: 'fare_management', name: '8. Fare Management', icon: DollarSign },
    { id: 'payments', name: '9. Payments Management', icon: CreditCard },
    { id: 'commission', name: '10. Commission Management', icon: Percent },
    { id: 'promos', name: '11. Promo Codes', icon: Tag },
    { id: 'complaints', name: '12. Customer Complaints', icon: AlertTriangle },
    { id: 'driver_complaints', name: '13. Driver Complaints', icon: MessageSquare },
    { id: 'reviews', name: '14. Reviews and Ratings', icon: Star },
    { id: 'notifications', name: '15. Notifications', icon: Bell },
    { id: 'analytics', name: '16. Reports and Analytics', icon: BarChart3 },
    { id: 'admin_users', name: '17. Admin Users and Roles', icon: UserCheck },
    { id: 'settings', name: '18. System Settings', icon: Settings },
    { id: 'api_config', name: '19. API Configuration', icon: Cpu },
    { id: 'audit_logs', name: '20. Audit Logs', icon: History }
  ];

  return (
    <div className="min-h-screen bg-[#070709] cyber-circuit-bg text-neutral-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#09090d]/95 backdrop-blur-2xl border-r border-yellow-500/20 flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-amber-500 text-black font-black rounded-xl shadow-neon-yellow-sm border border-yellow-400/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white">Super Admin</h1>
              <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {modules.map((m) => {
            const Icon = m.icon;
            const isSel = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModule(m.id);
                  setActionMessage('');
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isSel
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-black shadow-neon-yellow-sm border border-yellow-400/40'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* User bar */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="truncate text-xs">
            <p className="font-bold text-white truncate">{user.fullName}</p>
            <p className="text-neutral-400 text-[10px]">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Admin Working Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <h2 className="text-2xl font-black text-white capitalize">
              {modules.find((m) => m.id === activeModule)?.name}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Enterprise Mobility Control Center • India Operations</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadCurrentModuleData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-xl text-neutral-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-bold">
              PostgreSQL Connected
            </span>
          </div>
        </div>

        {actionMessage && (
          <div className="p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-bold">
            {actionMessage}
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 1: DASHBOARD OVERVIEW */}
        {/* =================================================== */}
        {activeModule === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                <p className="text-xs text-neutral-400 font-semibold">Total Revenue</p>
                <h3 className="text-2xl font-black text-white mt-1">₹{stats?.totalRevenue ?? '...'}</h3>
                <p className="text-[11px] text-emerald-400 font-bold mt-1">Gross Booking Volume</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                <p className="text-xs text-neutral-400 font-semibold">Platform Commission</p>
                <h3 className="text-2xl font-black text-amber-400 mt-1">₹{stats?.platformCommission ?? '...'}</h3>
                <p className="text-[11px] text-neutral-400 font-bold mt-1">15% Net Margin</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                <p className="text-xs text-neutral-400 font-semibold">Total Rides</p>
                <h3 className="text-2xl font-black text-white mt-1">{stats?.totalRides ?? '...'}</h3>
                <p className="text-[11px] text-blue-400 font-bold mt-1">{stats?.ongoingRides ?? 0} Active Trips</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                <p className="text-xs text-neutral-400 font-semibold">Pending Driver Approvals</p>
                <h3 className="text-2xl font-black text-amber-500 mt-1">{stats?.pendingDriverApprovals ?? '...'}</h3>
                <p className="text-[11px] text-amber-400 font-bold mt-1">Requires KYC Review</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl text-xs">
                <span className="text-neutral-400">Total Drivers:</span> <strong className="text-white">{stats?.totalDrivers ?? '...'}</strong>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl text-xs">
                <span className="text-neutral-400">Online Drivers:</span> <strong className="text-emerald-400">{stats?.onlineDrivers ?? '...'}</strong>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl text-xs">
                <span className="text-neutral-400">Completed Rides:</span> <strong className="text-white">{stats?.completedRides ?? '...'}</strong>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl text-xs">
                <span className="text-neutral-400">Cancelled Rides:</span> <strong className="text-red-400">{stats?.cancelledRides ?? '...'}</strong>
              </div>
            </div>

            {/* Quick Map Overview */}
            <div className="bg-neutral-900 p-4 rounded-3xl border border-neutral-800">
              <h3 className="text-sm font-bold text-white mb-3">Live Fleet & City Telemetry (OpenFreeMap)</h3>
              <AdminMap rides={rides} drivers={drivers} token={token} heightClass="h-[400px]" />
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 2: CUSTOMERS MANAGEMENT */}
        {/* =================================================== */}
        {activeModule === 'customers' && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Registered Passengers ({customers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Wallet Balance</th>
                    <th className="p-4">Total Rides</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-bold text-white">{c.fullName}</td>
                      <td className="p-4 text-neutral-300">{c.phone}</td>
                      <td className="p-4 font-mono">₹{c.walletBalance}</td>
                      <td className="p-4">{c.totalRides}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={async () => {
                            const newStatus = c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                            await apiFetch(`/api/admin/customers/${c.id}/status`, {
                              method: 'PUT',
                              body: JSON.stringify({ status: newStatus })
                            });
                            setActionMessage(`Customer ${c.fullName} status updated to ${newStatus}`);
                            loadCurrentModuleData();
                          }}
                          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold"
                        >
                          {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 3: DRIVERS MANAGEMENT */}
        {/* =================================================== */}
        {activeModule === 'drivers' && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Registered Driver Partners ({drivers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Driver Name</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Trips</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-bold text-white">{d.fullName}</td>
                      <td className="p-4 text-neutral-300">{d.vehicle ? `${d.vehicle.make} ${d.vehicle.model}` : 'None'}</td>
                      <td className="p-4 uppercase">{d.vehicle?.category || '-'}</td>
                      <td className="p-4 text-yellow-400 font-bold">★ {d.rating}</td>
                      <td className="p-4">{d.totalTrips}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.verificationStatus === 'APPROVED' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {d.verificationStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={async () => {
                            const newStatus = d.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                            await apiFetch(`/api/admin/drivers/${d.id}/status`, {
                              method: 'PUT',
                              body: JSON.stringify({ status: newStatus })
                            });
                            setActionMessage(`Driver ${d.fullName} marked as ${newStatus}`);
                            loadCurrentModuleData();
                          }}
                          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold"
                        >
                          {d.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 4: DRIVER VERIFICATION (KYC) */}
        {/* =================================================== */}
        {activeModule === 'verification' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Pending KYC Applications ({pendingVerifications.length})</h3>
            {pendingVerifications.length === 0 ? (
              <div className="bg-neutral-900 rounded-3xl p-8 text-center text-xs text-neutral-400 border border-neutral-800">
                All driver documents have been reviewed and verified. No pending items.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingVerifications.map((item) => (
                  <div key={item.driverId} className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-white">{item.fullName}</h4>
                        <p className="text-xs text-neutral-400">{item.phone} • DL: {item.licenseNumber}</p>
                      </div>
                      <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        PENDING REVIEW
                      </span>
                    </div>

                    {item.vehicle && (
                      <div className="bg-neutral-950 p-3 rounded-2xl text-xs">
                        <p className="text-neutral-400">Assigned Vehicle:</p>
                        <p className="font-bold text-white">{item.vehicle.make} {item.vehicle.model} ({item.vehicle.registrationNumber})</p>
                      </div>
                    )}

                    {item.documents?.length > 0 && (
                      <div>
                        <p className="text-xs text-neutral-400 font-semibold mb-2">Uploaded Document Proof:</p>
                        <img
                          src={item.documents[0].fileUrl}
                          alt="Document"
                          className="h-36 w-full object-cover rounded-xl border border-neutral-700"
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={async () => {
                          await apiFetch(`/api/admin/verifications/${item.driverId}/review`, {
                            method: 'POST',
                            body: JSON.stringify({ status: 'REJECTED', rejectionReason: 'Blurry document image or invalid license number' })
                          });
                          setActionMessage(`Driver ${item.fullName} KYC REJECTED.`);
                          loadCurrentModuleData();
                        }}
                        className="flex-1 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 font-bold py-2.5 rounded-xl text-xs transition"
                      >
                        Reject KYC
                      </button>

                      <button
                        onClick={async () => {
                          await apiFetch(`/api/admin/verifications/${item.driverId}/review`, {
                            method: 'POST',
                            body: JSON.stringify({ status: 'APPROVED' })
                          });
                          setActionMessage(`Driver ${item.fullName} KYC APPROVED! Partner can now accept rides.`);
                          loadCurrentModuleData();
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-md"
                      >
                        Approve Partner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 7: LIVE RIDE TRACKING */}
        {/* =================================================== */}
        {activeModule === 'live_tracking' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Live Fleet Telemetry</h3>
              <p className="text-xs text-neutral-400">
                Active Trips: <strong>{liveTelemetry?.activeRidesCount || 0}</strong> • Online Fleet: <strong>{liveTelemetry?.onlineDriversCount || 0}</strong>
              </p>
            </div>
            <div className="bg-neutral-900 p-4 rounded-3xl border border-neutral-800">
              <AdminMap rides={rides} drivers={drivers} token={token} heightClass="h-[560px]" />
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 8: FARE MANAGEMENT ENGINE */}
        {/* =================================================== */}
        {activeModule === 'fare_management' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-900 rounded-3xl border border-neutral-800 text-xs text-neutral-300">
              Formula: <strong>Estimated Fare = Base Fare + (Distance × Per KM) + Waiting Charges + Surge Multiplier</strong>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fareConfigs.map((fc) => (
                <div key={fc.id} className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-white text-base">{fc.name}</h4>
                    <span className="font-mono text-xs text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded">
                      {fc.category}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-neutral-400">Base Fare (₹)</label>
                      <input
                        type="number"
                        defaultValue={fc.baseFare}
                        id={`base_${fc.category}`}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400">Per KM Rate (₹)</label>
                      <input
                        type="number"
                        defaultValue={fc.perKmRate}
                        id={`perKm_${fc.category}`}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400">Waiting Charge / Min (₹)</label>
                      <input
                        type="number"
                        defaultValue={fc.waitingRateMin}
                        id={`wait_${fc.category}`}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400">Minimum Fare Guarantee (₹)</label>
                      <input
                        type="number"
                        defaultValue={fc.minimumFare}
                        id={`min_${fc.category}`}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400">Surge Multiplier (e.g. 1.0, 1.5)</label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={fc.surgeMultiplier}
                        id={`surge_${fc.category}`}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono mt-1"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const base = (document.getElementById(`base_${fc.category}`) as HTMLInputElement)?.value;
                      const perKm = (document.getElementById(`perKm_${fc.category}`) as HTMLInputElement)?.value;
                      const wait = (document.getElementById(`wait_${fc.category}`) as HTMLInputElement)?.value;
                      const min = (document.getElementById(`min_${fc.category}`) as HTMLInputElement)?.value;
                      const surge = (document.getElementById(`surge_${fc.category}`) as HTMLInputElement)?.value;

                      await apiFetch(`/api/admin/fare-configurations/${fc.category}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          baseFare: base,
                          perKmRate: perKm,
                          waitingRateMin: wait,
                          minimumFare: min,
                          surgeMultiplier: surge
                        })
                      });
                      setActionMessage(`Fare config for ${fc.name} updated successfully!`);
                      loadCurrentModuleData();
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 rounded-xl text-xs transition"
                  >
                    Save Rate Changes
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 10: COMMISSION MANAGEMENT */}
        {/* =================================================== */}
        {activeModule === 'commission' && commissionStats && (
          <div className="space-y-6">
            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Platform Commission Settings</h3>
              <p className="text-xs text-neutral-400">
                Configure the percentage deducted by RideNow India on every completed passenger trip.
              </p>

              <div className="flex items-center gap-3 max-w-sm">
                <input
                  type="number"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(e.target.value)}
                  className="w-32 bg-neutral-950 border border-neutral-700 rounded-2xl px-4 py-2.5 text-sm font-mono font-bold text-white"
                />
                <span className="font-bold text-sm">%</span>
                <button
                  onClick={async () => {
                    await apiFetch('/api/admin/commission', {
                      method: 'PUT',
                      body: JSON.stringify({ ratePercent: newCommissionRate })
                    });
                    setActionMessage(`Platform commission rate updated to ${newCommissionRate}%`);
                    loadCurrentModuleData();
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2.5 rounded-2xl text-xs"
                >
                  Update Rate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-900 p-5 rounded-3xl border border-neutral-800">
                <p className="text-xs text-neutral-400">Total Gross Processed</p>
                <h3 className="text-2xl font-black text-white mt-1">₹{commissionStats.totalGrossVolume}</h3>
              </div>
              <div className="bg-neutral-900 p-5 rounded-3xl border border-neutral-800">
                <p className="text-xs text-neutral-400">Total Retained Commission</p>
                <h3 className="text-2xl font-black text-amber-400 mt-1">₹{commissionStats.totalPlatformCommission}</h3>
              </div>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 15: NOTIFICATIONS BROADCAST */}
        {/* =================================================== */}
        {activeModule === 'notifications' && (
          <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 max-w-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Send Broadcast Push Notification</h3>
            <p className="text-xs text-neutral-400">Send system announcement to all passengers and driver partners.</p>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Title</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Monsoon Rain Surge Alert in Delhi"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Message</label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Important updates or discount announcements..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs text-white"
              />
            </div>

            <button
              onClick={async () => {
                if (!broadcastTitle || !broadcastMessage) return;
                await apiFetch('/api/admin/notifications/broadcast', {
                  method: 'POST',
                  body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage })
                });
                setActionMessage('Broadcast notification sent to all active users!');
                setBroadcastTitle('');
                setBroadcastMessage('');
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-2xl text-xs transition"
            >
              Broadcast Notification
            </button>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 16: REPORTS AND ANALYTICS & CSV EXPORT */}
        {/* =================================================== */}
        {activeModule === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Financial & Operational Analytics</h3>
                <p className="text-xs text-neutral-400">Completed rides revenue and category distributions</p>
              </div>
              <a
                href="/api/admin/analytics/export-csv"
                target="_blank"
                download
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs transition"
              >
                <Download className="w-4 h-4" /> Export CSV Report
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-400 uppercase mb-4">Vehicle Category Breakdown</h4>
                <div className="space-y-3">
                  {analytics?.categoryShare &&
                    Object.entries(analytics.categoryShare).map(([cat, count]: any) => (
                      <div key={cat} className="flex justify-between text-xs">
                        <span className="font-bold text-white">{cat}</span>
                        <span className="font-mono text-neutral-400">{count} rides</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-400 uppercase mb-4">Daily Performance</h4>
                <div className="space-y-3">
                  {analytics?.dailyBreakdown?.map((item: any) => (
                    <div key={item.date} className="flex justify-between text-xs border-b border-neutral-800 pb-2">
                      <span className="text-neutral-300">{item.date}</span>
                      <span className="font-mono text-emerald-400 font-bold">₹{item.revenue} ({item.rides} rides)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 20: AUDIT LOGS */}
        {/* =================================================== */}
        {activeModule === 'audit_logs' && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white">Immutable Administrative Audit Trail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target Entity</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-mono text-neutral-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-amber-400">{log.action}</td>
                      <td className="p-4">{log.targetEntity}</td>
                      <td className="p-4 text-neutral-300 max-w-sm truncate">{log.details}</td>
                      <td className="p-4 font-mono text-neutral-500">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 5: VEHICLES MANAGEMENT */}
        {/* =================================================== */}
        {activeModule === 'vehicles' && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Commercial Fleet Vehicles ({vehicles.length})</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Automobile fleet, vehicle models and number plates</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Reg. Number</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Make & Model</th>
                    <th className="p-4">Assigned Driver</th>
                    <th className="p-4">Seating</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-mono font-bold text-amber-400">{v.registrationNumber}</td>
                      <td className="p-4 font-bold text-white">{v.category}</td>
                      <td className="p-4 text-neutral-300">{v.make} {v.model} ({v.year || 2023})</td>
                      <td className="p-4">
                        <span className="font-semibold text-white block">{v.driverName}</span>
                        <span className="text-neutral-500 text-[10px]">{v.driverPhone}</span>
                      </td>
                      <td className="p-4 font-mono">{v.capacity || 4} Seats</td>
                      <td className="p-4">
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 6: RIDE REGISTRY MANAGEMENT */}
        {/* =================================================== */}
        {activeModule === 'rides' && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Platform Ride Registry ({rides.length})</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Real-time status of all bookings in India</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Booking Code</th>
                    <th className="p-4">Passenger</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Pickup & Drop Route</th>
                    <th className="p-4">Fare</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Communication</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {rides.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-mono font-bold text-white">{r.bookingCode}</td>
                      <td className="p-4">
                        <span className="font-bold text-white block">{r.customerName}</span>
                        <span className="text-neutral-500 text-[10px]">{r.customerPhone}</span>
                      </td>
                      <td className="p-4 uppercase font-bold text-amber-400">{r.vehicleCategory}</td>
                      <td className="p-4 max-w-xs text-neutral-300">
                        <p className="truncate"><span className="text-emerald-400">P:</span> {r.pickupAddress}</p>
                        <p className="truncate"><span className="text-amber-400">D:</span> {r.dropAddress}</p>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">₹{r.totalFare}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : r.status === 'CANCELLED'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleOpenChatAudit(r.id)}
                          className="px-2.5 py-1 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-lg border border-yellow-400/30 text-[11px] font-bold flex items-center gap-1 transition"
                          title="Review chat messages for dispute / safety"
                        >
                          <MessageSquare className="w-3 h-3 text-yellow-400" />
                          <span>Audit Chat</span>
                        </button>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-neutral-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 9: PAYMENTS & REFUNDS */}
        {/* =================================================== */}
        {activeModule === 'payments' && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Payments & Settlements ({payments.length})</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Razorpay Online and Cash on Delivery transaction records</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Trip Booking</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Platform Cut</th>
                    <th className="p-4">Driver Payout</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-mono font-bold text-white">{p.bookingCode}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400 text-sm">₹{p.amount}</td>
                      <td className="p-4 font-mono text-amber-400">₹{p.platformCommission}</td>
                      <td className="p-4 font-mono text-white">₹{p.driverEarnings}</td>
                      <td className="p-4 font-bold">{p.method}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'REFUNDED'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {p.status !== 'REFUNDED' && (
                          <button
                            onClick={() => {
                              setActiveRefundRideId(p.id);
                              setRefundAmount(p.amount.toString());
                              setShowRefundModal(true);
                            }}
                            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-red-400 hover:text-red-300 rounded-xl text-xs font-semibold"
                          >
                            Process Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 11: PROMO CODES */}
        {/* =================================================== */}
        {activeModule === 'promos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Active Promotional Vouchers ({promoCodes.length})</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Campaigns, percentage discounts and usage tracking</p>
              </div>
              <button
                onClick={() => setShowCreatePromo(true)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2 rounded-2xl text-xs transition shadow-md"
              >
                <Plus className="w-4 h-4" /> Create Promo Code
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promoCodes.map((p) => (
                <div key={p.id} className="bg-neutral-900 p-5 rounded-3xl border border-neutral-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-base font-black text-amber-400 bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-xl">
                      {p.code}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full">
                      {p.isActive ? 'ACTIVE' : 'EXPIRED'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-medium">{p.description}</p>
                  <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-3 rounded-2xl text-[11px] font-mono text-neutral-400">
                    <div>
                      <span>Discount:</span> <strong className="text-white block">{p.discountPercent}%</strong>
                    </div>
                    <div>
                      <span>Max Cap:</span> <strong className="text-white block">₹{p.maxDiscount}</strong>
                    </div>
                    <div>
                      <span>Redeemed:</span> <strong className="text-amber-400 block">{p.usedCount} / {p.maxUses}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 12 & 13: COMPLAINTS TICKETING */}
        {/* =================================================== */}
        {(activeModule === 'complaints' || activeModule === 'driver_complaints') && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Support Grievance Tickets ({complaints.length})</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Customer & Driver partner dispute resolution</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Ticket ID</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Subject & Description</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-mono font-bold text-amber-400">{c.ticketId}</td>
                      <td className="p-4">
                        <span className="font-bold text-white block">{c.userName}</span>
                        <span className="text-neutral-500 text-[10px]">{c.userRole}</span>
                      </td>
                      <td className="p-4 font-bold text-neutral-300">{c.category}</td>
                      <td className="p-4 max-w-sm">
                        <p className="font-bold text-white truncate">{c.subject}</p>
                        <p className="text-neutral-400 text-[11px] truncate">{c.description}</p>
                        {c.resolution && (
                          <p className="text-emerald-400 text-[10px] mt-1 font-mono">Res: {c.resolution}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {c.status !== 'RESOLVED' ? (
                          <button
                            onClick={() => {
                              setActiveComplaintId(c.id);
                              setShowResolveComplaint(true);
                            }}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-500 font-mono">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 14: REVIEWS AND RATINGS */}
        {/* =================================================== */}
        {activeModule === 'reviews' && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white">Passenger Trip Reviews & Compliments ({reviews.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Driver Partner</th>
                    <th className="p-4">Comment</th>
                    <th className="p-4">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-bold text-yellow-400 text-sm">★ {r.rating} / 5</td>
                      <td className="p-4 font-bold text-white">{r.customerName}</td>
                      <td className="p-4 font-bold text-neutral-300">{r.driverName}</td>
                      <td className="p-4 text-neutral-200">{r.comment || 'Smooth ride'}</td>
                      <td className="p-4 text-neutral-400 font-mono text-[11px]">{r.tags || 'Safe Driving'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 17: ADMIN USERS AND ROLES */}
        {/* =================================================== */}
        {activeModule === 'admin_users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Platform Staff & Roles ({adminUsers.length})</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Role-Based Access Control (RBAC) permissions</p>
              </div>
              <button
                onClick={() => setShowCreateAdmin(true)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2 rounded-2xl text-xs transition shadow-md"
              >
                <Plus className="w-4 h-4" /> Add Admin User
              </button>
            </div>

            <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono">
                  <tr>
                    <th className="p-4">Staff Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium">
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-800/40">
                      <td className="p-4 font-bold text-white">{u.fullName}</td>
                      <td className="p-4 font-mono text-neutral-300">{u.email}</td>
                      <td className="p-4 text-neutral-400">{u.phone}</td>
                      <td className="p-4 font-mono text-amber-400 font-bold">{u.role}</td>
                      <td className="p-4">
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 18: SYSTEM SETTINGS */}
        {/* =================================================== */}
        {activeModule === 'settings' && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white">System Global Configuration</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Control emergency routing, maintenance mode, and surge</p>
            </div>

            <div className="space-y-4">
              {systemSettings.map((s) => (
                <div key={s.id} className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-amber-400">{s.key}</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{s.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={s.value}
                      id={`setting_${s.key}`}
                      className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        const val = (document.getElementById(`setting_${s.key}`) as HTMLInputElement)?.value;
                        await apiFetch(`/api/admin/settings/${s.key}`, {
                          method: 'PUT',
                          body: JSON.stringify({ value: val })
                        });
                        setActionMessage(`Setting ${s.key} updated to "${val}"`);
                        loadCurrentModuleData();
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3 py-1.5 rounded-xl text-xs transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* MODULE 19: API CONFIGURATION STATUS */}
        {/* =================================================== */}
        {activeModule === 'api_config' && apiConfig && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Google Maps & GPS</h4>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                  {apiConfig.googleMaps?.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400">Mode: {apiConfig.googleMaps?.mode}</p>
              <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside">
                {apiConfig.googleMaps?.features?.map((f: string) => <li key={f}>{f}</li>)}
              </ul>
            </div>

            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Razorpay India Gateway</h4>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                  {apiConfig.razorpay?.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400">Merchant ID: {apiConfig.razorpay?.merchantId}</p>
              <div className="text-[11px] text-neutral-300 space-y-1">
                <p>✅ UPI QR & Handles Active</p>
                <p>✅ RuPay / Visa / MasterCards</p>
                <p>✅ 50+ NetBanking Nodes</p>
              </div>
            </div>

            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">RideNow SMS Node</h4>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                  {apiConfig.smsGateway?.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400">Provider: {apiConfig.smsGateway?.provider}</p>
              <p className="text-[11px] text-amber-400 font-mono">Test OTP Code: {apiConfig.smsGateway?.testOtpCode}</p>
            </div>
          </div>
        )}

      {/* CREATE PROMO CODE MODAL */}
      {showCreatePromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 text-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Create Promotional Voucher</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. DIWALI50"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 50% discount on all sedan rides"
                  value={newPromoDesc}
                  onChange={(e) => setNewPromoDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    value={newPromoMaxDisc}
                    onChange={(e) => setNewPromoMaxDisc(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreatePromo(false)}
                className="flex-1 bg-neutral-800 text-neutral-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newPromoCode) return;
                  await apiFetch('/api/admin/promos', {
                    method: 'POST',
                    body: JSON.stringify({
                      code: newPromoCode,
                      description: newPromoDesc || `${newPromoDiscount}% discount voucher`,
                      discountPercent: newPromoDiscount,
                      maxDiscount: newPromoMaxDisc,
                      minRideAmount: newPromoMinAmount
                    })
                  });
                  setShowCreatePromo(false);
                  setNewPromoCode('');
                  setActionMessage(`Promo code ${newPromoCode} created successfully!`);
                  loadCurrentModuleData();
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-extrabold"
              >
                Create Promo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE COMPLAINT MODAL */}
      {showResolveComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 text-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Resolve Support Ticket</h3>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Resolution Message / Actions Taken</label>
              <textarea
                rows={4}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Details of customer resolution or driver compensation..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResolveComplaint(false)}
                className="flex-1 bg-neutral-800 text-neutral-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await apiFetch(`/api/admin/complaints/${activeComplaintId}/resolve`, {
                    method: 'PUT',
                    body: JSON.stringify({ resolution: resolutionText || 'Issue resolved by operations team.' })
                  });
                  setShowResolveComplaint(false);
                  setResolutionText('');
                  setActionMessage('Ticket marked as RESOLVED.');
                  loadCurrentModuleData();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-extrabold"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ADMIN USER MODAL */}
      {showCreateAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 text-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Add Enterprise Admin User</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="priya@ridenow.in"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Administrative Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-white"
                >
                  <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN</option>
                  <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
                  <option value="SUPPORT_ADMIN">SUPPORT_ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateAdmin(false)}
                className="flex-1 bg-neutral-800 text-neutral-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newAdminEmail || !newAdminPassword) return;
                  await apiFetch('/api/admin/users', {
                    method: 'POST',
                    body: JSON.stringify({
                      fullName: newAdminName || 'Admin Staff',
                      email: newAdminEmail,
                      password: newAdminPassword,
                      role: newAdminRole,
                      department: newAdminDept
                    })
                  });
                  setShowCreateAdmin(false);
                  setNewAdminEmail('');
                  setActionMessage(`Staff user ${newAdminName} created successfully.`);
                  loadCurrentModuleData();
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-extrabold"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS REFUND MODAL */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 text-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Process Passenger Refund</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Reason for Refund</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 bg-neutral-800 text-neutral-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await apiFetch(`/api/admin/payments/${activeRefundRideId}/refund`, {
                    method: 'POST',
                    body: JSON.stringify({ amount: refundAmount, reason: refundReason })
                  });
                  setShowRefundModal(false);
                  setActionMessage(`Refund of ₹${refundAmount} processed successfully.`);
                  loadCurrentModuleData();
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-xs font-extrabold"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Chat Safety Audit Modal */}
      {showChatAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0e0e13] border border-yellow-500/40 rounded-3xl p-6 shadow-neon-yellow space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Ride Communication Audit</h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                    DISPUTE & SAFETY
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">Booking #{activeChatAudit?.bookingCode || '...'}</p>
              </div>
              <button
                onClick={() => setShowChatAudit(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[11px] text-yellow-300">
              ⚠️ <strong>Super Admin Audit Notice:</strong> Accessing private passenger-driver messages is recorded in the immutable audit log for compliance.
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 p-2">
              {loadingChatAudit && (
                <div className="text-center py-8 text-neutral-400 text-xs">Loading audit transcript...</div>
              )}
              {!loadingChatAudit && (!activeChatAudit?.messages || activeChatAudit.messages.length === 0) && (
                <div className="text-center py-8 text-neutral-400 text-xs">No chat messages recorded for this ride.</div>
              )}
              {!loadingChatAudit && activeChatAudit?.messages?.map((m: any) => (
                <div key={m.id} className="p-3 bg-neutral-900 rounded-xl border border-white/5 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                    <span className="font-bold text-yellow-400">[{m.senderRole}] {m.senderName}</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-white">{m.message}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowChatAudit(false)}
              className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Close Audit Transcript
            </button>
          </div>
        </div>
      )}

      </main>
    </div>
  );
};

