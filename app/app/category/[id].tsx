import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Redirect, useLocalSearchParams, Link } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import Header from '../../components/Header';

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const { cart, addToCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

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
        setFilteredProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [user, id]);

  const handleSearch = useCallback((query: string) => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const renderItem = ({ item }: { item: Product }) => {
    const cartItem = cart.find((cartItem) => cartItem.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleAdd = (e?: any) => {
      if (e) e.stopPropagation();
      addToCart(item);
    };
    const handleRemove = (e?: any) => {
      if (e) e.stopPropagation();
      removeFromCart(item.id);
    };

    return (
      <View className="flex-row items-center p-4 bg-white rounded-xl mb-3 shadow-md border border-gray-100">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-16 h-16 mr-4 rounded-md" />
        ) : (
          <Ionicons name="cube-outline" size={32} color="#2563eb" className="mr-4" />
        )}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
          <Text className="text-base text-gray-500">₹{item.price.toFixed(2)}</Text>
        </View>
        <View className="flex-row items-center">
          {quantity > 0 ? (
            <>
              <TouchableOpacity className="bg-gray-200 p-2 rounded-l-full" onPress={handleRemove}>
                <Ionicons name="remove" size={16} color="#2563eb" />
              </TouchableOpacity>
              <Text className="bg-gray-100 px-3 py-2 text-gray-800 font-semibold">{quantity}</Text>
              <TouchableOpacity className="bg-blue-600 p-2 rounded-r-full" onPress={handleAdd}>
                <Ionicons name="add" size={16} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-full" onPress={handleAdd}>
              <Text className="text-white font-semibold">Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Category Products" onSearch={handleSearch} />
      {filteredProducts.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600 font-medium">No products in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
      {cart.length > 0 && (
        <Link href="/cart" asChild>
          <TouchableOpacity style={styles.floatingButton}>
            <Ionicons name="cart-outline" size={28} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItemCount}</Text>
            </View>
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#14b8a6',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});