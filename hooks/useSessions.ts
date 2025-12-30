import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '../lib/database.types';

interface UseSessionsResult {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSessions(): UseSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (fetchError) {
      console.error('[useSessions] Error fetching sessions:', fetchError);
      setError(fetchError.message);
      setSessions([]);
    } else {
      setSessions(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
}

// Helper function to format session duration
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes > 0 ? `${minutes} min` : ''}`.trim();
  }
  if (minutes > 0) {
    return `${minutes} min`;
  }
  return `${Math.round(seconds)} sec`;
}

// Helper function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

