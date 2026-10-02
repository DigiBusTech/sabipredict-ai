'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { BlogPost } from '@/lib/types';
import { createBlogPostAction, updateBlogPostAction, deleteBlogPostAction } from '@/app/actions/blog';

export default function BlogTab({ posts }: { posts: BlogPost[] }) {
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData(e.currentTarget);
    try {
      if (editingPost?.id) {
        await updateBlogPostAction(editingPost.id, formData);
        setMsg('Blog post updated successfully.');
      } else {
        await createBlogPostAction(formData);
        setMsg('New blog post published.');
      }
      setEditingPost(null);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Article could not be saved.');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    setLoading(true);
    try {
      await deleteBlogPostAction(id);
      setMsg('Article deleted.');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-[#111C38] p-4 border border-[#1C2541]">
        <div>
          <h2 className="text-base font-black text-white">Editorial & News Management</h2>
          <p className="text-xs text-slate-400">Write, edit, and publish football betting intelligence articles.</p>
        </div>

        <button
          onClick={() => setEditingPost({ title: '', slug: '', content: '', excerpt: '', published: true })}
          className="flex items-center gap-1.5 rounded-xl bg-[#48CAE4] px-3.5 py-2 text-xs font-bold text-[#0B132B]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Article</span>
        </button>
      </div>

      {msg && (
        <div className="rounded-xl border border-[#48CAE4]/40 bg-[#48CAE4]/10 p-3 text-xs text-[#48CAE4]">
          {msg}
        </div>
      )}

      {editingPost && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#223156] bg-[#111C38] p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#1C2541] pb-2">
            <h3 className="text-sm font-bold text-white">
              {editingPost.id ? 'Edit Article' : 'Write New Article'}
            </h3>
            <button type="button" onClick={() => setEditingPost(null)} className="text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Title</label>
              <input
                name="title"
                defaultValue={editingPost.title}
                required
                placeholder="Title..."
                className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Slug (URL)</label>
              <input
                name="slug"
                defaultValue={editingPost.slug}
                placeholder="auto-generated-if-empty"
                className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="category" defaultValue={editingPost.category || 'Quantitative Strategy'} placeholder="Category" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="author" defaultValue={editingPost.author || 'SabiPredict AI Editorial'} placeholder="Author" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="cover_image" defaultValue={editingPost.cover_image || ''} placeholder="Cover Image URL" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
          </div>

          <input name="excerpt" defaultValue={editingPost.excerpt || ''} placeholder="Summary excerpt..." className="w-full rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
          <textarea name="content" defaultValue={editingPost.content} required rows={7} placeholder="Article markdown content..." className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-3 text-white font-mono text-[11px]" />

          <details className="rounded-xl border border-[#223156] bg-[#0B132B]/60 p-3">
            <summary className="cursor-pointer text-xs font-bold text-[#48CAE4]">Optional French, Spanish, and Portuguese versions</summary>
            <div className="mt-4 space-y-4">
              {(['fr', 'es', 'pt'] as const).map((locale) => (
                <fieldset key={locale} className="space-y-2 border-t border-[#223156] pt-3">
                  <legend className="px-1 text-[11px] font-black uppercase text-slate-300">{locale}</legend>
                  <input name={`${locale}_title`} defaultValue={editingPost.translations?.[locale]?.title || ''} placeholder={`${locale.toUpperCase()} title`} className="w-full rounded-lg border border-[#223156] bg-[#111C38] px-3 py-2 text-white" />
                  <input name={`${locale}_category`} defaultValue={editingPost.translations?.[locale]?.category || ''} placeholder={`${locale.toUpperCase()} category`} className="w-full rounded-lg border border-[#223156] bg-[#111C38] px-3 py-2 text-white" />
                  <textarea name={`${locale}_excerpt`} defaultValue={editingPost.translations?.[locale]?.excerpt || ''} rows={2} placeholder={`${locale.toUpperCase()} excerpt`} className="w-full rounded-lg border border-[#223156] bg-[#111C38] p-2 text-white" />
                  <textarea name={`${locale}_content`} defaultValue={editingPost.translations?.[locale]?.content || ''} rows={5} placeholder={`${locale.toUpperCase()} article content`} className="w-full rounded-lg border border-[#223156] bg-[#111C38] p-2 font-mono text-[11px] text-white" />
                </fieldset>
              ))}
            </div>
          </details>

          <div className="flex items-center justify-between pt-2 border-t border-[#1C2541]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="published" value="true" defaultChecked={editingPost.published !== false} className="rounded border-[#223156] bg-[#0B132B]" />
              <span className="text-slate-300 font-semibold">Publish to public blog immediately</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingPost(null)} className="px-3 py-1 text-slate-400">Cancel</button>
              <button type="submit" disabled={loading} className="rounded-xl bg-[#48CAE4] px-4 py-1.5 font-bold text-[#0B132B] disabled:opacity-50">Save Article</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{post.title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${post.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {post.published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] line-clamp-1">{post.excerpt}</p>
              <div className="flex gap-3 text-[10px] text-slate-500">
                <span>Slug: /blog/{post.slug}</span>
                <span>•</span>
                <span>Author: {post.author}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setEditingPost(post)}
                className="flex items-center gap-1 rounded-lg border border-[#3A506B] bg-[#1C2541] px-3 py-1 font-semibold text-slate-200 hover:text-white"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

