import { View, Text, Platform, Pressable, ScrollView } from 'react-native';
import { List, Section, Button, Host } from '@expo/ui/swift-ui';
import { useRouter } from 'expo-router';

// Hardcoded placeholder sessions
const PLACEHOLDER_SESSIONS = [
  { id: '1', title: 'Morning Standup', date: 'Dec 29, 2024', duration: '15 min' },
  { id: '2', title: 'Product Review', date: 'Dec 28, 2024', duration: '45 min' },
  { id: '3', title: 'Client Call', date: 'Dec 27, 2024', duration: '30 min' },
  { id: '4', title: 'Team Brainstorm', date: 'Dec 26, 2024', duration: '1 hr' },
  { id: '5', title: '1:1 with Manager', date: 'Dec 24, 2024', duration: '25 min' },
];

export default function SessionsListScreen() {
  const router = useRouter();

  const handleSessionPress = (sessionId: string) => {
    router.push(`/(sessions)/${sessionId}`);
  };

  if (Platform.OS !== 'ios') {
    // Fallback for non-iOS platforms
    return (
      <ScrollView className="flex-1 bg-white">
        {PLACEHOLDER_SESSIONS.map((session) => (
          <Pressable
            key={session.id}
            onPress={() => handleSessionPress(session.id)}
            className="border-b border-gray-200 px-4 py-3 active:bg-gray-100"
          >
            <Text className="text-lg font-medium">{session.title}</Text>
            <Text className="text-sm text-gray-500">
              {session.date} · {session.duration}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <List listStyle="insetGrouped">
        <Section>
          {PLACEHOLDER_SESSIONS.map((session) => (
            <Button
              key={session.id}
              variant="plain"
              onPress={() => handleSessionPress(session.id)}
            >
              {session.title}
            </Button>
          ))}
        </Section>
      </List>
    </Host>
  );
}
