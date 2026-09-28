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

