import { View, Text, FlatList, Platform, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, orderBy, query, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

interface Order {
  id: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  address: string;
  contactNumber: string;
  total: number;
  status: string;
  createdAt: any;
  userId: string;
  timestamp: string;
}

// Setup notifications for local use
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false, // Changed to false for better Expo Go compatibility
  }),
});

export default function StoreManagerScreen() {
  const { user, role, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const previousOrdersCountRef = useRef(0);
  const notificationsSetupComplete = useRef(false);

  // Setup local notifications for Expo Go compatibility
  useEffect(() => {
    if (!notificationsSetupComplete.current) {
      const setupNotifications = async () => {
        try {
          // Request permissions for notifications
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            console.log('Notification permissions not granted');
            return;
          }
          
          // Set up notification channel for Android
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'Default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
            });
          }
          
          console.log('Notifications setup complete');
          notificationsSetupComplete.current = true;
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      };
      
      setupNotifications();
    }
  }, []);

  // Handle refresh action
  const onRefresh = useCallback(async () => {
    if (role !== 'store_manager') return;
    
    setRefreshing(true);
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('timestamp', 'desc'),
        orderBy('status', 'asc')
      );
      
      const snapshot = await getDocs(ordersQuery);
      const ordersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      
      setOrders(ordersList);
    } catch (error) {
      console.error('Error refreshing orders:', error);
      Alert.alert('Error', 'Failed to refresh orders. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [role]);

  // Listen for orders
  useEffect(() => {
    console.log('StoreManagerScreen - User:', user?.email, 'Role:', role, 'Loading:', loading);
    if (role !== 'store_manager') return;

    // Create a query that orders by timestamp and status
    const ordersQuery = query(
      collection(db, 'orders'), 
      orderBy('timestamp', 'desc'),
      orderBy('status', 'asc')
    );

    const unsubscribe = onSnapshot(ordersQuery, 
      (snapshot) => {
        // Process the snapshot and update orders
        const ordersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        // Check for new orders to notify (using ref to avoid dependency loop)
        const currentOrdersCount = ordersList.length;
        if (previousOrdersCountRef.current > 0 && currentOrdersCount > previousOrdersCountRef.current) {
          const newOrdersCount = currentOrdersCount - previousOrdersCountRef.current;
          // Send local notification for new orders
          sendLocalNotification(
            `New Order${newOrdersCount > 1 ? 's' : ''}!`, 
            `You have ${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''} to process.`
          );
        }
        
        // Update the ref with current count
        previousOrdersCountRef.current = currentOrdersCount;
        setOrders(ordersList);
      }, 
      (error) => {
        console.error('Error getting orders:', error);
        // If the error is about missing index, show a more specific message
        if (error.code === 'failed-precondition') {
          Alert.alert(
            'Database Error',
            'Please contact support. The database needs to be updated to support order sorting.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Failed to load orders. Please try again later.');
        }
      }
    );

    return () => unsubscribe();
  }, [role]);

  // Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  // Send local notification function (Expo Go compatible)
  const sendLocalNotification = async (title: string, body: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Immediate notification
      });
      console.log('Local notification sent:', title);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

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
      
      <View className="flex-row mt-2 mb-2">
        <Text className="text-base text-gray-700 font-semibold">Status: </Text>
        <Text className={`text-base font-medium ${
          item.status === 'pending' ? 'text-yellow-600' : 
          item.status === 'processing' ? 'text-blue-600' : 
          item.status === 'completed' ? 'text-green-600' : 
          item.status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {item.status || 'pending'}
        </Text>
      </View>
      
      <FlatList
        data={item.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item: product }) => (
          <Text className="text-sm text-gray-600">
            {product.name} x {product.quantity} - ₹{(product.price * product.quantity).toFixed(2)}
          </Text>
        )}
      />
      
      <View className="flex-row justify-between mt-3">
        <TouchableOpacity 
          className="bg-blue-500 px-3 py-2 rounded-lg"
          onPress={() => updateOrderStatus(item.id, 'processing')}
        >
          <Text className="text-white">Process</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-green-500 px-3 py-2 rounded-lg"
          onPress={() => updateOrderStatus(item.id, 'completed')}
        >
          <Text className="text-white">Complete</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-red-500 px-3 py-2 rounded-lg"
          onPress={() => updateOrderStatus(item.id, 'cancelled')}
        >
          <Text className="text-white">Cancel</Text>
        </TouchableOpacity>
      </View>
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
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#0d9488']} // teal-600 color
            />
          }
        />
      )}
    </View>
  );
}