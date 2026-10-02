'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { AccountModerationStatus, PolicyPage } from '@/lib/types';

async function requireAdmin() {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== 'admin') throw new Error('Admin privileges required.');
  return user;
}

export async function submitTestimonialAction(formData: FormData) {
  const { user, profile } = await getCurrentUser();
  if (!user || !profile) return { success: false, error: 'Sign in to submit a testimonial.' };
  const content = String(formData.get('content') || '').trim();
  const rating = Number(formData.get('rating'));
  const publicConsent = formData.get('public_consent') === 'true';
  const authorName = (profile.full_name || profile.email.split('@')[0]).trim().slice(0, 80);
  if (content.length < 20 || content.length > 1500) return { success: false, error: 'Review must be 20 to 1,500 characters.' };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { success: false, error: 'Choose a rating from 1 to 5.' };
  if (!publicConsent) return { success: false, error: 'Consent is required before a review can be published.' };

  const supabase = createAdminClient();
  const { error } = await supabase.from('testimonials').insert({
    user_id: user.id,
    author_name: authorName,
    role_title: 'SabiPredict Member',
    content,
    rating,
    is_featured: false,
    status: 'pending',
  });
  if (error) return { success: false, error: 'Your review could not be submitted. Please try again.' };
  revalidatePath('/testimonials');
  revalidatePath('/');
  return { success: true };
}

export async function updateTestimonialAction(input: {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  content: string;
}) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(input.id) || input.content.length < 20 || input.content.length > 1500) {
    return { success: false, error: 'Invalid testimonial.' };
  }
  const featured = input.status === 'approved' && input.is_featured;
  const supabase = createAdminClient();
  const { error } = await supabase.from('testimonials').update({
    status: input.status,
    is_featured: featured,
    content: input.content.trim(),
    updated_at: new Date().toISOString(),
  }).eq('id', input.id);
  if (error) return { success: false, error: 'Testimonial could not be updated.' };
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/testimonials');
  return { success: true, is_featured: featured };
}

export async function deleteTestimonialAction(id: string) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { success: false, error: 'Invalid testimonial.' };
  const supabase = createAdminClient();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/testimonials');
  return { success: !error, error: error?.message };
}

