'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Calendar, ArrowRight } from 'lucide-react';
import { BlogPost } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface HomeBlogSectionProps {
  posts: BlogPost[];
}

export default function HomeBlogSection({ posts }: HomeBlogSectionProps) {
  const { t } = useTranslation();
  const fallbackPosts: BlogPost[] = [
    {
      id: 'fb-1',
      title: 'Mastering Expected Goals (xG) & Value Betting in Modern Football',
      slug: 'mastering-xg-and-value-betting-football',
      author: 'Dr. Alex Sterling',
      published: true,
      content: '',
      excerpt: 'Discover how SabiPredict AI leverages Expected Goals (xG) and Poisson probability modeling to calculate positive expected value (+EV).',
      created_at: new Date().toISOString(),
      category: 'Quantitative Strategy',
      read_time: '5 min read',
      cover_image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&fit=crop',
    },
    {
      id: 'fb-2',
      title: 'Bankroll Management 101: The Kelly Criterion for Football Punters',
      slug: 'bankroll-management-kelly-criterion-football',
      author: 'Elena Vance',
      published: true,
      content: '',
      excerpt: 'Learn how professional quantitative syndicates use the Kelly Criterion and unit staking to preserve capital and compound betting profits.',
      created_at: new Date().toISOString(),
      category: 'Bankroll Management',
      read_time: '6 min read',
      cover_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&fit=crop',
    },
    {
      id: 'fb-3',
      title: 'Why Conservative Betting Markets Deliver Higher Long-Term ROI',
      slug: 'conservative-betting-markets-higher-roi',
      author: 'Marcus Thorne',
      published: true,
      content: '',
      excerpt: 'Discover why focusing on Over 1.5 Goals and Double Chance markets protects your bankroll and compounds higher long-term returns.',
      created_at: new Date().toISOString(),
      category: 'Betting Strategy',
      read_time: '4 min read',
      cover_image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&fit=crop',
    },
  ];

  const displayPosts = (posts && posts.length > 0 ? posts : fallbackPosts).slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2541] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#48CAE4] mb-1">
            <BookOpen className="h-4 w-4" />
            <span>{t('insights.topBadge', 'Expert Betting Insights')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {t('insights.header', 'Football Betting Strategy & Research')}
          </h2>
          <p className="text-xs text-slate-400">
            {t(
              'insights.subtext',
              'Easy-to-understand match breakdowns, team analysis, and winning strategies.'
            )}
          </p>
        </div>

        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs font-bold text-[#48CAE4] hover:text-[#90E0EF] transition-colors"
        >
          <span>{t('insights.viewAll', 'View All Articles')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPosts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#1C2541] bg-[#111C38] hover:border-[#48CAE4]/60 transition-all shadow-md hover:shadow-xl hover:-translate-y-1"
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

            <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    {new Date(post.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {post.read_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {post.read_time}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-[#48CAE4] transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {post.excerpt || (post.content ? post.content.slice(0, 120) + '...' : '')}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1C2541] flex items-center justify-between text-xs font-semibold text-[#48CAE4]">
                <span>{t('insights.readArticle', 'Read Article')}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
