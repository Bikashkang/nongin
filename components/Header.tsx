import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
}

export default function Header({ title, onSearch }: HeaderProps) {
  const { cart } = useCart();
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

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <LinearGradient colors={['#14b8a6', '#0d9488']} className="p-6 pb-4 shadow-lg">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-3xl font-extrabold text-white">{title}</Text>
        <Link href="/cart" asChild>
          <TouchableOpacity className="relative p-2">
            <Ionicons name="cart-outline" size={28} color="white" />
            {cartItemCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                <Text className="text-white text-xs font-bold">{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Link>
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