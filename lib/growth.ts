import { createAdminClient } from '@/utils/supabase/admin';
import {
  AccountAppeal,
  AccountModeration,
  AdminManagedUser,
  AffiliateDashboardData,
  AffiliateLedgerEntry,
  AffiliatePayoutRequest,
  AffiliateReferral,
  AffiliateSettings,
  PolicyPage,
  Testimonial,
  UserProfile,
} from '@/lib/types';

const EMPTY_AFFILIATE_SETTINGS: AffiliateSettings = { commission_percent: 15, minimum_payout: 20 };

function maskEmail(email?: string | null) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  return domain ? `${local.slice(0, 1)}***@${domain}` : 'Member';
}

export async function getApprovedTestimonials(featuredOnly = false, locale: import('@/lib/i18n/types').Locale = 'en'): Promise<Testimonial[]> {
  const supabase = createAdminClient();
  let query = supabase.from('testimonials').select('*').eq('status', 'approved');
  if (featuredOnly) query = query.eq('is_featured', true);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Testimonial[]).map((item) => ({
    ...item,
    content: item.translations?.[locale]?.content || item.content,
    role_title: item.translations?.[locale]?.role_title || item.role_title,
  }));
}

export async function getAdminTestimonials(): Promise<Testimonial[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  return error ? [] : (data as Testimonial[]) || [];
}

export async function getAffiliateDashboard(userId: string): Promise<AffiliateDashboardData> {
  const supabase = createAdminClient();
  const { data: existingCode } = await supabase.from('affiliate_profiles').select('referral_code').eq('user_id', userId).maybeSingle();
  let referralCode = existingCode?.referral_code as string | undefined;

  if (!referralCode) {
    referralCode = crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
    const { error } = await supabase.from('affiliate_profiles').upsert({ user_id: userId, referral_code: referralCode }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (error) {
      const { data: racedCode } = await supabase.from('affiliate_profiles').select('referral_code').eq('user_id', userId).maybeSingle();
      referralCode = racedCode?.referral_code as string | undefined;
    }
  }

  const [settingsResult, attributionsResult, ledgerResult, payoutsResult] = await Promise.all([
    supabase.from('affiliate_settings').select('commission_percent, minimum_payout').eq('id', true).maybeSingle(),
    supabase.from('referral_attributions').select('id, referred_user_id, created_at').eq('referrer_id', userId).order('created_at', { ascending: false }),
    supabase.from('affiliate_ledger').select('id, referred_user_id, entry_type, amount, description, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('affiliate_payout_requests').select('*').eq('user_id', userId).order('requested_at', { ascending: false }),
  ]);

  const attributions = attributionsResult.data || [];
  const referredIds = attributions.map((row) => row.referred_user_id);
  const [profilesResult, commissionRowsResult] = referredIds.length
    ? await Promise.all([
        supabase.from('profiles').select('id, email, full_name, subscription_status, current_plan_id').in('id', referredIds),
        supabase.from('affiliate_ledger').select('referred_user_id, amount').eq('user_id', userId).eq('entry_type', 'commission').in('referred_user_id', referredIds),
      ])
    : [{ data: [] }, { data: [] }];

  const commissionByReferral = new Map<string, number>();
  for (const row of commissionRowsResult.data || []) {
    if (row.referred_user_id) commissionByReferral.set(row.referred_user_id, (commissionByReferral.get(row.referred_user_id) || 0) + Number(row.amount));
  }
  const profileById = new Map((profilesResult.data || []).map((row) => [row.id, row]));
  const referrals: AffiliateReferral[] = attributions.map((row) => {
    const profile = profileById.get(row.referred_user_id);
    return {
      id: row.id,
      referred_user_id: row.referred_user_id,
      created_at: row.created_at,
      referred_name: profile?.full_name || 'Member',
      referred_email: maskEmail(profile?.email),
      current_plan_id: profile?.current_plan_id,
      subscription_status: profile?.subscription_status || 'inactive',
      commission_total: commissionByReferral.get(row.referred_user_id) || 0,
    };
  });

  const ledger = (ledgerResult.data || []) as AffiliateLedgerEntry[];
  const payouts = (payoutsResult.data || []) as AffiliatePayoutRequest[];
  const balance = ledger.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const reserved = payouts.filter((item) => item.status === 'pending' || item.status === 'approved' || item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    referral_code: referralCode || '',
    settings: (settingsResult.data as AffiliateSettings) || EMPTY_AFFILIATE_SETTINGS,
    balance,
    available_balance: Math.max(0, balance - reserved),
    lifetime_commissions: ledger.filter((item) => item.entry_type === 'commission').reduce((sum, entry) => sum + Number(entry.amount), 0),
    referrals,
    ledger,
    payouts,
  };
}

export async function getAdminAffiliateData(): Promise<{ settings: AffiliateSettings; payouts: AffiliatePayoutRequest[] }> {
  const supabase = createAdminClient();
  const [settingsResult, payoutsResult] = await Promise.all([
    supabase.from('affiliate_settings').select('commission_percent, minimum_payout').eq('id', true).maybeSingle(),
    supabase.from('affiliate_payout_requests').select('*, profiles:profiles!affiliate_payout_requests_user_id_fkey(email, full_name)').order('requested_at', { ascending: false }),
  ]);
  const payouts = (payoutsResult.data || []).map((row) => ({
    ...row,
    user_email: row.profiles?.email || '',
    user_name: row.profiles?.full_name || null,
  })) as AffiliatePayoutRequest[];
  return { settings: (settingsResult.data as AffiliateSettings) || EMPTY_AFFILIATE_SETTINGS, payouts };
}

export async function getAdminUsers(): Promise<AdminManagedUser[]> {
  const supabase = createAdminClient();
  const [profilesResult, moderationResult, referralsResult] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, role, subscription_status, current_plan_id, created_at').order('created_at', { ascending: false }),
    supabase.from('account_moderation').select('*'),
    supabase.from('referral_attributions').select('referrer_id'),
  ]);
  const moderationByUser = new Map((moderationResult.data || []).map((row) => [row.user_id, row as AccountModeration]));
  const referralsByUser = new Map<string, number>();
  for (const row of referralsResult.data || []) referralsByUser.set(row.referrer_id, (referralsByUser.get(row.referrer_id) || 0) + 1);
  return (profilesResult.data || []).map((profile) => ({
    ...profile,
    moderation: moderationByUser.get(profile.id) || { user_id: profile.id, status: 'active' as const, updated_at: profile.created_at },
    referral_count: referralsByUser.get(profile.id) || 0,
  })) as AdminManagedUser[];
}

