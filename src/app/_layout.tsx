import React from 'react';
import { Stack } from 'expo-router';
import { AppProvider, useApp } from '../store/AppContext';
import { PinLockScreen } from './security/pin';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import '../global.css';

function AppContent() {
  const { isLocked, isLoading, theme } = useApp();
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <ActivityIndicator size="large" color={isDark ? '#c0c1ff' : '#4f46e5'} />
      </View>
    );
  }

  if (isLocked) {
    return <PinLockScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="customer/[id]" />
      <Stack.Screen name="supplier/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AppContent />
      <Toast />
    </AppProvider>
  );
}
