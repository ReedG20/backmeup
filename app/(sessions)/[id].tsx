import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSession, TimelineItem } from '../../hooks/useSession';
import { formatDate, formatDuration } from '../../hooks/useSessions';
import type { Insight } from '../../lib/database.types';

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable onPress={() => setExpanded(!expanded)}>
      <View className="overflow-hidden rounded-xl border border-white/20 bg-white/10">
        <View className="flex-row items-center px-4 py-3">
          <View className="mr-3 h-2 w-2 rounded-full bg-yellow-400" />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">{insight.title}</Text>
            <Text className="mt-0.5 text-sm text-white/70">{insight.notification_body}</Text>
          </View>
          <Text className="text-xs text-white/50">{expanded ? '▲' : '▼'}</Text>
        </View>
        {expanded && (
          <View className="border-t border-white/10 bg-black/20 px-4 py-3">
            <Text className="text-sm leading-relaxed text-white/80">{insight.expanded_body}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function TimelineItemView({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  if (item.type === 'turn') {
    return (
      <View className={!isLast ? 'mb-3' : ''}>
        <Text className="text-base leading-relaxed text-white/90">{item.data.transcript}</Text>
      </View>
    );
  }

  return (
    <View className={!isLast ? 'mb-3' : ''}>
      <InsightCard insight={item.data} />
    </View>
  );
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, timeline, loading, error } = useSession(id);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Session' }} />
        <View className="flex-1 items-center justify-center bg-primary">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </>
    );
  }

  if (error || !session) {
    return (
      <>
        <Stack.Screen options={{ title: 'Session' }} />
        <View className="flex-1 items-center justify-center bg-primary px-8">
          <Text className="text-center text-red-300">{error || 'Session not found'}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: session.title || 'Session',
        }}
      />
      <ScrollView className="flex-1 bg-primary px-6 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-1 text-sm text-white/50">
          {formatDate(session.started_at)}
          {session.session_duration_seconds
            ? ` · ${formatDuration(session.session_duration_seconds)}`
            : ''}
        </Text>

        <View className="mt-4">
          {timeline.length === 0 ? (
            <View className="rounded-xl bg-white/10 px-4 py-6">
              <Text className="text-center text-white/40">No content available</Text>
            </View>
          ) : (
            timeline.map((item, index) => (
              <TimelineItemView
                key={item.type === 'turn' ? `turn-${item.data.id}` : `insight-${item.data.id}`}
                item={item}
                isLast={index === timeline.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}
