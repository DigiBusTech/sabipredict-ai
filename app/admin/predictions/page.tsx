import React from 'react';
import { getAdminPredictions } from '@/lib/db';
import { fetchAvailableLeagues } from '@/lib/fixtures-service';
import PredictionsTab from '@/components/admin/PredictionsTab';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Predictions Moderation | SabiPredict AI Super-Dashboard',
  description: 'Moderate, approve, and settle live and staged AI football predictions.',
};

export default async function AdminPredictionsPage() {
  const [predictions, { leagues, activeProvider }] = await Promise.all([
    getAdminPredictions(),
    fetchAvailableLeagues(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PredictionsTab
        predictions={predictions}
        initialLeagues={leagues}
        initialProvider={activeProvider}
      />
    </div>
  );
}


