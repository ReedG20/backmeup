import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { useAssemblyAI } from '../hooks/useAssemblyAI';
import { useAudioRecording } from '../hooks/useAudioRecording';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  
  const { connectionState, connect, sendAudio, disconnect } = useAssemblyAI();
  
  const { recordingState, startRecording, stopRecording } = useAudioRecording({
    onAudioChunk: (audioData) => {
      sendAudio(audioData);
    },
  });

  const handleRecordPress = async () => {
    if (isRecording) {
      // Stop recording
      console.log('[App] Stopping recording...');
      await stopRecording();
      disconnect();
      setIsRecording(false);
    } else {
      // Start recording
      console.log('[App] Starting recording...');
      setIsRecording(true);
      connect();
      await startRecording();
    }
  };

  const getStatusText = () => {
    if (isRecording) {
      if (connectionState === 'connecting') return 'Connecting...';
      if (connectionState === 'connected' && recordingState === 'recording') return 'Recording...';
      if (connectionState === 'error' || recordingState === 'error') return 'Error';
      return 'Starting...';
    }
    return 'Ready';
  };

  const getStatusColor = () => {
    if (isRecording) {
      if (connectionState === 'error' || recordingState === 'error') return 'text-red-600';
      if (connectionState === 'connected' && recordingState === 'recording') return 'text-green-600';
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  };

  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <View className="items-center space-y-6">
        <Text className="text-3xl font-bold text-gray-900">Record</Text>
        
        <Text className={`text-lg font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </Text>

        <Pressable
          onPress={handleRecordPress}
          className={`rounded-full px-8 py-4 ${
            isRecording ? 'bg-red-500' : 'bg-blue-500'
          } active:opacity-70`}
        >
          <Text className="text-xl font-semibold text-white">
            {isRecording ? 'Stop' : 'Start Recording'}
          </Text>
        </Pressable>

        <View className="mt-8 rounded-lg bg-gray-100 p-4">
          <Text className="text-sm text-gray-700 text-center">
            Transcription will appear in the console logs.
          </Text>
          <Text className="mt-2 text-xs text-gray-500 text-center">
            Check your development console to see real-time transcription.
          </Text>
        </View>
      </View>
    </View>
  );
}
