'use client';

import React, { useState } from 'react';
import { Cpu, Sparkles, Terminal, Check } from 'lucide-react';
import { AILLMSettings } from '@/lib/types';
import { saveAILLMSettingsAction } from '@/app/actions/settings';

export default function AiTab({ initialSettings }: { initialSettings: AILLMSettings | null }) {
  const [provider, setProvider] = useState<'groq' | 'gemini'>(initialSettings?.active_provider || 'groq');
  const [model, setModel] = useState(initialSettings?.model || 'llama-3.3-70b-versatile');
  const [groqKey, setGroqKey] = useState(initialSettings?.groq_api_key || '');
  const [geminiKey, setGeminiKey] = useState(initialSettings?.gemini_api_key || '');
  const [systemPrompt, setSystemPrompt] = useState(
    initialSettings?.system_prompt ||
      'You are SabiPredict AI, an elite quantitative sports betting analyst. Evaluate the football fixture using Poisson expected goals (xG), recent team form, and head-to-head records. Propose a high-value betting market (e.g., Over 2.5 Goals, Home Win, Both Teams to Score) with estimated odds, probability, and a concise tactical rationale paragraph explaining why the selection has positive expected value (+EV).'
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await saveAILLMSettingsAction({
        active_provider: provider,
        model,
        groq_api_key: groqKey,
        gemini_api_key: geminiKey,
        system_prompt: systemPrompt,
      });
      setMsg(res.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-5 space-y-4 text-xs">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-[#48CAE4]/20 text-[#48CAE4]">
          <Cpu className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">AI Engine & LLM Configuration</h3>
          <p className="text-slate-400">Select active AI model and customize quantitative prompt templates.</p>
        </div>
      </div>

      <div>
        <label className="text-slate-300 font-semibold block mb-1">Active LLM Provider</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setProvider('groq');
              setModel('llama-3.3-70b-versatile');
            }}
            className={`rounded-xl px-4 py-2 font-bold ${
              provider === 'groq' ? 'bg-[#48CAE4] text-[#0B132B]' : 'bg-[#0B132B] text-slate-400 border border-[#223156]'
            }`}
          >
            Groq (Llama 3.3 70B Fast)
          </button>
          <button
            type="button"
            onClick={() => {
              setProvider('gemini');
              setModel('gemini-1.5-pro');
            }}
            className={`rounded-xl px-4 py-2 font-bold ${
              provider === 'gemini' ? 'bg-[#48CAE4] text-[#0B132B]' : 'bg-[#0B132B] text-slate-400 border border-[#223156]'
            }`}
          >
            Google Gemini 1.5 Pro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">Model Name</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono"
          />
        </div>

        {provider === 'groq' ? (
          <div>
            <label className="text-slate-400 block mb-1">Groq API Key</label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono"
            />
          </div>
        ) : (
          <div>
            <label className="text-slate-400 block mb-1">Gemini API Key</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono"
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-slate-300 font-semibold block mb-1">System Prompt (AI Prediction Prompt)</label>
        <p className="text-[11px] text-slate-400 mb-2">
          This prompt instructs the LLM how to parse fixtures, calculate expected value ($+EV$), and format market picks.
        </p>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
          className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-3 text-white font-mono text-[11px] leading-relaxed"
        />
      </div>

      {msg && <p className="text-emerald-400">{msg}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#48CAE4] px-4 py-2 font-bold text-[#0B132B] disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save AI Settings'}
        </button>
      </div>
    </form>
  );
}
