'use server';

import { revalidatePath } from 'next/cache';
import { 
  updatePrediction, deletePrediction, insertPredictions, upsertPredictions,
  getAdminPredictions, bulkUpdatePredictions, bulkDeletePredictions 
} from '@/lib/db';
import { fetchFixturesFromActiveProvider, fetchAvailableLeagues } from '@/lib/fixtures-service';
import { evaluateFixtureWithAI } from '@/lib/ai-engine';
import { Prediction, PredictionOutcome, PredictionTier } from '@/lib/types';
import { getCurrentUser } from './auth';

async function verifyAdmin() {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') throw new Error('Unauthorized. Admin access required.');
}

export async function approvePredictionAction(id: string, tier: PredictionTier) {
  await verifyAdmin();
  const success = await updatePrediction(id, { status: 'approved', tier });
  revalidatePath('/admin');
  revalidatePath('/predictions');
  return { success };
}

export async function rejectPredictionAction(id: string) {
  await verifyAdmin();
  const success = await updatePrediction(id, { status: 'rejected' });
  revalidatePath('/admin');
  revalidatePath('/predictions');
  return { success };
}

export async function bulkApprovePredictionsAction(ids: string[], tier: PredictionTier) {
  await verifyAdmin();
  if (!ids.length) return { success: false, message: 'No predictions selected.' };
  const success = await bulkUpdatePredictions(ids, { status: 'approved', tier });
  revalidatePath('/admin');
  revalidatePath('/predictions');
  return { success, message: `Approved ${ids.length} predictions to ${tier.toUpperCase()} tier.` };
}

export async function bulkRejectPredictionsAction(ids: string[]) {
  await verifyAdmin();
  if (!ids.length) return { success: false, message: 'No predictions selected.' };
  const success = await bulkUpdatePredictions(ids, { status: 'rejected' });
  revalidatePath('/admin');
  revalidatePath('/predictions');
  return { success, message: `Rejected ${ids.length} predictions.` };
}

export async function bulkDeletePredictionsAction(ids: string[]) {
  await verifyAdmin();
  if (!ids.length) return { success: false, message: 'No predictions selected.' };
  const success = await bulkDeletePredictions(ids);
  revalidatePath('/admin');
  revalidatePath('/predictions');
  return { success, message: `Deleted ${ids.length} predictions.` };
}

export async function settlePredictionAction(id: string, homeScore: number, awayScore: number, outcome: PredictionOutcome) {
  await verifyAdmin();
  const success = await updatePrediction(id, { home_score: homeScore, away_score: awayScore, prediction_outcome: outcome });
  revalidatePath('/admin');
  revalidatePath('/predictions');
  return { success };
}

export async function deletePredictionAction(id: string) {
  await verifyAdmin();
  const success = await deletePrediction(id);
  revalidatePath('/admin');
  revalidatePath('/predictions');
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
  const odds = parseFloat((formData.get('odds') as string) || '1.35');
  const confidence_score = parseInt((formData.get('confidence_score') as string) || '80', 10);
  const ai_analysis = formData.get('ai_analysis') as string;
  const translations = (['fr', 'es', 'pt'] as const).reduce<NonNullable<Prediction['translations']>>((all, locale) => {
    const marketTranslation = String(formData.get(`${locale}_market`) || '').trim();
    const leagueTranslation = String(formData.get(`${locale}_league`) || '').trim();
    const analysisTranslation = String(formData.get(`${locale}_analysis`) || '').trim();
    if (marketTranslation || leagueTranslation || analysisTranslation) {
      all[locale] = {
        ...(marketTranslation ? { market: marketTranslation } : {}),
        ...(leagueTranslation ? { league: leagueTranslation } : {}),
        ...(analysisTranslation ? { ai_analysis: analysisTranslation } : {}),
      };
    }
    return all;
  }, {});
  const tier = (formData.get('tier') as PredictionTier) || 'free';
  const status = (formData.get('status') as any) || 'approved';

  if (!home_team || !away_team || !market || !match_date) {
    return { error: 'Please provide home team, away team, market, and match date.' };
  }

  const success = await insertPredictions([{
    fixture_id: `manual-${Date.now()}`,
    home_team, away_team, league, country, match_date,
    match_time: match_time ? `${match_date}T${match_time}:00Z` : `${match_date}T18:00:00Z`,
    market, odds, confidence_score, ai_analysis, translations, tier, status, prediction_outcome: 'Pending',
  }]);

  revalidatePath('/admin');
  revalidatePath('/predictions');
  return { success };
}

