import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

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
    console.log('HomeScreen useEffect, user:', user ? user.uid : 'null');
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
    console.log('Redirecting to login from HomeScreen');
    return <Redirect href="/login" />;
  }

  const renderItem = ({ item }: { item: Product }) => {
    const cartItem = cart.find((cartItem) => cartItem.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
      <View className="flex-row justify-between items-center p-4 bg-white rounded-lg mb-2 shadow-md">
        <View className="flex-1">
          <Text className="text-lg font-semibold">{item.name}</Text>
          <Text className="text-gray-600">${item.price.toFixed(2)}</Text>
          {quantity > 0 && (
            <Text className="text-sm text-green-600">In Cart: {quantity}</Text>
          )}
        </View>
        <TouchableOpacity
          className="bg-blue-500 p-2 rounded-full"
          onPress={() => addToCart(item)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-blue-600 p-6 pb-4">
        <Text className="text-3xl font-bold text-white">Grocery Store</Text>
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
      <Link href="/cart" asChild>
        <TouchableOpacity className="bg-blue-500 m-4 p-4 rounded-lg flex-row justify-center items-center">
          <Ionicons name="cart-outline" size={24} color="white" />
          <Text className="text-white text-lg font-semibold ml-2">
            Go to Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}