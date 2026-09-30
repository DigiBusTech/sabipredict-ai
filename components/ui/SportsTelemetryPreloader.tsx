'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Sparkles, Terminal } from 'lucide-react';

interface SportsTelemetryPreloaderProps {
  variant?: 'fullscreen' | 'compact';
  message?: string;
  className?: string;
}

const DEFAULT_MESSAGES = [
  'Ingesting Live Sports Telemetry...',
  'Computing Poisson Goal Matrices...',
  'Analyzing +EV Odds Discrepancies...',
  'Finalizing AI Confidence Scores...',
];

export default function SportsTelemetryPreloader({
  variant = 'fullscreen',
  message,
  className = '',
}: SportsTelemetryPreloaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 1800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 20;
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 400);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const activeMessage = message || DEFAULT_MESSAGES[msgIndex];

  // Compact Variant (Inline for cards, admin moderation, or fetch hooks)
  if (variant === 'compact') {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-[#48CAE4]/30 bg-[#0B132B]/95 p-4 text-xs shadow-xl backdrop-blur-md ${className}`}>
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,255,247,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mini Radar Indicator */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#48CAE4]/40 bg-[#111C38] overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full border border-[#48CAE4]/30" />
                <div className="absolute h-8 w-8 rounded-full border border-[#48CAE4]/20" />
              </div>
              {/* Sweep Line */}
              <div className="absolute inset-0 flex items-center justify-center animate-radar-sweep">
                <div className="h-1/2 w-0.5 bg-linear-to-t from-[#48CAE4] to-transparent origin-bottom" />
              </div>
              <Activity className="relative z-10 h-4 w-4 text-[#48CAE4]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  AI TELEMETRY STREAM
                </span>
              </div>
              <p className="font-bold text-white text-xs mt-0.5">
                {activeMessage}
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-[11px] font-bold text-[#48CAE4]">
            {Math.min(99, progress)}%
          </div>
        </div>

        {/* Compact Glow Progress Bar */}
        <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1C2541]">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#48CAE4] via-cyan-400 to-[#10B981] transition-all duration-300 shadow-[0_0_12px_rgba(72,202,228,0.6)]"
            style={{ width: `${Math.min(99, progress)}%` }}
          />
        </div>
      </div>
    );
  }

  // Fullscreen Variant (Route transitions & Initial App Loads)
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B132B] p-4 text-center select-none overflow-hidden ${className}`}>
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1C2541_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Tactical Corner HUD Brackets */}
      <div className="absolute top-6 left-6 font-mono text-[10px] text-slate-500 text-left space-y-0.5 hidden sm:block">
        <div className="text-[#48CAE4] font-bold flex items-center gap-1.5">
          <Terminal className="h-3 w-3" />
          <span>SABIPREDICT QUANT v4.2</span>
        </div>
        <div>LATENCY: 12ms • NODES: 1,024 ACTIVE</div>
        <div>CALC ENGINE: POISSON xG TELEMETRY</div>
      </div>

      <div className="absolute top-6 right-6 font-mono text-[10px] text-slate-500 text-right space-y-0.5 hidden sm:block">
        <div className="text-emerald-400 font-bold flex items-center justify-end gap-1.5">
          <Cpu className="h-3 w-3" />
          <span>FEED: SPORTSMONKS-v3 / ODDS-v4</span>
        </div>
        <div>SAMPLING: 10,000 MONTE CARLO SIMS</div>
        <div>CONFIDENCE FLOOR: 80% +EV</div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full space-y-6">
        {/* Interactive Tactical Football Pitch / Radar HUD */}
        <div className="relative flex h-56 w-56 sm:h-64 sm:w-64 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#48CAE4]/10 blur-xl animate-pulse" />

          {/* SVG Tactical Radar & Pitch Grid */}
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full drop-shadow-[0_0_20px_rgba(72,202,228,0.25)]"
          >
            {/* Concentric Radar Rings */}
            <circle cx="100" cy="100" r="95" fill="#111C38" stroke="#1C2541" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="#223156" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="45" fill="none" stroke="#223156" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="100" cy="100" r="20" fill="none" stroke="#3A506B" strokeWidth="1" />

            {/* Radar Crosshairs */}
            <line x1="100" y1="5" x2="100" y2="195" stroke="#1C2541" strokeWidth="1" />
            <line x1="5" y1="100" x2="195" y2="100" stroke="#1C2541" strokeWidth="1" />

            {/* Tactical Football Pitch Markings Overlay */}
            <rect x="35" y="30" width="130" height="140" fill="none" stroke="#223156" strokeWidth="1" rx="4" />
            <line x1="35" y1="100" x2="165" y2="100" stroke="#3A506B" strokeWidth="1" />
            <circle cx="100" cy="100" r="18" fill="none" stroke="#3A506B" strokeWidth="1" />
            <rect x="65" y="30" width="70" height="28" fill="none" stroke="#223156" strokeWidth="1" />
            <rect x="80" y="30" width="40" height="12" fill="none" stroke="#223156" strokeWidth="0.8" />
            <rect x="65" y="142" width="70" height="28" fill="none" stroke="#223156" strokeWidth="1" />
            <rect x="80" y="158" width="40" height="12" fill="none" stroke="#223156" strokeWidth="0.8" />

            {/* Pulsing Telemetry Data Nodes */}
            <g className="animate-pulse-glow" style={{ animationDelay: '0s' }}>
              <circle cx="95" cy="52" r="5" fill="#48CAE4" fillOpacity="0.4" />
              <circle cx="95" cy="52" r="2.5" fill="#48CAE4" />
              <text x="105" y="55" fill="#48CAE4" fontSize="6" fontFamily="monospace" fontWeight="bold">xG: 2.14</text>
            </g>

            <g className="animate-pulse-glow" style={{ animationDelay: '0.6s' }}>
              <circle cx="130" cy="90" r="5" fill="#10B981" fillOpacity="0.4" />
              <circle cx="130" cy="90" r="2.5" fill="#10B981" />
              <text x="110" y="103" fill="#10B981" fontSize="6" fontFamily="monospace" fontWeight="bold">+EV +14.2%</text>
            </g>

            <g className="animate-pulse-glow" style={{ animationDelay: '1.2s' }}>
              <circle cx="68" cy="130" r="5" fill="#F59E0B" fillOpacity="0.4" />
              <circle cx="68" cy="130" r="2.5" fill="#F59E0B" />
              <text x="76" y="133" fill="#F59E0B" fontSize="6" fontFamily="monospace" fontWeight="bold">λ: 1.82</text>
            </g>

            {/* Rotating Radar Sweep Beam */}
            <g className="animate-radar-sweep origin-center">
              <defs>
                <linearGradient id="sweepGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#48CAE4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#48CAE4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="100" y1="100" x2="100" y2="5" stroke="#48CAE4" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M 100 100 L 100 5 A 95 95 0 0 1 175 40 Z"
                fill="url(#sweepGradient)"
                opacity="0.35"
              />
            </g>
          </svg>

          {/* Center Activity Beacon */}
          <div className="absolute flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B132B] border border-[#48CAE4] text-[#48CAE4] shadow-lg shadow-[#48CAE4]/30">
            <Activity className="h-4 w-4" />
          </div>
        </div>

        {/* Dynamic Telemetry Ticker */}
        <div className="space-y-2 w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#48CAE4]/30 bg-[#111C38] px-3.5 py-1 text-xs font-bold text-[#48CAE4]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#48CAE4] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#48CAE4]" />
            </span>
            <span className="font-mono tracking-wider text-[11px]">QUANTITATIVE CORE PROCESSING</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white tracking-wide min-h-[28px] transition-all duration-300">
            {activeMessage}
          </h3>

          <p className="text-xs text-slate-400 font-mono">
            Synchronizing live odds spreads, Poisson probabilities & predictive edge
          </p>
        </div>

        {/* Glow Progress Bar */}
        <div className="w-full space-y-1.5">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#111C38] border border-[#1C2541] p-0.5">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#48CAE4] via-cyan-400 to-[#10B981] transition-all duration-300 shadow-[0_0_16px_rgba(72,202,228,0.7)]"
              style={{ width: `${Math.min(99, progress)}%` }}
            />
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 px-1">
            <span>MODEL CONVERGENCE</span>
            <span className="text-[#48CAE4] font-bold">{Math.min(99, progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
