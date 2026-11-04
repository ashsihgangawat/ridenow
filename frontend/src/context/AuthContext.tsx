import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchJson } from '../services/api';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'CUSTOMER' | 'RIDER' | 'DRIVER' | 'SUPER_ADMIN' | 'OPERATIONS_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  preferredLang: string;
  customerProfile?: any;
  driverProfile?: any;
  adminProfile?: any;
}

export type PortalType = 'RIDER' | 'DRIVER' | 'ADMIN';

export const getActivePortalFromPath = (): PortalType => {
  if (typeof window === 'undefined') return 'RIDER';
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'ADMIN';
  if (path.startsWith('/driver')) return 'DRIVER';
  return 'RIDER';
};

interface AuthContextType {
  // Current active portal context
  user: User | null;
  token: string | null;
  loading: boolean;
  activePortal: PortalType;
  
  // Isolated portal states
  riderUser: User | null;
  riderToken: string | null;
  driverUser: User | null;
  driverToken: string | null;
  adminUser: User | null;
  adminToken: string | null;

  // Language & i18n
  language: 'en' | 'hi';
  t: (key: string) => string;
  setLanguage: (lang: 'en' | 'hi') => void;

  // Portal Authentication Actions
  riderSignup: (data: { name: string; email?: string; phone: string; password: string }) => Promise<any>;
  riderLogin: (data: { identifier: string; password: string }) => Promise<any>;
  riderLogout: () => Promise<void>;

  driverSignup: (data: {
    name: string;
    email?: string;
    phone: string;
    password: string;
    vehicleCategory?: string;
    make?: string;
    model?: string;
    registrationNumber?: string;
  }) => Promise<any>;
  driverLogin: (data: { identifier: string; password: string }) => Promise<any>;
  driverLogout: () => Promise<void>;

  adminLogin: (email: string, password: string) => Promise<any>;
  adminLogout: () => Promise<void>;

  // Generic / current portal actions
  logout: () => Promise<void>;
  refreshUser: (portal?: PortalType) => Promise<void>;

  // Legacy OTP modal helpers
  loginWithOtp: (phone: string, otp: string, role?: string, vehicleDetails?: any) => Promise<any>;
  isLoginModalOpen: boolean;
  loginModalRole: 'CUSTOMER' | 'DRIVER';
  openLoginModal: (role?: 'CUSTOMER' | 'DRIVER') => void;
  closeLoginModal: () => void;
}

