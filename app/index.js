import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

const initialProducts = [
  { id: '1', name: 'Apples', price: 2.99 },
  { id: '2', name: 'Milk', price: 3.49 },
  { id: '3', name: 'Bread', price: 1.99 },
];

export default function HomeScreen() {
  const { cart, addToCart } = useCart();

  const renderItem = ({ item }) => {
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
        data={initialProducts}
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
