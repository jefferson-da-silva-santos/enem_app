// context/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { userRepository, Usuario } from '../database/repositories/userRepository';

interface AuthState {
  isLoading: boolean;
  isFirstAccess: boolean;
  isLocked: boolean;
  isAuthenticated: boolean;
  user: Usuario | null;
  failedAttempts: number;
  isTemporarilyBlocked: boolean;
  blockEndTime: number | null;
}

interface AuthContextType extends AuthState {
  checkFirstAccess: () => Promise<void>;
  createPin: (pin: string) => Promise<void>;
  validatePin: (pin: string) => Promise<boolean>;
  updatePin: (currentPin: string, newPin: string) => Promise<boolean>;
  resetPinAndData: (newPin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isFirstAccess: false,
    isLocked: true,
    isAuthenticated: false,
    user: null,
    failedAttempts: 0,
    isTemporarilyBlocked: false,
    blockEndTime: null,
  });

  const checkFirstAccess = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    const hasUser = await userRepository.hasUser();
    setState(s => ({
      ...s,
      isLoading: false,
      isFirstAccess: !hasUser,
      isLocked: hasUser,
    }));
  }, []);

  useEffect(() => {
    checkFirstAccess();
  }, []);

  // Auto-unblock timer
  useEffect(() => {
    if (state.blockEndTime) {
      const remaining = state.blockEndTime - Date.now();
      if (remaining <= 0) {
        setState(s => ({ ...s, isTemporarilyBlocked: false, blockEndTime: null, failedAttempts: 0 }));
        return;
      }
      const timer = setTimeout(() => {
        setState(s => ({ ...s, isTemporarilyBlocked: false, blockEndTime: null, failedAttempts: 0 }));
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [state.blockEndTime]);

  const createPin = useCallback(async (pin: string) => {
    const userId = await userRepository.createUser(pin);
    const user = await userRepository.getUser();
    setState(s => ({
      ...s,
      isFirstAccess: false,
      isLocked: false,
      isAuthenticated: true,
      user,
    }));
  }, []);

  const validatePin = useCallback(async (pin: string): Promise<boolean> => {
    if (state.isTemporarilyBlocked) return false;

    const user = await userRepository.validatePin(pin);
    if (user) {
      setState(s => ({
        ...s,
        isLocked: false,
        isAuthenticated: true,
        user,
        failedAttempts: 0,
        isTemporarilyBlocked: false,
        blockEndTime: null,
      }));
      return true;
    } else {
      const newAttempts = state.failedAttempts + 1;
      const blocked = newAttempts >= MAX_ATTEMPTS;
      setState(s => ({
        ...s,
        failedAttempts: newAttempts,
        isTemporarilyBlocked: blocked,
        blockEndTime: blocked ? Date.now() + BLOCK_DURATION_MS : null,
      }));
      return false;
    }
  }, [state.failedAttempts, state.isTemporarilyBlocked]);

  const updatePin = useCallback(async (currentPin: string, newPin: string): Promise<boolean> => {
    if (!state.user) return false;
    return userRepository.updatePin(state.user.id, currentPin, newPin);
  }, [state.user]);

  const resetPinAndData = useCallback(async (newPin: string) => {
    await userRepository.resetPinAndData(newPin);
    const user = await userRepository.getUser();
    setState(s => ({
      ...s,
      isFirstAccess: false,
      isLocked: false,
      isAuthenticated: true,
      user,
      failedAttempts: 0,
    }));
  }, []);

  const logout = useCallback(() => {
    setState(s => ({
      ...s,
      isLocked: true,
      isAuthenticated: false,
      failedAttempts: 0,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      checkFirstAccess,
      createPin,
      validatePin,
      updatePin,
      resetPinAndData,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}