import { useCallback, useRef, useEffect } from 'react';
import { useAudioRecorder } from '@siteed/expo-audio-studio';

interface UseAudioRecordingOptions {
  onAudioChunk?: (audioData: ArrayBuffer) => void;
}

export function useAudioRecording({ 
  onAudioChunk,
}: UseAudioRecordingOptions = {}) {
  const onAudioChunkRef = useRef(onAudioChunk);

  // Keep the callback ref up to date
  useEffect(() => {
    onAudioChunkRef.current = onAudioChunk;
  }, [onAudioChunk]);

  // useAudioRecorder takes no config - config goes to startRecording
  const { startRecording, stopRecording, isRecording, isPaused } = useAudioRecorder();

  const handleStartRecording = useCallback(async () => {
    try {
      console.log('[Audio] Starting continuous recording...');
      
      // Config goes to startRecording, not useAudioRecorder
      await startRecording({
        sampleRate: 16000,        // Required by AssemblyAI
        channels: 1,              // Mono
        encoding: 'pcm_16bit',    // PCM16
        interval: 100,            // 100ms chunks
        onAudioStream: async (event) => {
          if (onAudioChunkRef.current && event.data) {
            try {
              const base64Data = event.data;
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              if (bytes.length > 0) {
                onAudioChunkRef.current(bytes.buffer);
                console.log(`[Audio] Sent chunk: ${bytes.length} bytes`);
              }
            } catch (error) {
              console.error('[Audio] Error processing audio stream:', error);
            }
          }
        },
      });
      
      console.log('[Audio] Recording started - streaming continuously');
      return true;
    } catch (error) {
      console.error('[Audio] Failed to start recording:', error);
      return false;
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      console.log('[Audio] Stopping recording...');
      await stopRecording();
      console.log('[Audio] Recording stopped');
    } catch (error) {
      console.error('[Audio] Failed to stop recording:', error);
    }
  }, [stopRecording]);

  const recordingState = isRecording ? 'recording' : 'idle';

  return {
    recordingState,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    isRecording,
    isPaused,
  };
}
