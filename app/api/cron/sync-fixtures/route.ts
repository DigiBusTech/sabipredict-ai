import { NextRequest, NextResponse } from 'next/server';
import { fetchFixturesFromActiveProvider } from '@/lib/fixtures-service';
import { insertPredictions } from '@/lib/db';

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    const startStr = today.toISOString().split('T')[0];
    const endStr = future.toISOString().split('T')[0];

    const fixtures = await fetchFixturesFromActiveProvider(startStr, endStr);
    await insertPredictions(fixtures);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${fixtures.length} fixtures from active provider.`,
      count: fixtures.length,
      fixtures: fixtures.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Error syncing fixtures:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync fixtures' },
      { status: 500 }
    );
  }
}


