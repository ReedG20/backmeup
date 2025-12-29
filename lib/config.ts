/**
 * AssemblyAI Configuration
 * 
 * API key is loaded from environment variables (.env file)
 * See .env.example for the template
 * 
 * In Expo, environment variables prefixed with EXPO_PUBLIC_ are
 * automatically made available to the app at build time.
 */
export const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY || '';

if (!ASSEMBLYAI_API_KEY) {
  console.warn(
    'AssemblyAI API key is not set!\n' +
    'Please create a .env file with EXPO_PUBLIC_ASSEMBLYAI_API_KEY\n' +
    'See .env.example for the template'
  );
}
