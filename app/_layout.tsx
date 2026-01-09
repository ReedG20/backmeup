import { Stack } from 'expo-router';

import '../global.css';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#3A20E3' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(sessions)" />
    </Stack>
  );
}

