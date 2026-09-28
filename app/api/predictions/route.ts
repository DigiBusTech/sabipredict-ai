import { NextRequest, NextResponse } from 'next/server';
import { getPredictions, insertPredictions } from '@/lib/db';
import { PredictionStatus, PredictionTier } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const status = (searchParams.get('status') as PredictionStatus | 'all') || 'approved';
    const tier = (searchParams.get('tier') as PredictionTier | 'all') || 'all';

    const predictions = await getPredictions({ date, status, tier });

    return NextResponse.json({
      success: true,
      count: predictions.length,
      data: predictions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.home_team || !body.away_team || !body.market) {
      return NextResponse.json(
        { success: false, error: 'home_team, away_team, and market are required' },
        { status: 400 }
      );
    }

    const prediction = {
      id: crypto.randomUUID(),
      fixture_id: body.fixture_id || `fixture-${Date.now()}`,
      home_team: body.home_team,
      away_team: body.away_team,
      league: body.league || 'International',
      country: body.country || 'International',
      market: body.market,
      odds: Number(body.odds || 1.8),
      confidence_score: Number(body.confidence_score || 75),
      ai_analysis: body.ai_analysis || 'AI evaluation pending.',
      tier: body.tier || 'free',
      status: body.status || 'pending',
      prediction_outcome: 'Pending' as const,
      match_date: body.match_date || new Date().toISOString().split('T')[0],
      match_time: body.match_time || new Date().toISOString(),
    };

    await insertPredictions([prediction]);

    return NextResponse.json({
      success: true,
      message: 'Prediction created successfully',
      data: prediction,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create prediction' },
      { status: 500 }
    );
  }
}

