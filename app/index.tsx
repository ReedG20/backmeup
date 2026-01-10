import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host, Button } from '@expo/ui/swift-ui';
import * as Notifications from 'expo-notifications';
import { useRecordingSession } from '../hooks/useRecordingSession';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useSessions } from '../hooks/useSessions';
import type { Turn, Insight } from '../lib/database.types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type TimelineItem = { type: 'turn'; data: Turn } | { type: 'insight'; data: Insight };

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


export default function HomeScreen() {
  const router = useRouter();
  const { sessions, loading: sessionsLoading, refetch } = useSessions();
  const {
    state,
    turns,
    insights,
    error,
    startSession,
    endSession,
    sendAudio,
  } = useRecordingSession();

  const { startRecording, stopRecording } = useAudioRecording({
    onAudioChunk: sendAudio,
  });

  useFocusEffect(
    useCallback(() => {
      if (state === 'idle') {
        refetch();
      }
    }, [refetch, state])
  );

  const timeline = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];
    for (const turn of turns) {
      items.push({ type: 'turn', data: turn });
    }
    for (const insight of insights) {
      items.push({ type: 'insight', data: insight });
    }
    items.sort((a, b) => {
      const aTime = new Date(a.data.created_at).getTime();
      const bTime = new Date(b.data.created_at).getTime();
      return aTime - bTime;
    });
    return items;
  }, [turns, insights]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    if (insights.length > 0) {
      const latestInsight = insights[insights.length - 1];
      Notifications.scheduleNotificationAsync({
        content: {
          title: latestInsight.title,
          body: latestInsight.notification_body,
        },
        trigger: null,
      });
    }
  }, [insights.length]);

  const handleStartSession = async () => {
    const sessionId = await startSession();
    if (sessionId) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Session Started',
          body: 'Your recording session is now active.',
        },
        trigger: null,
      });
      await startRecording();
    }
  };

  const handleEndSession = async () => {
    await stopRecording();
    await endSession();
  };

  const handleSessionPress = (sessionId: string) => {
    router.push(`/(sessions)/${sessionId}`);
  };

  const isRecording = state === 'recording';
  const isTransitioning = state === 'starting' || state === 'stopping';

  // Recording UI
  if (isRecording || isTransitioning) {
    return (
      <SafeAreaView className="flex-1 bg-primary" edges={['top', 'left', 'right']}>
        <View className="flex-1 px-6 pb-6">
          {error && <Text className="mb-4 mt-4 text-sm text-red-300">{error}</Text>}

          <ScrollView className="mb-4 flex-1 pt-4">
            {timeline.length === 0 ? (
              <Text className="text-center text-white/40">Listening... Speak to see transcript</Text>
            ) : (
              timeline.map((item, index) => (
                <View
                  key={item.type === 'turn' ? `turn-${item.data.id}` : `insight-${item.data.id}`}
                  className={index !== timeline.length - 1 ? 'mb-3' : ''}
                >
                  {item.type === 'turn' ? (
                    <Text className="text-lg leading-relaxed text-white/90">
                      {item.data.transcript}
                    </Text>
                  ) : (
                    <InsightCard insight={item.data} />
                  )}
                </View>
              ))
            )}
          </ScrollView>

          <View className="pb-4">
            {Platform.OS === 'ios' ? (
              <Host style={{ height: 52, minWidth: 160 }}>
                <Button
                  variant="glass"
                  controlSize="large"
                  onPress={handleEndSession}
                  disabled={isTransitioning}
                >
                  {isTransitioning ? 'Stopping...' : 'End Session'}
                </Button>
              </Host>
            ) : (
              <Pressable
                onPress={handleEndSession}
                disabled={isTransitioning}
                className="w-full rounded-full bg-white px-8 py-4 active:bg-white/80"
              >
                <Text className="text-center text-lg font-semibold text-primary">
                  {isTransitioning ? 'Stopping...' : 'End Session'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Home UI
  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-white">My Sessions</Text>
        </View>

        {sessionsLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : sessions.length === 0 ? (
          <View className="flex-1 px-6">
            <Text className="text-lg text-white/50">No sessions yet</Text>
            <Text className="mt-2 text-white/30">Start a session to begin recording</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
            {sessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => handleSessionPress(session.id)}
                className="border-b border-white/20 py-4 active:opacity-70"
              >
                <Text className="text-lg text-white">
                  {session.title || 'Untitled Session'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View className="absolute bottom-8 right-6">
          {Platform.OS === 'ios' ? (
            <Host style={{ height: 52, minWidth: 160 }}>
              <Button
                variant="glass"
                controlSize="large"
                onPress={handleStartSession}
                disabled={isTransitioning}
              >
                Start Session
              </Button>
            </Host>
          ) : (
            <Pressable
              onPress={handleStartSession}
              disabled={isTransitioning}
              className="rounded-full bg-white px-6 py-3 active:bg-white/80"
            >
              <Text className="font-semibold text-primary">
                {isTransitioning ? 'Starting...' : 'Start Session'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
