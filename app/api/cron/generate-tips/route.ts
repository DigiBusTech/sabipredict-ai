import { NextRequest, NextResponse } from 'next/server';
import { fetchSportsmonksFixtures } from '@/lib/sportsmonks';
import { evaluateFixtureWithAI } from '@/lib/ai-engine';
import { insertPredictions, getPredictions } from '@/lib/db';

export async function GET(req: NextRequest) {
  return handleGenerate(req);
}

export async function POST(req: NextRequest) {
  return handleGenerate(req);
}

async function handleGenerate(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    const startStr = today.toISOString().split('T')[0];
    const endStr = future.toISOString().split('T')[0];

    // 1. Fetch upcoming fixtures from Sportsmonks
    const rawFixtures = await fetchSportsmonksFixtures(startStr, endStr);

    // 2. Evaluate with AI
    const evaluated = await Promise.all(
      rawFixtures.map((f) => evaluateFixtureWithAI(f))
    );

    // 3. Insert into Supabase staged for moderation
    await insertPredictions(evaluated);

    // 4. Query updated stats
    const allTips = await getPredictions({ status: 'all' });
    const pendingTips = allTips.filter((t) => t.status === 'pending');

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${rawFixtures.length} upcoming fixtures across ${days} days and generated ${evaluated.length} AI betting predictions staged for admin moderation.`,
      summary: {
        fixtures_synced: rawFixtures.length,
        predictions_generated: evaluated.length,
        total_pending_moderation: pendingTips.length,
      },
      predictions_sample: evaluated.slice(0, 3),
    });
  } catch (error: any) {
    console.error('Error generating AI tips:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}

