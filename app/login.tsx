import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  // State variables for email, password, and error messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Access authentication functions from AuthContext
  const { login, signup } = useAuth();

  // Handle login button press
  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle signup button press
  const handleSignup = async () => {
    try {
      await signup(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // JSX for the login screen UI
  return (
    <View className="flex-1 bg-gray-100 justify-center p-6">
      <Text className="text-3xl font-bold text-center mb-6">Welcome</Text>
      
      <TextInput
        className="bg-white p-4 rounded-lg mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        className="bg-white p-4 rounded-lg mb-4"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      {error ? <Text className="text-red-500 mb-4">{error}</Text> : null}
      
      <TouchableOpacity
        className="bg-blue-500 p-4 rounded-lg mb-4 flex-row justify-center items-center"
        onPress={handleLogin}
      >
        <Ionicons name="log-in-outline" size={24} color="white" />
        <Text className="text-white text-lg font-semibold ml-2">Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className="bg-green-500 p-4 rounded-lg flex-row justify-center items-center"
        onPress={handleSignup}
      >
        <Ionicons name="person-add-outline" size={24} color="white" />
        <Text className="text-white text-lg font-semibold ml-2">Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}