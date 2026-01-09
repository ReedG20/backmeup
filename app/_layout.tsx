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
      <Stack.Screen
        name="(sessions)"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#3A20E3' },
          headerTintColor: '#fff',
          headerBackTitle: 'Sessions',
        }}
      />
    </Stack>
  );
}