export async function fetchAvailableLeaguesAction() {
  await verifyAdmin();
  return fetchAvailableLeagues();
}

export async function triggerSyncSportsmonksAction(options?: {
  selected_leagues?: string[];
  date_from?: string;
  date_to?: string;
}) {
  await verifyAdmin();
  const todayStr = options?.date_from || new Date().toISOString().split('T')[0];
  let futureStr = options?.date_to;
  if (!futureStr) {
    const future = new Date(todayStr);
    future.setDate(future.getDate() + 3);
    futureStr = future.toISOString().split('T')[0];
  }

  try {
    const fixtures = await fetchFixturesFromActiveProvider(
      todayStr,
      futureStr,
      options?.selected_leagues
    );

    if (!fixtures || fixtures.length === 0) {
      return { success: false, message: 'No fixtures returned for the selected leagues and date range.' };
    }

    const upsertRes = await upsertPredictions(fixtures);

    if (!upsertRes.success) {
      console.error('[Action Error] triggerSyncSportsmonksAction upsert failed:', upsertRes.error);
      return {
        success: false,
        error: upsertRes.error,
        message: `Database error staging fixtures: ${upsertRes.error}`,
      };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/predictions');
    revalidatePath('/predictions');

    return {
      success: true,
      count: upsertRes.count,
      message: `Successfully synchronized and staged ${upsertRes.count} upcoming fixtures for moderation.`,
    };
  } catch (err: any) {
    console.error('[Action Error] triggerSyncSportsmonksAction exception:', err);
    return {
      success: false,
      error: err.message || 'API sync failed',
      message: `Failed to synchronize fixtures: ${err.message || 'Unknown error'}`,
    };
  }
}

export const triggerSyncFixturesAction = triggerSyncSportsmonksAction;

export async function triggerGenerateAITipsAction(options?: {
  selected_leagues?: string[];
  date_from?: string;
  date_to?: string;
}) {
  await verifyAdmin();
  const pendings = await getAdminPredictions({ status: 'pending' });

  const todayStr = options?.date_from || new Date().toISOString().split('T')[0];
  let futureStr = options?.date_to;
  if (!futureStr) {
    const future = new Date(todayStr);
    future.setDate(future.getDate() + 3);
    futureStr = future.toISOString().split('T')[0];
  }

  try {
    const rawFixtures = await fetchFixturesFromActiveProvider(
      todayStr,
      futureStr,
      options?.selected_leagues
    );

    if (!rawFixtures || rawFixtures.length === 0) {
      return { success: false, message: 'No fixtures found for AI prediction generation in the selected range.' };
    }

    const evaluated = await Promise.all(rawFixtures.map((f) => evaluateFixtureWithAI(f)));
    const upsertRes = await upsertPredictions(evaluated);

    if (!upsertRes.success) {
      console.error('[Action Error] triggerGenerateAITipsAction upsert failed:', upsertRes.error);
      return {
        success: false,
        error: upsertRes.error,
        message: `Database error staging AI predictions: ${upsertRes.error}`,
      };
    }

    if (pendings.length > 0) {
      await Promise.all(
        pendings.slice(0, 10).map(async (p) => {
          const res = await evaluateFixtureWithAI(p);
          await updatePrediction(p.id, {
            market: res.market,
            odds: res.odds,
            confidence_score: res.confidence_score,
            ai_analysis: res.ai_analysis,
            tier: res.tier,
          });
        })
      );
    }

    revalidatePath('/admin');
    revalidatePath('/admin/predictions');
    revalidatePath('/predictions');

    return {
      success: true,
      count: upsertRes.count,
      message: `Generated low-risk AI predictions for ${upsertRes.count} fixtures across selected leagues.`,
    };
  } catch (err: any) {
    console.error('[Action Error] triggerGenerateAITipsAction exception:', err);
    return {
      success: false,
      error: err.message || 'AI Generation failed',
      message: `Failed to generate AI predictions: ${err.message || 'Unknown error'}`,
    };
  }
}
