'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, Lock, Mail, User, AlertCircle, CheckCircle2, 
  ArrowRight, Eye, EyeOff, Check, Loader2
} from 'lucide-react';
import { signUpAction } from '@/app/actions/auth';

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password visibility & confirmation state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const hasMinLength = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append('confirmPassword', confirmPassword);
    formData.append('referralCode', new URLSearchParams(window.location.search).get('ref') || '');

    const res = await signUpAction(formData);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(res.message || 'Account created! Please check your email or log in.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-cyan-600 via-cyan-500 to-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 mb-3.5">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Join SabiPredict AI</h1>
          <p className="text-xs text-slate-400 mt-1">Access daily algorithmic quantitative football predictions</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-300 animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-1.5">
              <span className="font-semibold block">{success}</span>
              <div className="pt-1">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-black text-slate-950 hover:bg-cyan-400 transition"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="fullName"
                required
                placeholder="Alex Sterling"
                className="w-full rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none pl-10 pr-3.5 py-2.5 text-xs sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
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

          {/* Password with View Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Password
              </label>
              <span className={`text-[10px] font-mono flex items-center gap-1 ${hasMinLength ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                {hasMinLength ? <Check className="h-3 w-3 stroke-3" /> : '•'} Min. 6 chars
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create strong password"
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

          {/* Confirm Password with View Toggle & Match Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Confirm Password
              </label>
              {passwordsMatch && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <Check className="h-3 w-3 stroke-3" /> Passwords match
                </span>
              )}
              {passwordsMismatch && (
                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1 animate-in fade-in">
                  ✗ Passwords do not match
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
                passwordsMatch ? 'text-emerald-400' : 'text-slate-400'
              }`} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`w-full rounded-xl bg-slate-800/90 border pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 transition-all focus:outline-none ${
                  passwordsMatch
                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    : passwordsMismatch
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (confirmPassword.length > 0 && !passwordsMatch)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 mt-3 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
          Already registered?{' '}
          <Link href="/login" className="font-extrabold text-cyan-400 hover:underline">
            Sign In Here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
