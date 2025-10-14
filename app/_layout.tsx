import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScheduledItemsProvider } from "@/providers/ScheduledItemsProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { View, ActivityIndicator, StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { loading, user, isGuest } = useAuth();

  useEffect(() => {
    if (!loading) {
      console.log('🟢 [LAYOUT] Auth loaded, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      console.log('🟢 [LAYOUT] Auth state:', { user: user?.email || 'null', isGuest });
    }
  }, [loading, user, isGuest]);

  if (loading) {
    console.log('🟡 [LAYOUT] Still loading auth, showing splash...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen 
        name="auth" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="account" 
        options={{ 
          title: "Account",
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="admin" 
        options={{ 
          title: "Admin Panel",
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="schedule-success" 
        options={{ 
          presentation: "modal",
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="scheduled-items" 
        options={{ 
          title: "Scheduled Items",
          headerShown: true 
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScheduledItemsProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </ScheduledItemsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}