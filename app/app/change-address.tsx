import { View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { useLocation } from '../context/LocationContext';

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

export default function ChangeAddressScreen({ navigation }: StackScreenProps<RootStackParamList, 'change-address'>) {
  const { deliveryAddress, setDeliveryAddress } = useLocation();
  const [localAddress, setLocalAddress] = useState<DeliveryAddress>(deliveryAddress);

  const handleSave = () => {
    const { name, houseNumber, street, city, state, postalCode } = localAddress;
    if (!name || !houseNumber || !street || !city || !state || !postalCode) {
      Alert.alert('Missing Details', 'Please fill all fields.');
      return;
    }
    setDeliveryAddress(localAddress);
    navigation.goBack();
  };

  const updateAddressField = (field: keyof DeliveryAddress, value: string) => {
    setLocalAddress((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View className="flex-1 bg-gray-50">
      <TouchableOpacity
        className="absolute top-4 right-4 z-10"
        onPress={handleSave}
      >
        <Ionicons name="checkmark-outline" size={24} color="#2563eb" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
          placeholder="Full Name"
          value={localAddress.name}
          onChangeText={(text) => updateAddressField('name', text)}
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
          placeholder="House Number"
          value={localAddress.houseNumber}
          onChangeText={(text) => updateAddressField('houseNumber', text)}
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
          placeholder="Street"
          value={localAddress.street}
          onChangeText={(text) => updateAddressField('street', text)}
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
          placeholder="City"
          value={localAddress.city}
          onChangeText={(text) => updateAddressField('city', text)}
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
          placeholder="State"
          value={localAddress.state}
          onChangeText={(text) => updateAddressField('state', text)}
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
          placeholder="Postal Code"
          value={localAddress.postalCode}
          onChangeText={(text) => updateAddressField('postalCode', text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          maxLength={6}
        />
      </ScrollView>
    </View>
  );
}