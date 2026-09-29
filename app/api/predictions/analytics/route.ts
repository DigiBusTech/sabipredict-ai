import { NextRequest, NextResponse } from 'next/server';
import { getPredictionById, getSystemSettings } from '@/lib/db';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMatchAnalytics, getEmptyAnalytics } from '@/lib/analytics-service';
import { DataProviderSettings, Prediction } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const fixtureId = searchParams.get('fixture_id');

    if (!id && !fixtureId) {
      return NextResponse.json(
        { success: false, error: 'Prediction id or fixture_id is required' },
        { status: 400 }
      );
    }

    let prediction: Prediction | null = null;
    if (id) {
      prediction = await getPredictionById(id);
    } else if (fixtureId) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .eq('fixture_id', fixtureId)
        .maybeSingle();
      if (data) prediction = data as Prediction;
    }

    if (!prediction) {
      return NextResponse.json(
        { success: false, error: 'Prediction not found' },
        { status: 404 }
      );
    }

    const providerSettings = await getSystemSettings<DataProviderSettings>('data_provider_settings');
    const apiKey =
      providerSettings?.sportsmonks_api_key?.trim() ||
      process.env.SPORTSMONKS_API_KEY?.trim();

    const analytics = await fetchMatchAnalytics(prediction, apiKey);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('[VIP Analytics Query Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to resolve match analytics',
        data: getEmptyAnalytics(),
      },
      { status: 500 }
    );
  }
}
