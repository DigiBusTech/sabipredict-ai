'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Clock, ShieldCheck, Copy, 
  Check, Calendar, AlertCircle, RefreshCw, Eye, 
  ExternalLink, ZoomIn, ZoomOut, FileText, Image as ImageIcon, X
} from 'lucide-react';
import { PendingSubscription } from '@/lib/types';
import { 
  approvePendingSubscriptionAction, 
  rejectPendingSubscriptionAction,
  getPendingSubscriptionsAction 
} from '@/app/actions/payments';

export default function PendingPaymentsTab({
  initialItems = [],
}: {
  initialItems?: PendingSubscription[];
}) {
  const [items, setItems] = useState<PendingSubscription[]>(initialItems);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Proof inspection modal
  const [proofModal, setProofModal] = useState<{
    open: boolean;
    item: PendingSubscription | null;
    isZoomed: boolean;
  }>({
    open: false,
    item: null,
    isZoomed: false,
  });

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    item: PendingSubscription | null;
    reason: string;
  }>({
    open: false,
    item: null,
    reason: '',
  });

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const rejectedCount = items.filter((i) => i.status === 'rejected').length;

  const filteredItems = items.filter((i) => {
    if (filter === 'all') return true;
    return i.status === filter;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (item: PendingSubscription) => {
    setProcessingId(item.id);
    setFeedback(null);
    try {
      const res = await approvePendingSubscriptionAction(item.id);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'approved', admin_notes: 'Approved by administrator' }
              : i
          )
        );
        setFeedback({
          type: 'success',
          message: `VIP Access approved for ${item.user_email}! Role updated & email sent.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Approval failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Exception occurred.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.item) return;
    const item = rejectModal.item;
    setProcessingId(item.id);
    try {
      const res = await rejectPendingSubscriptionAction(item.id, rejectModal.reason);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'rejected', admin_notes: rejectModal.reason }
              : i
          )
        );
        setFeedback({
          type: 'success',
          message: `Subscription request for ${item.user_email} marked rejected.`,
        });
        setRejectModal({ open: false, item: null, reason: '' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Rejection failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Exception occurred.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefresh = async () => {
    setProcessingId('refresh');
    try {
      const refreshed = await getPendingSubscriptionsAction();
      setItems(refreshed);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-500/30 bg-[#111C38] p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Verification</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-[#111C38] p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved VIP Access</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-[#111C38] p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected Requests</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{rejectedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl p-3 text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Filter Tabs & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2541] pb-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-[#111C38] p-1 border border-[#1C2541] text-xs">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-[#48CAE4] text-[#0B132B]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                filter === 'pending' ? 'bg-[#0B132B] text-[#48CAE4]' : 'bg-amber-400/20 text-amber-300'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'approved' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'rejected' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'all' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Submissions ({items.length})
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={processingId === 'refresh'}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#111C38] border border-[#223156] px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${processingId === 'refresh' ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-10 text-center space-y-2">
            <Clock className="h-8 w-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Submissions Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filter === 'pending'
                ? 'All caught up! There are currently no pending manual payment requests awaiting review.'
                : `No subscriptions with status "${filter}".`}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isProcessing = processingId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 text-xs transition-all hover:border-[#2A3B5C] space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{item.user_email || 'Subscriber'}</span>
                      {item.user_name && <span className="text-slate-400 text-xs">({item.user_name})</span>}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          item.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : item.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="text-[#48CAE4] font-bold">Plan: {item.plan_name || item.plan_id}</span>
                      <span>•</span>
                      <span className="text-amber-300 font-semibold">Method: {item.payment_method_used}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setProofModal({ open: true, item, isZoomed: false })}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border transition ${
                        item.proof_file_url
                          ? 'bg-[#0B132B] border-amber-500/40 text-amber-300 hover:bg-[#1C2541]'
                          : 'bg-[#0B132B] border-[#223156] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      <span>{item.proof_file_url ? 'Review Proof' : 'View Details'}</span>
                    </button>

                    {item.status === 'pending' && (
                      <>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleApprove(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-[#0B132B] hover:bg-emerald-400 disabled:opacity-50 transition"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>{isProcessing ? 'Approving...' : 'Approve VIP'}</span>
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => setRejectModal({ open: true, item, reason: '' })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 disabled:opacity-50 transition"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-[#0B132B] p-2.5 border border-[#1C2541] flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Transaction Hash / Sender Reference:
                    </span>
                    <span className="font-mono text-xs font-bold text-white break-all select-all">
                      {item.transaction_reference}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(item.transaction_reference, item.id)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#111C38] border border-[#223156] px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-400" />
                        <span>Copy Ref</span>
                      </>
                    )}
                  </button>
                </div>

                {item.admin_notes && (
                  <p className="text-[11px] text-slate-400 italic">Note: {item.admin_notes}</p>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* Reject Modal */}
      {rejectModal.open && rejectModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-[#111C38] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-bold text-base text-white">Reject Payment Submission</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Rejecting payment for <strong className="text-white">{rejectModal.item.user_email}</strong>. 
              The subscriber will be notified to review their transaction reference and resubmit.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="e.g. Transaction hash not found on blockchain explorer, sender amount does not match plan price..."
                rows={3}
                className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, item: null, reason: '' })}
                className="rounded-xl border border-[#223156] px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="rounded-xl bg-rose-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-600"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Review Inspection Modal */}
      {proofModal.open && proofModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/85 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-[#3A506B] bg-[#111C38] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1C2541] pb-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  <ShieldCheck className="h-3 w-3" /> Payment Proof Verification
                </div>
                <h3 className="text-base font-black text-white">Reviewing Transaction Submission</h3>
                <p className="text-xs text-slate-300">{proofModal.item.user_email}</p>
              </div>

              <button
                type="button"
                onClick={() => setProofModal({ open: false, item: null, isZoomed: false })}
                className="rounded-xl border border-[#223156] bg-[#0B132B] p-2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Transaction Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-xl bg-[#0B132B] p-2.5 border border-[#1C2541]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Requested Plan</span>
                <span className="font-extrabold text-[#48CAE4]">{proofModal.item.plan_name || proofModal.item.plan_id}</span>
              </div>
              <div className="rounded-xl bg-[#0B132B] p-2.5 border border-[#1C2541]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Method</span>
                <span className="font-extrabold text-amber-300">{proofModal.item.payment_method_used}</span>
              </div>
              <div className="rounded-xl bg-[#0B132B] p-2.5 border border-[#1C2541]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted At</span>
                <span className="font-bold text-slate-200">{new Date(proofModal.item.created_at).toLocaleDateString()}</span>
              </div>
              <div className="rounded-xl bg-[#0B132B] p-2.5 border border-[#1C2541]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                <span className="font-black uppercase text-amber-400">{proofModal.item.status}</span>
              </div>
            </div>

            {/* Reference */}
            <div className="rounded-xl bg-[#0B132B] p-3 border border-[#1C2541] flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Transaction Hash / Sender Reference:
                </span>
                <span className="font-mono text-xs font-bold text-white break-all select-all">
                  {proofModal.item.transaction_reference}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(proofModal.item!.transaction_reference, 'modal-' + proofModal.item!.id)}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#111C38] border border-[#223156] px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white"
              >
                {copiedId === 'modal-' + proofModal.item.id ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Embedded Media Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">Uploaded Receipt / Document:</span>

              {proofModal.item.proof_file_url ? (
                proofModal.item.proof_file_url.toLowerCase().includes('.pdf') ||
                proofModal.item.proof_file_url.startsWith('data:application/pdf') ? (
                  <div className="rounded-2xl border border-[#223156] bg-[#0B132B] p-4 text-center space-y-3">
                    <FileText className="h-10 w-10 text-amber-400 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-white">PDF Document Attached</p>
                      <p className="text-[11px] text-slate-400">Click below to open and inspect the official PDF receipt.</p>
                    </div>
                    <div className="pt-1">
                      <a
                        href={proofModal.item.proof_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#48CAE4] px-4 py-2 text-xs font-bold text-[#0B132B] hover:brightness-110"
                      >
                        <span>Open PDF in New Tab</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-[#223156] bg-[#0B132B] p-2 flex flex-col items-center justify-center overflow-hidden">
                    <div className="w-full flex items-center justify-between pb-2 px-2 text-[11px] text-slate-400 border-b border-[#1C2541] mb-2">
                      <span>Receipt Screenshot</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setProofModal((prev) => ({ ...prev, isZoomed: !prev.isZoomed }))}
                          className="flex items-center gap-1 text-slate-300 hover:text-white"
                        >
                          {proofModal.isZoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
                          <span>{proofModal.isZoomed ? 'Reset View' : 'Zoom'}</span>
                        </button>
                        <a
                          href={proofModal.item.proof_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#48CAE4] hover:underline"
                        >
                          <span>Full Size</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <img
                      src={proofModal.item.proof_file_url}
                      alt="Uploaded Payment Receipt"
                      className={`rounded-xl border border-[#1C2541] transition-all duration-200 select-all ${
                        proofModal.isZoomed ? 'max-h-[75vh] w-auto' : 'max-h-80 w-auto object-contain'
                      }`}
                    />
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-dashed border-[#223156] bg-[#0B132B] p-6 text-center text-slate-400 text-xs space-y-1">
                  <AlertCircle className="h-6 w-6 text-slate-500 mx-auto" />
                  <p className="font-semibold text-slate-300">No Receipt File Uploaded</p>
                  <p className="text-[11px] text-slate-500">The subscriber submitted a text transaction reference without a receipt screenshot.</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1C2541]">
              <button
                type="button"
                onClick={() => setProofModal({ open: false, item: null, isZoomed: false })}
                className="rounded-xl border border-[#223156] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                Close
              </button>

              {proofModal.item.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const itemToReject = proofModal.item!;
                      setProofModal({ open: false, item: null, isZoomed: false });
                      setRejectModal({ open: true, item: itemToReject, reason: '' });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const itemToApprove = proofModal.item!;
                      setProofModal({ open: false, item: null, isZoomed: false });
                      handleApprove(itemToApprove);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-[#0B132B] hover:bg-emerald-400"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve & Activate VIP</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


