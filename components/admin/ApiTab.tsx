'use client';

import React, { useState } from 'react';
import { Key, CreditCard } from 'lucide-react';
import { SportsmonksSettings, PaymentGatewaySettings } from '@/lib/types';
import { saveSportsmonksSettingsAction, savePaymentSettingsAction } from '@/app/actions/settings';

export default function ApiTab({
  sportsmonksSettings,
  paymentSettings,
}: {
  sportsmonksSettings: SportsmonksSettings | null;
  paymentSettings: PaymentGatewaySettings | null;
}) {
  const [smKey, setSmKey] = useState(sportsmonksSettings?.api_key || '');
  const [loadingSm, setLoadingSm] = useState(false);
  const [smMsg, setSmMsg] = useState<string | null>(null);

  const [activeProvider, setActiveProvider] = useState<'paystack' | 'stripe' | 'manual'>(
    paymentSettings?.active_provider || 'paystack'
  );
  const [stripePublic, setStripePublic] = useState(paymentSettings?.stripe_public_key || '');
  const [stripeSecret, setStripeSecret] = useState(paymentSettings?.stripe_secret_key || '');
  const [paystackPublic, setPaystackPublic] = useState(paymentSettings?.paystack_public_key || '');
  const [paystackSecret, setPaystackSecret] = useState(paymentSettings?.paystack_secret_key || '');
  const [manualDetails, setManualDetails] = useState(paymentSettings?.manual_bank_details || '');
  const [loadingPay, setLoadingPay] = useState(false);
  const [payMsg, setPayMsg] = useState<string | null>(null);

  const handleSaveSportsmonks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSm(true);
    try {
      const res = await saveSportsmonksSettingsAction(smKey);
      setSmMsg(res.message);
    } finally {
      setLoadingSm(false);
      setTimeout(() => setSmMsg(null), 3000);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPay(true);
    try {
      const res = await savePaymentSettingsAction({
        active_provider: activeProvider,
        stripe_public_key: stripePublic,
        stripe_secret_key: stripeSecret,
        paystack_public_key: paystackPublic,
        paystack_secret_key: paystackSecret,
        manual_bank_details: manualDetails,
      });
      setPayMsg(res.message);
    } finally {
      setLoadingPay(false);
      setTimeout(() => setPayMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveSportsmonks} className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-[#48CAE4]" />
          <h3 className="text-sm font-bold text-white">Sportsmonks Football API v3</h3>
        </div>
        <div>
          <label className="text-xs text-slate-300 block mb-1">API Token</label>
          <input
            type="password"
            value={smKey}
            onChange={(e) => setSmKey(e.target.value)}
            placeholder="Enter token..."
            className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-xs text-white font-mono"
          />

      <form onSubmit={handleSavePayment} className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Payment Gateway Configuration</h3>
        </div>

        <div>
          <label className="text-slate-300 block mb-1">Active Provider</label>
          <div className="flex gap-2">
            {(['paystack', 'stripe', 'manual'] as const).map((prov) => (
              <button
                key={prov}
                type="button"
                onClick={() => setActiveProvider(prov)}
                className={`rounded-xl px-3.5 py-1.5 font-bold capitalize ${
                  activeProvider === prov ? 'bg-[#48CAE4] text-[#0B132B]' : 'bg-[#0B132B] text-slate-400 border border-[#223156]'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {activeProvider === 'paystack' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={paystackPublic} onChange={(e) => setPaystackPublic(e.target.value)} placeholder="Paystack Public Key" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono" />
            <input type="password" value={paystackSecret} onChange={(e) => setPaystackSecret(e.target.value)} placeholder="Paystack Secret Key" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono" />
          </div>
        )}

        {activeProvider === 'stripe' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={stripePublic} onChange={(e) => setStripePublic(e.target.value)} placeholder="Stripe Publishable Key" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono" />
            <input type="password" value={stripeSecret} onChange={(e) => setStripeSecret(e.target.value)} placeholder="Stripe Secret Key" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono" />
          </div>
        )}

        {activeProvider === 'manual' && (
          <textarea value={manualDetails} onChange={(e) => setManualDetails(e.target.value)} rows={3} placeholder="Bank deposit instructions..." className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-2.5 text-white font-mono" />
        )}

        {payMsg && <p className="text-emerald-400">{payMsg}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={loadingPay} className="rounded-xl bg-[#48CAE4] px-4 py-1.5 font-bold text-[#0B132B]">
            {loadingPay ? 'Saving...' : 'Save Payments'}
          </button>
        </div>
      </form>

        </div>
        {smMsg && <p className="text-xs text-emerald-400">{smMsg}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={loadingSm} className="rounded-xl bg-[#48CAE4] px-4 py-1.5 text-xs font-bold text-[#0B132B]">
            {loadingSm ? 'Saving...' : 'Save Token'}
          </button>
        </div>
      </form>
    </div>
  );
}
