import { Resend } from 'resend';
import { SubscriptionReminderStage } from './types';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'SabiPredict AI <notifications@sabipredict.com>';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sabipredict.com';

interface SendReminderParams {
  to: string;
  fullName?: string | null;
  stage: SubscriptionReminderStage;
  vipUntil?: string | null;
}

export async function sendSubscriptionRenewalEmail({
  to,
  fullName,
  stage,
  vipUntil,
}: SendReminderParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const name = fullName || to.split('@')[0];
  const renewalUrl = `${siteUrl}/pricing`;
  const expiryFormatted = vipUntil
    ? new Date(vipUntil).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'soon';

  let subject = 'SabiPredict AI VIP Membership Notice';
  let headline = 'VIP Lounge Subscription';
  let badgeText = 'VIP MEMBERSHIP';
  let badgeColor = '#F59E0B';
  let bodyParagraph = '';

  if (stage === '5_days') {
    subject = '⏳ 5 Days Left: Your SabiPredict VIP Lounge Access is Expiring Soon';
    headline = 'Your VIP Access Expires in 5 Days';
    badgeText = '5-DAY EXPIRATION NOTICE';
    badgeColor = '#F59E0B';
    bodyParagraph = `This is a courtesy reminder that your SabiPredict VIP Lounge access will end on <strong>${expiryFormatted}</strong>. Renew today to guarantee uninterrupted access to high-confidence 80%+ value picks, Poisson xG charts, and daily banker accumulators.`;
  } else if (stage === '3_days') {
    subject = '⚠️ Action Required: 3 Days Left on Your SabiPredict VIP Membership';
    headline = 'Only 3 Days Remaining on Your VIP Plan';
    badgeText = '3-DAY EXPIRATION NOTICE';
    badgeColor = '#F97316';
    bodyParagraph = `Your SabiPredict VIP membership is set to expire on <strong>${expiryFormatted}</strong>. Avoid losing access to live odds movements, squad injury updates, and weekend VIP slips by renewing your subscription now.`;
  } else if (stage === 'exact_day') {
    subject = '🚨 Final Notice: Your SabiPredict VIP Membership Expires Today';
    headline = 'Your VIP Access Expires Today';
    badgeText = 'FINAL EXPIRATION NOTICE';
    badgeColor = '#EF4444';
    bodyParagraph = `Your SabiPredict VIP membership expires today (<strong>${expiryFormatted}</strong>). To keep accessing our exclusive quantitative algorithms and daily banker selections, please renew your subscription now.`;
  } else {
    subject = '⚡ SabiPredict AI: Renew Your VIP Membership';
    headline = 'Renew Your VIP Lounge Membership';
    badgeText = 'VIP RENEWAL';
    bodyParagraph = `We noticed your SabiPredict VIP access is due for renewal. Continue capitalizing on quantitative mathematical edge and machine learning football models by renewing today.`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B132B; color: #E2E8F0; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #111C38; border-radius: 16px; border: 1px solid #1C2541; overflow: hidden;">
    <tr>
      <td style="padding: 28px 32px; background-color: #0B132B; border-bottom: 1px solid #1C2541;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">SabiPredict <span style="color: #48CAE4;">AI</span></span>
            </td>
            <td align="right">
              <span style="display: inline-block; padding: 4px 10px; background-color: rgba(245, 158, 11, 0.15); border: 1px solid ${badgeColor}; border-radius: 999px; color: ${badgeColor}; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">${badgeText}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 36px 32px;">
        <h1 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0 0 16px 0; line-height: 1.3;">${headline}</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1; margin: 0 0 20px 0;">Hello ${name},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1; margin: 0 0 24px 0;">${bodyParagraph}</p>
        
        <div style="background-color: #0B132B; border: 1px solid #223156; border-radius: 12px; padding: 18px; margin-bottom: 28px;">
          <p style="font-size: 12px; font-weight: 700; color: #48CAE4; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 0.5px;">Your VIP Lounge Features:</p>
          <ul style="font-size: 13px; color: #94A3B8; margin: 0; padding-left: 18px; line-height: 1.8;">
            <li>Daily Banker of the Day (Max Kelly Criterion edge)</li>
            <li>80%+ High-Confidence Model Predictions</li>
            <li>Full 5-match xG trend curves & H2H distribution charts</li>
            <li>Verified squad injury rosters & suspension alerts</li>
          </ul>
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${renewalUrl}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B, #FBBF24); color: #0B132B; font-weight: 900; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">Renew VIP Membership Now &rarr;</a>
            </td>
          </tr>
        </table>

        <p style="font-size: 12px; color: #64748B; margin: 28px 0 0 0; text-align: center;">
          Have questions or need assistance? Reply directly to this email or visit our <a href="${siteUrl}/account" style="color: #48CAE4; text-decoration: none;">Account Dashboard</a>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; background-color: #0B132B; border-top: 1px solid #1C2541; text-align: center;">
        <p style="font-size: 11px; color: #475569; margin: 0;">
          &copy; ${new Date().getFullYear()} SabiPredict AI. All rights reserved. 18+ Gamble Responsibly.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // If Resend API key is configured, send live email
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('Resend delivery error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err: any) {
      console.error('sendSubscriptionRenewalEmail exception:', err);
      return { success: false, error: err.message || 'Email delivery failed.' };
    }
  }

  // Graceful fallback for local development / testing without live Resend key
  console.log(`[EMAIL SIMULATION] Sending ${stage} reminder to ${to}: "${subject}"`);
  return {
    success: true,
    messageId: `simulated-${Date.now()}`,
  };
}

