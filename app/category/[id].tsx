import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../context/CartContext'; // Adjusted path: ../../ to go up two levels
import { useAuth } from '../../context/AuthContext'; // Same adjustment
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjusted path
import { LinearGradient } from 'expo-linear-gradient';

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const { cart, addToCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), where('categoryId', '==', id));
        const querySnapshot = await getDocs(q);
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
  }, [user, id]);

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

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient colors={['#2563eb', '#1e40af']} className="p-6 pb-4 shadow-lg">
        <Text className="text-3xl font-extrabold text-white">Category Products</Text>
      </LinearGradient>
      {products.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600 font-medium">No products in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}