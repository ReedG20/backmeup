import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSession } from '../../hooks/useSession';
import { formatDate, formatDuration } from '../../hooks/useSessions';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, loading, error } = useSession(id);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Session',
            headerBackTitle: 'Sessions',
          }}
        />
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </>
    );
  }

  if (error || !session) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Session',
            headerBackTitle: 'Sessions',
          }}
        />
        <View className="flex-1 items-center justify-center bg-gray-50 px-8">
          <Text className="text-center text-red-500">
            {error || 'Session not found'}
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: session.title || 'Session',
          headerBackTitle: 'Sessions',
        }}
      />
      <ScrollView className="flex-1 bg-gray-50">
        {/* Session Info */}
        <View className="px-4 pt-4">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {formatDate(session.started_at)}
            {session.session_duration_seconds
              ? ` · ${formatDuration(session.session_duration_seconds)}`
              : ''}
          </Text>
        </View>

        {/* Turns Section */}
        <View className="px-4 pt-2">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Transcript
          </Text>
          {session.turns.length === 0 ? (
            <View className="overflow-hidden rounded-xl bg-white px-4 py-6">
              <Text className="text-center text-gray-400">
                No transcript available
              </Text>
            </View>
          ) : (
            <View className="overflow-hidden rounded-xl bg-white">
              {session.turns.map((turn, index) => (
                <View
                  key={turn.id}
                  className={`px-4 py-3 ${index !== session.turns.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <Text className="mb-1 text-xs text-gray-400">
                    Turn {turn.turn_order}
                  </Text>
                  <Text className="text-base leading-relaxed text-gray-800">
                    {turn.transcript}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Spacer at bottom */}
        <View className="h-8" />
      </ScrollView>
    </>
  );
}
