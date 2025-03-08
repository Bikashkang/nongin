import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { LinearGradient } from 'expo-linear-gradient';

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function HomeScreen() {
  const { cart, addToCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, [user]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const renderItem = ({ item }: { item: Product }) => {
    const cartItem = cart.find((cartItem) => cartItem.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
      <TouchableOpacity
        className="flex-row justify-between items-center p-4 bg-white rounded-xl mb-3 shadow-md border border-gray-100"
        activeOpacity={0.8}
      >
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
          <Text className="text-base text-gray-500">${item.price.toFixed(2)}</Text>
          {quantity > 0 && (
            <Text className="text-sm text-green-600 mt-1">In Cart: {quantity}</Text>
          )}
        </View>
        <TouchableOpacity
          className="bg-blue-600 p-2 rounded-full shadow-sm"
          onPress={() => addToCart(item)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient colors={['#2563eb', '#1e40af']} className="p-6 pb-4 shadow-lg">
        <Text className="text-3xl font-extrabold text-white">Grocery Store</Text>
      </LinearGradient>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
      <Link href="/cart" asChild>
        <TouchableOpacity
          className="bg-blue-600 m-4 p-4 rounded-xl flex-row justify-center items-center shadow-lg"
          activeOpacity={0.9}
        >
          <Ionicons name="cart-outline" size={24} color="white" />
          <Text className="text-white text-lg font-semibold ml-2">Go to Cart</Text>
          {cartItemCount > 0 && (
            <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">
              <Text className="text-white text-xs font-bold">{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Link>
    </View>
  );
}