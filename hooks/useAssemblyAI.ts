import { useRef, useCallback, useState } from 'react';
import { ASSEMBLYAI_API_KEY } from '../lib/config';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

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

export function useAssemblyAI() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  const connect = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('[AssemblyAI] Already connected');
        resolve(true);
        return;
      }

      console.log('[AssemblyAI] Connecting to WebSocket...');
      setConnectionState('connecting');

      // WebSocket URL with turn detection parameters
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?` +
        `sample_rate=16000` +
        `&format_turns=true` +
        `&end_of_turn_confidence_threshold=0.8` +        // Higher = more confident before finalizing
        `&min_end_of_turn_silence_when_confident=500` +  // Min silence (ms) to end turn
        `&max_turn_silence=2000`;                        // Max silence (ms) before forcing turn end

      // React Native WebSocket supports headers in the second parameter
      const ws = new WebSocket(wsUrl, undefined, {
        headers: {
          Authorization: ASSEMBLYAI_API_KEY,
        },
      });
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[AssemblyAI] WebSocket connected');
        setConnectionState('connected');
        resolve(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: AssemblyAIMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'Begin':
              console.log(`[AssemblyAI] Session started: ${data.id}`);
              console.log(`[AssemblyAI] Expires at: ${data.expires_at ? new Date(data.expires_at * 1000).toISOString() : 'unknown'}`);
              break;
              
            case 'Turn':
              if (data.turn_is_formatted) {
                console.log(`[AssemblyAI] Final transcript: ${data.transcript}`);
              } else {
                console.log(`[AssemblyAI] Partial transcript: ${data.transcript}`);
              }
              break;
              
            case 'Termination':
              console.log('[AssemblyAI] Session terminated');
              console.log(`[AssemblyAI] Audio duration: ${data.audio_duration_seconds}s`);
              console.log(`[AssemblyAI] Session duration: ${data.session_duration_seconds}s`);
              break;
              
            case 'Error':
              console.error('[AssemblyAI] Error:', data.error);
              setConnectionState('error');
              break;
              
            default:
              console.log('[AssemblyAI] Unknown message type:', data);
          }
        } catch (error) {
          console.error('[AssemblyAI] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[AssemblyAI] WebSocket error:', error);
        setConnectionState('error');
        resolve(false);
      };

      ws.onclose = (event) => {
        console.log(`[AssemblyAI] WebSocket closed: ${event.code} - ${event.reason}`);
        setConnectionState('disconnected');
        wsRef.current = null;
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          console.error('[AssemblyAI] Connection timeout');
          setConnectionState('error');
          resolve(false);
        }
      }, 10000);
    });
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    }
    // Silently ignore if not connected - prevents log spam
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log('[AssemblyAI] Disconnecting...');
      
      // Send termination message
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'Terminate' }));
        } catch (error) {
          console.error('[AssemblyAI] Failed to send termination message:', error);
        }
      }
      
      wsRef.current.close();
      wsRef.current = null;
      setConnectionState('disconnected');
    }
  }, []);

  return {
    connectionState,
    connect,
    sendAudio,
    disconnect,
  };
}
