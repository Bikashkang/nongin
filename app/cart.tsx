import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Redirect, Link } from 'expo-router'; // Add Link import
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function CartScreen() {
  const { cart, addToCart, removeFromCart, clearCart, placeOrder } = useCart();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const handlePlaceOrder = async () => {
    if (!user || cart.length === 0) {
      Alert.alert('Error', 'Cart is empty or user not authenticated.');
      return;
    }
    setIsLoading(true);
    try {
      const orderId = await placeOrder();
      if (orderId) {
        Alert.alert('Order Placed', `Your order (ID: ${orderId}) has been successfully placed!`);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      Alert.alert('Error', `Failed to place order: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: { id: string; name: string; price: number; quantity: number } }) => (
    <View className="flex-row justify-between items-center p-4 bg-white rounded-lg mb-2 shadow-md">
      <View className="flex-1">
        <Text className="text-lg font-semibold">{item.name}</Text>
        <Text className="text-gray-600">
          ${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="bg-red-500 p-2 rounded-full"
          onPress={() => removeFromCart(item.id)}
        >
          <Ionicons name="remove" size={20} color="white" />
        </TouchableOpacity>
        <Text className="mx-3 text-lg font-semibold">{item.quantity}</Text>
        <TouchableOpacity
          className="bg-blue-500 p-2 rounded-full"
          onPress={() => addToCart(item)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-blue-600 p-6 pb-4">
        <Text className="text-3xl font-bold text-white">Your Cart</Text>
      </View>
      {cart.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600">Your cart is empty.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
          />
          <View className="p-4 bg-white border-t border-gray-200">
            <Text className="text-xl font-bold text-right">
              Total: ${total.toFixed(2)}
            </Text>
            <TouchableOpacity
              className="bg-green-500 mt-4 p-4 rounded-lg flex-row justify-center items-center"
              onPress={handlePlaceOrder}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                  <Text className="text-white text-lg font-semibold ml-2">Place Order</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-500 mt-4 p-4 rounded-lg flex-row justify-center items-center"
              onPress={clearCart}
              disabled={isLoading}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">Clear Cart</Text>
            </TouchableOpacity>
            <Link href="/orders" asChild>
              <TouchableOpacity
                className="bg-blue-500 mt-4 p-4 rounded-lg flex-row justify-center items-center"
                disabled={isLoading}
              >
                <Ionicons name="list-outline" size={24} color="white" />
                <Text className="text-white text-lg font-semibold ml-2">Order History</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity
              className="bg-gray-500 mt-4 p-4 rounded-lg flex-row justify-center items-center"
              onPress={logout}
              disabled={isLoading}
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}