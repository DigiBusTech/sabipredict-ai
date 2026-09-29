'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import { processExpiringSubscriptionReminders } from '@/lib/reminders-processor';
import { sendSubscriptionRenewalEmail } from '@/lib/email-service';
import { insertSubscriptionReminderLog, getVipProfiles } from '@/lib/db';
import { SubscriptionReminderStage } from '@/lib/types';

async function verifyAdmin() {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function processDueRemindersAction() {
  await verifyAdmin();
  const summary = await processExpiringSubscriptionReminders();
  revalidatePath('/admin');
  return {
    success: true,
    summary,
    message: `Processed ${summary.totalChecked} VIP accounts: ${summary.sentCount} sent, ${summary.skippedCount} skipped.`,
  };
}

export async function sendSingleReminderAction(userId: string, stage: SubscriptionReminderStage) {
  await verifyAdmin();
  const profiles = await getVipProfiles();
  const target = profiles.find((p) => p.id === userId);

  if (!target) {
    return { success: false, error: 'User profile not found or not in VIP tier.' };
  }

  const res = await sendSubscriptionRenewalEmail({
    to: target.email,
    fullName: target.full_name,
    stage,
    vipUntil: target.vip_until,
  });

  await insertSubscriptionReminderLog({
    user_id: target.id,
    email: target.email,
    stage,
    status: res.success ? 'sent' : 'failed',
    vip_until: target.vip_until,
    error_message: res.error,
  });

  revalidatePath('/admin');
  return {
    success: res.success,
    message: res.success
      ? `Successfully delivered ${stage} reminder email to ${target.email}.`
      : `Failed to deliver email: ${res.error}`,
  };
}

export async function sendTestReminderEmailAction(email: string, stage: SubscriptionReminderStage) {
  await verifyAdmin();
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please provide a valid destination email address.' };
  }

  const dummyExpiry = new Date();
  if (stage === '5_days') dummyExpiry.setDate(dummyExpiry.getDate() + 5);
  else if (stage === '3_days') dummyExpiry.setDate(dummyExpiry.getDate() + 3);

  const res = await sendSubscriptionRenewalEmail({
    to: email,
    fullName: 'Test VIP Member',
    stage,
    vipUntil: dummyExpiry.toISOString(),
  });

  return {
    success: res.success,
    message: res.success
      ? `Test ${stage} reminder email dispatched to ${email}. Check inbox or server simulation logs.`
      : `Test email delivery failed: ${res.error}`,
  };
}