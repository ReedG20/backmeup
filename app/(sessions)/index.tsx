import { View, Text, Platform, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { List, Section, Button, Host } from '@expo/ui/swift-ui';
import { useRouter } from 'expo-router';
import { useSessions, formatDate, formatDuration } from '../../hooks/useSessions';

export default function SessionsListScreen() {
  const router = useRouter();
  const { sessions, loading, error } = useSessions();

  const handleSessionPress = (sessionId: string) => {
    router.push(`/(sessions)/${sessionId}`);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-red-500">Error: {error}</Text>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-lg text-gray-500">No sessions yet</Text>
        <Text className="mt-2 text-center text-gray-400">
          Start a recording to create your first session
        </Text>
      </View>
    );
  }

  if (Platform.OS !== 'ios') {
    // Fallback for non-iOS platforms
    return (
      <ScrollView className="flex-1 bg-white">
        {sessions.map((session) => (
          <Pressable
            key={session.id}
            onPress={() => handleSessionPress(session.id)}
            className="border-b border-gray-200 px-4 py-3 active:bg-gray-100"
          >
            <Text className="text-lg font-medium">
              {session.title || 'Untitled Session'}
            </Text>
            <Text className="text-sm text-gray-500">
              {formatDate(session.started_at)}
              {session.session_duration_seconds
                ? ` · ${formatDuration(session.session_duration_seconds)}`
                : ''}
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
          {sessions.map((session) => (
            <Button
              key={session.id}
              variant="plain"
              onPress={() => handleSessionPress(session.id)}
            >
              {session.title || 'Untitled Session'}
            </Button>
          ))}
        </Section>
      </List>
    </Host>
  );
}
