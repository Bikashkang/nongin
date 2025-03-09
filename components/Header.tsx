import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useLocation } from '../context/LocationContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
}

export default function Header({ title, onSearch }: HeaderProps) {
  const { currentAddress, retryLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search handler
  const handleSearch = useCallback(
    (query: string) => {
      if (onSearch) {
        const timeout = setTimeout(() => onSearch(query), 300); // 300ms debounce
        return () => clearTimeout(timeout);
      }
    },
    [onSearch]
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  return (
    <LinearGradient colors={['#14b8a6', '#0d9488']} className="p-6 pb-4 shadow-lg">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-3xl font-extrabold text-white">{title}</Text>
        {/* Cart removed */}
      </View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-white flex-1" numberOfLines={1}>
          Deliver to: {currentAddress}
        </Text>
        <TouchableOpacity onPress={retryLocation}>
          <Text className="text-sm text-white underline ml-2">Retry</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center bg-white rounded-xl p-2 shadow-sm">
        <Ionicons name="search-outline" size={20} color="#6b7280" />
        <TextInput
          className="flex-1 ml-2 text-gray-800"
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </LinearGradient>
  );
}
