import { View, Text, FlatList } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

interface Order {
  id: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  address: string;
  contactNumber: string;
  total: number;
  status: string;
  createdAt: any;
  userId: string;
}

export default function StoreManagerScreen() {
  const { user, role, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    console.log('StoreManagerScreen - User:', user?.email, 'Role:', role, 'Loading:', loading);
    if (role !== 'store_manager') return;

    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(ordersList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => unsubscribe();
  }, [role]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Text className="text-lg text-red-600">Please log in.</Text>;
  }

  if (role !== 'store_manager') {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-red-600">Access Denied: Store Manager Only (Role: {role})</Text>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <View className="p-4 bg-white rounded-xl mb-3 shadow-md border border-gray-100">
      <Text className="text-lg font-bold text-gray-800">Order #{item.id}</Text>
      <Text className="text-base text-gray-500">Total: ₹{item.total.toFixed(2)}</Text>
      <Text className="text-base text-gray-500">Address: {item.address}</Text>
      <Text className="text-base text-gray-500">Contact: {item.contactNumber}</Text>
      <Text className="text-base text-gray-500">Status: {item.status}</Text>
      <FlatList
        data={item.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item: product }) => (
          <Text className="text-sm text-gray-600">
            {product.name} x {product.quantity} - ₹{(product.price * product.quantity).toFixed(2)}
          </Text>
        )}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-6 bg-teal-600 flex-row items-center">
        <Ionicons name="storefront-outline" size={28} color="white" />
        <Text className="text-2xl font-bold text-white ml-2">Store Manager</Text>
      </View>
      {orders.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600">No orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}