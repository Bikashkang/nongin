import React from 'react';
import { View, Text, FlatList, Platform, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, orderBy, query, Timestamp, getDocs, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AppState } from 'react-native';
import { cacheData, getCachedData, generateCacheKey } from '../../utils/dataCache';
import SkeletonLoading from '../../components/SkeletonLoading';

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

// Order skeleton component for manager
const ManagerOrderSkeleton = ({ count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  
  return (
    <View className="px-4">
      {items.map((item) => (
        <View key={item} className="p-4 bg-white rounded-xl mb-3 shadow-md border border-gray-100">
          <View className="flex-row justify-between mb-2">
            <SkeletonLoading width={120} height={24} borderRadius={4} />
            <SkeletonLoading width={150} height={22} borderRadius={4} />
          </View>
          
          <SkeletonLoading width="60%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonLoading width="70%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
          
          <View className="mt-2 mb-3">
            <SkeletonLoading width="100%" height={20} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonLoading width="90%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonLoading width="85%" height={16} borderRadius={4} />
          </View>
          
          <View className="flex-row justify-between mt-3">
            <SkeletonLoading width={80} height={34} borderRadius={8} />
            <SkeletonLoading width={80} height={34} borderRadius={8} />
            <SkeletonLoading width={80} height={34} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Setup notifications for local use
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false, // Changed to false for better Expo Go compatibility
  }),
});

export default function StoreManagerScreen() {
  const { user, role, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const previousOrdersCountRef = useRef(0);
  const notificationsSetupComplete = useRef(false);
  const appState = useRef(AppState.currentState);

  // Setup local notifications for Expo Go compatibility
  useEffect(() => {
    if (!notificationsSetupComplete.current) {
      const setupNotifications = async () => {
        try {
          // Request permissions for notifications
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          
          if (finalStatus !== 'granted') {
            Alert.alert(
              'Permission Required',
              'Please enable notifications to receive order alerts',
              [{ text: 'OK' }]
            );
            return;
          }
          
          // Set up notification channel for Android
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('orders', {
              name: 'Order Notifications',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
              sound: 'default',
              description: 'Notifications for new orders from customers',
            });
          }
          
          console.log('Notifications setup complete');
          notificationsSetupComplete.current = true;
          
          // Remove test notification
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      };
      
      setupNotifications();
    }

    // Set up notification received handler
    const notificationReceivedListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
      }
    );

    // Set up notification response handler
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response:', response);
        // You can add navigation logic here if needed
      }
    );

    // Handle app state changes to reset order count reference when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        console.log('App has come to the foreground!');
        // Reset previous orders count to current count to avoid duplicate notifications
        previousOrdersCountRef.current = orders.length;
      }
      appState.current = nextAppState;
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationReceivedListener);
      Notifications.removeNotificationSubscription(notificationResponseListener);
      subscription.remove();
    };
  }, [orders.length]);

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
      
      // Cache the refreshed orders
      const cacheKey = generateCacheKey('manager-orders', 'all');
      await cacheData(cacheKey, ordersList, 5); // Cache for just 5 minutes since managers need fresh data
      
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
    console.log('StoreManagerScreen - User:', user?.email, 'Role:', role);
    if (role !== 'store_manager') return;

    // Initialize order count reference when component mounts
    if (previousOrdersCountRef.current === 0) {
      console.log('Initializing order tracking');
    }

    const loadOrders = async () => {
      setLoading(true);
      
      // Try to get cached orders first (for quick initial load)
      const cacheKey = generateCacheKey('manager-orders', 'all');
      const cachedOrders = await getCachedData<Order[]>(cacheKey);
      
      if (cachedOrders && cachedOrders.length > 0) {
        console.log("Using cached manager orders data");
        setOrders(cachedOrders);
        // Set the previous orders count reference
        previousOrdersCountRef.current = cachedOrders.length;
        setLoading(false);
      }
      
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
          
          // Check for new orders to notify
          const currentOrdersCount = ordersList.length;
          
          // Only check for new orders if the previous count was initialized and greater than 0
          if (previousOrdersCountRef.current > 0) {
            if (currentOrdersCount > previousOrdersCountRef.current) {
              const newOrdersCount = currentOrdersCount - previousOrdersCountRef.current;
              
              // Find the new orders - assuming they're at the beginning of the array since we're sorting by timestamp DESC
              const newOrders = ordersList.slice(0, newOrdersCount);
              
              // Send a notification with specific order details
              if (newOrders.length > 0) {
                const latestOrder = newOrders[0];
                const orderTotal = latestOrder.total.toFixed(2);
                const orderItems = latestOrder.items.map(item => item.name).join(', ');
                
                // Send enhanced notification with more details
                sendLocalNotification(
                  `New Order #${latestOrder.id.slice(-6)}`,
                  `₹${orderTotal} - ${orderItems.substring(0, 50)}${orderItems.length > 50 ? '...' : ''}`,
                  {
                    orderId: latestOrder.id,
                    channelId: 'orders'
                  }
                );
              }
            }
          }
          
          // Cache the updated orders
          cacheData(cacheKey, ordersList, 5); // Cache for just 5 minutes
          
          // Update the ref with current count
          previousOrdersCountRef.current = currentOrdersCount;
          setOrders(ordersList);
          setLoading(false);
        }, 
        (error) => {
          console.error('Error getting orders:', error);
          setLoading(false);
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

      // Cleanup function
      return () => {
        unsubscribe();
      };
    };
    
    loadOrders();
  }, [role]);

  // Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`Starting updateOrderStatus for order ${orderId} to status ${newStatus}`);
      
      // First get the order details to access the userId
      const orderDoc = await doc(db, 'orders', orderId);
      const orderSnapshot = await getDoc(orderDoc);
      
      if (!orderSnapshot.exists()) {
        console.error(`Order ${orderId} not found`);
        Alert.alert('Error', 'Order not found');
        return;
      }
      
      const orderData = orderSnapshot.data() as Order;
      const userId = orderData.userId;
      console.log(`Updating order for user ${userId}`);
      
      // Update the order status
      await updateDoc(orderDoc, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      console.log(`Order ${orderId} status updated to ${newStatus}`);
      
      // Save notification in a "notifications" collection for the specific user
      if (newStatus === 'processing') {
        console.log(`Creating "on the way" notification for user ${userId}`);
        // Create a notification for the customer
        try {
          const notificationRef = await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: "Your order is on the way!",
            body: `Order #${orderId.slice(-6)} is being processed by our team.`,
            orderId: orderId,
            timestamp: serverTimestamp(),
            read: false,
            type: 'order_status'
          });
          
          console.log(`Notification created with ID: ${notificationRef.id} for user ${userId} about order ${orderId}`);
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      } else if (newStatus === 'completed') {
        console.log(`Creating "delivered" notification for user ${userId}`);
        // Create a notification for completion
        try {
          const notificationRef = await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: "Your order has been delivered!",
            body: `Order #${orderId.slice(-6)} has been marked as completed. Enjoy!`,
            orderId: orderId,
            timestamp: serverTimestamp(),
            read: false,
            type: 'order_status'
          });
          
          console.log(`Notification created with ID: ${notificationRef.id} for user ${userId} about order ${orderId}`);
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      } else if (newStatus === 'cancelled') {
        console.log(`Creating "cancelled" notification for user ${userId}`);
        // Create a notification for cancellation
        try {
          const notificationRef = await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: "Your order has been cancelled",
            body: `Order #${orderId.slice(-6)} has been cancelled. Please contact support if you need assistance.`,
            orderId: orderId,
            timestamp: serverTimestamp(),
            read: false,
            type: 'order_status'
          });
          
          console.log(`Notification created with ID: ${notificationRef.id} for user ${userId} about order ${orderId}`);
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  // Send local notification function (Expo Go compatible)
  const sendLocalNotification = async (title: string, body: string, data = {}) => {
    try {
      // Check permissions again just to be sure
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.error('Notification permission not granted');
        return;
      }
      
      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: 'high',
        },
        trigger: null, // Immediate notification
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  if (authLoading) {
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
      <Text className="text-lg font-bold text-gray-800">Order #{item.id.slice(-6)}</Text>
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
      <View className="p-6 bg-teal-600">
        <View className="flex-row items-center">
          <Ionicons name="storefront-outline" size={28} color="white" />
          <Text className="text-2xl font-bold text-white ml-2">Store Manager</Text>
        </View>
      </View>
      
      {loading ? (
        <ManagerOrderSkeleton count={4} />
      ) : orders.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
          <Text className="text-lg text-gray-600">No orders yet.</Text>
          <Text className="text-sm text-gray-500 mt-1">New orders will appear here.</Text>
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