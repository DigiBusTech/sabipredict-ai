import TestimonialsSection from '@/components/TestimonialsSection';
import { getApprovedTestimonials } from '@/lib/growth';
import { getCurrentUserProfile } from '@/lib/db';

export const metadata = {
  title: 'Member Reviews | SabiPredict AI',
  description: 'Read member experiences and share your own review of SabiPredict AI.',
};

export default async function TestimonialsPage() {
  const [testimonials, profile] = await Promise.all([
    getApprovedTestimonials(),
    getCurrentUserProfile(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#48CAE4]">Community</p>
        <h1 className="text-3xl font-black text-white">Member reviews</h1>
        <p className="text-sm leading-relaxed text-slate-400">Reviews reflect individual experiences and are not a guarantee of betting results.</p>
      </header>
      <TestimonialsSection testimonials={testimonials} userProfile={profile} />
    </div>
  );
}