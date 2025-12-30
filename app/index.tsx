import { View, Text, Pressable } from 'react-native';

export default function RecordScreen() {
  const handleStartSession = () => {
    // TODO: Start new recording session
    console.log('Starting new session...');
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="mb-12 text-4xl font-bold text-gray-900">
        New Session
      </Text>
      
      <Pressable
        onPress={handleStartSession}
        className="w-full rounded-2xl bg-blue-500 px-8 py-5 active:bg-blue-600"
      >
        <Text className="text-center text-xl font-semibold text-white">
          Start Recording
        </Text>
      </Pressable>
    </View>
  );
}
