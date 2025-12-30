import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, Turn, Insight } from '../lib/database.types';

interface SessionWithData extends Session {
  turns: Turn[];
  insights: Insight[];
}

// Timeline item types for interleaved display
export type TimelineItem =
  | { type: 'turn'; data: Turn }
  | { type: 'insight'; data: Insight };

interface UseSessionResult {
  session: SessionWithData | null;
  timeline: TimelineItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSession(sessionId: string | undefined): UseSessionResult {
  const [session, setSession] = useState<SessionWithData | null>(null);
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

    // Fetch insights for this session
    const { data: insightsData, error: insightsError } = await supabase
      .from('insights')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (insightsError) {
      console.error('[useSession] Error fetching insights:', insightsError);
      // Continue without insights rather than failing completely
    }

    setSession({
      ...sessionData,
      turns: turnsData ?? [],
      insights: insightsData ?? [],
    });
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Build timeline by interleaving turns and insights based on created_at
  const timeline = useMemo((): TimelineItem[] => {
    if (!session) return [];

    const items: TimelineItem[] = [];

    // Add all turns
    for (const turn of session.turns) {
      items.push({ type: 'turn', data: turn });
    }

    // Add all insights
    for (const insight of session.insights) {
      items.push({ type: 'insight', data: insight });
    }

    // Sort by created_at timestamp
    items.sort((a, b) => {
      const aTime = new Date(a.data.created_at).getTime();
      const bTime = new Date(b.data.created_at).getTime();
      return aTime - bTime;
    });

    return items;
  }, [session]);

  return { session, timeline, loading, error, refetch: fetchSession };
}
