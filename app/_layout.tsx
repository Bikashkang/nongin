import { Tabs } from 'expo-router';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import '../global.css';

export default function Layout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Tabs
          screenOptions={{
            headerShown: false, // Hide headers for tabs, we'll handle in screens
            tabBarActiveTintColor: '#2563eb', // Active tab color
            tabBarInactiveTintColor: '#6b7280', // Inactive tab color
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              height: 60,
              paddingBottom: 5,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="categories"
            options={{
              tabBarLabel: 'Categories',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="grid-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="orders"
            options={{
              tabBarLabel: 'Orders',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="list-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
            }}
          />
          {/* Keep login and cart as hidden from tabs */}
          <Tabs.Screen name="login" options={{ href: null }} />
          <Tabs.Screen name="cart" options={{ href: null }} />
        </Tabs>
      </CartProvider>
    </AuthProvider>
  );
}