export async function sendSubscriptionApprovedEmail({
  to,
  fullName,
  planName = 'VIP Lounge Membership',
  vipUntil,
}: {
  to: string;
  fullName?: string | null;
  planName?: string;
  vipUntil?: string | null;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const name = fullName || to.split('@')[0];
  const vipUrl = `${siteUrl}/vip`;
  const expiryFormatted = vipUntil
    ? new Date(vipUntil).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active';

  const subject = `🎉 VIP Lounge Access Activated! | SabiPredict AI`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0B132B; color: #E2E8F0; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #111C38; border-radius: 16px; border: 1px solid #1C2541; overflow: hidden;">
    <tr>
      <td style="padding: 24px 32px; background-color: #0B132B; border-bottom: 1px solid #1C2541;">
        <span style="font-size: 20px; font-weight: 900; color: #FFFFFF;">SabiPredict <span style="color: #48CAE4;">AI</span></span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <div style="display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; border-radius: 999px; color: #34D399; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px;">
          ✓ PAYMENT VERIFIED & APPROVED
        </div>
        <h1 style="font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0 0 16px 0;">Welcome to VIP Lounge, ${name}!</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1; margin: 0 0 20px 0;">
          Your manual payment has been confirmed by our administrators. Your <strong>${planName}</strong> is now officially active until <strong>${expiryFormatted}</strong>.
        </p>

        <div style="background-color: #0B132B; border: 1px solid #223156; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 12px; font-weight: 700; color: #48CAE4; text-transform: uppercase; margin: 0 0 8px 0;">Unlocked VIP Privileges:</p>
          <ul style="font-size: 13px; color: #94A3B8; margin: 0; padding-left: 18px; line-height: 1.8;">
            <li>High-confidence 80%+ Poisson prediction slips</li>
            <li>Daily Banker of the Day (Max Kelly Edge)</li>
            <li>5-match xG trend curves & head-to-head performance telemetry</li>
            <li>Verified medical report & missing squad personnel alerts</li>
          </ul>
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${vipUrl}" style="display: inline-block; background: linear-gradient(135deg, #48CAE4, #00B4D8); color: #0B132B; font-weight: 900; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
                Access VIP Lounge Now &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  console.log(`[EMAIL SIMULATION] Sending VIP approval email to ${to}: "${subject}"`);
  return { success: true, messageId: `simulated-${Date.now()}` };
}

export async function sendSubscriptionRejectedEmail({
  to,
  fullName,
  planName = 'VIP Lounge Membership',
  reason,
}: {
  to: string;
  fullName?: string | null;
  planName?: string;
  reason?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const name = fullName || to.split('@')[0];
  const pricingUrl = `${siteUrl}/pricing`;
  const subject = `Notice regarding your SabiPredict VIP payment submission`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0B132B; color: #E2E8F0; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #111C38; border-radius: 16px; border: 1px solid #1C2541; overflow: hidden;">
    <tr>
      <td style="padding: 24px 32px; background-color: #0B132B; border-bottom: 1px solid #1C2541;">
        <span style="font-size: 20px; font-weight: 900; color: #FFFFFF;">SabiPredict <span style="color: #48CAE4;">AI</span></span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h1 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 0 0 16px 0;">Payment Verification Update</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1; margin: 0 0 16px 0;">Hello ${name},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1; margin: 0 0 20px 0;">
          Your manual payment submission for <strong>${planName}</strong> could not be verified by our team.
        </p>
        ${
          reason
            ? `<div style="background-color: #0B132B; border: 1px solid #EF4444; border-radius: 12px; padding: 14px; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #FCA5A5; margin: 0;"><strong>Reason provided:</strong> ${reason}</p>
              </div>`
            : ''
        }
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin: 0 0 24px 0;">
          Please confirm your transfer reference or transaction hash and resubmit through our checkout portal.
        </p>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${pricingUrl}" style="display: inline-block; background: #3A506B; color: #FFFFFF; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 12px; text-decoration: none;">
                Review Payment Details &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  console.log(`[EMAIL SIMULATION] Sending VIP rejection email to ${to}: "${subject}"`);
  return { success: true, messageId: `simulated-${Date.now()}` };
}