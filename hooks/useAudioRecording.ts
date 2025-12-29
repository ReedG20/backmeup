import { useState, useRef, useCallback, useEffect } from 'react';
import LiveAudioStream from 'react-native-live-audio-stream';
import { Buffer } from 'buffer';
import { PermissionsAndroid, Platform } from 'react-native';

type RecordingState = 'idle' | 'recording' | 'error';

interface UseAudioRecordingOptions {
  onAudioChunk?: (audioData: ArrayBuffer) => void;
}

// Audio configuration for AssemblyAI compatibility
const AUDIO_CONFIG = {
  sampleRate: 16000,    // Required by AssemblyAI
  channels: 1,          // Mono
  bitsPerSample: 16,    // PCM16
  audioSource: 6,       // Voice recognition (Android only)
  bufferSize: 4096,     // ~256ms chunks at 16kHz mono 16-bit
};

async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('[Audio] Permission request failed:', err);
      return false;
    }
  }
  // iOS handles permission via Info.plist - the system prompts automatically
  return true;
}

export function useAudioRecording({ 
  onAudioChunk,
}: UseAudioRecordingOptions = {}) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const onAudioChunkRef = useRef(onAudioChunk);
  const isInitializedRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Keep the callback ref up to date
  useEffect(() => {
    onAudioChunkRef.current = onAudioChunk;
  }, [onAudioChunk]);

  // Initialize LiveAudioStream once
  useEffect(() => {
    if (isInitializedRef.current) return;

    console.log('[Audio] Initializing LiveAudioStream...');
    console.log(`[Audio] Config: ${JSON.stringify(AUDIO_CONFIG)}`);
    
    LiveAudioStream.init(AUDIO_CONFIG);
    isInitializedRef.current = true;

    // Set up the continuous audio data callback
    LiveAudioStream.on('data', (base64Data: string) => {
      // Only process if we're actively recording and have a callback
      if (!isRecordingRef.current || !onAudioChunkRef.current) {
        return;
      }
      
      if (!base64Data || base64Data.length === 0) {
        console.warn('[Audio] Received empty audio data');
        return;
      }

      try {
        // Convert base64 to ArrayBuffer
        const audioBuffer = Buffer.from(base64Data, 'base64');
        
        if (audioBuffer.length > 0) {
          onAudioChunkRef.current(audioBuffer.buffer);
          console.log(`[Audio] Sent chunk: ${audioBuffer.length} bytes`);
        }
      } catch (error) {
        console.error('[Audio] Error processing audio data:', error);
      }
    });

    return () => {
      // Cleanup on unmount
      isRecordingRef.current = false;
      LiveAudioStream.stop();
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log('[Audio] Requesting microphone permission...');
      const hasPermission = await requestMicrophonePermission();
      
      if (!hasPermission) {
        console.error('[Audio] Microphone permission denied');
        setRecordingState('error');
        return false;
      }
      
      console.log('[Audio] Permission granted, starting continuous recording...');
      
      // Re-initialize before starting (fixes some iOS issues)
      LiveAudioStream.init(AUDIO_CONFIG);
      
      isRecordingRef.current = true;
      LiveAudioStream.start();
      setRecordingState('recording');
      
      console.log('[Audio] Recording started - streaming continuously');
      return true;
    } catch (error) {
      console.error('[Audio] Failed to start recording:', error);
      setRecordingState('error');
      isRecordingRef.current = false;
      return false;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      console.log('[Audio] Stopping recording...');
      
      isRecordingRef.current = false;
      LiveAudioStream.stop();
      setRecordingState('idle');
      
      console.log('[Audio] Recording stopped');
    } catch (error) {
      console.error('[Audio] Failed to stop recording:', error);
      setRecordingState('error');
    }
  }, []);

  return {
    recordingState,
    startRecording,
    stopRecording,
  };
}
