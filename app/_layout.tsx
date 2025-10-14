import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScheduledItemsProvider } from "@/providers/ScheduledItemsProvider";
import { AuthProvider } from "@/providers/AuthProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
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
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="register" 
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
        name="admin-users" 
        options={{ 
          title: "Registered Users",
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="admin-maintenance" 
        options={{ 
          title: "Maintenance Mode",
          headerShown: true 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScheduledItemsProvider>
          <GestureHandlerRootView>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </ScheduledItemsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}