import { NextRequest, NextResponse } from 'next/server';
import { processExpiringSubscriptionReminders } from '@/lib/reminders-processor';

export async function GET(req: NextRequest) {
  return handleReminders(req);
}

export async function POST(req: NextRequest) {
  return handleReminders(req);
}

async function handleReminders(req: NextRequest) {
  try {
    const summary = await processExpiringSubscriptionReminders();

    return NextResponse.json({
      success: true,
      message: `Processed ${summary.totalChecked} VIP memberships. Reminders sent: ${summary.sentCount}, skipped: ${summary.skippedCount}.`,
      summary,
    });
  } catch (error: any) {
    console.error('Error running automated subscription reminders cron:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process subscription reminders' },
      { status: 500 }
    );
  }
}
