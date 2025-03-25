import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Redirect, Link } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Header from '../../components/Header';
import CachedImage from '../../components/CachedImage';
import { ProductSkeleton, CategorySkeleton } from '../../components/SkeletonLoading';
import { cacheData, getCachedData, generateCacheKey } from '../../utils/dataCache';

// Local placeholder image for when remote images can't be loaded
const DEFAULT_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMDUtMjJUMTU6MTM6MTYrMDI6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTA1LTIyVDE1OjE2OjA1KzAyOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIzLTA1LTIyVDE1OjE2OjA1KzAyOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY2NGE0YmJkLWI5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';

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
  const [loading, setLoading] = useState(true);

  const getCategoryIcon = (name: string): any => {
    const iconMap: { [key: string]: any } = {
      spices: 'leaf-outline',
      vegetables: 'nutrition-outline',
      fish: 'fish-outline',
      meat: 'heart-half-outline',
    };
    return iconMap[name.toLowerCase()] || 'cube-outline';
  };

  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      try {
        // Try to get data from cache first
        const cacheKey = generateCacheKey('products', user.uid);
        const cachedProducts = await getCachedData<Product[]>(cacheKey);
        
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          setLoading(false);
          return;
        }
        
        // If no cache, fetch from Firestore
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        
        // Cache the results
        await cacheData(cacheKey, productsList, 30); // Cache for 30 minutes
        
        setProducts(productsList);
        setFilteredProducts(productsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        // Try to get data from cache first
        const cacheKey = generateCacheKey('categories', 'all');
        const cachedCategories = await getCachedData<Category[]>(cacheKey);
        
        if (cachedCategories && cachedCategories.length > 0) {
          setCategories(cachedCategories);
          return;
        }
        
        // If no cache, fetch from Firestore
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        
        // Cache the results
        await cacheData(cacheKey, categoriesList, 60); // Cache for 60 minutes
        
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
      console.log('Adding to cart:', item);
      addToCart(item); // Pass Product without quantity
    };
    const handleRemove = (e?: any) => {
      if (e) e.stopPropagation();
      console.log('Removing from cart:', item.id);
      removeFromCart(item.id);
    };

    return (
      <View className="flex-1 m-2 p-4 bg-white rounded-xl shadow-md border border-gray-100 items-center">
        {item.imageUrl ? (
          <CachedImage
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          {categories.length === 0 ? (
            <CategorySkeleton count={5} />
          ) : (
            categories.map((category) => (
              <View key={category.id}>
                {renderCategoryItem({ item: category })}
              </View>
            ))
          )}
        </ScrollView>
        <TouchableOpacity
          className="mx-4 my-2 bg-cyan-600 rounded-xl overflow-hidden"
          onPress={() => console.log('Promo clicked')}
        >
          <CachedImage
            source={{ uri: DEFAULT_PLACEHOLDER }}
            className="w-full h-24"
            resizeMode="cover"
          />
          <View className="absolute inset-0 justify-center items-center">
            <Text className="text-white text-lg font-bold">ꯌꯥꯎꯁꯪ ꯑꯣꯐꯔ ꯊꯝꯖꯔꯤ! Nakuppi FREE!</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800 mx-4 my-2">Featured Products</Text>
        {loading ? (
          <ProductSkeleton count={6} />
        ) : filteredProducts.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <Ionicons name="search-outline" size={48} color="#9ca3af" />
            <Text className="text-lg text-gray-600 font-medium mt-2">No products found.</Text>
            <Text className="text-sm text-gray-500 text-center mt-1">Try a different search term or check back later.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProductItem}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
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