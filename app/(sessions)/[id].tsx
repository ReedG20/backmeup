import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

// Placeholder turns data
const PLACEHOLDER_TURNS = [
  { id: '1', speaker: 'Speaker A', text: 'Good morning everyone. Let\'s get started with today\'s agenda.' },
  { id: '2', speaker: 'Speaker B', text: 'Sounds good. I wanted to discuss the new feature rollout first.' },
  { id: '3', speaker: 'Speaker A', text: 'Perfect. Can you give us an overview of where we are with that?' },
  { id: '4', speaker: 'Speaker B', text: 'Sure. We\'ve completed the backend work and are now focusing on the UI components. Should be ready for testing by end of week.' },
  { id: '5', speaker: 'Speaker C', text: 'I can help with the testing once it\'s ready. I\'ll block off some time Friday.' },
  { id: '6', speaker: 'Speaker A', text: 'Great, that works. Any blockers we should be aware of?' },
];

// Placeholder AI insights
const PLACEHOLDER_INSIGHTS = [
  { id: '1', title: 'Key Decision', content: 'Feature rollout testing scheduled for Friday.' },
  { id: '2', title: 'Action Item', content: 'Speaker C to block time for testing.' },
  { id: '3', title: 'Topic Summary', content: 'Discussion focused on new feature rollout progress and timeline.' },
];

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Session',
          headerBackTitle: 'Sessions',
        }}
      />
      <ScrollView className="flex-1 bg-gray-50">
        {/* Turns Section */}
        <View className="px-4 pt-4">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Transcript
          </Text>
          <View className="overflow-hidden rounded-xl bg-white">
            {PLACEHOLDER_TURNS.map((turn, index) => (
              <View
                key={turn.id}
                className={`px-4 py-3 ${index !== PLACEHOLDER_TURNS.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <Text className="mb-1 text-sm font-semibold text-blue-600">
                  {turn.speaker}
                </Text>
                <Text className="text-base leading-relaxed text-gray-800">
                  {turn.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Insights Section */}
        <View className="px-4 pb-8 pt-6">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            AI Insights
          </Text>
          <View className="space-y-3">
            {PLACEHOLDER_INSIGHTS.map((insight) => (
              <View
                key={insight.id}
                className="rounded-xl bg-white px-4 py-3"
              >
                <Text className="mb-1 text-sm font-semibold text-purple-600">
                  {insight.title}
                </Text>
                <Text className="text-base text-gray-700">
                  {insight.content}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

