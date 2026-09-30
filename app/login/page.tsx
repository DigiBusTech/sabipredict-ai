'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInAction } from '@/app/actions/auth';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('redirect', redirectTo);

    const res = await signInAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-cyan-600 via-cyan-500 to-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 mb-3.5">
          <Activity className="h-6 w-6 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-400 mt-1">Sign in to your SabiPredict AI account</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              name="email"
              required
              placeholder="analyst@example.com"
              className="w-full rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none pl-10 pr-3.5 py-2.5 text-xs sm:text-sm transition-all"
            />
          </div>
        </div>

        {/* Password Field with Visibility Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="Enter your password"
              className="w-full rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none pl-10 pr-10 py-2.5 text-xs sm:text-sm transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 mt-3 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-extrabold text-cyan-400 hover:underline">
          Create Free Account &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading auth...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}


