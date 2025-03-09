import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useState } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CartScreen() {
  const { cart, addToCart, removeFromCart, clearCart, placeOrder } = useCart();
  const { currentAddress, retryLocation } = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState(currentAddress || '');
  const [contactNumber, setContactNumber] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress || !contactNumber) {
      Alert.alert('Missing Details', 'Please provide a delivery address and contact number.');
      return;
    }

    try {
      const orderId = await placeOrder(deliveryAddress, contactNumber);
      if (orderId) {
        Alert.alert(
          'Order Placed',
          `Your order has been placed successfully! Order ID: ${orderId}`,
          [{ text: 'OK' }]
        );
        setContactNumber(''); // Clear contact field after order
        setIsEditingAddress(false); // Reset address editing
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const handleAdd = () => addToCart(item);
    const handleRemove = () => removeFromCart(item.id);

    return (
      <View className="flex-row items-center p-4 bg-white rounded-xl mb-2 shadow-md border border-gray-100">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
          <Text className="text-base text-gray-500">
            ₹{item.price.toFixed(2)} x {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            className="bg-gray-200 p-2 rounded-l-full"
            onPress={handleRemove}
          >
            <Ionicons name="remove" size={16} color="#2563eb" />
          </TouchableOpacity>
          <Text className="bg-gray-100 px-3 py-2 text-gray-800 font-semibold">
            {item.quantity}
          </Text>
          <TouchableOpacity
            className="bg-blue-600 p-2 rounded-r-full"
            onPress={handleAdd}
          >
            <Ionicons name="add" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          className="ml-4"
          onPress={() => removeFromCart(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Checkout" />
      {cart.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600 font-medium">Your cart is empty.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Cart Items */}
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false} // Disable FlatList scrolling, let ScrollView handle it
          />

          {/* Delivery Address */}
          <View className="p-4 bg-white rounded-xl shadow-md mt-4">
            <Text className="text-lg font-bold text-gray-800 mb-2">Delivery Address</Text>
            {isEditingAddress ? (
              <TextInput
                className="border border-gray-300 rounded-lg p-2 text-gray-800"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Enter delivery address"
                multiline
              />
            ) : (
              <Text className="text-base text-gray-500">{deliveryAddress || 'No address provided'}</Text>
            )}
            <TouchableOpacity
              className="mt-2 flex-row items-center"
              onPress={() => setIsEditingAddress(!isEditingAddress)}
            >
              <Ionicons
                name={isEditingAddress ? 'checkmark-outline' : 'pencil-outline'}
                size={20}
                color="#2563eb"
              />
              <Text className="text-blue-600 ml-1">
                {isEditingAddress ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
            {!isEditingAddress && (
              <TouchableOpacity className="mt-2 flex-row items-center" onPress={retryLocation}>
                <Ionicons name="refresh-outline" size={20} color="#2563eb" />
                <Text className="text-blue-600 ml-1">Retry Location</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contact Details */}
          <View className="p-4 bg-white rounded-xl shadow-md mt-4">
            <Text className="text-lg font-bold text-gray-800 mb-2">Contact Number</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 text-gray-800"
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          {/* Total and Buttons */}
          <View className="p-4 bg-white rounded-xl shadow-md mt-4">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              Total: ₹{total.toFixed(2)}
            </Text>
            <TouchableOpacity
              className="bg-teal-600 p-3 rounded-full"
              onPress={handlePlaceOrder}
            >
              <Text className="text-white font-semibold text-center text-lg">
                Place Order
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-600 p-3 rounded-full mt-2"
              onPress={clearCart}
            >
              <Text className="text-white font-semibold text-center text-lg">
                Clear Cart
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}