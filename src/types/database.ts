export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ReviewResult = 'forgot' | 'soon' | 'remembered';

export type AnswerWordReviewResponse = {
  ok: true;
  word_id: string;
  result: ReviewResult;
  interval_days: number;
  previous_correct_streak: number;
  correct_streak: number;
  was_mastered: boolean;
  is_mastered: boolean;
  newly_mastered: boolean;
};

export type WordExampleInput = {
  sentence?: string;
  translation?: string | null;
};

export type WordMutationInput = {
  deck_id: string;
  word: string;
  meaning: string;
  examples?: WordExampleInput[];
  note?: string | null;
  phonetic?: string | null;
  audio_url?: string | null;
};

export type LeaderboardMetric = 'mastered' | 'words';

export type LeaderboardPeriod = 'all_time' | 'week' | 'month';

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_words: number;
  mastered_words: number;
  total_reviews: number;
  period_reviews: number;
  period_start: string | null;
  period_end: string | null;
  current_streak: number;
  is_current_user: boolean;
};

export type DailyLearningPlanAction = 'review_due' | 'learn_new' | 'practice_weak' | 'done';

export type ReviewForecastPeriod = 'today' | 'tomorrow' | 'next_7_days';

export type DailyLearningPlan = {
  username: string;
  due_count: number;
  available_new_words: number;
  available_weak_words: number;
  daily_new_words_limit: number;
  daily_weak_words_limit: number;
  daily_review_target: number;
  reviewed_today: number;
  total_words: number;
  mastered_words: number;
  current_streak: number;
  remaining_today: number;
  completion_percent: number;
  next_recommended_action: DailyLearningPlanAction;
};

export type ReviewForecastRow = {
  period: ReviewForecastPeriod;
  label: string;
  review_count: number;
  start_date: string;
  end_date: string;
};

export type WeakWordRow = {
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
  soon_count: number;
  remembered_count: number;
  created_at: string;
  updated_at: string;
  weak_score: number;
  decks: Json;
  word_examples: Json;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          timezone: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          timezone?: string;
          avatar_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
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
        Relationships: [];
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
          soon_count: number;
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
        Relationships: [
          {
            foreignKeyName: 'words_deck_id_fkey';
            columns: ['deck_id'];
            isOneToOne: false;
            referencedRelation: 'decks';
            referencedColumns: ['id'];
          },
        ];
      };
      word_examples: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          sentence: string;
          translation: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          word_id: string;
          sentence: string;
          translation?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['word_examples']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'word_examples_word_id_fkey';
            columns: ['word_id'];
            isOneToOne: false;
            referencedRelation: 'words';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'review_logs_deck_id_fkey';
            columns: ['deck_id'];
            isOneToOne: false;
            referencedRelation: 'decks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_logs_word_id_fkey';
            columns: ['word_id'];
            isOneToOne: false;
            referencedRelation: 'words';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [];
      };
      learning_settings: {
        Row: {
          user_id: string;
          daily_new_words_limit: number;
          daily_weak_words_limit: number;
          daily_review_target: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          daily_new_words_limit?: number;
          daily_weak_words_limit?: number;
          daily_review_target?: number;
        };
        Update: Partial<Database['public']['Tables']['learning_settings']['Insert']>;
        Relationships: [];
      };
      reminder_push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'android' | 'ios' | 'web' | 'unknown';
          device_id: string | null;
          enabled: boolean;
          last_registered_at: string;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          platform: 'android' | 'ios' | 'web' | 'unknown';
          device_id?: string | null;
          enabled?: boolean;
          last_registered_at?: string;
          last_error?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reminder_push_tokens']['Insert']>;
        Relationships: [];
      };
      reminder_push_delivery_log: {
        Row: {
          user_id: string;
          reminder_date: string;
          reminder_time: string;
          status: 'processing' | 'sent' | 'failed';
          sent_count: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          reminder_date: string;
          reminder_time: string;
          status?: 'processing' | 'sent' | 'failed';
          sent_count?: number;
          error_message?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reminder_push_delivery_log']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_profile_stats: {
        Args: Record<string, never>;
        Returns: {
          due_count: number;
          total_words: number;
          mastered_words: number;
          total_reviews: number;
          reviewed_today: number;
          accuracy: number | null;
          current_streak: number;
        };
      };
      get_daily_learning_plan: {
        Args: Record<string, never>;
        Returns: DailyLearningPlan;
      };
      get_weak_words: {
        Args: { p_limit?: number; p_deck_id?: string | null };
        Returns: WeakWordRow[];
      };
      get_review_forecast: {
        Args: Record<string, never>;
        Returns: ReviewForecastRow[];
      };
      get_decks_with_stats: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
          word_count: number;
          due_count: number;
          mastered_count: number;
          mastery_percent: number;
        }[];
      };
      ensure_default_deck: {
        Args: { p_user_id: string };
        Returns: void;
      };
      answer_word_review: {
        Args: { p_word_id: string; p_result: ReviewResult };
        Returns: AnswerWordReviewResponse;
      };
      create_word_with_examples: {
        Args: { p_input: WordMutationInput };
        Returns: Database['public']['Tables']['words']['Row'];
      };
      update_word_with_examples: {
        Args: { p_word_id: string; p_input: WordMutationInput };
        Returns: Database['public']['Tables']['words']['Row'];
      };
      get_leaderboard: {
        Args: { p_metric?: LeaderboardMetric; p_period?: LeaderboardPeriod; p_limit?: number };
        Returns: LeaderboardRow[];
      };
    };
  };
};
