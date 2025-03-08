import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { View, Text } from 'react-native';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? user.uid : 'null');
      setUser(user);
      setLoading(false);
    });
    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Attempting login with:', email);
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful');
  };

  const logout = async () => {
    await signOut(auth);
    console.log('Logged out');
  };

  const signup = async (email: string, password: string) => {
    console.log('Attempting signup with:', email);
    await createUserWithEmailAndPassword(auth, email, password);
    console.log('Signup successful');
  };

  const value: AuthContextValue = { user, login, logout, signup };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <View className="flex-1 justify-center items-center bg-gray-100">
          <Text className="text-lg text-gray-600">Loading...</Text>
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}