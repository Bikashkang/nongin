import React from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { cacheData, getCachedData, generateCacheKey } from '../../utils/dataCache';
import SkeletonLoading from '../../components/SkeletonLoading';

// Setup notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface Order {
  id: string;
  userId: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  timestamp: string;
  status: string;
  address: string;
}

interface CustomerNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  orderId: string;
  timestamp: any; // Firebase Timestamp
  read: boolean;
  type: string;
}

// Order skeleton component
const OrderSkeleton = ({ count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  
  return (
    <View className="px-4">
      {items.map((item) => (
        <View key={item} className="p-4 bg-white rounded-xl mb-3 shadow-md border border-gray-100">
          <View className="flex-row justify-between items-center mb-2">
            <SkeletonLoading width={120} height={24} borderRadius={4} />
            <SkeletonLoading width={80} height={26} borderRadius={12} />
          </View>
          
          <SkeletonLoading width="60%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonLoading width="70%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
          
          <SkeletonLoading width="40%" height={20} borderRadius={4} style={{ marginTop: 10, marginBottom: 6 }} />
          
          <View className="mt-2">
            <SkeletonLoading width="90%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonLoading width="80%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonLoading width="85%" height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationsPermission, setNotificationsPermission] = useState(false);

  // Set up notifications
  useEffect(() => {
    (async () => {
      try {
        // Request permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        setNotificationsPermission(finalStatus === 'granted');
        
        // Set up channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('order-updates', {
            name: 'Order Updates',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3B82F6',
            sound: 'default',
            description: 'Notifications for order status updates',
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    })();
  }, []);
  
  // Listen for user notifications
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up notifications listener for user:", user.uid);
    console.log("Notification permission status:", notificationsPermission ? "Granted" : "Not granted");
    
    // Listen for new notifications for this user
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    console.log("Notification query created with filters: userId ==", user.uid, "and read == false");
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      console.log(`Notification snapshot received: ${snapshot.docChanges().length} changes`);
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          // This is a new notification
          const notification = {
            id: change.doc.id,
            ...change.doc.data()
          } as CustomerNotification;
          
          console.log("New notification received:", notification);
          
          // Show local notification to user
          if (notificationsPermission) {
            console.log("Showing local notification:", notification.title);
            try {
              const notificationId = await showLocalNotification(notification.title, notification.body);
              console.log("Local notification shown with ID:", notificationId);
              
              // Mark notification as read
              try {
                await updateDoc(doc(db, 'notifications', notification.id), {
                  read: true
                });
                console.log("Marked notification as read:", notification.id);
              } catch (error) {
                console.error("Error marking notification as read:", error);
              }
            } catch (error) {
              console.error("Error showing local notification:", error);
            }
          } else {
            console.warn("Cannot show notification - permission not granted");
          }
        }
      });
    }, (error) => {
      console.error("Error in notification listener:", error);
    });
    
    return () => {
      console.log("Cleaning up notification listener");
      unsubscribe();
    };
  }, [user, notificationsPermission]);
  
  // Function to display local notification
  const showLocalNotification = async (title: string, body: string) => {
    try {
      console.log("Scheduling notification with title:", title);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: 'high',
          data: { channelId: 'order-updates' },
        },
        trigger: null, // Immediate notification
      });
      console.log("Notification scheduled with ID:", notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  };

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
      
      // Cache the refreshed orders
      const cacheKey = generateCacheKey('orders', user.uid);
      await cacheData(cacheKey, ordersList, 15); // Cache for 15 minutes
      
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
    
    const loadOrders = async () => {
      setLoading(true);
      
      // Try to get cached orders first
      const cacheKey = generateCacheKey('orders', user.uid);
      const cachedOrders = await getCachedData<Order[]>(cacheKey);
      
      if (cachedOrders && cachedOrders.length > 0) {
        console.log("Using cached orders data");
        setOrders(cachedOrders);
        setLoading(false);
      }
      
      // Always set up real-time listener for updates
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
        
        // Cache the updated orders
        cacheData(cacheKey, ordersList, 15); // Cache for 15 minutes
        
        setOrders(ordersList);
        setLoading(false);
      }, (error) => {
        console.error("Error listening to orders:", error);
        setLoading(false);
      });
      
      // Clean up the listener on unmount
      return unsubscribe;
    };
    
    loadOrders();
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
      
      {loading ? (
        <OrderSkeleton count={3} />
      ) : orders.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
          <Text className="text-lg text-gray-600 font-medium mt-4">No orders yet.</Text>
          <Text className="text-sm text-gray-500 mt-1">Your order history will appear here.</Text>
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