import type { Locale } from '@/lib/i18n/types';

export type UserRole = 'admin' | 'vip_user' | 'free_user';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due';
export type SubscriptionTier = 'free' | 'vip';
export type BillingInterval = 'weekly' | 'monthly' | 'yearly' | 'lifetime';
export type VipPlanTier = 'free' | 'standard' | 'gold' | 'platinum';

export interface UserProfile {
  id: string; // References auth.users(id)
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
  vip_until?: string | null;
  current_plan_id?: string | null;

}

export type PredictionTier = 'free' | 'vip';
export type PredictionStatus = 'pending' | 'approved' | 'rejected';
export type PredictionOutcome = 'Pending' | 'Won' | 'Lost' | 'Void';
export interface PredictionTranslation {
  market?: string;
  ai_analysis?: string;
  league?: string;
}

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
  translations?: Partial<Record<Locale, PredictionTranslation>>;
  raw_data?: any; // Live odds, bookmaker values, and match insights from API provider
  starting_at?: string;
  result?: string;

  created_at?: string;
  updated_at?: string;
}

export type WinningTicketStatus = 'pending' | 'approved' | 'rejected';

export interface WinningTicket {
  id: string;
  image_url: string;
  win_date: string;
  bet_date?: string | null;
  caption: string;
  status: WinningTicketStatus;
  moderation_note?: string | null;
  moderated_at?: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string | null;
  user_name?: string | null;
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
  translations?: Partial<Record<Locale, Partial<Pick<BlogPost, 'title' | 'excerpt' | 'content' | 'category'>>>>;
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

export interface ManualPaymentMethod {
  id: string;
  method_name: string;
  account_details: string;
  instructions: string;
  is_active: boolean;
  require_file_proof?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PendingSubscriptionStatus = 'pending' | 'approved' | 'rejected';

export interface PendingSubscription {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  plan_id: string;
  plan_name?: string;
  plan_price?: number;
  payment_method_used: string;
  transaction_reference: string;
  status: PendingSubscriptionStatus;
  proof_file_url?: string;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentGatewaySettings {
  active_provider: 'paystack' | 'stripe' | 'manual';
  stripe_public_key: string;
  stripe_secret_key: string;
  paystack_public_key: string;
  paystack_secret_key: string;
  manual_bank_details: string;
  manual_methods?: ManualPaymentMethod[];
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
  interval: BillingInterval;
  tier?: VipPlanTier;
  translations?: Partial<Record<Locale, { name?: string; features?: string[] }>>;
  features: string[];
  is_active: boolean;
  created_at?: string;
}

export type TestimonialStatus = 'pending' | 'approved' | 'rejected';
export interface Testimonial {
  id: string;
  user_id?: string | null;
  author_name: string;
  avatar_url?: string | null;
  role_title: string;
  content: string;
  translations?: Partial<Record<Locale, { content?: string; role_title?: string }>>;
  source_locale?: Locale;
  rating: number;
  is_featured: boolean;
  status: TestimonialStatus;
  created_at: string;
  updated_at?: string;
}

export interface AffiliateSettings {
  commission_percent: number;
  minimum_payout: number;
}

export interface AffiliateLedgerEntry {
  id: string;
  referred_user_id?: string | null;
  entry_type: 'commission' | 'adjustment' | 'reversal';
  amount: number;
  description: string;
  created_at: string;
}

export interface AffiliatePayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  payout_method: 'bank' | 'crypto';
  payout_details: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  admin_note?: string | null;
  payment_reference?: string | null;
  requested_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  user_name?: string | null;
  user_email?: string | null;
}

export interface AffiliateReferral {
  id: string;
  referred_user_id: string;
  created_at: string;
  referred_name: string;
  referred_email: string;
  current_plan_id?: string | null;
  subscription_status: SubscriptionStatus;
  commission_total: number;
}

export interface AffiliateDashboardData {
  referral_code: string;
  settings: AffiliateSettings;
  balance: number;
  available_balance: number;
  lifetime_commissions: number;
  referrals: AffiliateReferral[];
  ledger: AffiliateLedgerEntry[];
  payouts: AffiliatePayoutRequest[];
}

export type AccountModerationStatus = 'active' | 'flagged' | 'suspended' | 'banned';
export interface AccountModeration {
  user_id: string;
  status: AccountModerationStatus;
  reason?: string | null;
  previous_role?: UserRole | null;
  previous_subscription_tier?: SubscriptionTier | null;
  previous_plan_id?: string | null;
  previous_subscription_status?: SubscriptionStatus | null;
  previous_vip_until?: string | null;
  updated_at: string;
}

export interface AdminManagedUser {
  id: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  current_plan_id?: string | null;
  created_at: string;
  moderation: AccountModeration;
  referral_count: number;
}

export interface AccountAppeal {
  id: string;
  user_id: string;
  message: string;
  status: 'pending' | 'reinstated' | 'rejected';
  admin_response?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string | null;
}

export interface PolicyPage {
  slug: 'terms' | 'privacy' | 'affiliate-policy';
  title: string;
  content: string;
  translations?: Partial<Record<Locale, { title?: string; content?: string }>>;
  is_published: boolean;
  updated_at: string;
}

export interface SiteBrandingSettings {
  site_name: string;
  site_tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  hero_image_url?: string;
  hero_image_alt?: Partial<Record<Locale, string>>;
}

export interface HomepageCopy {
  eyebrow: string;
  headline: string;
  headline_highlight: string;
  description: string;
  accuracy_label: string;
  verified_label: string;
  banker_label: string;
}

export interface HomepageContent {
  translations: Partial<Record<Locale, Partial<HomepageCopy>>>;
  hero_image_url: string;
  hero_image_alt: Partial<Record<Locale, string>>;
}

export interface PageSeoMetadata {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  canonical_url?: string | null;
  open_graph_image_url?: string | null;
  no_index: boolean;
  translations?: Partial<Record<Locale, { title?: string; description?: string }>>;
  updated_at?: string;
}

export interface PromoSlot {
  id: string;
  name: string;
  placement: 'home-hero' | 'home-feed' | 'blog-sidebar' | 'pricing-banner';
  translations: Partial<Record<Locale, { title?: string; body?: string; cta?: string }>>;
  image_url?: string | null;
  target_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  sort_order: number;
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
  xg?: number;
  league?: string;
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


