import React from 'react';
import PredictionsFeed from '@/components/PredictionsFeed';
import HeroSection from '@/components/HeroSection';
import PredictionsSectionHeader from '@/components/PredictionsSectionHeader';
import HomeBlogSection from '@/components/HomeBlogSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import { getCurrentUserProfile, getBlogPosts } from '@/lib/db';
import { getApprovedTestimonials } from '@/lib/growth';

export default async function HomePage() {
  const profile = await getCurrentUserProfile();
  const posts = await getBlogPosts(true);
  const testimonials = await getApprovedTestimonials(true);

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
      <HeroSection />

      {/* Main Core Date-Filtered Predictions Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PredictionsSectionHeader />

        <PredictionsFeed
          initialDate={todayStr}
          yesterdayStr={yesterdayStr}
          todayStr={todayStr}
          tomorrowStr={tomorrowStr}
          userProfile={profile}
        />
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TestimonialsSection testimonials={testimonials.slice(0, 3)} userProfile={profile} featuredOnly />
      </div>

      {/* Featured Blog Insights Section */}
      <HomeBlogSection posts={posts} />
    </div>
  );
}



