import React from 'react';
import PredictionsFeed from '@/components/PredictionsFeed';
import HeroSection from '@/components/HeroSection';
import PredictionsSectionHeader from '@/components/PredictionsSectionHeader';
import HomeBlogSection from '@/components/HomeBlogSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import { getCurrentUserProfile, getBlogPosts } from '@/lib/db';
import { getApprovedTestimonials } from '@/lib/growth';
import { getRequestLocale } from '@/lib/i18n/server';
import { getHomepageContent } from '@/lib/site-content';
import { getActivePromoSlots } from '@/lib/site-content';
import PromoSlotCard from '@/components/PromoSlotCard';
import ScrollReveal from '@/components/ScrollReveal';

export default async function HomePage() {
  const locale = await getRequestLocale();
  const [profile, posts, testimonials, homepageContent, heroPromos, feedPromos] = await Promise.all([
    getCurrentUserProfile(),
    getBlogPosts(true, locale),
    getApprovedTestimonials(true, locale),
    getHomepageContent(),
    getActivePromoSlots('home-hero'),
    getActivePromoSlots('home-feed'),
  ]);

  const now = new Date();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);

  const yesterdayStr = yest.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = tom.toISOString().split('T')[0];

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <ScrollReveal><HeroSection content={homepageContent} /></ScrollReveal>
      {heroPromos.map((promo) => <ScrollReveal key={promo.id} className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><PromoSlotCard slot={promo} locale={locale} /></ScrollReveal>)}

      {/* Main Core Date-Filtered Predictions Section */}
      <ScrollReveal><section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PredictionsSectionHeader />

        <PredictionsFeed
          initialDate={todayStr}
          yesterdayStr={yesterdayStr}
          todayStr={todayStr}
          tomorrowStr={tomorrowStr}
          userProfile={profile}
        />
      </section></ScrollReveal>

      {feedPromos.map((promo) => <ScrollReveal key={promo.id} className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><PromoSlotCard slot={promo} locale={locale} /></ScrollReveal>)}

      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TestimonialsSection testimonials={testimonials.slice(0, 3)} userProfile={profile} featuredOnly />
      </ScrollReveal>

      {/* Featured Blog Insights Section */}
      <ScrollReveal><HomeBlogSection posts={posts} /></ScrollReveal>
    </div>
  );
}



