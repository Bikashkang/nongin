import { Stack } from 'expo-router';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import '../global.css';

export default function Layout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Stack
          screenOptions={{ headerShown: false }}
          initialRouteName="login"
        >
          <Stack.Screen name="index" options={{ title: 'Grocery Store', headerShown: true }} />
          <Stack.Screen name="cart" options={{ title: 'Your Cart', headerShown: true }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}