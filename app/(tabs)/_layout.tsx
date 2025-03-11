import { Tabs } from 'expo-router';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import { LocationProvider } from '../../context/LocationContext';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';

function CustomTabBar({ state, descriptors, navigation }) {
  const { role } = useAuth();

  return (
    <View className="flex-row bg-white border-t border-gray-200 p-2">
      {state.routes.map((route, index) => {
        // Skip store-manager tab for non-managers
        if (route.name === 'store-manager' && role !== 'store_manager') {
          return null;
        }

        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center py-2"
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          >
            {options.tabBarIcon?.({
              color: isFocused ? '#0d9488' : '#6b7280', // teal-600 vs gray-500
              size: 24,
              focused: isFocused,
            })}
            <Text className={`${isFocused ? 'text-teal-600' : 'text-gray-500'} text-xs mt-1`}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TabLayout() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store-manager"
        options={{
          title: 'Store',
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <TabLayout />
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}