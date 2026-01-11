import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface UseAuthResult {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign In Error', error.message);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (!session) {
      Alert.alert('Check your email', 'Please check your inbox for email verification!');
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign Out Error', error.message);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'myexpoapp://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert('Google Sign In Error', error.message);
        return;
      }

      if (data?.url) {
        // Open the OAuth URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'myexpoapp://auth/callback'
        );

        if (result.type === 'success' && result.url) {
          // Parse the URL to extract tokens (they may be in hash fragment or query params)
          const url = result.url;

          // Handle hash fragment (#access_token=...) - common for OAuth implicit flow
          const hashParams = url.includes('#')
            ? Object.fromEntries(new URLSearchParams(url.split('#')[1]))
            : {};

          // Handle query params (?access_token=...)
          const queryParams = url.includes('?')
            ? Object.fromEntries(new URLSearchParams(url.split('?')[1].split('#')[0]))
            : {};

          const access_token = hashParams.access_token || queryParams.access_token;
          const refresh_token = hashParams.refresh_token || queryParams.refresh_token;

          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  }, []);

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    signInWithGoogle,
  };
}
