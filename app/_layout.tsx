import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import Auth from '../components/Auth';

import '../global.css';

export default function Layout() {
  const { user, loading } = useAuth();

  // Show loading spinner during initial auth check
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Show auth screen when not logged in
  if (!user) {
    return <Auth />;
  }

  // Show main app when authenticated
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: '#3A20E3' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="(sessions)/[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#3A20E3' },
          headerTintColor: '#fff',
        }}
      />
    </Stack>
  );
}
