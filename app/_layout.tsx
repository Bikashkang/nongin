import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LocationProvider } from '../context/LocationContext'; // Add this
import '../global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="category/[id]" />
          </Stack>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}