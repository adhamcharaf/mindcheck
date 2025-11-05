import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'expo-crypto'; // Initialize crypto polyfill for uuid package
import Navigation from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { COLORS } from './src/utils/constants';
import { initRevenueCat } from './src/services/revenuecat';

export default function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize RevenueCat (mock mode)
    initRevenueCat();

    // Initialize auth state on app mount
    initialize();
  }, []);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <StatusBar style="auto" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Navigation />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
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
