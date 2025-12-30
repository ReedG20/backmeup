import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, Turn } from '../lib/database.types';

interface SessionWithTurns extends Session {
  turns: Turn[];
}

interface UseSessionResult {
  session: SessionWithTurns | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSession(sessionId: string | undefined): UseSessionResult {
  const [session, setSession] = useState<SessionWithTurns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('[useSession] Error fetching session:', sessionError);
      setError(sessionError.message);
      setSession(null);
      setLoading(false);
      return;
    }

    // Fetch turns for this session
    const { data: turnsData, error: turnsError } = await supabase
      .from('turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_order', { ascending: true });

    if (turnsError) {
      console.error('[useSession] Error fetching turns:', turnsError);
      setError(turnsError.message);
      setSession(null);
      setLoading(false);
      return;
    }

    setSession({
      ...sessionData,
      turns: turnsData ?? [],
    });
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, loading, error, refetch: fetchSession };
}

