import { NextRequest, NextResponse } from 'next/server';
import { getPredictionById, getSystemSettings } from '@/lib/db';
import { fetchMatchAnalytics, getEmptyAnalytics } from '@/lib/analytics-service';
import { DataProviderSettings } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prediction = await getPredictionById(id);

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
    console.error(`[VIP Analytics API Error]:`, error);
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
