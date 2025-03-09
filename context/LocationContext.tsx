import { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';

interface LocationContextType {
  currentAddress: string;
  retryLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentAddress, setCurrentAddress] = useState<string>('Fetching location...');

  const getLocation = async () => {
    setCurrentAddress('Fetching location...');
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          console.log('Geolocation not supported, falling back to IP');
        } else {
          const permission = await new Promise<string>((resolve) => {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => resolve(result.state));
          });

          if (permission !== 'denied') {
            try {
              await new Promise<void>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    const { latitude, longitude } = position.coords;
                    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (address) {
                      const formattedAddress = `${address.street || ''} ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim();
                      setCurrentAddress(formattedAddress || 'Unknown location');
                    } else {
                      setCurrentAddress('Unable to fetch address');
                    }
                    resolve();
                  },
                  (error) => reject(error),
                  { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
                );
              });
              return;
            } catch (error) {
              console.error('Web geolocation failed:', error);
            }
          }
        }

        console.log('Falling back to IP-based location');
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const formattedAddress = `${data.city || ''}, ${data.region || ''} ${data.country_name || ''}`.trim();
        setCurrentAddress(formattedAddress || 'Unknown location');
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCurrentAddress('Location permission denied');
          Alert.alert('Permission Denied', 'Please enable location services.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address) {
          const formattedAddress = `${address.street || ''} ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim();
          setCurrentAddress(formattedAddress || 'Unknown location');
        } else {
          setCurrentAddress('Unable to fetch address');
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setCurrentAddress('Error fetching location');
    }
  };

  useEffect(() => {
    getLocation();
  }, []); // Runs once on mount

  const retryLocation = () => {
    getLocation();
  };

  return (
    <LocationContext.Provider value={{ currentAddress, retryLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}