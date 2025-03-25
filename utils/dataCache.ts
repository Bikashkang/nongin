import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache data with a timestamp for expiration
 */
export const cacheData = async (key: string, data: any, expiryMinutes = 60): Promise<void> => {
  try {
    const item = {
      data,
      timestamp: new Date().getTime(),
      expiry: expiryMinutes * 60 * 1000 // Convert minutes to milliseconds
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(item));
    console.log(`Data cached: ${key}`);
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

/**
 * Get cached data if it exists and is not expired
 */
export const getCachedData = async <T>(key: string, defaultValue: T | null = null): Promise<T | null> => {
  try {
    const cachedItem = await AsyncStorage.getItem(key);
    
    if (!cachedItem) {
      return defaultValue;
    }
    
    const item = JSON.parse(cachedItem);
    const now = new Date().getTime();
    
    // Check if the cached data has expired
    if (now - item.timestamp > item.expiry) {
      console.log(`Cache expired: ${key}`);
      await AsyncStorage.removeItem(key); // Clean up expired data
      return defaultValue;
    }
    
    console.log(`Cache hit: ${key}`);
    return item.data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return defaultValue;
  }
};

/**
 * Clear a specific cached item
 */
export const clearCachedItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`Cache cleared: ${key}`);
  } catch (error) {
    console.error('Error clearing cached item:', error);
  }
};

/**
 * Clear all cached data (use with caution!)
 */
export const clearAllCachedData = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cachePrefixedKeys = allKeys.filter(key => key.startsWith('cache:'));
    
    if (cachePrefixedKeys.length > 0) {
      await AsyncStorage.multiRemove(cachePrefixedKeys);
      console.log(`Cleared ${cachePrefixedKeys.length} cached items`);
    }
  } catch (error) {
    console.error('Error clearing all cached data:', error);
  }
};

/**
 * Generate a cache key with a consistent prefix
 */
export const generateCacheKey = (namespace: string, identifier: string): string => {
  return `cache:${namespace}:${identifier}`;
}; 