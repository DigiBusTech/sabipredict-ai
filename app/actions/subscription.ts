'use server';

import { revalidatePath } from 'next/cache';
import { 
  getSystemSettings, 
  upsertSubscriptionPlan, 
  deleteSubscriptionPlan,
  getManualPaymentMethods
} from '@/lib/db';
import { getCurrentUser } from './auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { SubscriptionPlan, PaymentGatewaySettings } from '@/lib/types';

export async function createCheckoutSessionAction(planId: string, providerOverride?: string) {
  const { user, profile } = await getCurrentUser();
  if (!user) {
    return { error: 'Please log in to upgrade to VIP Lounge.', redirect: '/login' };
  }

  const paymentSettings = await getSystemSettings<PaymentGatewaySettings>('payment_gateways');
  const provider = providerOverride || paymentSettings?.active_provider || 'manual';

  if (provider === 'manual') {
    const manualMethods = await getManualPaymentMethods(true);
    return {
      provider: 'manual',
      manualMethods,
      instructions: paymentSettings?.manual_bank_details || 'Manual payment methods available.',
    };
  }

  // Scaffolding for Paystack / Stripe
  if (provider === 'paystack') {
    return {
      provider: 'paystack',
      publicKey: paymentSettings?.paystack_public_key || 'pk_test_demo',
      email: user.email,
      planId,
      message: 'Paystack checkout initialized.',
    };
  }

  return {
    provider: 'stripe',
    publicKey: paymentSettings?.stripe_public_key || 'pk_test_demo',
    email: user.email,
    planId,
    message: 'Stripe checkout initialized.',
  };
}

export async function upgradeUserVipAction(userId: string) {
  const { profile: currentAdmin } = await getCurrentUser();
  if (!currentAdmin || currentAdmin.role !== 'admin') {
    throw new Error('Admin privileges required.');
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      role: 'vip_user',
      subscription_status: 'active',
      subscription_tier: 'vip',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  revalidatePath('/admin');
  revalidatePath('/predictions');
  return { success: !error };
}

export async function saveSubscriptionPlanAction(plan: SubscriptionPlan) {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin privileges required.');
  }

  const success = await upsertSubscriptionPlan(plan);
  revalidatePath('/admin');
  revalidatePath('/pricing');
  return { success };
}

export async function deleteSubscriptionPlanAction(id: string) {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin privileges required.');
  }

  const success = await deleteSubscriptionPlan(id);
  revalidatePath('/admin');
  revalidatePath('/pricing');
  return { success };
}
