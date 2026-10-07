import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { getSupabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, preferredRole?: UserRole) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  // Role-based permission checks
  canAccess: (permission: PermissionKey) => boolean;
}

export type PermissionKey =
  | 'manage_medicines'
  | 'manage_categories'
  | 'manage_generics'
  | 'manage_purchases'
  | 'manage_sales'
  | 'manage_returns'
  | 'manage_inventory'
  | 'manage_expenses'
  | 'manage_accounts'
  | 'view_reports'
  | 'manage_users'
  | 'manage_settings'
  | 'view_audit_logs';

const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  'Super Admin': [
    'manage_medicines',
    'manage_categories',
    'manage_generics',
    'manage_purchases',
    'manage_sales',
    'manage_returns',
    'manage_inventory',
    'manage_expenses',
    'manage_accounts',
    'view_reports',
    'manage_users',
    'manage_settings',
    'view_audit_logs',
  ],
  Admin: [
    'manage_medicines',
    'manage_categories',
    'manage_generics',
    'manage_purchases',
    'manage_sales',
    'manage_returns',
    'manage_inventory',
    'manage_expenses',
    'manage_accounts',
    'view_reports',
    'manage_settings',
  ],
  Manager: [
    'manage_medicines',
    'manage_purchases',
    'manage_sales',
    'manage_returns',
    'manage_inventory',
    'view_reports',
  ],
  Pharmacist: [
    'manage_medicines',
    'manage_sales',
    'manage_returns',
    'manage_inventory',
  ],
  Salesman: [
    'manage_sales',
    'manage_returns',
  ],
  Accountant: [
    'manage_expenses',
    'manage_accounts',
    'view_reports',
  ],
  Customer: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('medistock_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default logged in user for immediate seamless experience
    return {
      id: 'usr-admin-1',
      email: 'admin@medistockpro.com',
      full_name: 'Dr. Tarique Rahman (Chief Pharmacist)',
      role: 'Super Admin',
      phone: '+880 1711-000111',
    };
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If Supabase is available, sync session
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser((prev) => ({
            id: session.user.id,
            email: session.user.email || 'user@medistockpro.com',
            full_name: session.user.user_metadata?.full_name || prev?.full_name || 'Staff Member',
            role: (session.user.user_metadata?.role as UserRole) || prev?.role || 'Super Admin',
            phone: session.user.phone || prev?.phone,
          }));
        }
      });
    }
  }, []);

  const login = async (email: string, password = '', preferredRole: UserRole = 'Super Admin') => {
    setIsLoading(true);
    try {
      const supabase = getSupabase();
      if (supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || 'Staff User',
            role: (data.user.user_metadata?.role as UserRole) || preferredRole,
          };
          setUser(profile);
          localStorage.setItem('medistock_current_user', JSON.stringify(profile));
          setIsLoading(false);
          return;
        }
      }

      // Local / instant auth login
      const profile: UserProfile = {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.split('@')[0].toUpperCase().replace('.', ' '),
        role: preferredRole,
      };
      setUser(profile);
      localStorage.setItem('medistock_current_user', JSON.stringify(profile));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password = '') => {
    setIsLoading(true);
    try {
      const supabase = getSupabase();
      if (supabase && password) {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, role: 'Pharmacist' },
          },
        });
      }
      const profile: UserProfile = {
        id: `usr-${Date.now()}`,
        email,
        full_name: name,
        role: 'Pharmacist',
      };
      setUser(profile);
      localStorage.setItem('medistock_current_user', JSON.stringify(profile));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('medistock_current_user');
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('medistock_current_user', JSON.stringify(updated));
    } else {
      const profile: UserProfile = {
        id: `usr-${Date.now()}`,
        email: `${newRole.toLowerCase().replace(' ', '')}@medistockpro.com`,
        full_name: `${newRole} User`,
        role: newRole,
      };
      setUser(profile);
      localStorage.setItem('medistock_current_user', JSON.stringify(profile));
    }
  };

  const role = user?.role || 'Customer';

  const canAccess = (permission: PermissionKey): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        canAccess,
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
