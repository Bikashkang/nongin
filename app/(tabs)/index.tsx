import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { Redirect, Link } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Header from '../../components/Header';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function HomeScreen() {
  const { cart, addToCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Map category names to Ionicons (customize as needed)
  const getCategoryIcon = (name: string): string => {
    const iconMap: { [key: string]: string } = {
      spices: 'leaf-outline',
      vegetables: 'nutrition-outline',
      fish: 'fish-outline',
      meat: 'heart-half-outline',
      //beverages: 'beer-outline',
    };
    return iconMap[name.toLowerCase()] || 'cube-outline'; // Default icon
  };

  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
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

    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, [user]);

  const handleSearch = useCallback((query: string) => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <Link href={`/category/${item.id}`} asChild>
      <TouchableOpacity className="items-center mx-2" activeOpacity={0.8}>
        <View className="w-16 h-16 bg-teal-100 rounded-full justify-center items-center">
          <Ionicons name={getCategoryIcon(item.name)} size={28} color="#14b8a6" />
        </View>
        <Text className="text-sm text-gray-800 mt-1 text-center">{item.name}</Text>
      </TouchableOpacity>
    </Link>
  );

  const renderProductItem = ({ item }: { item: Product }) => {
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
      <View className="flex-1 m-2 p-4 bg-white rounded-xl shadow-md border border-gray-100 items-center">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-20 h-20 mb-2 rounded-md"
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="cube-outline" size={32} color="#2563eb" className="mb-2" />
        )}
        <Text className="text-lg font-bold text-gray-800 text-center">{item.name}</Text>
        <Text className="text-base text-gray-500 mt-1">₹{item.price.toFixed(2)}</Text>
        <View className="flex-row items-center mt-2">
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
      <Header title="Nongin Store" onSearch={handleSearch} />
      <ScrollView className="flex-1">
        {/* Categories Horizontal ScrollView */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          {categories.map((category) => (
            <View key={category.id}>
              {renderCategoryItem({ item: category })}
            </View>
          ))}
        </ScrollView>

        {/* Promotional Banner */}
        <TouchableOpacity
          className="mx-4 my-2 bg-cyan-600 rounded-xl overflow-hidden"
          onPress={() => console.log('Promo clicked')} // Add promo action here
        >
          <Image
            source={{ uri: 'https://via.placeholder.com/300x100?text=Promo+Banner' }} // Replace with actual promo image
            className="w-full h-24"
            resizeMode="cover"
          />
          <View className="absolute inset-0 justify-center items-center">
            <Text className="text-white text-lg font-bold">ꯌꯥꯎꯁꯪ ꯑꯣꯐꯔ ꯊꯝꯖꯔꯤ! Nakuppi FREE!</Text>
          </View>
        </TouchableOpacity>

        {/* Featured Products Title */}
        <Text className="text-2xl font-bold text-gray-800 mx-4 my-2">Featured Products</Text>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-lg text-gray-600 font-medium">No products available.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProductItem}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }} // Extra padding for floating button
            scrollEnabled={false} // Disable FlatList scrolling since it's inside ScrollView
          />
        )}
      </ScrollView>

      {/* Floating Cart Button */}
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