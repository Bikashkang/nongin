import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const OfflineNotice = () => {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = new Animated.Value(-60);

  useEffect(() => {
    let unsubscribe = () => {};
    
    // Safely set up NetInfo listener with error handling
    const setupNetInfoListener = async () => {
      try {
        // First check - get current state
        const state = await NetInfo.fetch();
        if (state) {
          const offline = !(state.isConnected && state.isInternetReachable);
          setIsOffline(offline);
          
          // Animate in if offline
          if (offline) {
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        }
        
        // Subscribe to network state updates
        unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
          if (!state) return;
          
          const offline = !(state.isConnected && state.isInternetReachable);
          setIsOffline(offline);
          
          // Animate in or out based on connection state
          Animated.timing(slideAnim, {
            toValue: offline ? 0 : -60,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      } catch (error) {
        console.error('Error setting up NetInfo listener:', error);
      }
    };
    
    setupNetInfoListener();

    // Unsubscribe when component unmounts
    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from NetInfo:', error);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name="cloud-offline-outline" size={20} color="white" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default OfflineNotice; 