import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useState, useEffect } from 'react';

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
}

export default function CartScreen() {
  const { cart, addToCart, removeFromCart, clearCart, placeOrder } = useCart();
  const { currentAddress, retryLocation } = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    name: '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [contactNumber, setContactNumber] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(true);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (currentAddress && isEditingAddress) {
      const parsedAddress = parseAddress(currentAddress);
      setDeliveryAddress((prev) => ({
        ...prev,
        ...parsedAddress,
        name: prev.name || '',
        houseNumber: prev.houseNumber || '',
        street: prev.street || '', // Fixed syntax error here
      }));
    }
  }, [currentAddress, isEditingAddress]);

  const parseAddress = (address: string): Partial<DeliveryAddress> => {
    // Expected format: "city, state pin code" (e.g., "Bangalore, Karnataka 560001")
    const parts = address.split(', ').map((part) => part.trim());
    const result: Partial<DeliveryAddress> = {};

    if (parts.length >= 2) {
      result.city = parts[0]; // "Bangalore"
      const stateAndPin = parts[1].split(' '); // "Karnataka 560001" → ["Karnataka", "560001"]
      if (stateAndPin.length >= 2) {
        result.state = stateAndPin[0]; // "Karnataka"
        result.postalCode = stateAndPin[1]; // "560001"
      } else {
        result.state = parts[1]; // Fallback if no space-separated pin code
      }
    } else if (parts.length === 1) {
      result.city = parts[0]; // Single part as city
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

    const fullAddress = `${name}, ${houseNumber}, ${street}, ${city}, ${state} - ${postalCode}`;
    try {
      const orderId = await placeOrder(fullAddress, contactNumber);
      if (orderId) {
        Alert.alert('Order Placed', `Your order has been placed successfully! Order ID: ${orderId}`, [{ text: 'OK' }]);
        setContactNumber('');
        setDeliveryAddress({ name: '', houseNumber: '', street: '', city: '', state: '', postalCode: '' });
        setIsEditingAddress(true);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const handleAdd = () => addToCart(item);
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
      <View className="flex-row items-center p-4 bg-white rounded-xl mb-2 shadow-md border border-gray-100">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
          <Text className="text-base text-gray-500">
            ₹{item.price.toFixed(2)} x {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity className="bg-gray-200 p-2 rounded-l-full" onPress={handleRemove}>
            <Ionicons name="remove" size={16} color="#2563eb" />
          </TouchableOpacity>
          <Text className="bg-gray-100 px-3 py-2 text-gray-800 font-semibold">{item.quantity}</Text>
          <TouchableOpacity className="bg-blue-600 p-2 rounded-r-full" onPress={handleAdd}>
            <Ionicons name="add" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity className="ml-4" onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const updateAddressField = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress((prev) => ({ ...prev, [field]: value }));
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
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
          />
          <View className="p-4 bg-white rounded-xl shadow-md mt-4">
            <Text className="text-lg font-bold text-gray-800 mb-2">Delivery Address</Text>
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
              <Text className="text-base text-gray-500">
                {`${deliveryAddress.name}, ${deliveryAddress.houseNumber}, ${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.postalCode}`}
              </Text>
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
              <Text className="text-blue-600 ml-1">{isEditingAddress ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
            {!isEditingAddress && (
              <TouchableOpacity className="mt-2 flex-row items-center" onPress={retryLocation}>
                <Ionicons name="refresh-outline" size={20} color="#2563eb" />
                <Text className="text-blue-600 ml-1">Retry Location</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="p-4 bg-white rounded-xl shadow-md mt-4">
            <Text className="text-lg font-bold text-gray-800 mb-2">Contact Number</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 text-gray-800"
              value={contactNumber}
              onChangeText={(text) => setContactNumber(text.replace(/[^0-9]/g, ''))}
              placeholder="Enter 10-digit phone number"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <View className="p-4 bg-white rounded-xl shadow-md mt-4">
            <Text className="text-lg font-bold text-gray-800 mb-2">Total: ₹{total.toFixed(2)}</Text>
            <TouchableOpacity className="bg-teal-600 p-3 rounded-full" onPress={handlePlaceOrder}>
              <Text className="text-white font-semibold text-center text-lg">Place Order</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-red-600 p-3 rounded-full mt-2" onPress={clearCart}>
              <Text className="text-white font-semibold text-center text-lg">Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}