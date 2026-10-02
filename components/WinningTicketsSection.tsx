'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Camera, CheckCircle2, Clock3, Eye, ImagePlus, LoaderCircle, Upload, X, XCircle } from 'lucide-react';
import { UserProfile, WinningTicket } from '@/lib/types';

interface WinningTicketsSectionProps {
  selectedDate: string;
  userProfile?: UserProfile | null;
}

function prettyDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WinningTicketsSection({ selectedDate, userProfile }: WinningTicketsSectionProps) {
  const [ticketData, setTicketData] = useState<{ date: string; tickets: WinningTicket[] } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [myTickets, setMyTickets] = useState<WinningTicket[]>([]);
  const [mineLoading, setMineLoading] = useState(false);
  const [mineLoaded, setMineLoaded] = useState(false);
  const [activeTicket, setActiveTicket] = useState<WinningTicket | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [winDate, setWinDate] = useState(selectedDate);
  const [betDate, setBetDate] = useState('');
  const [caption, setCaption] = useState('');
  const [publicConsent, setPublicConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const tickets = ticketData?.date === selectedDate ? ticketData.tickets : [];
  const loading = ticketData?.date !== selectedDate;

  useEffect(() => {
    let active = true;
    fetch(`/api/winning-tickets?date=${selectedDate}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load winning tickets.');
        if (active) setTicketData({ date: selectedDate, tickets: result.data || [] });
      })
      .catch(() => {
        if (active) setTicketData({ date: selectedDate, tickets: [] });
      });

    return () => { active = false; };
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function chooseUploadFile(file: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setFilePreview(previewUrlRef.current);
    setSelectedFile(file);
  }

  async function loadMyTickets() {
    setMineLoading(true);
    try {
      const response = await fetch('/api/winning-tickets?mine=true', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load your tickets.');
      setMyTickets(result.data || []);
      setMineLoaded(true);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not load your tickets.' });
    } finally {
      setMineLoading(false);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Choose an image of your winning ticket.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.set('file', selectedFile);
    formData.set('win_date', winDate);
    formData.set('bet_date', betDate);
    formData.set('caption', caption);
    formData.set('public_consent', String(publicConsent));

    try {
      const response = await fetch('/api/winning-tickets', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ticket upload failed.');

      setMessage({ type: 'success', text: 'Ticket submitted for review.' });
      chooseUploadFile(null);
      setCaption('');
      setBetDate('');
      setPublicConsent(false);
      setShowUpload(false);
      await loadMyTickets();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Ticket upload failed.' });
    } finally {
      setUploading(false);
    }
  }

  function openUpload() {
    const today = new Date().toISOString().slice(0, 10);
    setWinDate(selectedDate > today ? today : selectedDate);
    setMessage(null);
    setShowUpload(true);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#1C2541] bg-[#111C38]" aria-labelledby="winning-tickets-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2541] px-4 py-3 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <h2 id="winning-tickets-heading" className="text-sm font-black text-white">Community Wins</h2>
              <p className="text-[11px] text-slate-400">Winning tickets for {prettyDate(selectedDate)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userProfile ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowMine((value) => !value);
                  if (!mineLoaded) void loadMyTickets();
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#33415F] px-3 text-xs font-bold text-slate-300 transition hover:border-[#48CAE4] hover:text-white"
              >
                <Eye className="h-3.5 w-3.5" /> My tickets
              </button>
              <button
                type="button"
                onClick={openUpload}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 text-xs font-black text-[#08251D] transition hover:bg-emerald-300"
              >
                <ImagePlus className="h-3.5 w-3.5" /> Share a win
              </button>
            </>
          ) : (
            <Link
              href="/login?redirect=/predictions"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 text-xs font-black text-[#08251D] transition hover:bg-emerald-300"
            >
              <Upload className="h-3.5 w-3.5" /> Sign in to share
            </Link>
          )}
        </div>
      </div>

      {message && (
        <div className={`mx-4 mt-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs sm:mx-5 ${
          message.type === 'success'
            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
            : 'border-rose-400/30 bg-rose-400/10 text-rose-200'
        }`} role="status">
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message"><X className="h-4 w-4" /></button>
        </div>
      )}

      {showMine && userProfile && (
        <div className="border-b border-[#1C2541] bg-[#0B132B]/50 px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Your submissions</h3>
            <button type="button" onClick={() => void loadMyTickets()} className="text-[11px] font-bold text-[#48CAE4] hover:text-white">Refresh</button>
          </div>
          {mineLoading ? (
            <p className="text-xs text-slate-400">Loading your tickets...</p>
          ) : myTickets.length === 0 ? (
            <p className="text-xs text-slate-400">No ticket submissions yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {myTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveTicket(ticket)}
                  className="flex items-center gap-3 rounded-lg border border-[#24314E] bg-[#111C38] p-2 text-left transition hover:border-[#48CAE4]"
                >
                  <Image unoptimized src={ticket.image_url} alt="Your uploaded ticket" width={64} height={48} className="h-12 w-16 rounded object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white">Won {prettyDate(ticket.win_date)}</span>
                    <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase ${
                      ticket.status === 'approved' ? 'text-emerald-300' : ticket.status === 'rejected' ? 'text-rose-300' : 'text-amber-300'
                    }`}>
                      {ticket.status === 'approved' ? <CheckCircle2 className="h-3 w-3" /> : ticket.status === 'rejected' ? <XCircle className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                      {ticket.status}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-36 items-center justify-center gap-2 text-xs text-slate-400">
          <LoaderCircle className="h-4 w-4 animate-spin text-emerald-300" /> Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-1 px-4 py-6 text-center">
          <Camera className="mb-1 h-5 w-5 text-slate-500" />
          <p className="text-xs font-bold text-slate-300">No approved tickets for this date</p>
          <p className="text-[11px] text-slate-500">Approved community wins will appear here.</p>
        </div>
      ) : (
        <div className="custom-scrollbar overflow-x-auto px-5 pb-5 pt-4">
          <div className="flex min-w-max items-end py-2">
            {tickets.map((ticket, index) => {
              const rotation = ((index % 5) - 2) * 1.8;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveTicket(ticket)}
                  aria-label={`Open winning ticket from ${prettyDate(ticket.win_date)}${ticket.caption ? `: ${ticket.caption}` : ''}`}
                  className="ticket-stack-card group relative w-52 shrink-0 overflow-hidden rounded-xl border border-[#42506D] bg-[#0B132B] text-left shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 sm:w-60"
                  style={{ '--ticket-rotation': `${rotation}deg`, zIndex: tickets.length - index, marginLeft: index === 0 ? 0 : '-2.5rem' } as React.CSSProperties}
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-[#09101F]">
                    <Image unoptimized fill sizes="(max-width: 640px) 208px, 240px" src={ticket.image_url} alt="Winning bet ticket" className="object-cover transition duration-300 group-hover:scale-105" />
                    <span className="absolute right-2 top-2 rounded-md border border-emerald-300/30 bg-[#071B19]/90 px-2 py-1 text-[10px] font-black uppercase text-emerald-200">
                      Verified win
                    </span>
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-linear-to-t from-[#06110F]/95 to-transparent pb-3 pt-8 text-xs font-black text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <Eye className="h-3.5 w-3.5" /> Open ticket
                    </span>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Won {prettyDate(ticket.win_date)}</p>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-200">{ticket.caption || 'Community winning ticket'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020617]/85 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !uploading) setShowUpload(false);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="ticket-upload-title" className="my-auto w-full max-w-lg rounded-2xl border border-[#33415F] bg-[#101A33] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#25314D] px-5 py-4">
              <div>
                <h3 id="ticket-upload-title" className="text-base font-black text-white">Share a winning ticket</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">Your image stays private until approved.</p>
              </div>
              <button type="button" onClick={() => setShowUpload(false)} disabled={uploading} className="rounded-lg p-2 text-slate-400 hover:bg-[#1C2541] hover:text-white" aria-label="Close upload form">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 p-5">
              <label className="block text-xs font-bold text-slate-300">
                Ticket image <span className="text-rose-300">*</span>
                <span className="mt-1.5 flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#40516E] bg-[#0B132B] text-center transition hover:border-emerald-300">
                  {filePreview ? (
                    <Image unoptimized src={filePreview} alt="Selected ticket preview" width={560} height={224} className="max-h-56 w-full object-contain" />
                  ) : (
                    <span className="flex min-h-32 flex-col items-center justify-center gap-2 px-5 text-slate-400">
                      <ImagePlus className="h-6 w-6 text-emerald-300" />
                      <span>Choose PNG, JPG, or WebP (max 5 MB)</span>
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => chooseUploadFile(event.target.files?.[0] || null)}
                    required={!selectedFile}
                  />
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-300">
                  Win date <span className="text-rose-300">*</span>
                  <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-[#34415E] bg-[#0B132B] px-3">
                    <CalendarDays className="h-4 w-4 shrink-0 text-emerald-300" />
                    <input type="date" required max={new Date().toISOString().slice(0, 10)} value={winDate} onChange={(event) => setWinDate(event.target.value)} className="min-h-10 w-full bg-transparent text-xs text-white outline-none" />
                  </span>
                </label>
                <label className="text-xs font-bold text-slate-300">
                  Bet placed date <span className="font-normal text-slate-500">(optional)</span>
                  <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-[#34415E] bg-[#0B132B] px-3">
                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                    <input type="date" max={winDate} value={betDate} onChange={(event) => setBetDate(event.target.value)} className="min-h-10 w-full bg-transparent text-xs text-white outline-none" />
                  </span>
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-300">
                Caption <span className="font-normal text-slate-500">(optional, up to 240 characters)</span>
                <input maxLength={240} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="A short note about the win" className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-emerald-300" />
              </label>

              <label className="flex items-start gap-2.5 rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-[11px] leading-relaxed text-slate-300">
                <input type="checkbox" checked={publicConsent} onChange={(event) => setPublicConsent(event.target.checked)} required className="mt-0.5 accent-emerald-400" />
                <span>I agree that this ticket image may be shown publicly if approved. I have hidden account details, barcodes, and other sensitive information.</span>
              </label>

              <button type="submit" disabled={uploading || !publicConsent} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-xs font-black text-[#08251D] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
                {uploading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Submit for review</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTicket && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#020617]/90 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActiveTicket(null);
        }}>
          <div role="dialog" aria-modal="true" aria-label="Winning ticket image" className="relative max-h-[92vh] w-full max-w-4xl rounded-xl border border-[#33415F] bg-[#0B132B] p-2 shadow-2xl sm:p-3">
            <button type="button" onClick={() => setActiveTicket(null)} className="absolute -right-2 -top-2 z-10 rounded-full border border-[#52617D] bg-[#111C38] p-2 text-white hover:bg-[#25314D]" aria-label="Close ticket viewer">
              <X className="h-4 w-4" />
            </button>
            <Image unoptimized src={activeTicket.image_url} alt="Full winning ticket" width={1280} height={960} className="max-h-[78vh] w-full rounded-lg object-contain" />
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-3">
              <p className="text-xs font-bold text-emerald-300">Won {prettyDate(activeTicket.win_date)}</p>
              {activeTicket.caption && <p className="text-xs text-slate-300">{activeTicket.caption}</p>}
              {activeTicket.status === 'rejected' && activeTicket.moderation_note && <p className="basis-full text-xs text-rose-300">Review note: {activeTicket.moderation_note}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}