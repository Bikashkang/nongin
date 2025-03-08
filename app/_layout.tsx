import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import '../global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" /> {/* Nested tab navigation */}
          <Stack.Screen name="login" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="category/[id]" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}