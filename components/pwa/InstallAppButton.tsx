'use client';

import React from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { usePwa } from './PwaContext';

interface InstallAppButtonProps {
  variant?: 'primary' | 'secondary' | 'nav';
  className?: string;
}

export default function InstallAppButton({
  variant = 'primary',
  className = '',
}: InstallAppButtonProps) {
  const { promptInstall, isInstalled } = usePwa();

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>App Installed</span>
      </span>
    );
  }

  if (variant === 'nav') {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#48CAE4] hover:bg-[#1C2541] border border-[#3A506B]/50 transition ${className}`}
      >
        <Download className="h-3.5 w-3.5" />
        <span>Download App</span>
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className={`w-full flex items-center justify-center gap-2 rounded-xl bg-[#1C2541] border border-[#3A506B] px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:border-[#48CAE4] transition ${className}`}
      >
        <Smartphone className="h-4 w-4 text-[#48CAE4]" />
        <span>Download Mobile App</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={promptInstall}
      className={`inline-flex items-center gap-2 rounded-xl bg-[#48CAE4] px-4 py-2 text-xs font-black text-[#0B132B] hover:bg-[#00B4D8] shadow-md transition ${className}`}
    >
      <Download className="h-4 w-4" />
      <span>Download App</span>
    </button>
  );
}

