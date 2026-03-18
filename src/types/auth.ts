export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'customer';
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastRoute: string;
}