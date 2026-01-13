import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import BackMeUpLogo from '../assets/backmeup-logo';

type AuthMode = 'signin' | 'signup';

export default function Auth() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-12">
            {/* Logo */}
            <View className="mb-12 items-center">
              <BackMeUpLogo width={180} height={35} color="#fff" />
            </View>

            {/* Header */}
            <Text className="mb-2 text-3xl font-bold text-white">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text className="mb-8 text-lg text-white/60">
              {mode === 'signin'
                ? 'Sign in to continue to your sessions'
                : 'Sign up to start recording sessions'}
            </Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-white/80">Email</Text>
              <TextInput
                className="rounded-xl bg-white/10 px-4 py-4 text-base text-white"
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-white/80">Password</Text>
              <TextInput
                className="rounded-xl bg-white/10 px-4 py-4 text-base text-white"
                placeholder="Your password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !email || !password}
              className={`mb-4 rounded-xl py-4 ${
                loading || !email || !password ? 'bg-white/50' : 'bg-white active:bg-white/90'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#3A20E3" />
              ) : (
                <Text className="text-center text-base font-semibold text-primary">
                  {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </Pressable>

            {/* Divider */}
            <View className="my-6 flex-row items-center">
              <View className="h-px flex-1 bg-white/20" />
              <Text className="mx-4 text-sm text-white/40">or continue with</Text>
              <View className="h-px flex-1 bg-white/20" />
            </View>

            {/* Social Auth Button */}
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={loading}
              className="mb-6 flex-row items-center justify-center rounded-xl bg-white/10 py-4 active:bg-white/20"
            >
              <Text className="text-2xl">G</Text>
              <Text className="ml-2 font-medium text-white">Google</Text>
            </Pressable>

            {/* Toggle Mode */}
            <View className="flex-row justify-center">
              <Text className="text-white/60">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                <Text className="font-semibold text-white">
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
