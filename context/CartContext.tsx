import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, setDoc, onSnapshot, addDoc, DocumentSnapshot } from 'firebase/firestore';
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
  addToCart: (item: Omit<CartItem, 'quantity'>) => void; // Accept item without quantity
  removeFromCart: (itemId: string) => void;
  clearCart: () => Promise<void>;
  placeOrder: (deliveryAddress: string, contactNumber: string) => Promise<string | void>;
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
        const firestoreCart = (doc.data()?.items as CartItem[]) || [];
        setCart(firestoreCart);
        console.log('Cart updated from Firestore:', firestoreCart);
      } else {
        setCart([]);
        console.log('No cart found in Firestore, initialized empty');
      }
    }, (error) => {
      console.error('Firestore snapshot error:', error);
    });
    return () => unsubscribe();
  }, [user]);

  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    if (!user) return;
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      const updatedCart = existingItem
        ? prevCart.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        : [...prevCart, { ...item, quantity: 1 }];
      saveCartToFirestore(updatedCart); // Async, no await to avoid blocking
      console.log('Local cart updated:', updatedCart);
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
    console.log('Cart cleared');
  };

  const placeOrder = async (deliveryAddress: string, contactNumber: string) => {
    if (!user || cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderData = {
      userId: user.uid,
      items: cart,
      total,
      deliveryAddress,
      contactNumber,
      timestamp: new Date().toISOString(),
    };
    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    await clearCart();
    console.log(`Order placed: ₹${total.toFixed(2)} to ${deliveryAddress}`);
    return orderRef.id;
  };

  const saveCartToFirestore = async (updatedCart: CartItem[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'carts', user.uid), { items: updatedCart });
      console.log('Cart saved to Firestore:', updatedCart);
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
    }
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