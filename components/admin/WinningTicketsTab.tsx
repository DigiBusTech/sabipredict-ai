'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, Clock3, Image as ImageIcon, LoaderCircle, RefreshCw, Trash2, X, XCircle } from 'lucide-react';
import { WinningTicket, WinningTicketStatus } from '@/lib/types';

type TicketFilter = WinningTicketStatus | 'all';

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function WinningTicketsTab({ initialTickets = [] }: { initialTickets?: WinningTicket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState<TicketFilter>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const counts = {
    pending: tickets.filter((ticket) => ticket.status === 'pending').length,
    approved: tickets.filter((ticket) => ticket.status === 'approved').length,
    rejected: tickets.filter((ticket) => ticket.status === 'rejected').length,
  };
  const filteredTickets = tickets.filter((ticket) => filter === 'all' || ticket.status === filter);

  async function refreshTickets() {
    setProcessingId('refresh');
    setFeedback(null);
    try {
      const response = await fetch('/api/winning-tickets?admin=true', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load winning tickets.');
      setTickets(result.data || []);
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Could not load winning tickets.' });
    } finally {
      setProcessingId(null);
    }
  }

  async function moderate(ticket: WinningTicket, status: 'approved' | 'rejected') {
    const moderationNote = status === 'rejected' ? window.prompt('Optional note for the uploader:', '') : null;
    if (status === 'rejected' && moderationNote === null) return;

    setProcessingId(ticket.id);
    setFeedback(null);
    try {
      const response = await fetch('/api/winning-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticket.id, status, moderation_note: moderationNote || '' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ticket could not be updated.');
      setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, ...result.data } : item));
      setFeedback({ type: 'success', text: `Ticket ${status}.` });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Ticket could not be updated.' });
    } finally {
      setProcessingId(null);
    }
  }

  async function removeTicket(ticket: WinningTicket) {
    if (!window.confirm('Permanently remove this ticket and its image?')) return;
    setProcessingId(ticket.id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/winning-tickets?id=${ticket.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ticket could not be removed.');
      setTickets((current) => current.filter((item) => item.id !== ticket.id));
      setFeedback({ type: 'success', text: 'Ticket and image removed.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Ticket could not be removed.' });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-amber-400/25 bg-[#111C38] p-4">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting review</p><p className="mt-1 text-xl font-black text-amber-300">{counts.pending}</p></div>
          <Clock3 className="h-5 w-5 text-amber-300" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-emerald-400/25 bg-[#111C38] p-4">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved</p><p className="mt-1 text-xl font-black text-emerald-300">{counts.approved}</p></div>
          <Check className="h-5 w-5 text-emerald-300" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-rose-400/25 bg-[#111C38] p-4">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rejected</p><p className="mt-1 text-xl font-black text-rose-300">{counts.rejected}</p></div>
          <XCircle className="h-5 w-5 text-rose-300" />
        </div>
      </div>

      {feedback && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${feedback.type === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/30 bg-rose-400/10 text-rose-200'}`} role="status">
          {feedback.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2541] pb-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-[#1C2541] bg-[#111C38] p-1">
          {(['pending', 'approved', 'rejected', 'all'] as TicketFilter[]).map((status) => (
            <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold capitalize transition ${filter === status ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'}`}>
              {status === 'all' ? `All (${tickets.length})` : `${status} (${counts[status]})`}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void refreshTickets()} disabled={processingId === 'refresh'} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#33415F] px-3 text-xs font-bold text-slate-300 hover:border-[#48CAE4] hover:text-white disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${processingId === 'refresh' ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#33415F] px-5 py-12 text-center">
          <ImageIcon className="mx-auto mb-2 h-6 w-6 text-slate-500" />
          <p className="text-xs font-bold text-slate-300">No {filter === 'all' ? '' : `${filter} `}tickets</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTickets.map((ticket) => {
            const isProcessing = processingId === ticket.id;
            return (
              <article key={ticket.id} className="overflow-hidden rounded-xl border border-[#1C2541] bg-[#111C38]">
                <a href={ticket.image_url} target="_blank" rel="noreferrer" className="block bg-[#080E1D]" aria-label="Open ticket image in a new tab">
                  <Image unoptimized src={ticket.image_url} alt="Submitted winning ticket" width={960} height={540} className="h-56 w-full object-contain" />
                </a>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-white">Won {formatDate(ticket.win_date)}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {ticket.user_name || ticket.user_email || 'User'}{ticket.user_name && ticket.user_email ? ` · ${ticket.user_email}` : ''}
                      </p>
                      {ticket.bet_date && <p className="mt-1 text-[10px] text-slate-500">Bet placed {formatDate(ticket.bet_date)}</p>}
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase ${ticket.status === 'approved' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : ticket.status === 'rejected' ? 'border-rose-400/30 bg-rose-400/10 text-rose-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  {ticket.caption && <p className="text-xs text-slate-300">{ticket.caption}</p>}
                  {ticket.moderation_note && <p className="rounded-md bg-[#0B132B] px-3 py-2 text-[11px] text-slate-400">Note: {ticket.moderation_note}</p>}
                  <div className="flex flex-wrap gap-2 border-t border-[#25314D] pt-3">
                    {ticket.status !== 'approved' && (
                      <button type="button" onClick={() => void moderate(ticket, 'approved')} disabled={isProcessing} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 text-[11px] font-black text-[#08251D] hover:bg-emerald-300 disabled:opacity-50">
                        {isProcessing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                      </button>
                    )}
                    {ticket.status !== 'rejected' && (
                      <button type="button" onClick={() => void moderate(ticket, 'rejected')} disabled={isProcessing} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/30 px-3 text-[11px] font-bold text-rose-300 hover:bg-rose-400/10 disabled:opacity-50">
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    )}
                    <button type="button" onClick={() => void removeTicket(ticket)} disabled={isProcessing} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#33415F] px-3 text-[11px] font-bold text-slate-400 hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}