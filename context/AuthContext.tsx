import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signOut,
  onAuthStateChanged,
  User,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  ApplicationVerifier,
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  signInWithPhone: (phoneNumber: string, verifier: ApplicationVerifier) => Promise<string>;
  verifyOtp: (verificationId: string, otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
  };

  const signInWithPhone = async (phoneNumber: string, verifier: ApplicationVerifier) => {
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      return confirmation.verificationId;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const verifyOtp = async (verificationId: string, otp: string) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    signOutUser,
    signInWithPhone,
    verifyOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}