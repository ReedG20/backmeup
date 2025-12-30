import { useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ASSEMBLYAI_API_KEY } from '../lib/config';
import type { Session, Turn } from '../lib/database.types';

type RecordingState = 'idle' | 'starting' | 'recording' | 'stopping' | 'error';

interface AssemblyAIMessage {
  type: 'Begin' | 'Turn' | 'Termination' | 'Error';
  id?: string;
  expires_at?: number;
  transcript?: string;
  turn_is_formatted?: boolean;
  audio_duration_seconds?: number;
  session_duration_seconds?: number;
  error?: string;
}

interface UseRecordingSessionResult {
  state: RecordingState;
  currentSession: Session | null;
  turns: Turn[];
  error: string | null;
  startSession: (title?: string) => Promise<string | null>;
  endSession: () => Promise<void>;
  sendAudio: (audioData: ArrayBuffer) => void;
}

export function useRecordingSession(): UseRecordingSessionResult {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<RecordingState>('idle');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const turnCountRef = useRef(0);

  const startSession = useCallback(async (title?: string): Promise<string | null> => {
    setState('starting');
    setError(null);
    setTurns([]);
    turnCountRef.current = 0;

    // Create session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        title: title || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      console.error('[RecordingSession] Failed to create session:', sessionError);
      setError(sessionError?.message || 'Failed to create session');
      setState('error');
      return null;
    }

    setCurrentSession(sessionData);
    console.log('[RecordingSession] Created session:', sessionData.id);

    // Connect to AssemblyAI WebSocket
    const wsUrl =
      `wss://streaming.assemblyai.com/v3/ws?` +
      `sample_rate=16000` +
      `&format_turns=true`;

    const ws = new WebSocket(wsUrl, undefined, {
      headers: {
        Authorization: ASSEMBLYAI_API_KEY,
      },
    });
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[RecordingSession] WebSocket connected');
      setState('recording');
    };

    ws.onmessage = async (event) => {
      try {
        const data: AssemblyAIMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'Begin':
            console.log(`[RecordingSession] AssemblyAI session started: ${data.id}`);
            break;

          case 'Turn':
            if (data.turn_is_formatted && data.transcript) {
              console.log(`[RecordingSession] Final transcript: ${data.transcript}`);

              // Save turn to database
              turnCountRef.current += 1;
              const { data: turnData, error: turnError } = await supabase
                .from('turns')
                .insert({
                  session_id: sessionData.id,
                  transcript: data.transcript,
                  turn_order: turnCountRef.current,
                  is_formatted: true,
                })
                .select()
                .single();

              if (turnError) {
                console.error('[RecordingSession] Failed to save turn:', turnError);
              } else if (turnData) {
                setTurns((prev) => [...prev, turnData]);
              }
            }
            break;

          case 'Termination':
            console.log('[RecordingSession] AssemblyAI session terminated');
            // Update session with duration info
            await supabase
              .from('sessions')
              .update({
                ended_at: new Date().toISOString(),
                audio_duration_seconds: data.audio_duration_seconds,
                session_duration_seconds: data.session_duration_seconds,
              })
              .eq('id', sessionData.id);
            break;

          case 'Error':
            console.error('[RecordingSession] AssemblyAI error:', data.error);
            setError(data.error || 'Transcription error');
            break;
        }
      } catch (err) {
        console.error('[RecordingSession] Failed to parse message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[RecordingSession] WebSocket error:', err);
      setError('WebSocket connection failed');
      setState('error');
    };

    ws.onclose = () => {
      console.log('[RecordingSession] WebSocket closed');
      wsRef.current = null;
    };

    return sessionData.id;
  }, []);

  const endSession = useCallback(async () => {
    setState('stopping');

    // Send termination to AssemblyAI
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'Terminate' }));
      } catch (err) {
        console.error('[RecordingSession] Failed to send termination:', err);
      }
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Update session end time if we have a current session
    if (currentSession) {
      await supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentSession.id);
    }

    setState('idle');
    setCurrentSession(null);
  }, [currentSession]);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    }
  }, []);

  return {
    state,
    currentSession,
    turns,
    error,
    startSession,
    endSession,
    sendAudio,
  };
}

