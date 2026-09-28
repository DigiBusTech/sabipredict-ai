import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, User, ArrowRight } from 'lucide-react';
import { getBlogPosts } from '@/lib/db';

export const metadata = {
  title: 'Football Betting Strategy & News | SabiPredict AI Blog',
  description: 'Tactical breakdowns, quantitative xG tutorials, bankroll management guides, and weekend previews.',
};

export default async function BlogListPage() {
  const posts = await getBlogPosts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Blog Header */}
      <div className="border-b border-[#1C2541] pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#3A506B] bg-[#1C2541] px-3.5 py-1 text-xs font-semibold text-[#48CAE4] mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          <span>SabiPredict AI Editorial</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Football Insights & Quantitative Strategy
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
          Analytical articles exploring Expected Goals (xG), Kelly Criterion bankroll sizing, and tactical previews of top leagues.
        </p>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1C2541] bg-[#111C38]/40 p-12 text-center text-xs text-slate-400">
          No articles published yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#1C2541] bg-[#111C38] hover:border-[#48CAE4]/50 transition-all shadow-md"
            >
              {post.cover_image && (
                <div className="relative h-44 w-full overflow-hidden bg-[#0B132B]">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 rounded-lg bg-[#0B132B]/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#48CAE4] border border-[#223156]">
                    {post.category || 'Analysis'}
                  </span>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="h-3 w-3" /> {post.read_time || '4 min'}
                    </span>
                    <span>•</span>
                    <span className="text-[11px]">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>

                  <h2 className="text-base font-bold text-white group-hover:text-[#48CAE4] transition-colors line-clamp-2">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-[#1C2541] flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <User className="h-3 w-3 text-slate-500" /> {post.author}
                  </span>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex items-center gap-1 text-xs font-bold text-[#48CAE4] hover:text-[#00B4D8]"
                  >
                    <span>Read</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

