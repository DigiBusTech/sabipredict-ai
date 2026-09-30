'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, Crown, Shield, CreditCard, Copy, 
  CheckCircle, Wallet, ArrowRight, X, AlertCircle, Loader2,
  UploadCloud, FileText, Image as ImageIcon, Trash
} from 'lucide-react';
import { SubscriptionPlan, UserProfile, ManualPaymentMethod } from '@/lib/types';
import { createCheckoutSessionAction } from '@/app/actions/subscription';
import { submitManualPaymentProofAction, uploadPaymentProofAction } from '@/app/actions/payments';

export default function PricingClient({
  plans,
  userProfile,
  activeGateway = 'manual',
  initialManualMethods = [],
}: {
  plans: SubscriptionPlan[];
  userProfile?: UserProfile | null;
  activeGateway?: 'paystack' | 'stripe' | 'manual';
  initialManualMethods?: ManualPaymentMethod[];
}) {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  // Manual payment checkout state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<ManualPaymentMethod | null>(
    initialManualMethods[0] || null
  );
  const [txReference, setTxReference] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Paystack / Stripe automated modal state
  const [gatewayNotice, setGatewayNotice] = useState<{ open: boolean; provider: string; msg?: string } | null>(null);

  const isVip = userProfile?.role === 'vip_user' || userProfile?.role === 'admin';

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!userProfile) {
      window.location.href = `/login?redirect=/pricing`;
      return;
    }

    if (activeGateway === 'manual') {
      setSelectedPlan(plan);
      if (initialManualMethods.length > 0 && !selectedMethod) {
        setSelectedMethod(initialManualMethods[0]);
      }
      setTxReference('');
      setSelectedFile(null);
      setFilePreview(null);
      setSubmitError(null);
      setSubmittedSuccess(false);
      setCheckoutModalOpen(true);
      return;
    }

    // Automated provider initialization
    setLoadingPlanId(plan.id);
    try {
      const res = await createCheckoutSessionAction(plan.id);
      if (res?.error && res.redirect) {
        window.location.href = res.redirect;
        return;
      }
      setGatewayNotice({ open: true, provider: res.provider || activeGateway, msg: res.instructions || res.message });
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleCopyAccountDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setSubmitError('Selected file exceeds maximum 5MB limit.');
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setSubmitError('Invalid file type. Please upload a PNG, JPG, or PDF file.');
      return;
    }

    setSubmitError(null);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !selectedMethod) return;

    if (!txReference.trim()) {
      setSubmitError('Please provide your transaction reference, hash, or sender name.');
      return;
    }

    const isProofRequired = selectedMethod.require_file_proof !== false;
    if (isProofRequired && !selectedFile) {
      setSubmitError('Please upload your payment receipt or transfer proof (PNG, JPG, or PDF under 5MB).');
      return;
    }

    setSubmittingProof(true);
    setSubmitError(null);

    try {
      let uploadedUrl: string | undefined = undefined;

      if (selectedFile) {
        setUploadStatusText('Uploading receipt to secure storage...');
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await uploadPaymentProofAction(formData);

        if (!uploadRes.success || !uploadRes.url) {
          setSubmitError(uploadRes.error || 'Failed to upload receipt. Please try again.');
          setSubmittingProof(false);
          return;
        }
        uploadedUrl = uploadRes.url;
      }

      setUploadStatusText('Submitting VIP verification request...');
      const res = await submitManualPaymentProofAction(
        selectedPlan.id,
        selectedMethod.method_name,
        txReference.trim(),
        uploadedUrl
      );

      if (res.success) {
        setSubmittedSuccess(true);
      } else {
        setSubmitError(res.error || 'Failed to submit payment proof.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed.');
    } finally {
      setSubmittingProof(false);
      setUploadStatusText('');
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
                    disabled={loadingPlanId === plan.id}
                    onClick={() => handleSubscribe(plan)}
                    className="w-full rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 py-2.5 text-xs font-extrabold text-[#0B132B] shadow-lg disabled:opacity-50 hover:brightness-110 transition cursor-pointer"
                  >
                    {loadingPlanId === plan.id ? 'Connecting...' : 'Upgrade to VIP Lounge'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Payment Checkout Modal */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-[#111C38] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1C2541] pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  <Crown className="h-3 w-3" /> VIP Lounge Membership
                </div>
                <h3 className="text-lg font-black text-white">{selectedPlan.name}</h3>
                <div className="flex items-baseline gap-1.5 text-xs text-slate-300">
                  <span className="text-2xl font-black text-amber-400">
                    ${Number(selectedPlan.price).toFixed(2)}
                  </span>
                  <span>/ {selectedPlan.interval}</span>
                </div>
              </div>

              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="rounded-xl border border-[#223156] bg-[#0B132B] p-2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submittedSuccess ? (
              <div className="py-6 text-center space-y-4 animate-in fade-in">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                  <CheckCircle className="h-8 w-8 stroke-[2.5]" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-black text-white">Payment Proof Submitted!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Payment submitted! Your VIP access will be activated once verified by an administrator.
                  </p>
                </div>

                <div className="rounded-xl bg-[#0B132B] p-3 text-left border border-[#1C2541] text-xs space-y-1 max-w-sm mx-auto">
                  <div className="text-slate-400 flex justify-between">
                    <span>Plan:</span>
                    <span className="text-white font-bold">{selectedPlan.name}</span>
                  </div>
                  <div className="text-slate-400 flex justify-between">
                    <span>Method:</span>
                    <span className="text-amber-300 font-bold">{selectedMethod?.method_name}</span>
                  </div>
                  <div className="text-slate-400 flex justify-between">
                    <span>Reference:</span>
                    <span className="font-mono text-[#48CAE4] break-all">{txReference}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-6 py-2.5 text-xs font-black text-[#0B132B] shadow-md hover:brightness-110"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Method Selector Tabs */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    1. Select Payment Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {initialManualMethods.map((m) => {
                      const isSelected = selectedMethod?.id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethod(m)}
                          className={`rounded-xl p-2.5 text-left border transition-all ${
                            isSelected
                              ? 'border-[#48CAE4] bg-[#48CAE4]/10 text-white shadow-md'
                              : 'border-[#223156] bg-[#0B132B] text-slate-400 hover:border-slate-500 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Wallet className={`h-3.5 w-3.5 ${isSelected ? 'text-[#48CAE4]' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold truncate">{m.method_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 line-clamp-1">{m.account_details}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Method Details */}
                {selectedMethod && (
                  <div className="rounded-2xl bg-[#0B132B] p-4 border border-[#223156] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        {selectedMethod.method_name} Details
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyAccountDetails(selectedMethod.account_details)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#111C38] border border-[#223156] px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-slate-400" />
                            <span>Copy Details</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="font-mono text-xs font-bold text-white bg-[#111C38] p-3 rounded-xl border border-[#1C2541] whitespace-pre-wrap select-all break-all">
                      {selectedMethod.account_details}
                    </div>

                    {selectedMethod.instructions && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-200/90 leading-relaxed">
                        {selectedMethod.instructions}
                      </div>
                    )}
                  </div>
                )}

                {/* Proof of Payment Form */}
                <form onSubmit={handleSubmitProof} className="space-y-3 pt-1">
                  {/* File Upload Area */}
                  <div>
                    <label className="text-xs font-bold text-white flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <UploadCloud className="h-4 w-4 text-amber-400" />
                        <span>2. Upload Payment Receipt / Proof</span>
                        {selectedMethod?.require_file_proof !== false && (
                          <span className="text-amber-400 font-black">*</span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">Max 5MB (PNG, JPG, PDF)</span>
                    </label>

                    {!selectedFile ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleFileChange(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`relative rounded-2xl border-2 border-dashed p-4 text-center transition cursor-pointer ${
                          isDragging
                            ? 'border-[#48CAE4] bg-[#48CAE4]/10'
                            : 'border-[#223156] bg-[#0B132B]/80 hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileChange(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="space-y-1 pointer-events-none">
                          <UploadCloud className="h-6 w-6 text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-200">
                            Drag & drop receipt here, or <span className="text-[#48CAE4] underline">browse</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Screenshots, transfer receipts, or PDF documents
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#223156] bg-[#0B132B] p-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {filePreview ? (
                            <img
                              src={filePreview}
                              alt="Receipt Preview"
                              className="h-10 w-10 object-cover rounded-lg border border-[#3A506B] shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                          <div className="truncate space-y-0.5">
                            <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type.toUpperCase() || 'DOCUMENT'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleFileChange(null)}
                          className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-1.5 text-rose-300 hover:bg-rose-500/20 shrink-0"
                          title="Remove file"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-1">
                      3. Transaction Hash / Sender Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={txReference}
                      onChange={(e) => setTxReference(e.target.value)}
                      placeholder="e.g. Transaction Hash (TxID) or Sender Name (Bank Transfer)"
                      className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-amber-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Paste the transaction ID or bank sender name matching your payment receipt.
                    </p>
                  </div>

                  {submitError && (
                    <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs text-rose-300 flex items-start gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutModalOpen(false)}
                      className="rounded-xl border border-[#223156] px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingProof || !selectedMethod}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-xs font-black text-[#0B132B] shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                    >
                      {submittingProof ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{uploadStatusText || 'Submitting Proof...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Payment Proof</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Automated Gateway Fallback Modal (Paystack/Stripe) */}
      {gatewayNotice?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#3A506B] bg-[#111C38] p-6 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-base capitalize">{gatewayNotice.provider} Checkout</h3>
            </div>
            <div className="rounded-xl bg-[#0B132B] p-3 text-xs text-slate-300 border border-[#1C2541] space-y-1">
              <p className="font-mono text-[11px] text-amber-300 whitespace-pre-wrap">{gatewayNotice.msg}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setGatewayNotice(null)}
                className="rounded-xl bg-[#48CAE4] px-4 py-1.5 text-xs font-bold text-[#0B132B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
