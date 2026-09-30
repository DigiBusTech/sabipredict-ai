'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Crown, TrendingUp, X } from 'lucide-react';
import { generateRandomSocialProof, SocialProofNotification } from '@/lib/socialProofData';

export default function SocialProofToast() {
  const pathname = usePathname();
  const [notification, setNotification] = useState<SocialProofNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissedForSession, setIsDismissedForSession] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically disable across all admin routes
  const isAdminRoute = Boolean(pathname?.startsWith('/admin'));

  // Check session storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const dismissed = sessionStorage.getItem('sabipredicts_hide_social_proof') === 'true';
        if (dismissed) {
          setIsDismissedForSession(true);
        }
      } catch {
        // sessionStorage may be blocked in strict privacy modes
      }
    }
  }, []);

  // Dismiss logic for user clicking (✕)
  const handleSessionClose = useCallback(() => {
    setIsVisible(false);
    setIsDismissedForSession(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('sabipredicts_hide_social_proof', 'true');
      } catch {
        // Fallback for sandboxed environments
      }
    }
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (nextToastTimerRef.current) clearTimeout(nextToastTimerRef.current);
  }, []);

  // Schedule the next toast after a random interval between 12s and 25s
  const scheduleNextToast = useCallback(() => {
    if (nextToastTimerRef.current) clearTimeout(nextToastTimerRef.current);

    const randomInterval = Math.floor(Math.random() * (25000 - 12000 + 1)) + 12000;
    nextToastTimerRef.current = setTimeout(() => {
      const nextNotif = generateRandomSocialProof();
      setNotification(nextNotif);
      setIsVisible(true);
    }, randomInterval);
  }, []);

  // Start auto-dismiss timer (6 seconds)
  const startDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      scheduleNextToast();
    }, 6000);
  }, [scheduleNextToast]);

  // Initial display timer on mount (5s delay so page loads cleanly)
  useEffect(() => {
    if (isDismissedForSession || isAdminRoute) return;

    const initialDelayTimer = setTimeout(() => {
      const initialNotif = generateRandomSocialProof();
      setNotification(initialNotif);
      setIsVisible(true);
    }, 5000);

    return () => {
      clearTimeout(initialDelayTimer);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (nextToastTimerRef.current) clearTimeout(nextToastTimerRef.current);
    };
  }, [isDismissedForSession, isAdminRoute]);

  // Auto-dismiss management when visibility changes or hover state updates
  useEffect(() => {
    if (isVisible && !isHovered) {
      startDismissTimer();
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [isVisible, isHovered, startDismissTimer]);

  // Hover handlers to pause auto-dismiss
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isVisible) {
      startDismissTimer();
    }
  };

  // If dismissed for session, or on admin route, or no notification yet, render nothing
  if (isDismissedForSession || isAdminRoute || !notification) {
    return null;
  }

  const isVip = notification.iconType === 'vip';

  return (
    <aside
      aria-live="polite"
      aria-label="Live Activity Notification"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

