import { useContext } from 'react';
import { AuthContext } from '../contexts/auth-context-value';
import type { AuthContextValue } from '../contexts/auth-context-value';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
