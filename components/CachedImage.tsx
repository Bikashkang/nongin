import React, { useState, useEffect } from 'react';
import { Image, ImageProps, StyleSheet, View, ActivityIndicator } from 'react-native';
import { getCachedImage } from '../utils/imageCache';
import SkeletonLoading from './SkeletonLoading';

interface CachedImageProps extends ImageProps {
  source: { uri: string } | number;
  placeholderColor?: string;
  showLoadingIndicator?: boolean;
}

const CachedImage: React.FC<CachedImageProps> = (props) => {
  const {
    source,
    style,
    placeholderColor = '#E5E7EB',
    showLoadingIndicator = false,
    ...rest
  } = props;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Only cache images from URLs
        if (typeof source === 'number') {
          setImageUri(Image.resolveAssetSource(source).uri);
          setLoading(false);
          return;
        }

        if (!source.uri) {
          setError(true);
          setLoading(false);
          return;
        }

        const cachedUri = await getCachedImage(source.uri);
        setImageUri(cachedUri);
        setLoading(false);
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadImage();
  }, [source]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        {showLoadingIndicator ? (
          <ActivityIndicator size="small" color="#0284c7" />
        ) : (
          <SkeletonLoading 
            width="100%" 
            height="100%" 
            style={{ borderRadius: StyleSheet.flatten(style)?.borderRadius || 0 }} 
          />
        )}
      </View>
    );
  }

  if (error || !imageUri) {
    // Return a gray box for failed images
    return <View style={[styles.container, { backgroundColor: placeholderColor }, style]} />;
  }

  return (
    <Image
      {...rest}
      source={{ uri: imageUri }}
      style={style}
      onError={() => setError(true)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default CachedImage; 