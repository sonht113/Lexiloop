export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ReviewResult = 'forgot' | 'remembered';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          timezone?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
        };
        Update: Partial<Database['public']['Tables']['decks']['Insert']>;
      };
      words: {
        Row: {
          id: string;
          user_id: string;
          deck_id: string;
          word: string;
          meaning: string;
          example: string | null;
          note: string | null;
          phonetic: string | null;
          audio_url: string | null;
          due_at: string;
          interval_days: number;
          correct_streak: number;
          review_count: number;
          forgot_count: number;
          remembered_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          deck_id: string;
          word: string;
          meaning: string;
          example?: string | null;
          note?: string | null;
          phonetic?: string | null;
          audio_url?: string | null;
          due_at?: string;
        };
        Update: Partial<Database['public']['Tables']['words']['Insert']>;
      };
      review_logs: {
        Row: {
          id: string;
          user_id: string;
          deck_id: string;
          word_id: string;
          result: ReviewResult;
          reviewed_at: string;
        };
        Insert: {
          user_id: string;
          deck_id: string;
          word_id: string;
          result: ReviewResult;
        };
        Update: never;
      };
      reminder_settings: {
        Row: {
          user_id: string;
          enabled: boolean;
          time: string;
          repeat_days: number[];
          message: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          enabled?: boolean;
          time?: string;
          repeat_days?: number[];
          message?: string;
        };
        Update: Partial<Database['public']['Tables']['reminder_settings']['Insert']>;
      };
    };
    Functions: {
      answer_word_review: {
        Args: { p_word_id: string; p_result: ReviewResult };
        Returns: Json;
      };
    };
  };
};
