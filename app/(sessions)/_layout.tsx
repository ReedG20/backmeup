import { Stack } from 'expo-router';

export default function SessionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#3A20E3' },
        headerTintColor: '#fff',
        headerBackTitle: 'Sessions',
        contentStyle: { backgroundColor: '#3A20E3' },
      }}
    />
  );
}

