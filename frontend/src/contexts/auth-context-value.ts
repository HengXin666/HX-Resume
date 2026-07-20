import { createContext } from 'react';

export interface AuthContextValue {
  checking: boolean;
  authenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
