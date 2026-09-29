'use client';

import React, { useState } from 'react';
import { Palette, Upload, Image as ImageIcon, Sparkles, Check, Globe } from 'lucide-react';
import { SiteBrandingSettings } from '@/lib/types';
import { saveSiteBrandingAction, uploadBrandingAssetAction } from '@/app/actions/settings';

export default function BrandingTab({
  initialSettings,
}: {
  initialSettings?: SiteBrandingSettings | null;
}) {
  const [siteName, setSiteName] = useState(initialSettings?.site_name || 'SabiPredict AI');
  const [siteTagline, setSiteTagline] = useState(
    initialSettings?.site_tagline || 'Quantitative Football Intelligence & Predictive xG Analytics'
  );
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url || '');
  const [faviconUrl, setFaviconUrl] = useState(initialSettings?.favicon_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await uploadBrandingAssetAction(formData);
      if (res.success && res.url) {
        if (type === 'logo') setLogoUrl(res.url);
        else setFaviconUrl(res.url);
        setMsg({ type: 'success', text: res.message || `${type} uploaded.` });
      } else {
        setMsg({ type: 'error', text: res.error || 'Upload failed.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'File upload error.' });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveSiteBrandingAction({
        site_name: siteName,
        site_tagline: siteTagline,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
      });
      setMsg({ type: 'success', text: res.message });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save branding settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-5 space-y-6 text-xs">
        <div className="flex items-center justify-between border-b border-[#1C2541] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#48CAE4]/20 text-[#48CAE4]">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Global Site Branding & Assets</h3>
              <p className="text-slate-400 text-[11px]">Manage dynamically served Logo, Favicon, and Site Meta Information.</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-mono text-[#48CAE4] bg-[#0B132B] px-3 py-1 rounded-xl border border-[#223156]">
            <Globe className="h-3.5 w-3.5" /> Supabase Storage
          </span>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Site Title</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. SabiPredict AI"
              required
              className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Tagline</label>
            <input
              type="text"
              value={siteTagline}
              onChange={(e) => setSiteTagline(e.target.value)}
              placeholder="e.g. Quantitative Football Intelligence"
              className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Logo Configuration */}
        <div className="rounded-2xl border border-[#223156] bg-[#0B132B]/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-[#48CAE4]" /> Site Logo
            </span>
            <span className="text-[10px] text-slate-400">PNG, SVG, or WEBP (Recommended: 240x60px)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-16 w-36 shrink-0 items-center justify-center rounded-xl bg-[#0B132B] border border-[#223156] p-2 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] text-slate-500 italic">No Logo Set</span>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... or upload file below"
                className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono text-[11px]"
              />

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer rounded-xl bg-[#1C2541] border border-[#3A506B] px-3 py-1.5 font-bold text-slate-200 hover:text-white transition">
                  <Upload className="h-3.5 w-3.5 text-[#48CAE4]" />
                  <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo to Storage'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingLogo}
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Favicon Configuration */}
        <div className="rounded-2xl border border-[#223156] bg-[#0B132B]/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" /> Site Favicon
            </span>
            <span className="text-[10px] text-slate-400">ICO, PNG (Recommended: 32x32px or 64x64px)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B132B] border border-[#223156] p-1.5 overflow-hidden">
              {faviconUrl ? (
                <img src={faviconUrl} alt="Favicon Preview" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[9px] text-slate-500 italic">None</span>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <input
                type="text"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://... or upload favicon"
                className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono text-[11px]"
              />

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer rounded-xl bg-[#1C2541] border border-[#3A506B] px-3 py-1.5 font-bold text-slate-200 hover:text-white transition">
                  <Upload className="h-3.5 w-3.5 text-amber-400" />
                  <span>{uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}</span>
                  <input
                    type="file"
                    accept="image/*,.ico"
                    disabled={uploadingFavicon}
                    onChange={(e) => handleFileUpload(e, 'favicon')}
                    className="hidden"
                  />
                </label>
                {faviconUrl && (
                  <button
                    type="button"
                    onClick={() => setFaviconUrl('')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#1C2541]">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-[#48CAE4] px-5 py-2 font-bold text-[#0B132B] hover:bg-[#00B4D8] disabled:opacity-50 transition"
          >
            <Check className="h-4 w-4" />
            <span>{saving ? 'Saving Branding...' : 'Save Global Branding'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}