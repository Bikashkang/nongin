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
        activeOpacity={0.7}
      >
        <View className="w-20 h-20 rounded-full shadow-md justify-center items-center overflow-hidden mb-3" 
          style={{ 
            elevation: 4, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
          }}>
          <View className="w-full h-full absolute" 
            style={{ 
              backgroundColor: item.name.toLowerCase() === 'spices' ? '#f97316' : 
                            item.name.toLowerCase() === 'vegetables' ? '#22c55e' : 
                            item.name.toLowerCase() === 'fish' ? '#0ea5e9' : 
                            item.name.toLowerCase() === 'meat' ? '#ef4444' : '#14b8a6' 
            }} />
          <View className="w-full h-full absolute" 
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 50,
            }} />
          <Ionicons 
            name={getCategoryIcon(item.name)} 
            size={36} 
            color="white" 
            style={{ textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}
          />
        </View>
        <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
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