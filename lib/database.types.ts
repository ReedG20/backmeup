/**
 * Database Types
 *
 * This file contains TypeScript types for the Supabase database schema.
 * Regenerate with: supabase gen types typescript --local > lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          title: string | null;
          started_at: string;
          ended_at: string | null;
          audio_duration_seconds: number | null;
          session_duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          started_at?: string;
          ended_at?: string | null;
          audio_duration_seconds?: number | null;
          session_duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string | null;
          started_at?: string;
          ended_at?: string | null;
          audio_duration_seconds?: number | null;
          session_duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      turns: {
        Row: {
          id: string;
          session_id: string;
          transcript: string;
          turn_order: number;
          is_formatted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          transcript: string;
          turn_order: number;
          is_formatted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          transcript?: string;
          turn_order?: number;
          is_formatted?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'turns_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience types for working with tables
export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export type Turn = Database['public']['Tables']['turns']['Row'];
export type TurnInsert = Database['public']['Tables']['turns']['Insert'];
export type TurnUpdate = Database['public']['Tables']['turns']['Update'];

