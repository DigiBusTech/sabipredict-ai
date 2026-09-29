'use client';

import React, { useState } from 'react';
import { Database, CreditCard, ExternalLink } from 'lucide-react';
import { SportsmonksSettings, PaymentGatewaySettings, DataProviderSettings, DataProviderType } from '@/lib/types';
import { saveDataProviderSettingsAction, savePaymentSettingsAction } from '@/app/actions/settings';

export default function ApiTab({
  dataProviderSettings,
  sportsmonksSettings,
  paymentSettings,
}: {
  dataProviderSettings?: DataProviderSettings | null;
  sportsmonksSettings: SportsmonksSettings | null;
  paymentSettings: PaymentGatewaySettings | null;
}) {
  const [provider, setProvider] = useState<DataProviderType>(
    dataProviderSettings?.active_provider || 'sportsmonks'
  );
  const [smKey, setSmKey] = useState(
    dataProviderSettings?.sportsmonks_api_key || sportsmonksSettings?.api_key || ''
  );
  const [toaKey, setToaKey] = useState(
    dataProviderSettings?.the_odds_api_key || ''
  );
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [providerMsg, setProviderMsg] = useState<string | null>(null);

  const [activePayment, setActivePayment] = useState<'paystack' | 'stripe' | 'manual'>(
    paymentSettings?.active_provider || 'paystack'
  );
  const [stripePublic, setStripePublic] = useState(paymentSettings?.stripe_public_key || '');
  const [stripeSecret, setStripeSecret] = useState(paymentSettings?.stripe_secret_key || '');
  const [paystackPublic, setPaystackPublic] = useState(paymentSettings?.paystack_public_key || '');
  const [paystackSecret, setPaystackSecret] = useState(paymentSettings?.paystack_secret_key || '');
  const [manualDetails, setManualDetails] = useState(paymentSettings?.manual_bank_details || '');
  const [loadingPay, setLoadingPay] = useState(false);
  const [payMsg, setPayMsg] = useState<string | null>(null);

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider(true);
    try {
      const res = await saveDataProviderSettingsAction({
        active_provider: provider,
        sportsmonks_api_key: smKey,
        the_odds_api_key: toaKey,
      });
      setProviderMsg(res.message);
    } finally {
      setLoadingProvider(false);
      setTimeout(() => setProviderMsg(null), 3500);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPay(true);
    try {
      const res = await savePaymentSettingsAction({
        active_provider: activePayment,
        stripe_public_key: stripePublic,
        stripe_secret_key: stripeSecret,
        paystack_public_key: paystackPublic,
        paystack_secret_key: paystackSecret,
        manual_bank_details: manualDetails,
      });
      setPayMsg(res.message);
    } finally {
      setLoadingPay(false);
      setTimeout(() => setPayMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveProvider} className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-5 space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[#48CAE4]" />
          <h3 className="text-sm font-bold text-white">Football Data Provider</h3>
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1.5">Active Data Provider</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setProvider('sportsmonks')}
              className={`rounded-xl px-4 py-2 font-bold ${
                provider === 'sportsmonks' ? 'bg-[#48CAE4] text-[#0B132B]' : 'bg-[#0B132B] text-slate-400 border border-[#223156]'
              }`}
            >
              Sportsmonks
            </button>
            <button
              type="button"
              onClick={() => setProvider('the-odds-api')}
              className={`rounded-xl px-4 py-2 font-bold ${
                provider === 'the-odds-api' ? 'bg-[#48CAE4] text-[#0B132B]' : 'bg-[#0B132B] text-slate-400 border border-[#223156]'
              }`}
            >
              The Odds API (v4)
            </button>
          </div>
          {provider === 'the-odds-api' && (
            <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
              <span>Guide:</span>
              <a href="https://the-odds-api.com/liveapi/guides/v4/" target="_blank" rel="noreferrer" className="text-[#48CAE4] underline inline-flex items-center">
                The Odds API (v4) <ExternalLink className="h-3 w-3 ml-0.5" />
              </a>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 block mb-1">Sportsmonks API Key</label>
            <input
              type="password"
              value={smKey}
              onChange={(e) => setSmKey(e.target.value)}
              placeholder="Sportsmonks token..."
              className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-300 block mb-1">The Odds API Key</label>
            <input
              type="password"
              value={toaKey}
              onChange={(e) => setToaKey(e.target.value)}
              placeholder="The Odds API key..."
              className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono"
            />
          </div>
        </div>

        {providerMsg && <p className="text-emerald-400 font-semibold">{providerMsg}</p>}

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={loadingProvider} className="rounded-xl bg-[#48CAE4] px-4 py-1.5 font-bold text-[#0B132B] hover:bg-[#00B4D8]">
            {loadingProvider ? 'Saving Provider...' : 'Save Provider Settings'}
          </button>
        </div>
      </form>

      {/* Payment Gateway Configuration */}
      <form onSubmit={handleSavePayment} className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Payment Gateway Configuration</h3>
        </div>

        <div>
          <label className="text-slate-300 block mb-1 font-semibold">Active Payment Gateway</label>
          <div className="flex gap-2">
            {(['paystack', 'stripe', 'manual'] as const).map((prov) => (
              <button
                key={prov}
                type="button"
                onClick={() => setActivePayment(prov)}
                className={`rounded-xl px-3.5 py-1.5 font-bold capitalize ${
                  activePayment === prov ? 'bg-[#48CAE4] text-[#0B132B]' : 'bg-[#0B132B] text-slate-400 border border-[#223156]'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {activePayment === 'paystack' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={paystackPublic} onChange={(e) => setPaystackPublic(e.target.value)} placeholder="Paystack Public Key" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono" />
            <input type="password" value={paystackSecret} onChange={(e) => setPaystackSecret(e.target.value)} placeholder="Paystack Secret Key" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono" />
          </div>
        )}

        {activePayment === 'stripe' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={stripePublic} onChange={(e) => setStripePublic(e.target.value)} placeholder="Stripe Publishable Key" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono" />
            <input type="password" value={stripeSecret} onChange={(e) => setStripeSecret(e.target.value)} placeholder="Stripe Secret Key" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono" />
          </div>
        )}

        {activePayment === 'manual' && (
          <textarea value={manualDetails} onChange={(e) => setManualDetails(e.target.value)} rows={3} placeholder="Bank deposit instructions..." className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-2.5 text-white font-mono" />
        )}

        {payMsg && <p className="text-emerald-400 font-semibold">{payMsg}</p>}

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={loadingPay} className="rounded-xl bg-[#48CAE4] px-4 py-1.5 font-bold text-[#0B132B] hover:bg-[#00B4D8]">
            {loadingPay ? 'Saving Payments...' : 'Save Payment Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
