import { View, Text, TouchableOpacity } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, signOutUser } = useAuth(); // Changed 'logout' to 'signOutUser'

  if (!user) {
    return <Redirect href="/login" />;
  }

  const handleLogout = async () => {
    try {
      console.log('Attempting to log out...');
      await signOutUser();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient colors={['#2563eb', '#1e40af']} className="p-6 pb-4 shadow-lg">
        <Text className="text-3xl font-extrabold text-white">Profile</Text>
      </LinearGradient>
      <View className="p-6">
        <Text className="text-lg font-bold text-gray-800">Email: {user.email}</Text>
        <Text className="text-base text-gray-500 mt-2">User ID: {user.uid}</Text>
        <TouchableOpacity
          className="bg-red-600 mt-6 p-4 rounded-xl flex-row justify-center items-center shadow-sm"
          onPress={handleLogout} // Use handleLogout instead of signOutUser directly
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text className="text-white text-lg font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}