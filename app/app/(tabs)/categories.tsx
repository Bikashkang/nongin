import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Redirect, Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

interface Category {
  id: string;
  name: string;
}

export default function CategoriesScreen() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(categoriesList);
        setFilteredCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [user]);

  const handleSearch = useCallback((query: string) => {
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const renderCategory = ({ item }: { item: Category }) => (
    <Link href={`/category/${item.id}`} asChild>
      <TouchableOpacity
        className="flex-1 m-2 p-6 bg-white rounded-xl shadow-md border border-gray-100 items-center justify-center"
        activeOpacity={0.8}
      >
        <Ionicons name="cube-outline" size={32} color="#2563eb" />
        <Text className="text-lg font-bold text-gray-800 mt-2">{item.name}</Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Categories" onSearch={handleSearch} />
      {filteredCategories.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600 font-medium">
            No categories available.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          numColumns={2}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}