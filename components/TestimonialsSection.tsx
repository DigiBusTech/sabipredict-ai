'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquareQuote, Send, Star, X } from 'lucide-react';
import { submitTestimonialAction } from '@/app/actions/growth';
import { Testimonial, UserProfile } from '@/lib/types';

export default function TestimonialsSection({
  testimonials,
  userProfile,
  featuredOnly = false,
}: {
  testimonials: Testimonial[];
  userProfile?: UserProfile | null;
  featuredOnly?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [publicConsent, setPublicConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.set('content', content);
    formData.set('rating', String(rating));
    formData.set('public_consent', String(publicConsent));
    const result = await submitTestimonialAction(formData);
    setSubmitting(false);
    if (!result.success) {
      setMessage(result.error || 'Your review could not be submitted.');
      return;
    }
    setModalOpen(false);
    setContent('');
    setPublicConsent(false);
    setMessage('Your review is submitted for moderation.');
  }

  return (
    <section className="space-y-5" aria-labelledby="testimonials-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#48CAE4]">Member feedback</p>
          <h2 id="testimonials-title" className="mt-1 text-xl font-black text-white">Reviews from the community</h2>
        </div>
        <div className="flex items-center gap-3">
          {featuredOnly && <Link href="/testimonials" className="text-xs font-bold text-[#48CAE4] hover:text-white">All reviews</Link>}
          {userProfile ? (
            <button type="button" onClick={() => setModalOpen(true)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#33415F] px-3 text-xs font-bold text-slate-200 hover:border-[#48CAE4] hover:text-white">
              <MessageSquareQuote className="h-4 w-4" /> Share a review
            </button>
          ) : (
            <Link href="/login?redirect=/testimonials" className="text-xs font-bold text-[#48CAE4] hover:text-white">Sign in to review</Link>
          )}
        </div>
      </div>

      {message && <p role="status" className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">{message}</p>}

      {testimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#33415F] px-4 py-10 text-center text-xs text-slate-400">No published reviews yet.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="flex min-h-48 flex-col rounded-xl border border-[#25314D] bg-[#111C38] p-4">
              <div className="flex gap-1" aria-label={`${testimonial.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < testimonial.rating ? 'fill-amber-300 text-amber-300' : 'text-slate-600'}`} />)}
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">“{testimonial.content}”</p>
              <div className="mt-4 border-t border-[#25314D] pt-3">
                <p className="text-xs font-black text-white">{testimonial.author_name}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{testimonial.role_title}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/85 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !submitting) setModalOpen(false);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" className="w-full max-w-lg rounded-xl border border-[#33415F] bg-[#101A33] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#25314D] px-5 py-4">
              <div><h3 id="review-dialog-title" className="text-sm font-black text-white">Share your experience</h3><p className="mt-1 text-[11px] text-slate-400">Reviews are published after moderation.</p></div>
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} aria-label="Close review form" className="rounded-md p-2 text-slate-400 hover:bg-[#1C2541] hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={submitReview} className="space-y-4 p-5">
              <fieldset>
                <legend className="text-xs font-bold text-slate-300">Your rating</legend>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <button key={index} type="button" onClick={() => setRating(index + 1)} aria-label={`${index + 1} stars`} aria-pressed={rating === index + 1} className="rounded p-1 focus-visible:outline-2 focus-visible:outline-[#48CAE4]">
                      <Star className={`h-5 w-5 ${index < rating ? 'fill-amber-300 text-amber-300' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block text-xs font-bold text-slate-300">Review
                <textarea required minLength={20} maxLength={1500} rows={5} value={content} onChange={(event) => setContent(event.target.value)} placeholder="What has your experience been like?" className="mt-1.5 w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#48CAE4]" />
                <span className="mt-1 block text-right text-[10px] font-normal text-slate-500">{content.length}/1500</span>
              </label>
              <label className="flex items-start gap-2 rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-[11px] leading-relaxed text-slate-300"><input type="checkbox" checked={publicConsent} onChange={(event) => setPublicConsent(event.target.checked)} required className="mt-0.5 accent-[#48CAE4]" /><span>I agree that my account name and review may be published if approved. I understand reviews are personal opinions, not guarantees of betting outcomes.</span></label>
              <button type="submit" disabled={submitting || content.trim().length < 20 || !publicConsent} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B] disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> {submitting ? 'Submitting...' : 'Submit for review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}