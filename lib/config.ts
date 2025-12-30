/**
 * Environment Configuration
 *
 * All configuration is loaded from environment variables (.env file)
 * See .env.example for the template
 *
 * In Expo, environment variables prefixed with EXPO_PUBLIC_ are
 * automatically made available to the app at build time.
 */

// AssemblyAI Configuration
export const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY || '';

if (!ASSEMBLYAI_API_KEY) {
  console.warn(
    'AssemblyAI API key is not set!\n' +
      'Please create a .env file with EXPO_PUBLIC_ASSEMBLYAI_API_KEY\n' +
      'See .env.example for the template'
  );
}

// Supabase Configuration
// Local development defaults to the standard Supabase local dev server
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase anon key is not set!\n' +
      'Run `supabase start` and copy the anon key to your .env file\n' +
      'See .env.example for the template'
  );
}
