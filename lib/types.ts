export type UserRole = 'admin' | 'vip_user' | 'free_user';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due';
export type SubscriptionTier = 'free' | 'vip';

export interface UserProfile {
  id: string; // References auth.users(id)
  email: string;
  full_name?: string | null;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
  vip_until?: string | null;

}

export type PredictionTier = 'free' | 'vip';
export type PredictionStatus = 'pending' | 'approved' | 'rejected';
export type PredictionOutcome = 'Pending' | 'Won' | 'Lost' | 'Void';

export interface Prediction {
  id: string; // UUID
  fixture_id: string;
  home_team: string;
  away_team: string;
  home_logo?: string | null;
  away_logo?: string | null;
  league: string;
  country: string;
  match_date: string; // YYYY-MM-DD
  match_time: string; // ISO 8601
  market: string;
  odds: number;
  confidence_score: number; // 1-100
  ai_analysis: string;
  tier: PredictionTier;
  status: PredictionStatus;
  home_score?: number | null;
  away_score?: number | null;
  prediction_outcome: PredictionOutcome;
  raw_data?: any; // Live odds, bookmaker values, and match insights from API provider
  starting_at?: string;
  result?: string;

  created_at?: string;
  updated_at?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  author: string;
  cover_image?: string | null;
  published: boolean;
  category?: string | null;
  read_time?: string | null;
  created_at: string;
  updated_at?: string;
}

export type DataProviderType = 'sportsmonks' | 'the-odds-api';

export interface DataProviderSettings {
  active_provider: DataProviderType;
  sportsmonks_api_key: string;
  the_odds_api_key: string;
}
export interface LeagueOption {
  id: string;
  name: string;
  country: string;
  provider: DataProviderType;
  sport_key?: string;
  is_active?: boolean;
}

export interface SportsmonksSettings {
  api_key: string;
}

export interface PaymentGatewaySettings {
  active_provider: 'paystack' | 'stripe' | 'manual';
  stripe_public_key: string;
  stripe_secret_key: string;
  paystack_public_key: string;
  paystack_secret_key: string;
  manual_bank_details: string;
}

export interface AILLMSettings {
  active_provider: 'groq' | 'gemini';
  model: string;
  gemini_api_key: string;
  groq_api_key: string;
  system_prompt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  is_active: boolean;
  created_at?: string;
}
export interface SiteBrandingSettings {
  site_name: string;
  site_tagline?: string;
  logo_url?: string;
  favicon_url?: string;
}

export type SubscriptionReminderStage = '5_days' | '3_days' | 'exact_day' | 'manual';
export type SubscriptionReminderStatus = 'sent' | 'failed';

export interface SubscriptionReminderLog {
  id: string;
  user_id: string;
  email: string;
  stage: SubscriptionReminderStage;
  status: SubscriptionReminderStatus;
  vip_until?: string | null;
  error_message?: string | null;
  sent_at: string;
  full_name?: string | null;
}

// VIP-Exclusive Analytics
export interface FormMatch {
  opponent: string;
  is_home: boolean;
  score: string;
  result: 'W' | 'D' | 'L';
  xg: number;
  date: string;
}

export interface PlayerInjury {
  player: string;
  team: string;
  position: string;
  status: 'Out' | 'Doubtful' | 'Suspended';
  reason: string;
}

export interface MatchStatMetric {
  label: string;
  homeValue: number;
  awayValue: number;
  unit?: string;
}

export interface MatchAnalytics {
  home_form: FormMatch[];
  away_form: FormMatch[];
  h2h_matches: {
    date: string;
    home_score: number;
    away_score: number;
    winner: 'home' | 'away' | 'draw';
  }[];
  h2h_summary: {
    home_wins: number;
    draws: number;
    away_wins: number;
    total_goals: number;
  };
  injuries: PlayerInjury[];
  stats: MatchStatMetric[];
  xg_trends: {
    match_num: string;
    home_xg: number;
    away_xg: number;
  }[];
}


