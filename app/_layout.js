import { Stack } from 'expo-router';
import { CartProvider } from '../context/CartContext';
import '../global.css';

export default function Layout() {
  return (
    <CartProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Grocery Store' }} />
        <Stack.Screen name="cart" options={{ title: 'Your Cart' }} />
        <Stack.Screen name="test" options={{title:'test'}}/>
      </Stack>
    </CartProvider>
  );
}