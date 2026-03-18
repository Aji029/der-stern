export const AUTH_STORAGE_KEY = 'der-stern-auth';

export const DEFAULT_USER = {
  id: '1',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'admin' as const,
  createdAt: new Date(),
};