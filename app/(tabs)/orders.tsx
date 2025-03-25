import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Order {
  id: string;
  userId: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  timestamp: string;
  status: string;
  address: string;
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      const q = query(
        collection(db, 'orders'), 
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(ordersList);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up orders listener for user:", user.uid);
    
    // Use real-time listener with orderBy to get latest orders first
    const q = query(
      collection(db, 'orders'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      
      console.log("Real-time orders update:", ordersList.length, "orders found");
      setOrders(ordersList);
    }, (error) => {
      console.error("Error listening to orders:", error);
    });
    
    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending':
        return <Ionicons name="time-outline" size={20} color="#f59e0b" />;
      case 'processing':
        return <Ionicons name="refresh-outline" size={20} color="#3b82f6" />;
      case 'completed':
        return <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />;
      case 'cancelled':
        return <Ionicons name="close-circle-outline" size={20} color="#ef4444" />;
      default:
        return <Ionicons name="help-circle-outline" size={20} color="#6b7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View className="p-4 bg-white rounded-xl mb-3 shadow-md border border-gray-100">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-bold text-gray-800">Order #{item.id.slice(-6)}</Text>
        <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-lg">
          {getStatusIcon(item.status)}
          <Text className={`ml-1 font-medium ${
            item.status === 'pending' ? 'text-yellow-600' : 
            item.status === 'processing' ? 'text-blue-600' : 
            item.status === 'completed' ? 'text-green-600' : 
            item.status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {getStatusText(item.status || 'pending')}
          </Text>
        </View>
      </View>
      
      <Text className="text-base text-gray-500">Total: ₹{item.total.toFixed(2)}</Text>
      <Text className="text-base text-gray-500">Date: {new Date(item.timestamp).toLocaleString()}</Text>
      
      <Text className="mt-2 text-base font-semibold text-gray-700">Items:</Text>
      {item.items.map((orderItem) => (
        <Text key={orderItem.id} className="text-sm text-gray-600">
          {orderItem.name} - ₹{orderItem.price.toFixed(2)} x {orderItem.quantity}
        </Text>
      ))}
      
      {item.address && (
        <>
          <Text className="mt-2 text-base font-semibold text-gray-700">Delivery Address:</Text>
          <Text className="text-sm text-gray-600">{item.address}</Text>
        </>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient colors={['#2563eb', '#1e40af']} className="p-6 pb-4 shadow-lg">
        <Text className="text-3xl font-extrabold text-white">Order History</Text>
      </LinearGradient>
      {orders.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600 font-medium">No orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#2563eb']} // blue-600 color
            />
          }
        />
      )}
    </View>
  );
}