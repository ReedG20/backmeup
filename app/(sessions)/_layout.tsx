import { Stack } from 'expo-router';

export default function SessionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#3A20E3' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#3A20E3' },
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}

