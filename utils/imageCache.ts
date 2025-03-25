import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const imageDirectory = `${FileSystem.cacheDirectory}images/`;

// Default placeholder image as a base64 string for offline fallback
export const DEFAULT_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMDUtMjJUMTU6MTM6MTYrMDI6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTA1LTIyVDE1OjE2OjA1KzAyOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIzLTA1LTIyVDE1OjE2OjA1KzAyOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY2NGE0YmJkLWI5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';

// Ensure the directory exists
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(imageDirectory);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(imageDirectory, { intermediates: true });
  }
};

// Generate a filename from the URL
const generateFilename = (url: string): string => {
  return url
    .split('/')
    .pop()
    ?.replace(/[^a-zA-Z0-9]/g, '') || Math.random().toString(36).substring(2);
};

// Check if network is available
const isNetworkAvailable = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable);
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Download and cache an image
export const cacheImage = async (url: string): Promise<string> => {
  try {
    // Web platform doesn't need caching
    if (Platform.OS === 'web') {
      return url;
    }
    
    // Check if we're working with a placeholder image
    if (url.startsWith('data:')) {
      return url;
    }
    
    // Skip network requests if we're offline
    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      console.log('Network unavailable, skipping image download');
      return DEFAULT_PLACEHOLDER;
    }

    await ensureDirExists();
    
    const filename = generateFilename(url);
    const filePath = `${imageDirectory}${filename}`;
    
    // Check if the file already exists
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists) {
      console.log(`Image exists at: ${filePath}`);
      return fileInfo.uri;
    }
    
    // Download the image
    console.log(`Downloading ${url} to ${filePath}`);
    const { uri } = await FileSystem.downloadAsync(url, filePath);
    console.log(`Downloaded ${url} to ${uri}`);
    
    return uri;
  } catch (error) {
    console.error('Error caching image:', error);
    return DEFAULT_PLACEHOLDER; // Return placeholder instead of original URL
  }
};

// Get cached image if it exists, otherwise return the original URL
export const getCachedImage = async (url: string): Promise<string> => {
  try {
    // Web platform doesn't need caching
    if (Platform.OS === 'web' || !url) {
      return url;
    }
    
    // Check if we're working with a placeholder image or data URI
    if (url.startsWith('data:')) {
      return url;
    }
    
    await ensureDirExists();
    
    const filename = generateFilename(url);
    const filePath = `${imageDirectory}${filename}`;
    
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists) {
      return fileInfo.uri;
    }
    
    // Check network before trying to cache
    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      console.log('Network unavailable, using placeholder');
      return DEFAULT_PLACEHOLDER;
    }
    
    // Not cached yet, cache it now
    return await cacheImage(url);
  } catch (error) {
    console.error('Error getting cached image:', error);
    return DEFAULT_PLACEHOLDER; // Return placeholder instead of original URL
  }
};

// Clear the image cache
export const clearImageCache = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(imageDirectory);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(imageDirectory);
      console.log('Image cache cleared');
    }
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
}; 