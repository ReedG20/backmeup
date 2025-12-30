import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PlayIcon } from '@hugeicons/core-free-icons';
import * as Notifications from 'expo-notifications';
import { useRecordingSession } from '../hooks/useRecordingSession';
import { useAudioRecording } from '../hooks/useAudioRecording';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RecordScreen() {
  const router = useRouter();
  const { state, currentSession, turns, error, startSession, endSession, sendAudio } =
    useRecordingSession();

  const { startRecording, stopRecording } = useAudioRecording({
    onAudioChunk: sendAudio,
  });

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  const handleStartSession = async () => {
    const sessionId = await startSession();
    if (sessionId) {
      console.log('Session started:', sessionId);

      // Show notification that session has started
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Session Started',
          body: 'Your recording session is now active.',
        },
        trigger: null,
      });

      // Start audio recording after session is created
      await startRecording();
    }
  };

  const handleEndSession = async () => {
    // Stop audio recording first
    await stopRecording();
    // Then end the session
    await endSession();
    // Navigate to sessions list after ending
    router.push('/(sessions)');
  };

  const isRecording = state === 'recording';
  const isTransitioning = state === 'starting' || state === 'stopping';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-8 pb-24">
        {/* Header area */}
        <View className="pt-8 pb-8">
          <Text className="text-3xl font-bold text-gray-900">
            {isRecording ? 'Recording' : 'Welcome back, Reed'}
          </Text>
          {currentSession && isRecording && (
            <Text className="mt-2 text-sm text-gray-500">
              Session ID: {currentSession.id.slice(0, 8)}...
            </Text>
          )}
          {error && <Text className="mt-2 text-sm text-red-500">{error}</Text>}
        </View>

        {/* Content area */}
        <View className="flex-1">
          {/* Live transcript area */}
          {isRecording ? (
            <>
              <ScrollView className="flex-1 mb-6 rounded-xl bg-gray-50 p-4">
                {turns.length === 0 ? (
                  <Text className="text-center text-gray-400">
                    Listening... Speak to see transcript
                  </Text>
                ) : (
                  turns.map((turn, index) => (
                    <View
                      key={turn.id}
                      className={`py-2 ${index !== turns.length - 1 ? 'border-b border-gray-200' : ''}`}
                    >
                      <Text className="text-base leading-relaxed text-gray-800">
                        {turn.transcript}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
              
              <View className="pb-4">
                <Pressable
                  onPress={handleEndSession}
                  disabled={isTransitioning}
                  className={`w-full rounded-full px-8 py-5 ${
                    isTransitioning ? 'bg-gray-400' : 'bg-red-500 active:bg-red-600'
                  }`}
                >
                  <Text className="text-center text-xl font-semibold text-white">
                    {isTransitioning ? 'Stopping...' : 'Stop Recording'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View>
              <Pressable
                onPress={handleStartSession}
                disabled={isTransitioning}
                className={`w-full flex-row items-center justify-center rounded-full px-8 py-5 ${
                  isTransitioning ? 'bg-gray-400' : 'bg-[#4b04ff]'
                }`}
              >
                {!isTransitioning && <HugeiconsIcon icon={PlayIcon} size={24} color="white" strokeWidth={2} />}
                <Text className="text-center text-xl font-semibold text-white ml-3">
                  {isTransitioning ? 'Starting...' : 'Start Session'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
