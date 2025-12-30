import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecordingSession } from '../hooks/useRecordingSession';
import { useAudioRecording } from '../hooks/useAudioRecording';

export default function RecordScreen() {
  const router = useRouter();
  const { state, currentSession, turns, error, startSession, endSession, sendAudio } =
    useRecordingSession();

  const { startRecording, stopRecording } = useAudioRecording({
    onAudioChunk: sendAudio,
  });

  const handleStartSession = async () => {
    const sessionId = await startSession();
    if (sessionId) {
      console.log('Session started:', sessionId);
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
    <View className="flex-1 bg-white">
      {/* Header area */}
      <View className="items-center px-8 pt-16">
        <Text className="text-4xl font-bold text-gray-900">
          {isRecording ? 'Recording' : 'New Session'}
        </Text>
        {currentSession && (
          <Text className="mt-2 text-sm text-gray-500">
            Session ID: {currentSession.id.slice(0, 8)}...
          </Text>
        )}
        {error && <Text className="mt-2 text-sm text-red-500">{error}</Text>}
      </View>

      {/* Live transcript area */}
      {isRecording && (
        <ScrollView className="mx-4 my-6 flex-1 rounded-xl bg-gray-50 p-4">
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
      )}

      {/* Button area - centered when not recording */}
      <View className={`px-8 ${isRecording ? 'pb-12' : 'flex-1 justify-center'}`}>
        {!isRecording ? (
          <Pressable
            onPress={handleStartSession}
            disabled={isTransitioning}
            className={`w-full rounded-2xl px-8 py-5 ${
              isTransitioning ? 'bg-gray-400' : 'bg-blue-500 active:bg-blue-600'
            }`}
          >
            <Text className="text-center text-xl font-semibold text-white">
              {isTransitioning ? 'Starting...' : 'Start Recording'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleEndSession}
            disabled={isTransitioning}
            className={`w-full rounded-2xl px-8 py-5 ${
              isTransitioning ? 'bg-gray-400' : 'bg-red-500 active:bg-red-600'
            }`}
          >
            <Text className="text-center text-xl font-semibold text-white">
              {isTransitioning ? 'Stopping...' : 'Stop Recording'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
