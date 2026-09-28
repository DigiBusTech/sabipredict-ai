'use server';

import { revalidatePath } from 'next/cache';
import { 
  updatePrediction, 
  deletePrediction, 
  insertPredictions, 
  getAdminPredictions 
} from '@/lib/db';
import { fetchSportsmonksFixtures } from '@/lib/sportsmonks';
import { evaluateFixtureWithAI } from '@/lib/ai-engine';
import { PredictionOutcome, PredictionTier } from '@/lib/types';
import { getCurrentUser } from './auth';

async function verifyAdmin() {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function approvePredictionAction(id: string, tier: PredictionTier) {
  await verifyAdmin();
  const success = await updatePrediction(id, {
    status: 'approved',
    tier,
  });
  revalidatePath('/admin');
  revalidatePath('/predictions');
  revalidatePath('/vip');
  revalidatePath('/');
  return { success };
}

export async function rejectPredictionAction(id: string) {
  await verifyAdmin();
  const success = await updatePrediction(id, {
    status: 'rejected',
  });
  revalidatePath('/admin');
  revalidatePath('/predictions');
  revalidatePath('/');
  return { success };
}

export async function settlePredictionAction(
  id: string,
  homeScore: number,
  awayScore: number,
  outcome: PredictionOutcome
) {
  await verifyAdmin();
  const success = await updatePrediction(id, {
    home_score: homeScore,
    away_score: awayScore,
    prediction_outcome: outcome,
  });
  revalidatePath('/admin');
  revalidatePath('/predictions');
  revalidatePath('/');
  return { success };
}

export async function deletePredictionAction(id: string) {
  await verifyAdmin();
  const success = await deletePrediction(id);
  revalidatePath('/admin');
  revalidatePath('/predictions');
  revalidatePath('/');
  return { success };
}

export async function createManualPredictionAction(formData: FormData) {
  await verifyAdmin();

  const home_team = formData.get('home_team') as string;
  const away_team = formData.get('away_team') as string;
  const league = formData.get('league') as string;
  const country = (formData.get('country') as string) || 'International';
  const match_date = formData.get('match_date') as string;
  const match_time = formData.get('match_time') as string;
  const market = formData.get('market') as string;
  const odds = parseFloat((formData.get('odds') as string) || '1.80');
  const confidence_score = parseInt((formData.get('confidence_score') as string) || '75', 10);
  const ai_analysis = formData.get('ai_analysis') as string;
  const tier = (formData.get('tier') as PredictionTier) || 'free';
  const status = (formData.get('status') as any) || 'approved';

  if (!home_team || !away_team || !market || !match_date) {
    return { error: 'Please provide home team, away team, market, and match date.' };
  }

  const success = await insertPredictions([
    {
      fixture_id: `manual-${Date.now()}`,
      home_team,
      away_team,
      league,
      country,
      match_date,
      match_time: match_time ? `${match_date}T${match_time}:00Z` : `${match_date}T18:00:00Z`,
      market,
      odds,
      confidence_score,
      ai_analysis,
      tier,
      status,
      prediction_outcome: 'Pending',
    },
  ]);

  revalidatePath('/admin');
  revalidatePath('/predictions');
  revalidatePath('/');
  return { success };
}

export async function triggerSyncSportsmonksAction() {
  await verifyAdmin();

  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + 7);

  const startStr = today.toISOString().split('T')[0];
  const endStr = future.toISOString().split('T')[0];

  const fixtures = await fetchSportsmonksFixtures(startStr, endStr);
  if (fixtures.length === 0) {
    return { success: false, message: 'No fixtures returned from Sportsmonks.' };
  }

  const success = await insertPredictions(fixtures);
  revalidatePath('/admin');
  return {
    success,
    count: fixtures.length,
    message: `Synchronized ${fixtures.length} upcoming fixtures from Sportsmonks staged for moderation.`,
  };
}

export async function triggerGenerateAITipsAction() {
  await verifyAdmin();

  const pendings = await getAdminPredictions({ status: 'pending' });
  if (pendings.length === 0) {
    // If no pending, pull upcoming fixtures and generate tips
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 5);

    const fixtures = await fetchSportsmonksFixtures(
      today.toISOString().split('T')[0],
      future.toISOString().split('T')[0]
    );

    const evaluated = await Promise.all(fixtures.map((f) => evaluateFixtureWithAI(f)));
    await insertPredictions(evaluated);
    revalidatePath('/admin');
    return {
      success: true,
      count: evaluated.length,
      message: `Generated AI quantitative predictions for ${evaluated.length} fixtures staged for moderation.`,
    };
  }

  const evaluated = await Promise.all(
    pendings.slice(0, 10).map(async (p) => {
      const result = await evaluateFixtureWithAI(p);
      await updatePrediction(p.id, {
        market: result.market,
        odds: result.odds,
        confidence_score: result.confidence_score,
        ai_analysis: result.ai_analysis,
        tier: result.tier,
      });
      return result;
    })
  );

  revalidatePath('/admin');
  return {
    success: true,
    count: evaluated.length,
    message: `Updated ${evaluated.length} pending predictions with fresh AI model calculations.`,
  };
}
