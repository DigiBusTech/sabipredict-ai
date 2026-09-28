'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { signInAction } from '@/app/actions/auth';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="w-full max-w-md rounded-2xl border border-[#1C2541] bg-[#111C38] p-6 sm:p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-[#3A506B] to-[#48CAE4] text-[#0B132B] mb-3">
          <Activity className="h-6 w-6 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black text-white">Welcome Back</h1>
        <p className="text-xs text-slate-400 mt-1">Sign in to your SabiPredict AI account</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="email"
              name="email"
              required
              placeholder="analyst@example.com"
              className="w-full rounded-xl border border-[#223156] bg-[#0B132B] pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#48CAE4] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#223156] bg-[#0B132B] pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#48CAE4] focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#48CAE4] py-2.5 text-xs font-bold text-[#0B132B] hover:bg-[#00B4D8] transition-all disabled:opacity-50 mt-2"
        >
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400 border-t border-[#1C2541] pt-4">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-bold text-[#48CAE4] hover:underline">
          Create Free Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading auth...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

