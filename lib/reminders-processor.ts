import { getVipProfiles, getSubscriptionReminderLogs, insertSubscriptionReminderLog } from './db';
import { sendSubscriptionRenewalEmail } from './email-service';
import { SubscriptionReminderStage } from './types';

export interface ReminderProcessResult {
  totalChecked: number;
  sentCount: number;
  skippedCount: number;
  errors: string[];
  processed: {
    email: string;
    stage: SubscriptionReminderStage;
    status: 'sent' | 'skipped' | 'failed';
    reason?: string;
  }[];
}

export async function processExpiringSubscriptionReminders(): Promise<ReminderProcessResult> {
  const vipProfiles = await getVipProfiles();
  const recentLogs = await getSubscriptionReminderLogs(200);

  const now = new Date();
  const result: ReminderProcessResult = {
    totalChecked: vipProfiles.length,
    sentCount: 0,
    skippedCount: 0,
    errors: [],
    processed: [],
  };

  for (const profile of vipProfiles) {
    if (!profile.vip_until) {
      result.skippedCount++;
      continue;
    }

    const expiryDate = new Date(profile.vip_until);
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let stage: SubscriptionReminderStage | null = null;

    if (diffDays >= 4 && diffDays <= 5) {
      stage = '5_days';
    } else if (diffDays >= 2 && diffDays <= 3) {
      stage = '3_days';
    } else if (diffDays <= 1 && diffDays >= -1) {
      stage = 'exact_day';
    }

    if (!stage) {
      result.skippedCount++;
      continue;
    }

    // Check if reminder was already sent for this stage in the last 7 days
    const alreadySent = recentLogs.some(
      (log) =>
        log.user_id === profile.id &&
        log.stage === stage &&
        log.status === 'sent' &&
        (now.getTime() - new Date(log.sent_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    );

    if (alreadySent) {
      result.skippedCount++;
      result.processed.push({
        email: profile.email,
        stage,
        status: 'skipped',
        reason: 'Already sent for this billing stage',
      });
      continue;
    }

    // Send email
    try {
      const sendRes = await sendSubscriptionRenewalEmail({
        to: profile.email,
        fullName: profile.full_name,
        stage,
        vipUntil: profile.vip_until,
      });

      if (sendRes.success) {
        await insertSubscriptionReminderLog({
          user_id: profile.id,
          email: profile.email,
          stage,
          status: 'sent',
          vip_until: profile.vip_until,
        });

        result.sentCount++;
        result.processed.push({
          email: profile.email,
          stage,
          status: 'sent',
        });
      } else {
        await insertSubscriptionReminderLog({
          user_id: profile.id,
          email: profile.email,
          stage,
          status: 'failed',
          vip_until: profile.vip_until,
          error_message: sendRes.error,
        });

        result.errors.push(`Failed for ${profile.email}: ${sendRes.error}`);
        result.processed.push({
          email: profile.email,
          stage,
          status: 'failed',
          reason: sendRes.error,
        });
      }
    } catch (err: any) {
      result.errors.push(`Error processing ${profile.email}: ${err.message}`);
      result.processed.push({
        email: profile.email,
        stage,
        status: 'failed',
        reason: err.message,
      });
    }
  }

  return result;
}