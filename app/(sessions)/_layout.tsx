import { Stack } from 'expo-router';

export default function SessionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#3A20E3' },
        headerTintColor: '#fff',
        headerBackVisible: true,
        contentStyle: { backgroundColor: '#3A20E3' },
      }}
    />
  );
}

