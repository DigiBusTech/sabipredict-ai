'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Crown, Shield, CreditCard } from 'lucide-react';
import { SubscriptionPlan, UserProfile } from '@/lib/types';
import { createCheckoutSessionAction } from '@/app/actions/subscription';

export default function PricingClient({
  plans,
  userProfile,
}: {
  plans: SubscriptionPlan[];
  userProfile?: UserProfile | null;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; provider: string; msg?: string } | null>(null);

  const isVip = userProfile?.role === 'vip_user' || userProfile?.role === 'admin';

  const handleSubscribe = async (planId: string) => {
    if (!userProfile) {
      window.location.href = `/login?redirect=/pricing`;
      return;
    }
    setLoading(planId);
    try {
      const res = await createCheckoutSessionAction(planId);
      if (res?.error && res.redirect) {
        window.location.href = res.redirect;
        return;
      }
      setModal({ open: true, provider: res.provider || 'paystack', msg: res.instructions || res.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isVipPlan = plan.id.includes('vip');
          return (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-3xl border p-6 transition-all ${
                isVipPlan
                  ? 'border-amber-500/50 bg-linear-to-b from-[#111C38] to-amber-950/20 shadow-2xl'
                  : 'border-[#1C2541] bg-[#111C38]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black text-white">{plan.name}</h3>
                  {isVipPlan ? <Crown className="h-4 w-4 text-amber-400" /> : <Shield className="h-4 w-4 text-slate-400" />}
                </div>

                <div className="mb-5 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${Number(plan.price).toFixed(2)}</span>
                  <span className="text-xs text-slate-400">/{plan.interval}</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isVipPlan ? 'text-amber-400' : 'text-[#48CAE4]'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1C2541]">
                {isVip && isVipPlan ? (
                  <button disabled className="w-full rounded-xl bg-amber-500/20 border border-amber-500/40 py-2.5 text-xs font-bold text-amber-300">
                    Active Membership
                  </button>
                ) : !isVipPlan ? (
                  <Link href="/predictions" className="block w-full rounded-xl bg-[#1C2541] hover:bg-[#223156] py-2.5 text-center text-xs font-bold text-white">
                    Access Free Tips
                  </Link>
                ) : (
                  <button
                    disabled={loading === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                    className="w-full rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 py-2.5 text-xs font-extrabold text-[#0B132B] shadow-lg disabled:opacity-50"
                  >
                    {loading === plan.id ? 'Connecting...' : 'Upgrade to VIP Lounge'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#3A506B] bg-[#111C38] p-6 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-base">Payment Gateway Scaffolding</h3>
            </div>
            <div className="rounded-xl bg-[#0B132B] p-3 text-xs text-slate-300 border border-[#1C2541] space-y-1">
              <p className="font-semibold text-white">Provider: <span className="uppercase text-[#48CAE4]">{modal.provider}</span></p>
              <p className="font-mono text-[11px] text-amber-300 whitespace-pre-wrap">{modal.msg}</p>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setModal(null)} className="rounded-xl bg-[#48CAE4] px-4 py-1.5 text-xs font-bold text-[#0B132B]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
