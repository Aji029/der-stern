import { AUTH_STORAGE_KEY, DEFAULT_USER } from './constants';
import type { User } from '../../types/auth';

interface StoredAuth {
  user: User | null;
  sessionExpiry?: string;
}

export const getStoredAuth = (): StoredAuth | null => {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading auth from storage:', error);
    return null;
  }
};

export const setStoredAuth = (auth: StoredAuth | null): void => {
  try {
    if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error writing auth to storage:', error);
  }
};

// For demo purposes, store the default user's credentials
const DEMO_CREDENTIALS = {
  email: DEFAULT_USER.email,
  password: 'demo123',
};

export const validateCredentials = (email: string, password: string): boolean => {
  return email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
};