export async function getUserModeration(userId: string): Promise<AccountModeration | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from('account_moderation').select('*').eq('user_id', userId).maybeSingle();
  return (data as AccountModeration) || null;
}

export async function getAdminAppeals(): Promise<AccountAppeal[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('account_appeals')
    .select('*, profiles:profiles!account_appeals_user_id_fkey(email, full_name)')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({ ...row, user_email: row.profiles?.email || '', user_name: row.profiles?.full_name || null })) as AccountAppeal[];
}

export async function getUserAppeals(userId: string): Promise<AccountAppeal[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('account_appeals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return error ? [] : (data as AccountAppeal[]) || [];
}

export async function getPolicyPage(slug: PolicyPage['slug'], locale: import('@/lib/i18n/types').Locale = 'en'): Promise<PolicyPage | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('policy_pages').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
  if (error || !data) return null;
  const page = data as PolicyPage;
  const translation = page.translations?.[locale];
  return { ...page, title: translation?.title || page.title, content: translation?.content || page.content };
}

export async function getAdminPolicyPages(): Promise<PolicyPage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('policy_pages').select('*').order('slug');
  return error ? [] : (data as PolicyPage[]) || [];
}

export function hasActiveVipMembership(profile: Pick<UserProfile, 'role' | 'subscription_status' | 'vip_until'>) {
  return profile.role === 'vip_user' && profile.subscription_status === 'active' &&
    (!profile.vip_until || new Date(profile.vip_until).getTime() > Date.now());
}