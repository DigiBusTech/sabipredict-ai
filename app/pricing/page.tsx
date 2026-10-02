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
import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';
import { getActivePromoSlots } from '@/lib/site-content';
import PromoSlotCard from '@/components/PromoSlotCard';

export async function generateMetadata() {
  return getPageMetadata('/pricing', await getRequestLocale(), {
    title: 'Membership Plans | SabiPredict AI',
    description: 'Compare SabiPredict AI membership plans and billing intervals.',
  });
}

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const [plans, profile, paymentSettings, manualMethods, promos] = await Promise.all([
    getSubscriptionPlans(locale),
    getCurrentUserProfile(),
    getSystemSettings<PaymentGatewaySettings>('payment_gateways'),
    getManualPaymentMethods(true),
    getActivePromoSlots('pricing-banner'),
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
      {promos.map((promo) => <PromoSlotCard key={promo.id} slot={promo} locale={locale} />)}
    </div>
  );
}


