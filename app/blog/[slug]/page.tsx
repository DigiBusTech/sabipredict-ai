import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ArrowLeft, Sparkles } from 'lucide-react';
import { getBlogPostBySlug, getBlogPosts } from '@/lib/db';
import { BlogPost } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: 'Article Not Found | SabiPredict AI' };

  return {
    title: `${post.title} | SabiPredict AI Blog`,
    description: post.excerpt || post.title,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = await getBlogPosts();
  const relatedPosts = allPosts.filter((p: BlogPost) => p.slug !== slug).slice(0, 2);

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#48CAE4] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Articles</span>
        </Link>
      </div>

      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[#1C2541] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#48CAE4] border border-[#3A506B]">
            {post.category || 'Strategy'}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <Clock className="h-3.5 w-3.5 text-slate-500" /> {post.read_time || '4 min read'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#1C2541] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#1C2541] border border-[#3A506B] flex items-center justify-center text-[#48CAE4] font-bold">
              {post.author.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-white">{post.author}</p>
              <p className="text-[11px] text-slate-500">
                Published on {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/predictions"
              className="inline-flex items-center gap-1 rounded-xl bg-[#48CAE4]/10 px-3 py-1.5 text-xs font-bold text-[#48CAE4] border border-[#48CAE4]/30 hover:bg-[#48CAE4]/20"
            >
              <Sparkles className="h-3.5 w-3.5" /> View Daily Tips
            </Link>
          </div>
        </div>
      </header>

      {post.cover_image && (
        <div className="relative h-64 sm:h-96 w-full overflow-hidden rounded-2xl bg-[#111C38] border border-[#1C2541]">
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
        {post.content.split('\n\n').map((paragraph: string, idx: number) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h2 key={idx} className="text-xl sm:text-2xl font-bold text-white pt-4 pb-1">
                {paragraph.replace('### ', '')}
              </h2>
            );
          }
          return <p key={idx}>{paragraph}</p>;
        })}
      </div>

      {relatedPosts.length > 0 && (
        <div className="mt-12 pt-8 border-t border-[#1C2541]">
          <h3 className="text-lg font-bold text-white mb-4">Related Intelligence Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((related: BlogPost) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 hover:border-[#48CAE4]/40 transition-all block"
              >
                <span className="text-[10px] font-bold uppercase text-[#48CAE4] block mb-1">
                  {related.category}
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {related.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {related.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

