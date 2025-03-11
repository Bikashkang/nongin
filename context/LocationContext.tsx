import { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface DeliveryAddress {
  name: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

interface LocationContextType {
  currentAddress: string | null;
  deliveryAddress: DeliveryAddress;
  setDeliveryAddress: (address: DeliveryAddress) => void;
  retryLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    name: '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    latitude: undefined,
    longitude: undefined,
  });

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentAddress('Permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = address
        ? `${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim()
        : 'Unknown location';
      setCurrentAddress(formattedAddress);
      setDeliveryAddress((prev) => ({
        ...prev,
        city: address.city || prev.city,
        state: address.region || prev.state,
        postalCode: address.postalCode || prev.postalCode,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
    } catch (error) {
      console.error('Location fetch error:', error);
      setCurrentAddress('Error fetching location');
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const retryLocation = () => {
    fetchLocation();
  };

  return (
    <LocationContext.Provider value={{ currentAddress, deliveryAddress, setDeliveryAddress, retryLocation }}>
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