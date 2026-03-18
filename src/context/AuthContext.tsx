import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, retryRequest } from '../lib/supabase';
import type { User } from '../types/auth';

interface SignupData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string) => Promise<void>;
  lastRoute: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRoute, setLastRoute] = useState<string>('/dashboard');
  const initializingRef = useRef(false);

  // Save route on location change
  useEffect(() => {
    if (location.pathname !== '/login' && location.pathname !== '/signup') {
      setLastRoute(location.pathname + location.search + location.hash);
    }
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (initializingRef.current) return;

    initializingRef.current = true;
    let subscription: any;

    const initializeAuth = async () => {
      try {
        // Check if we're already on the login page to avoid redirect loops
        const isAuthPage = window.location.pathname === '/login' ||
                         window.location.pathname === '/signup' ||
                         window.location.pathname === '/forgot-password';

        setIsLoading(true);
        setError(null);

        const { data: { session }, error: sessionError } = await retryRequest(
          () => supabase.auth.getSession()
        );

        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.name || '',
            role: 'customer',
            createdAt: new Date(session.user.created_at),
          });
          // Only navigate if we're on an auth page
          if (isAuthPage) {
            navigate(lastRoute, { replace: true });
          }
        } else {
          setUser(null);
          // Only navigate to login if we're not already on an auth page
          if (!isAuthPage) {
            navigate('/login', { replace: true });
          }
        }

        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          const currentIsAuthPage = window.location.pathname === '/login' ||
                                   window.location.pathname === '/signup' ||
                                   window.location.pathname === '/forgot-password';

          if (event === 'SIGNED_IN' && session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata.name || '',
              role: 'customer',
              createdAt: new Date(session.user.created_at),
            });
            // Only navigate if we're on an auth page
            if (currentIsAuthPage) {
              navigate('/dashboard', { replace: true });
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            navigate('/login', { replace: true });
          }
        });

        subscription = data.subscription;
      } catch (err: any) {
        const error = supabase.handleError(err);
        console.error('Auth initialization error:', error);
        setError(error.message);
        setUser(null);
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    initializeAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      initializingRef.current = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (err: any) {
      const error = supabase.handleError(err);
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; message: string }> => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            company_name: data.companyName,
            phone: data.phone,
          },
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Account created successfully! You can now log in.',
      };
    } catch (err: any) {
      const error = supabase.handleError(err);
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create account',
      };
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      navigate('/login');
    } catch (err: any) {
      const error = supabase.handleError(err);
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (err: any) {
      const error = supabase.handleError(err);
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    signup,
    resetPassword,
    lastRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}