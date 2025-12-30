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
      <View className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <View className="mr-3 h-2 w-2 rounded-full bg-amber-500" />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-amber-900">{insight.title}</Text>
            <Text className="mt-0.5 text-sm text-amber-700">{insight.notification_body}</Text>
          </View>
          <Text className="text-xs text-amber-500">{expanded ? '▲' : '▼'}</Text>
        </View>

        {/* Expanded content */}
        {expanded && (
          <View className="border-t border-amber-200 bg-white px-4 py-3">
            <Text className="text-sm leading-relaxed text-gray-700">{insight.expanded_body}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function TimelineItemView({
  item,
  isLast,
}: {
  item: TimelineItem;
  isLast: boolean;
}) {
  if (item.type === 'turn') {
    return (
      <View className={`overflow-hidden rounded-xl bg-white px-4 py-4 ${!isLast ? 'mb-3' : ''}`}>
        <Text className="text-base leading-relaxed text-gray-800">{item.data.transcript}</Text>
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
          <Text className="text-center text-red-500">{error || 'Session not found'}</Text>
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

        {/* Timeline Section */}
        <View className="px-4 pt-2">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Timeline
          </Text>
          {timeline.length === 0 ? (
            <View className="overflow-hidden rounded-xl bg-white px-4 py-6">
              <Text className="text-center text-gray-400">No content available</Text>
            </View>
          ) : (
            <View>
              {timeline.map((item, index) => (
                <TimelineItemView
                  key={item.type === 'turn' ? `turn-${item.data.id}` : `insight-${item.data.id}`}
                  item={item}
                  isLast={index === timeline.length - 1}
                />
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
