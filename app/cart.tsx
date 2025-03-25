import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { useRouter } from 'expo-router';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface DeliveryAddress {
  name: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

type RootStackParamList = {
  cart: undefined;
  'change-address': undefined;
  '(tabs)': undefined;
  login: undefined;
  'category/[id]': { id: string };
};

export default function CartScreen({ navigation }: StackScreenProps<RootStackParamList, 'cart'>) {
  const { cart, addToCart, removeFromCart, clearCart, placeOrder } = useCart();
  const { currentAddress, deliveryAddress, setDeliveryAddress } = useLocation();
  const [contactNumber, setContactNumber] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (currentAddress && !deliveryAddress.city && !deliveryAddress.state && !deliveryAddress.postalCode) {
      const parsedAddress = parseAddress(currentAddress);
      setDeliveryAddress((prev) => ({
        ...prev,
        city: parsedAddress.city || '',
        state: parsedAddress.state || '',
        postalCode: parsedAddress.postalCode || '',
      }));
    }
  }, [currentAddress, deliveryAddress, setDeliveryAddress]);

  const parseAddress = (address: string): Partial<DeliveryAddress> => {
    const parts = address.split(', ').map((part) => part.trim());
    const result: Partial<DeliveryAddress> = {};
    if (parts.length >= 2) {
      result.city = parts[0];
      const stateAndPin = parts[1].split(' ');
      if (stateAndPin.length >= 2) {
        result.state = stateAndPin[0];
        result.postalCode = stateAndPin[1];
      } else {
        result.state = parts[1];
      }
    } else if (parts.length === 1) {
      result.city = parts[0];
    }
    return result;
  };

  const handlePlaceOrder = async () => {
    const { name, houseNumber, street, city, state, postalCode } = deliveryAddress;
    if (!name || !houseNumber || !street || !city || !state || !postalCode) {
      Alert.alert('Missing Details', 'Please fill all delivery address fields.');
      return;
    }
    if (!contactNumber || contactNumber.length !== 10) {
      Alert.alert('Invalid Contact', 'Please enter a 10-digit phone number.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    const fullAddress = `${name}, ${houseNumber}, ${street}, ${city}, ${state} - ${postalCode}`;
    try {
      // Show loading indicator
      setIsLoading(true);
      const orderId = await placeOrder(fullAddress, contactNumber);
      
      if (orderId) {
        // Set order success state instead of using Alert
        setOrderSuccess({
          isSuccess: true,
          orderId: orderId,
          total: total,
        });
        setContactNumber('');
        setIsEditingAddress(false);
      }
      
      // Only hide loading after setting success state to ensure smooth transition
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const handleShopNow = () => {
    console.log('Shop Now pressed, redirecting to /(tabs)');
    router.replace('/(tabs)'); // Changed from /(tabs)/index to /(tabs)
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const handleAdd = () => addToCart({ id: item.id, name: item.name, price: item.price });
    const handleRemove = () => removeFromCart(item.id);
    const handleDelete = () => {
      const updatedCart = cart.filter((cartItem) => cartItem.id !== item.id);
      clearCart().then(() => {
        if (updatedCart.length > 0) {
          updatedCart.forEach((cartItem) => addToCart({ ...cartItem, quantity: cartItem.quantity }));
        }
      });
    };

    return (
      <View className="flex-row items-center p-3 bg-white rounded-lg mb-2 shadow-sm border border-gray-200">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
          <Text className="text-sm text-gray-600">
            ₹{item.price.toFixed(2)} x {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity className="bg-gray-200 p-2 rounded-l-lg" onPress={handleRemove}>
            <Ionicons name="remove" size={16} color="#2563eb" />
          </TouchableOpacity>
          <Text className="bg-gray-100 px-3 py-1 text-gray-800 font-semibold">{item.quantity}</Text>
          <TouchableOpacity className="bg-teal-600 p-2 rounded-r-lg" onPress={handleAdd}>
            <Ionicons name="add" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="ml-3" onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const updateAddressField = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress((prev) => {
      return { ...prev, [field]: value };
    });
  };

  const fullAddress = `${deliveryAddress.name}, ${deliveryAddress.houseNumber}, ${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.postalCode}`.trim();

  // Add state for order success
  const [orderSuccess, setOrderSuccess] = useState<{
    isSuccess: boolean;
    orderId?: string;
    total?: number;
  }>({
    isSuccess: false
  });

  // Handle continue shopping
  const handleContinueShopping = () => {
    setOrderSuccess({ isSuccess: false });
    router.replace('/(tabs)');
  };

  // Handle view orders
  const handleViewOrders = () => {
    setOrderSuccess({ isSuccess: false });
    router.replace('/(tabs)/orders');
  };

  return (
    <View className="flex-1 bg-gray-50">
      {!isLoading && orderSuccess.isSuccess ? (
        <View className="flex-1 justify-center items-center bg-white p-6">
          <View className="bg-green-50 rounded-full p-6 mb-4">
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">Order Placed Successfully!</Text>
          <Text className="text-base text-gray-600 mb-6 text-center">
            Your order #{orderSuccess.orderId?.slice(-6)} has been placed and will be processed shortly.
          </Text>
          
          <View className="bg-gray-50 w-full rounded-xl p-4 mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">Order Summary:</Text>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Order ID:</Text>
              <Text className="font-medium">#{orderSuccess.orderId?.slice(-6)}</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-600">Total Amount:</Text>
              <Text className="font-medium">₹{orderSuccess.total?.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-600">Delivery Address:</Text>
              <Text className="font-medium text-right flex-1 ml-4">{fullAddress.length > 30 ? fullAddress.substring(0, 30) + '...' : fullAddress}</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-600">Status:</Text>
              <Text className="font-medium text-amber-600">Pending</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            className="bg-teal-600 p-4 rounded-full w-full mb-3"
            onPress={handleViewOrders}
          >
            <Text className="text-white font-semibold text-center text-lg">View My Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-gray-200 p-4 rounded-full w-full"
            onPress={handleContinueShopping}
          >
            <Text className="text-gray-800 font-semibold text-center text-lg">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : !isLoading && cart.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="cart-outline" size={64} color="#6b7280" />
          <Text className="text-xl text-gray-600 font-medium mt-4">Your cart is empty</Text>
          <TouchableOpacity
            className="mt-6 bg-teal-600 px-6 py-3 rounded-full"
            onPress={handleShopNow}
          >
            <Text className="text-white font-semibold text-lg">Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : !isLoading ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <Text className="text-2xl font-bold text-gray-800 mb-4">Your Cart</Text>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
            style={{ marginBottom: 16 }}
          />
          <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-800">Delivery Address</Text>
              <TouchableOpacity onPress={() => setIsEditingAddress(!isEditingAddress)}>
                <Ionicons
                  name={isEditingAddress ? 'checkmark-outline' : 'pencil-outline'}
                  size={20}
                  color="#2563eb"
                />
              </TouchableOpacity>
            </View>
            {isEditingAddress ? (
              <>
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
                  placeholder="Full Name"
                  value={deliveryAddress.name}
                  onChangeText={(text) => updateAddressField('name', text)}
                />
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
                  placeholder="House Number"
                  value={deliveryAddress.houseNumber}
                  onChangeText={(text) => updateAddressField('houseNumber', text)}
                />
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
                  placeholder="Street"
                  value={deliveryAddress.street}
                  onChangeText={(text) => updateAddressField('street', text)}
                />
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
                  placeholder="City"
                  value={deliveryAddress.city}
                  onChangeText={(text) => updateAddressField('city', text)}
                />
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
                  placeholder="State"
                  value={deliveryAddress.state}
                  onChangeText={(text) => updateAddressField('state', text)}
                />
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
                  placeholder="Postal Code"
                  value={deliveryAddress.postalCode}
                  onChangeText={(text) => updateAddressField('postalCode', text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </>
            ) : (
              <Text className="text-base text-gray-600">
                {fullAddress && fullAddress !== ', , , ,  - ' ? fullAddress : 'No address set'}
              </Text>
            )}
          </View>
          <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">Contact Number</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 text-gray-800"
              value={contactNumber}
              onChangeText={(text) => setContactNumber(text.replace(/[^0-9]/g, ''))}
              placeholder="Enter 10-digit phone number"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <View className="bg-white rounded-lg shadow-sm p-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Total: ₹{total.toFixed(2)}
            </Text>
            <TouchableOpacity
              className="bg-teal-600 p-3 rounded-full"
              onPress={handlePlaceOrder}
            >
              <Text className="text-white font-semibold text-center text-lg">Place Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-500 p-3 rounded-full mt-2"
              onPress={clearCart}
            >
              <Text className="text-white font-semibold text-center text-lg">Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}
      
      {/* Loading overlay */}
      {isLoading && (
        <View className="flex-1 justify-center items-center">
          <View className="bg-white rounded-3xl shadow-lg py-8 px-12 w-4/5 max-w-sm items-center">
            <View className="bg-teal-50 rounded-full p-6 mb-6">
              <ActivityIndicator size="large" color="#0f766e" />
            </View>
            <Text className="text-2xl font-semibold text-gray-800 mb-2 text-center">Processing Order</Text>
            <Text className="text-base text-gray-600 text-center">Please wait a moment</Text>
          </View>
        </View>
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
});