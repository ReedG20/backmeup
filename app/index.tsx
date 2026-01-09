import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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
    sendManualTurn,
  } = useRecordingSession();

  const { startRecording, stopRecording } = useAudioRecording({
    onAudioChunk: sendAudio,
  });

  const [manualTurnText, setManualTurnText] = useState('');

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

  const handleSendManualTurn = async () => {
    if (manualTurnText.trim()) {
      await sendManualTurn(manualTurnText);
      setManualTurnText('');
    }
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
          <View className="py-4">
            <Pressable
              onPress={handleEndSession}
              disabled={isTransitioning}
              className="self-start rounded-full bg-white/20 px-5 py-2"
            >
              <Text className="font-medium text-white">back</Text>
            </Pressable>
          </View>

          {error && <Text className="mb-4 text-sm text-red-300">{error}</Text>}

          <ScrollView className="mb-4 flex-1">
            {timeline.length === 0 ? (
              <Text className="text-center text-white/40">Listening... Speak to see transcript</Text>
            ) : (
              timeline.map((item, index) => (
                <View
                  key={item.type === 'turn' ? `turn-${item.data.id}` : `insight-${item.data.id}`}
                  className={index !== timeline.length - 1 ? 'mb-3' : ''}
                >
                  {item.type === 'turn' ? (
                    <Text className="text-base leading-relaxed text-white/90">
                      {item.data.transcript}
                    </Text>
                  ) : (
                    <InsightCard insight={item.data} />
                  )}
                </View>
              ))
            )}
          </ScrollView>

          <TextInput
            className="mb-4 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white"
            placeholder="Type a turn..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={manualTurnText}
            onChangeText={setManualTurnText}
            onSubmitEditing={handleSendManualTurn}
            returnKeyType="send"
          />

          <View className="pb-4">
            {Platform.OS === 'ios' ? (
              <Host style={{ height: 56 }}>
                <Button variant="borderedProminent" onPress={handleEndSession} disabled={isTransitioning}>
                  {isTransitioning ? 'Stopping...' : 'End Session'}
                </Button>
              </Host>
            ) : (
              <Pressable
                onPress={handleEndSession}
                disabled={isTransitioning}
                className="w-full rounded-full bg-white/20 px-8 py-4 active:bg-white/30"
              >
                <Text className="text-center text-lg font-semibold text-white">
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
          <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 220 }}>
            {sessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => handleSessionPress(session.id)}
                className="border-b border-white/20 py-4 active:opacity-70"
              >
                <Text className="text-base text-white">
                  {session.title || 'Untitled Session'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View className="absolute bottom-0 left-0 right-0 px-4 pb-8">
          <GlassView
            style={{
              borderRadius: 24,
              padding: 24,
              overflow: 'hidden',
            }}
            glassStyle="dark"
          >
            <Text className="text-2xl font-bold text-white">Welcome back, Reed</Text>
            <Text className="mt-1 text-base text-white/60">It's {formatDate(new Date())}</Text>
            <Text className="text-base text-white/60">Let's kill this debate</Text>

            <View className="mt-5 flex-row justify-end">
              {Platform.OS === 'ios' ? (
                <Host style={{ height: 48, minWidth: 140 }}>
                  <Button
                    variant="borderedProminent"
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
                  className="rounded-full bg-white/20 px-6 py-3 active:bg-white/30"
                >
                  <Text className="font-semibold text-white">
                    {isTransitioning ? 'Starting...' : 'Start Session'}
                  </Text>
                </Pressable>
              )}
            </View>
          </GlassView>
        </View>
      </View>
    </SafeAreaView>
  );
}
