import { Stack } from 'expo-router';

export default function SessionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Sessions', 
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen name="[id]" options={{ title: 'Session' }} />
    </Stack>
  );
}