const translations: Record<'en' | 'hi', Record<string, string>> = {
  en: {
    brand: 'RideNow',
    ride: 'Ride',
    drive: 'Drive',
    admin: 'Admin',
    login: 'Log in',
    signup: 'Sign up',
    logout: 'Log out',
    pickupLocation: 'Pickup location',
    dropoffLocation: 'Drop-off location',
    seePrices: 'See prices',
    rideNow: 'Request RideNow',
    cash: 'Cash',
    online: 'Online (Razorpay / UPI)',
    sos: 'Emergency SOS',
    confirmBooking: 'Confirm Ride',
    driverPartner: 'Driver Partner',
    goOnline: 'Go Online',
    goOffline: 'Go Offline',
    earnings: 'Earnings',
    kycDocuments: 'KYC Documents',
    otpLabel: 'Ride Start PIN'
  },
  hi: {
    brand: 'RideNow',
    ride: 'सवारी (Ride)',
    drive: 'गाड़ी चलाएं (Drive)',
    admin: 'प्रशासक (Admin)',
    login: 'लॉग इन करें',
    signup: 'साइन अप करें',
    logout: 'लॉग आउट',
    pickupLocation: 'पिकअप स्थान दर्ज करें',
    dropoffLocation: 'गंतव्य स्थान दर्ज करें',
    seePrices: 'किराया देखें',
    rideNow: 'सवारी बुक करें',
    cash: 'नकद (Cash)',
    online: 'ऑनलाइन भुगतान (UPI / कार्ड)',
    sos: 'आपातकालीन सहायता (SOS)',
    confirmBooking: 'सवारी की पुष्टि करें',
    driverPartner: 'ड्राइवर पार्टनर',
    goOnline: 'ड्यूटी शुरू करें (ऑनलाइन)',
    goOffline: 'ड्यूटी समाप्त (ऑफलाइन)',
    earnings: 'कमाई',
    kycDocuments: 'दस्तावेज़ सत्यापन',
    otpLabel: 'सवारी शुरू पिन (PIN)'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Storage keys
  const RIDER_TOKEN_KEY = 'ridenow_rider_token';
  const RIDER_USER_KEY = 'ridenow_rider_user';
  const DRIVER_TOKEN_KEY = 'ridenow_driver_token';
  const DRIVER_USER_KEY = 'ridenow_driver_user';
  const ADMIN_TOKEN_KEY = 'ridenow_admin_token';
  const ADMIN_USER_KEY = 'ridenow_admin_user';

  const [activePortal, setActivePortal] = useState<PortalType>(getActivePortalFromPath());

  // Isolated tokens
  const [riderToken, setRiderToken] = useState<string | null>(() => localStorage.getItem(RIDER_TOKEN_KEY));
  const [riderUser, setRiderUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem(RIDER_USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  });

  const [driverToken, setDriverToken] = useState<string | null>(() => localStorage.getItem(DRIVER_TOKEN_KEY));
  const [driverUser, setDriverUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem(DRIVER_USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem(ADMIN_USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  });

  const [language, setLanguageState] = useState<'en' | 'hi'>(
    (localStorage.getItem('ridenow_lang') as 'en' | 'hi') || 'en'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalRole, setLoginModalRole] = useState<'CUSTOMER' | 'DRIVER'>('CUSTOMER');

  // Track location changes to keep activePortal and legacy ridenow_token updated
  useEffect(() => {
    const handleLocationChange = () => {
      const portal = getActivePortalFromPath();
      setActivePortal(portal);
      // Keep legacy ridenow_token in sync with active portal
      const currentToken = portal === 'ADMIN' ? adminToken : portal === 'DRIVER' ? driverToken : riderToken;
      if (currentToken) {
        localStorage.setItem('ridenow_token', currentToken);
      } else {
        localStorage.removeItem('ridenow_token');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [adminToken, driverToken, riderToken]);

  const openLoginModal = (role: 'CUSTOMER' | 'DRIVER' = 'CUSTOMER') => {
    setLoginModalRole(role);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const setLanguage = (lang: 'en' | 'hi') => {
    setLanguageState(lang);
    localStorage.setItem('ridenow_lang', lang);
  };

  // Refresh profile for a specific portal
  const refreshUser = useCallback(async (portal?: PortalType) => {
    const targetPortal = portal || getActivePortalFromPath();
    const tokenToUse =
      targetPortal === 'ADMIN' ? adminToken : targetPortal === 'DRIVER' ? driverToken : riderToken;

    if (!tokenToUse) {
      if (targetPortal === 'ADMIN') setAdminUser(null);
      if (targetPortal === 'DRIVER') setDriverUser(null);
      if (targetPortal === 'RIDER') setRiderUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchJson('/api/auth/me', {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });
      if (data.success && data.user) {
        if (targetPortal === 'ADMIN') {
          setAdminUser(data.user);
          localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
        } else if (targetPortal === 'DRIVER') {
          setDriverUser(data.user);
          localStorage.setItem(DRIVER_USER_KEY, JSON.stringify(data.user));
        } else {
          setRiderUser(data.user);
          localStorage.setItem(RIDER_USER_KEY, JSON.stringify(data.user));
        }
      } else {
        // Token invalid or expired
        if (targetPortal === 'ADMIN') {
          setAdminToken(null);
          setAdminUser(null);
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_USER_KEY);
        } else if (targetPortal === 'DRIVER') {
          setDriverToken(null);
          setDriverUser(null);
          localStorage.removeItem(DRIVER_TOKEN_KEY);
          localStorage.removeItem(DRIVER_USER_KEY);
        } else {
          setRiderToken(null);
          setRiderUser(null);
          localStorage.removeItem(RIDER_TOKEN_KEY);
          localStorage.removeItem(RIDER_USER_KEY);
        }
      }
    } catch (err) {
      console.warn('Auth refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [adminToken, driverToken, riderToken]);

  useEffect(() => {
    refreshUser();
  }, []);

  // --- RIDER ACTIONS ---
  const riderSignup = async (payload: { name: string; email?: string; phone: string; password: string }) => {
    const data = await fetchJson('/api/auth/rider/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.success && data.token) {
      localStorage.setItem(RIDER_TOKEN_KEY, data.token);
      localStorage.setItem(RIDER_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('ridenow_token', data.token);
      setRiderToken(data.token);
      setRiderUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Rider signup failed.');
  };

  const riderLogin = async (payload: { identifier: string; password: string }) => {
    const data = await fetchJson('/api/auth/rider/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.success && data.token) {
      localStorage.setItem(RIDER_TOKEN_KEY, data.token);
      localStorage.setItem(RIDER_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('ridenow_token', data.token);
      setRiderToken(data.token);
      setRiderUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Rider login failed.');
  };

  const riderLogout = async () => {
    if (riderToken) {
      try {
        await fetchJson('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${riderToken}` }
        });
      } catch (_) {}
    }
    localStorage.removeItem(RIDER_TOKEN_KEY);
    localStorage.removeItem(RIDER_USER_KEY);
    if (localStorage.getItem('ridenow_token') === riderToken) {
      localStorage.removeItem('ridenow_token');
    }
    setRiderToken(null);
    setRiderUser(null);
  };

  // --- DRIVER ACTIONS ---
  const driverSignup = async (payload: {
    name: string;
    email?: string;
    phone: string;
    password: string;
    vehicleCategory?: string;
    make?: string;
    model?: string;
    registrationNumber?: string;
  }) => {
    const data = await fetchJson('/api/auth/driver/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.success && data.token) {
      localStorage.setItem(DRIVER_TOKEN_KEY, data.token);
      localStorage.setItem(DRIVER_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('ridenow_token', data.token);
      setDriverToken(data.token);
      setDriverUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Driver registration failed.');
  };

  const driverLogin = async (payload: { identifier: string; password: string }) => {
    const data = await fetchJson('/api/auth/driver/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.success && data.token) {
      localStorage.setItem(DRIVER_TOKEN_KEY, data.token);
      localStorage.setItem(DRIVER_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('ridenow_token', data.token);
      setDriverToken(data.token);
      setDriverUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Driver login failed.');
  };

  const driverLogout = async () => {
    if (driverToken) {
      try {
        await fetchJson('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${driverToken}` }
        });
      } catch (_) {}
    }
    localStorage.removeItem(DRIVER_TOKEN_KEY);
    localStorage.removeItem(DRIVER_USER_KEY);
    if (localStorage.getItem('ridenow_token') === driverToken) {
      localStorage.removeItem('ridenow_token');
    }
    setDriverToken(null);
    setDriverUser(null);
  };

  // --- ADMIN ACTIONS ---
  const adminLogin = async (email: string, password: string) => {
    const data = await fetchJson('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.success && data.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('ridenow_token', data.token);
      setAdminToken(data.token);
      setAdminUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Admin authentication failed.');
  };

  const adminLogout = async () => {
    if (adminToken) {
      try {
        await fetchJson('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      } catch (_) {}
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    if (localStorage.getItem('ridenow_token') === adminToken) {
      localStorage.removeItem('ridenow_token');
    }
    setAdminToken(null);
    setAdminUser(null);
  };

  // Generic portal-aware logout
  const logout = async () => {
    const currentPortal = getActivePortalFromPath();
    if (currentPortal === 'ADMIN') await adminLogout();
    else if (currentPortal === 'DRIVER') await driverLogout();
    else await riderLogout();
  };

  // Legacy OTP flow handler (retained for backward compatibility)
  const loginWithOtp = async (phone: string, otp: string, role = 'CUSTOMER', vehicleDetails?: any) => {
    const data = await fetchJson('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, role, vehicleDetails })
    });
    if (data.success && data.token) {
      if (role === 'DRIVER') {
        localStorage.setItem(DRIVER_TOKEN_KEY, data.token);
        localStorage.setItem(DRIVER_USER_KEY, JSON.stringify(data.user));
        setDriverToken(data.token);
        setDriverUser(data.user);
      } else {
        localStorage.setItem(RIDER_TOKEN_KEY, data.token);
        localStorage.setItem(RIDER_USER_KEY, JSON.stringify(data.user));
        setRiderToken(data.token);
        setRiderUser(data.user);
      }
      localStorage.setItem('ridenow_token', data.token);
      return data;
    }
    throw new Error(data.message || 'OTP verification failed');
  };

  // Determine current active token & user dynamically based on URL
  const currentPortal = getActivePortalFromPath();
  const activeToken =
    currentPortal === 'ADMIN' ? adminToken : currentPortal === 'DRIVER' ? driverToken : riderToken;
  const activeUser =
    currentPortal === 'ADMIN' ? adminUser : currentPortal === 'DRIVER' ? driverUser : riderUser;

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        token: activeToken,
        loading,
        activePortal,

        riderUser,
        riderToken,
        driverUser,
        driverToken,
        adminUser,
        adminToken,

        language,
        t,
        setLanguage,

        riderSignup,
        riderLogin,
        riderLogout,

        driverSignup,
        driverLogin,
        driverLogout,

        adminLogin,
        adminLogout,

        logout,
        refreshUser,

        loginWithOtp,
        isLoginModalOpen,
        loginModalRole,
        openLoginModal,
        closeLoginModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const useRiderAuth = () => {
  const { riderUser, riderToken, riderSignup, riderLogin, riderLogout, loading, refreshUser } = useAuth();
  return {
    user: riderUser,
    token: riderToken,
    signup: riderSignup,
    login: riderLogin,
    logout: riderLogout,
    loading,
    refreshUser: () => refreshUser('RIDER')
  };
};

export const useDriverAuth = () => {
  const { driverUser, driverToken, driverSignup, driverLogin, driverLogout, loading, refreshUser } = useAuth();
  return {
    user: driverUser,
    token: driverToken,
    signup: driverSignup,
    login: driverLogin,
    logout: driverLogout,
    loading,
    refreshUser: () => refreshUser('DRIVER')
  };
};

export const useAdminAuth = () => {
  const { adminUser, adminToken, adminLogin, adminLogout, loading, refreshUser } = useAuth();
  return {
    user: adminUser,
    token: adminToken,
    login: adminLogin,
    logout: adminLogout,
    loading,
    refreshUser: () => refreshUser('ADMIN')
  };
};
