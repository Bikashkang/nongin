import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, setDoc, onSnapshot, DocumentSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  placeOrder: () => Promise<string>; // Returns order ID
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }
    const cartRef = doc(db, 'carts', user.uid);
    const unsubscribe = onSnapshot(cartRef, (doc: DocumentSnapshot) => {
      if (doc.exists()) {
        setCart((doc.data()?.items as CartItem[]) || []);
      } else {
        setCart([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const addToCart = async (item: CartItem) => {
    if (!user) return;
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        const updatedCart = prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
        saveCartToFirestore(updatedCart);
        return updatedCart;
      }
      const updatedCart = [...prevCart, { ...item, quantity: 1 }];
      saveCartToFirestore(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        const updatedCart = prevCart.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
        saveCartToFirestore(updatedCart);
        return updatedCart;
      }
      const updatedCart = prevCart.filter((cartItem) => cartItem.id !== itemId);
      saveCartToFirestore(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = async () => {
    if (!user) return;
    setCart([]);
    await setDoc(doc(db, 'carts', user.uid), { items: [] });
  };

  const placeOrder = async () => {
    if (!user || cart.length === 0) return '';
    const orderData = {
      userId: user.uid,
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      timestamp: new Date().toISOString(),
    };
    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    await clearCart();
    return orderRef.id; // Return order ID for confirmation
  };

  const saveCartToFirestore = async (updatedCart: CartItem[]) => {
    if (!user) return;
    await setDoc(doc(db, 'carts', user.uid), { items: updatedCart });
  };

  const value: CartContextValue = { cart, addToCart, removeFromCart, clearCart, placeOrder };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}