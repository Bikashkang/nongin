import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; // Import useAuth

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => Promise<void>;
  placeOrder: (address: string, contactNumber: string) => Promise<string>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useAuth(); // Get authenticated user

  useEffect(() => {
    const loadCart = async () => {
      const storedCart = await AsyncStorage.getItem('cart');
      if (storedCart) setCart(JSON.parse(storedCart));
    };
    loadCart();
  }, []);

  const saveCart = async (updatedCart: CartItem[]) => {
    await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const addToCart = (item: CartItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    let updatedCart: CartItem[];
    if (existingItem) {
      updatedCart = cart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      );
    } else {
      updatedCart = [...cart, { ...item, quantity: 1 }];
    }
    saveCart(updatedCart);
  };

  const removeFromCart = (id: string) => {
    const existingItem = cart.find((cartItem) => cartItem.id === id);
    let updatedCart: CartItem[];
    if (existingItem && existingItem.quantity > 1) {
      updatedCart = cart.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
      );
    } else {
      updatedCart = cart.filter((cartItem) => cartItem.id !== id);
    }
    saveCart(updatedCart);
  };

  const clearCart = async () => {
    await AsyncStorage.removeItem('cart');
    setCart([]);
  };

  const placeOrder = async (address: string, contactNumber: string): Promise<string> => {
    if (cart.length === 0) throw new Error('Cart is empty');
    if (!user) throw new Error('User not authenticated');

    const orderData = {
      items: cart,
      address,
      contactNumber,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      createdAt: serverTimestamp(),
      userId: user.uid, // Add userId
    };

    try {
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      await clearCart();
      return orderRef.id;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  };

  const value: CartContextValue = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    placeOrder,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}