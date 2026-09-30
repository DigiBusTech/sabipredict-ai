'use client';

import React, { useState } from 'react';
import { 
  Database, CreditCard, ExternalLink, Plus, Trash2, 
  Edit2, Wallet, Check, AlertCircle, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { 
  SportsmonksSettings, 
  PaymentGatewaySettings, 
  DataProviderSettings, 
  DataProviderType,
  ManualPaymentMethod 
} from '@/lib/types';
import { saveDataProviderSettingsAction, savePaymentSettingsAction } from '@/app/actions/settings';
import { 
  saveManualPaymentMethodAction, 
  deleteManualPaymentMethodAction, 
  toggleManualPaymentMethodAction 
} from '@/app/actions/payments';

export default function ApiTab({
  dataProviderSettings,
  sportsmonksSettings,
  paymentSettings,
  initialManualMethods = [],
}: {
  dataProviderSettings?: DataProviderSettings | null;
  sportsmonksSettings: SportsmonksSettings | null;
  paymentSettings: PaymentGatewaySettings | null;
  initialManualMethods?: ManualPaymentMethod[];
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

  // Manual payment methods dynamic management
  const [methods, setMethods] = useState<ManualPaymentMethod[]>(initialManualMethods);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<Partial<ManualPaymentMethod> | null>(null);
  const [savingMethod, setSavingMethod] = useState(false);
  const [methodError, setMethodError] = useState<string | null>(null);
  const handleOpenAddMethod = () => {
    setEditingMethod({
      method_name: '',
      account_details: '',
      instructions: '',
      is_active: true,
      require_file_proof: true,
    });
    setMethodError(null);
    setModalOpen(true);
  };

  const handleOpenEditMethod = (m: ManualPaymentMethod) => {
    setEditingMethod(m);
    setMethodError(null);
    setModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod?.method_name?.trim() || !editingMethod?.account_details?.trim()) {
      setMethodError('Please provide a method title and account details.');
      return;
    }

    setSavingMethod(true);
    setMethodError(null);
    try {
      const res = await saveManualPaymentMethodAction(editingMethod);
      if (res.success && res.data) {
        setMethods((prev) => {
          const idx = prev.findIndex((item) => item.id === res.data!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.data!;
            return next;
          }
          return [...prev, res.data!];
        });
        setModalOpen(false);
        setEditingMethod(null);
      } else {
        setMethodError(res.error || 'Failed to save payment option.');
      }
    } finally {
      setSavingMethod(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    const res = await deleteManualPaymentMethodAction(id);
    if (res.success) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleToggleMethod = async (id: string, currentActive: boolean) => {
    const nextState = !currentActive;
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_active: nextState } : m))
    );
    await toggleManualPaymentMethodAction(id, nextState);
  };


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
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#223156] pb-2">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-amber-400" />
                  <span>Configured Manual Payment Methods ({methods.length})</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Dynamic crypto wallets, local banks, and e-wallets displayed to users during VIP checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddMethod}
                className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-extrabold text-[#0B132B] shadow-md hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Add Payment Method</span>
              </button>
            </div>

            {/* Methods Cards */}
            <div className="space-y-2.5">
              {methods.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#223156] bg-[#0B132B] p-5 text-center text-slate-400 text-xs">
                  No payment methods configured yet. Click &quot;Add Payment Method&quot; above to add USDT Crypto, Bank Wire, or OPay.
                </div>
              ) : (
                methods.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[#223156] bg-[#0B132B] p-3 text-xs flex flex-wrap items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{m.method_name}</span>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[9px] font-black uppercase ${
                            m.is_active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                          }`}
                        >
                          {m.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="font-mono text-[11px] text-[#48CAE4] bg-[#111C38] px-2.5 py-1.5 rounded-lg border border-[#1C2541] whitespace-pre-wrap select-all">
                        {m.account_details}
                      </div>

                      {m.instructions && (
                        <p className="text-[11px] text-slate-300 italic leading-relaxed">
                          {m.instructions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleMethod(m.id, m.is_active)}
                        title={m.is_active ? 'Disable method' : 'Enable method'}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                          m.is_active
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                        <span>{m.is_active ? 'Active' : 'Inactive'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditMethod(m)}
                        title="Edit method"
                        className="rounded-lg bg-[#111C38] border border-[#223156] p-1.5 text-slate-300 hover:text-white"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMethod(m.id)}
                        title="Delete method"
                        className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-1.5 text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <label className="text-slate-400 block mb-1 text-[11px]">General Deposit Footnote (Fallback)</label>
              <textarea
                value={manualDetails}
                onChange={(e) => setManualDetails(e.target.value)}
                rows={2}
                placeholder="Optional general notes displayed below methods..."
                className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-2 text-white font-mono text-[11px]"
              />
            </div>
          </div>
        )}

        {payMsg && <p className="text-emerald-400 font-semibold">{payMsg}</p>}

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={loadingPay} className="rounded-xl bg-[#48CAE4] px-4 py-1.5 font-bold text-[#0B132B] hover:bg-[#00B4D8]">
            {loadingPay ? 'Saving Payments...' : 'Save Payment Settings'}
          </button>
        </div>
      </form>
      {/* Dynamic Add / Edit Payment Method Modal */}
      {modalOpen && editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveMethod}
            className="w-full max-w-lg rounded-2xl border border-[#3A506B] bg-[#111C38] p-5 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#223156] pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingMethod.id ? 'Edit Manual Payment Method' : 'Add New Manual Payment Method'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                &times;
              </button>
            </div>

            {methodError && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs text-rose-300">
                {methodError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Payment Method Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingMethod.method_name || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, method_name: e.target.value })}
                  placeholder="e.g. USDT (TRC20 Crypto), Bank Wire (First Bank), OPay"
                  className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Account / Wallet Details <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingMethod.account_details || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, account_details: e.target.value })}
                  placeholder="e.g. Wallet address: TYDzs... or Bank: GTB, Account: 0123456789, Name: SabiPredict"
                  className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Specific Instructions & Network Warning
                </label>
                <textarea
                  rows={3}
                  value={editingMethod.instructions || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                  placeholder="e.g. Send only TRC20 USDT to this address. Paste your transaction hash (TxID) below after completing the transfer."
                  className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="method_active"
                  checked={editingMethod.is_active !== false}
                  onChange={(e) => setEditingMethod({ ...editingMethod, is_active: e.target.checked })}
                  className="rounded border-[#223156] text-amber-500 focus:ring-0"
                />
                <label htmlFor="method_active" className="text-slate-300 font-medium cursor-pointer">
                  Active (Display this payment option to users during checkout)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="method_require_proof"
                  checked={editingMethod.require_file_proof !== false}
                  onChange={(e) => setEditingMethod({ ...editingMethod, require_file_proof: e.target.checked })}
                  className="rounded border-[#223156] text-amber-500 focus:ring-0"
                />
                <label htmlFor="method_require_proof" className="text-slate-300 font-medium cursor-pointer">
                  Require Receipt / File Proof Upload (Users must attach image or PDF proof)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#223156]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-[#223156] px-4 py-2 font-bold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingMethod}
                className="rounded-xl bg-[#48CAE4] px-4 py-2 font-bold text-[#0B132B] hover:bg-[#00B4D8] disabled:opacity-50"
              >
                {savingMethod ? 'Saving Method...' : 'Save Payment Method'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