export async function requestAffiliatePayoutAction(input: {
  amount: number;
  method: 'bank' | 'crypto';
  details: string;
}) {
  const { user, profile } = await getCurrentUser();
  if (!user || !profile) return { success: false, error: 'Sign in to request a payout.' };
  if (profile.role !== 'vip_user' || profile.subscription_status !== 'active') {
    return { success: false, error: 'An active VIP subscription is required to use the affiliate program.' };
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0 || !['bank', 'crypto'].includes(input.method) || input.details.trim().length < 5) {
    return { success: false, error: 'Check the payout amount and payment details.' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc('request_affiliate_payout', {
    p_user_id: user.id,
    p_amount: Math.round(input.amount * 100) / 100,
    p_method: input.method,
    p_details: input.details.trim(),
  });
  if (error) return { success: false, error: error.message };
  revalidatePath('/vip/affiliate');
  revalidatePath('/admin');
  return { success: true };
}

export async function saveAffiliateSettingsAction(input: { commission_percent: number; minimum_payout: number }) {
  const admin = await requireAdmin();
  if (!Number.isFinite(input.commission_percent) || input.commission_percent < 0 || input.commission_percent > 20 ||
      !Number.isFinite(input.minimum_payout) || input.minimum_payout < 0 || input.minimum_payout > 100000) {
    return { success: false, error: 'Commission must be 0–20%, and the minimum payout must be non-negative.' };
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from('affiliate_settings').upsert({
    id: true,
    commission_percent: input.commission_percent,
    minimum_payout: input.minimum_payout,
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  });
  revalidatePath('/admin');
  revalidatePath('/vip/affiliate');
  return { success: !error, error: error?.message };
}

export async function resolveAffiliatePayoutAction(input: {
  id: string;
  status: 'approved' | 'rejected' | 'paid';
  note?: string;
  paymentReference?: string;
}) {
  const admin = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(input.id) || (input.note?.length || 0) > 1000 || (input.paymentReference?.length || 0) > 120) {
    return { success: false, error: 'Invalid payout update.' };
  }
  if (input.status === 'paid' && !input.paymentReference?.trim()) {
    return { success: false, error: 'A transfer reference is required before marking a payout paid.' };
  }
  const expectedStatus = input.status === 'paid' ? 'approved' : 'pending';
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('affiliate_payout_requests').update({
    status: input.status,
    admin_note: input.note?.trim() || null,
    payment_reference: input.paymentReference?.trim() || null,
    resolved_by: admin.id,
    resolved_at: new Date().toISOString(),
  }).eq('id', input.id).eq('status', expectedStatus).select('id').maybeSingle();
  if (error || !data) return { success: false, error: 'Payout status changed or request not found. Refresh and try again.' };
  revalidatePath('/admin');
  revalidatePath('/vip/affiliate');
  return { success: true };
}

export async function updateAccountModerationAction(input: {
  userId: string;
  status: AccountModerationStatus;
  reason: string;
}) {
  const adminUser = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(input.userId) || !['active', 'flagged', 'suspended', 'banned'].includes(input.status) || input.reason.length > 1000) {
    return { success: false, error: 'Invalid account moderation update.' };
  }
  if (input.userId === adminUser.id) return { success: false, error: 'You cannot restrict your own admin account.' };

  const supabase = createAdminClient();
  const [{ data: priorModeration }, { data: account }] = await Promise.all([
    supabase.from('account_moderation').select('*').eq('user_id', input.userId).maybeSingle(),
    supabase.from('profiles').select('role, subscription_tier, subscription_status, current_plan_id, vip_until').eq('id', input.userId).maybeSingle(),
  ]);
  if (!account) return { success: false, error: 'Account not found.' };

  const wasRestricted = priorModeration?.status === 'suspended' || priorModeration?.status === 'banned';
  const isBeingRestricted = input.status === 'suspended' || input.status === 'banned';
  const moderationPayload: Record<string, string | null> = {
    user_id: input.userId,
    status: input.status,
    reason: input.reason.trim() || null,
    updated_by: adminUser.id,
    updated_at: new Date().toISOString(),
  };
  if (isBeingRestricted && !wasRestricted) {
    moderationPayload.previous_role = account.role;
    moderationPayload.previous_subscription_tier = account.subscription_tier;
    moderationPayload.previous_plan_id = account.current_plan_id || null;
    moderationPayload.previous_subscription_status = account.subscription_status;
    moderationPayload.previous_vip_until = account.vip_until || null;
  } else if (input.status === 'active' && wasRestricted) {
    moderationPayload.previous_plan_id = null;
    moderationPayload.previous_subscription_status = null;
    moderationPayload.previous_vip_until = null;
  }
  const { error } = await supabase.from('account_moderation').upsert({
    ...priorModeration,
    ...moderationPayload,
  });
  if (error) return { success: false, error: 'Account status could not be updated.' };

  if (isBeingRestricted) {
    await supabase.from('profiles').update({
      role: 'free_user',
      subscription_tier: 'free',
      subscription_status: 'canceled',
      current_plan_id: null,
      vip_until: null,
      updated_at: new Date().toISOString(),
    }).eq('id', input.userId);
  } else if (input.status === 'active' && wasRestricted) {
    const restoreVip = priorModeration?.previous_role === 'vip_user' &&
      priorModeration.previous_subscription_status === 'active' &&
      (!priorModeration.previous_vip_until || new Date(priorModeration.previous_vip_until).getTime() > Date.now());
    await supabase.from('profiles').update({
      role: restoreVip ? 'vip_user' : priorModeration?.previous_role || 'free_user',
      subscription_tier: restoreVip ? 'vip' : priorModeration?.previous_subscription_tier || 'free',
      subscription_status: restoreVip ? 'active' : priorModeration?.previous_subscription_status || 'inactive',
      current_plan_id: restoreVip ? priorModeration?.previous_plan_id || null : null,
      vip_until: restoreVip ? priorModeration?.previous_vip_until || null : null,
      updated_at: new Date().toISOString(),
    }).eq('id', input.userId);
  }
  revalidatePath('/admin/users');
  revalidatePath('/admin');
  revalidatePath('/account');
  return { success: true };
}

export async function submitAccountAppealAction(message: string) {
  const { user } = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to submit an appeal.' };
  const content = message.trim();
  if (content.length < 30 || content.length > 3000) return { success: false, error: 'Appeals must be 30 to 3,000 characters.' };
  const supabase = createAdminClient();
  const { error } = await supabase.from('account_appeals').insert({ user_id: user.id, message: content });
  if (error) return { success: false, error: error.code === '23505' ? 'You already have an appeal awaiting review.' : 'Appeal could not be submitted.' };
  revalidatePath('/support/appeal');
  revalidatePath('/admin');
  return { success: true };
}

export async function reviewAccountAppealAction(input: {
  id: string;
  status: 'reinstated' | 'rejected';
  response: string;
}) {
  const admin = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(input.id) || input.response.length > 1500) return { success: false, error: 'Invalid appeal update.' };
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('account_appeals').update({
    status: input.status,
    admin_response: input.response.trim() || null,
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', input.id).eq('status', 'pending').select('user_id').maybeSingle();
  if (error || !data) return { success: false, error: 'Appeal was already reviewed or could not be found.' };
  if (input.status === 'reinstated') {
    const { data: priorModeration } = await supabase.from('account_moderation').select('*').eq('user_id', data.user_id).maybeSingle();
    await supabase.from('account_moderation').upsert({
      ...priorModeration,
      user_id: data.user_id,
      status: 'active',
      reason: null,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    });
    if (priorModeration?.status === 'suspended' || priorModeration?.status === 'banned') {
      const restoreVip = priorModeration.previous_role === 'vip_user' &&
        priorModeration.previous_subscription_status === 'active' &&
        (!priorModeration.previous_vip_until || new Date(priorModeration.previous_vip_until).getTime() > Date.now());
      await supabase.from('profiles').update({
        role: restoreVip ? 'vip_user' : priorModeration.previous_role || 'free_user',
        subscription_tier: restoreVip ? 'vip' : priorModeration.previous_subscription_tier || 'free',
        subscription_status: restoreVip ? 'active' : priorModeration.previous_subscription_status || 'inactive',
        current_plan_id: restoreVip ? priorModeration.previous_plan_id || null : null,
        vip_until: restoreVip ? priorModeration.previous_vip_until || null : null,
        updated_at: new Date().toISOString(),
      }).eq('id', data.user_id);
    }
  }
  revalidatePath('/admin');
  revalidatePath('/admin/users');
  revalidatePath('/support/appeal');
  return { success: true };
}

export async function savePolicyPageAction(input: Pick<PolicyPage, 'slug' | 'title' | 'content' | 'is_published'>) {
  const admin = await requireAdmin();
  if (!['terms', 'privacy', 'affiliate-policy'].includes(input.slug) || input.title.trim().length < 3 || input.title.length > 120 || input.content.length > 30000) {
    return { success: false, error: 'Invalid policy content.' };
  }
  if (input.is_published && input.content.trim().length < 100) {
    return { success: false, error: 'Add at least 100 characters before publishing this policy.' };
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from('policy_pages').upsert({
    ...input,
    title: input.title.trim(),
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  });
  revalidatePath('/admin');
  revalidatePath(`/${input.slug}`);
  return { success: !error, error: error?.message };
}