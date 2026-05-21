import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import FastImage, { FastImageProps } from 'react-native-fast-image';

interface LazyImageProps extends FastImageProps {
  placeholderColor?: string;
  showLoadingIndicator?: boolean;
  errorFallback?: React.ReactNode;
}

export default function LazyImage({
  placeholderColor = '#F8F9FA',
  showLoadingIndicator = true,
  errorFallback,
  style,
  ...props
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError && errorFallback) {
    return <View style={style}>{errorFallback}</View>;
  }

  return (
    <View style={style}>
      <FastImage
        {...props}
        style={StyleSheet.absoluteFillObject}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode={props.resizeMode || FastImage.resizeMode.cover}
      />
      
      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: placeholderColor }]}>
          {showLoadingIndicator && (
            <ActivityIndicator size="small" color="#1B4332" />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
