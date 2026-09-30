import React from 'react';
import { Crown } from 'lucide-react';
import { 
  getSubscriptionPlans, 
  getCurrentUserProfile, 
  getSystemSettings, 
  getManualPaymentMethods 
} from '@/lib/db';
import { PaymentGatewaySettings } from '@/lib/types';
import PricingClient from '@/components/PricingClient';

export const metadata = {
  title: 'VIP Lounge Subscriptions & Pricing | SabiPredict AI',
  description: 'Unlock 80%+ Poisson confidence football predictions and daily Banker of the Day value bets.',
};

export default async function PricingPage() {
  const [plans, profile, paymentSettings, manualMethods] = await Promise.all([
    getSubscriptionPlans(),
    getCurrentUserProfile(),
    getSystemSettings<PaymentGatewaySettings>('payment_gateways'),
    getManualPaymentMethods(true),
  ]);

  const activeGateway = paymentSettings?.active_provider || 'manual';

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300">
          <Crown className="h-3.5 w-3.5" />
          <span>INVEST IN QUANTITATIVE ADVANTAGE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Flexible VIP Memberships
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Transparent algorithmic betting analysis designed for positive long-term expected value. Cancel anytime.
        </p>
      </div>

      <PricingClient 
        plans={plans} 
        userProfile={profile} 
        activeGateway={activeGateway}
        initialManualMethods={manualMethods}
      />
    </div>
  );
}


