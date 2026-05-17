import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabasePortal } from '../lib/supabasePortal';
import type { User } from '../types/auth';

interface PortalAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let subscription: any;

    const init = async () => {
      try {
        const { data: { session } } = await supabasePortal.auth.getSession();
        if (session?.user) {
          setUser(toUser(session.user));
        }

        const { data } = supabasePortal.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(toUser(session.user));
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        });
        subscription = data.subscription;
      } finally {
        setIsLoading(false);
      }
    };

    init();
    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabasePortal.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabasePortal.auth.signOut();
    setUser(null);
  };

  return (
    <PortalAuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider');
  return ctx;
}

function toUser(u: any): User {
  return {
    id: u.id,
    email: u.email!,
    name: u.user_metadata?.name || '',
    role: (u.user_metadata?.role as User['role']) ?? 'customer',
    createdAt: new Date(u.created_at),
  };
}
