import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Redirect } from 'expo-router';

export default function LoginScreen() {
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and signup
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('Success', 'Account created! Please log in.');
        setIsSignUp(false); // Switch back to login after signup
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-6 justify-center">
      <Text className="text-3xl font-bold text-gray-800 mb-6 text-center">
        {isSignUp ? 'Sign Up' : 'Login'}
      </Text>

      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        className="bg-teal-600 p-3 rounded-full mb-4"
        onPress={handleAuth}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-center text-lg">
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text className="text-blue-600 text-center">
          {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}