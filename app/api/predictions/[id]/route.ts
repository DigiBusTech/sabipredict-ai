import { NextRequest, NextResponse } from 'next/server';
import { updatePrediction, getPredictionById } from '@/lib/db';
import { PredictionStatus, PredictionTier } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prediction = await getPredictionById(id);

    if (!prediction) {
      return NextResponse.json({ success: false, error: 'Prediction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: prediction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { status, tier } = body as {
      status?: PredictionStatus;
      tier?: PredictionTier;
    };

    if (!status && !tier) {
      return NextResponse.json(
        { success: false, error: 'status or tier is required' },
        { status: 400 }
      );
    }

    const payload: any = {};
    if (status) payload.status = status;
    if (tier) payload.tier = tier;

    const success = await updatePrediction(id, payload);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Prediction not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Prediction ${id} updated.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

