import { View, Text, FlatList } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface Order {
  id: string;
  userId: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  timestamp: string;
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const ordersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersList);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <View className="p-4 bg-white rounded-lg mb-2 shadow-md">
      <Text className="text-lg font-semibold">Order ID: {item.id}</Text>
      <Text>Total: ${item.total.toFixed(2)}</Text>
      <Text>Date: {new Date(item.timestamp).toLocaleString()}</Text>
      <Text className="mt-2 font-semibold">Items:</Text>
      {item.items.map((orderItem) => (
        <Text key={orderItem.id} className="text-gray-600">
          {orderItem.name} - ${orderItem.price.toFixed(2)} x {orderItem.quantity}
        </Text>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-blue-600 p-6 pb-4">
        <Text className="text-3xl font-bold text-white">Order History</Text>
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