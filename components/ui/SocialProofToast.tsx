'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Crown, TrendingUp, X } from 'lucide-react';
import { generateRandomSocialProof, SocialProofNotification } from '@/lib/socialProofData';

const INITIAL_DELAY_MS = 8_000;
const DISPLAY_DURATION_MS = 5_500;
const MIN_INTERVAL_MS = 25_000;
const MAX_INTERVAL_MS = 40_000;

type PauseReason = 'pointer' | 'focus' | 'hidden' | 'modal';

export default function SocialProofToast() {
  const pathname = usePathname();
  const [notification, setNotification] = useState<SocialProofNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissedForSession, setIsDismissedForSession] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerDeadlineRef = useRef<number | null>(null);
  const remainingTimeRef = useRef<number | null>(null);
  const scheduledActionRef = useRef<(() => void) | null>(null);
  const pauseReasonsRef = useRef(new Set<PauseReason>());
  const dismissedRef = useRef(false);
  const showNextRef = useRef<() => void>(() => {});

  const isAdminRoute = Boolean(pathname?.startsWith('/admin'));

  useEffect(() => {
    try {
      dismissedRef.current = sessionStorage.getItem('sabipredicts_hide_social_proof') === 'true';
    } catch {
      dismissedRef.current = false;
    }
  }, []);

  const clearScheduledTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    timerDeadlineRef.current = null;
    remainingTimeRef.current = null;
    scheduledActionRef.current = null;
  }, []);

  const scheduleTimer = useCallback((action: () => void, delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    scheduledActionRef.current = action;
    remainingTimeRef.current = delay;

    if (pauseReasonsRef.current.size > 0) return;

    timerDeadlineRef.current = Date.now() + delay;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      timerDeadlineRef.current = null;
      remainingTimeRef.current = null;
      const nextAction = scheduledActionRef.current;
      scheduledActionRef.current = null;
      nextAction?.();
    }, delay);
  }, []);

  const pauseTimer = useCallback((reason: PauseReason) => {
    const reasons = pauseReasonsRef.current;
    if (reasons.has(reason)) return;
    const wasRunning = reasons.size === 0;
    reasons.add(reason);

    if (wasRunning && timerRef.current) {
      remainingTimeRef.current = Math.max(0, (timerDeadlineRef.current || Date.now()) - Date.now());
      clearTimeout(timerRef.current);
      timerRef.current = null;
      timerDeadlineRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback((reason: PauseReason) => {
    const reasons = pauseReasonsRef.current;
    reasons.delete(reason);
    if (reasons.size > 0 || !scheduledActionRef.current || remainingTimeRef.current === null) return;

    scheduleTimer(scheduledActionRef.current, remainingTimeRef.current);
  }, [scheduleTimer]);

  const showNext = useCallback(() => {
    setNotification(generateRandomSocialProof());
    setIsVisible(true);
    scheduleTimer(() => {
      setIsVisible(false);
      const nextInterval = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
      scheduleTimer(() => showNextRef.current(), nextInterval);
    }, DISPLAY_DURATION_MS);
  }, [scheduleTimer]);

  useEffect(() => {
    showNextRef.current = showNext;
  }, [showNext]);

  useEffect(() => {
    if (isDismissedForSession || dismissedRef.current || isAdminRoute) return;
    scheduleTimer(() => showNextRef.current(), INITIAL_DELAY_MS);
    return clearScheduledTimer;
  }, [clearScheduledTimer, isAdminRoute, isDismissedForSession, scheduleTimer]);

  useEffect(() => {
    const syncPageVisibility = () => {
      if (document.visibilityState === 'hidden') pauseTimer('hidden');
      else resumeTimer('hidden');
    };

    syncPageVisibility();
    document.addEventListener('visibilitychange', syncPageVisibility);
    return () => document.removeEventListener('visibilitychange', syncPageVisibility);
  }, [pauseTimer, resumeTimer]);

  useEffect(() => {
    const syncModalVisibility = () => {
      if (document.querySelector('[aria-modal="true"], dialog[open]')) pauseTimer('modal');
      else resumeTimer('modal');
    };

    syncModalVisibility();
    const observer = new MutationObserver(syncModalVisibility);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-modal', 'open'],
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [pauseTimer, resumeTimer]);

  const handleSessionClose = useCallback(() => {
    dismissedRef.current = true;
    setIsVisible(false);
    setIsDismissedForSession(true);
    try {
      sessionStorage.setItem('sabipredicts_hide_social_proof', 'true');
    } catch {
      // Session storage may be unavailable in restricted browser contexts.
    }
    clearScheduledTimer();
  }, [clearScheduledTimer]);

  if (isDismissedForSession || isAdminRoute || !notification) {
    return null;
  }

  const isVip = notification.iconType === 'vip';

  return (
    <aside
      aria-live="polite"
      aria-atomic="true"
      aria-label="Live Activity Notification"
      onPointerEnter={() => pauseTimer('pointer')}
      onPointerLeave={() => resumeTimer('pointer')}
      onFocusCapture={() => pauseTimer('focus')}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) resumeTimer('focus');
      }}
      className={`fixed z-40 bottom-20 left-4 right-4 sm:right-auto sm:left-6 md:bottom-6 md:left-6 max-w-sm transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border bg-slate-900/90 backdrop-blur-md p-3.5 shadow-2xl transition-all ${
          isVip
            ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
            : 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
        }`}
      >
        {/* Glowing top accent border */}
        <div
          className={`absolute top-0 left-0 right-0 h-0.5 ${
            isVip
              ? 'bg-linear-to-r from-amber-500 via-yellow-400 to-amber-600'
              : 'bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600'
          }`}
        />

        <div className="flex items-start gap-3">
          {/* Glowing Avatar / Icon Badge */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner ${
              isVip
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isVip ? (
              <Crown className="h-5 w-5 stroke-[2.2]" />
            ) : (
              <TrendingUp className="h-5 w-5 stroke-[2.2]" />
            )}
          </div>

          {/* Notification Content */}
          <div className="min-w-0 flex-1 space-y-0.5 pr-4">
            {/* User & Country */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
              <span className="text-sm leading-none" role="img" aria-label={notification.country}>
                {notification.flag}
              </span>
              <span className="truncate">{notification.name}</span>
              <span className="text-[10px] text-slate-400 font-normal truncate">• {notification.country}</span>
            </div>

            {/* Action Text */}
            <p className="text-xs text-slate-200 leading-snug">
              {notification.action}
            </p>

            {/* Detail & Time row */}
            <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
              {notification.detail && (
                <span className="font-mono text-cyan-300/90 truncate max-w-[210px] sm:max-w-[250px]">
                  {notification.detail}
                </span>
              )}
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{notification.time}</span>
              </span>
            </div>
          </div>

          {/* Session Close Button */}
          <button
            type="button"
            onClick={handleSessionClose}
            aria-label="Dismiss notifications"
            className="absolute top-2.5 right-2.5 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

