import React, { useEffect } from 'react';
import { View, Animated, Easing, Dimensions } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoading: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style = {},
}) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      })
    ).start();

    return () => {
      animatedValue.stopAnimation();
    };
  }, []);

  const interpolatedColor = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#E5E7EB', '#F3F4F6', '#E5E7EB'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: interpolatedColor,
        },
        style,
      ]}
    />
  );
};

interface ProductSkeletonProps {
  count?: number;
}

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count = 4 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 48) / 2; // Account for padding and margins

  return (
    <View className="flex-row flex-wrap justify-between px-4">
      {items.map((item) => (
        <View
          key={item}
          className="m-2 p-4 bg-white rounded-xl shadow-md border border-gray-100"
          style={{ width: itemWidth - 16 }}
        >
          <SkeletonLoading
            width="100%"
            height={100}
            borderRadius={8}
            style={{ marginBottom: 10 }}
          />
          <SkeletonLoading
            width="80%"
            height={20}
            borderRadius={4}
            style={{ marginBottom: 8 }}
          />
          <SkeletonLoading
            width="40%"
            height={16}
            borderRadius={4}
            style={{ marginBottom: 10 }}
          />
          <SkeletonLoading
            width="60%"
            height={32}
            borderRadius={20}
          />
        </View>
      ))}
    </View>
  );
};

interface CategorySkeletonProps {
  count?: number;
}

export const CategorySkeleton: React.FC<CategorySkeletonProps> = ({ count = 5 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View className="flex-row px-4 py-2">
      {items.map((item) => (
        <View key={item} className="items-center mx-2">
          <SkeletonLoading
            width={64}
            height={64}
            borderRadius={32}
            style={{ marginBottom: 4 }}
          />
          <SkeletonLoading
            width={60}
            height={12}
            borderRadius={4}
          />
        </View>
      ))}
    </View>
  );
};

export default SkeletonLoading; 