import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Redirect } from 'expo-router';
import { RecaptchaVerifier, ApplicationVerifier } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginScreen() {
  const { user, signInWithPhone, verifyOtp } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<ApplicationVerifier | null>(null);

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const initializeRecaptcha = () => {
    if (!recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            Alert.alert('Error', 'reCAPTCHA expired. Please try again.');
            setRecaptchaVerifier(null); // Reset to force re-initialization
          },
        });
        setRecaptchaVerifier(verifier);
        return verifier;
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        Alert.alert('Error', 'Failed to initialize reCAPTCHA.');
        throw error;
      }
    }
    return recaptchaVerifier;
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const verifier = initializeRecaptcha();
      const fullPhoneNumber = `+91${phoneNumber}`; // India country code
      const id = await signInWithPhone(fullPhoneNumber, verifier);
      setVerificationId(id);
      Alert.alert('OTP Sent', 'Please check your phone for the OTP.');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationId || !otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(verificationId, otp);
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', error.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-6 justify-center">
      <Text className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Login with Phone
      </Text>

      {/* Invisible reCAPTCHA container */}
      <View id="recaptcha-container" style={{ display: 'none' }} />

      {!verificationId ? (
        <>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
            placeholder="Enter phone number (e.g., 9876543210)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <TouchableOpacity
            className="bg-teal-600 p-3 rounded-full"
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-center text-lg">
              {loading ? 'Sending...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            className="bg-teal-600 p-3 rounded-full"
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-center text-lg">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="mt-4"
            onPress={() => setVerificationId(null)}
          >
            <Text className="text-blue-600 text-center">Change Phone Number</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}