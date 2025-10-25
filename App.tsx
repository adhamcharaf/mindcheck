import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'expo-crypto'; // Initialize crypto polyfill for uuid package
import Navigation from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { COLORS } from './src/utils/constants';

export default function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on app mount
    initialize();
  }, []);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <Navigation />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
