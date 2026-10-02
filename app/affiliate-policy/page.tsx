import PolicyPageView from '@/components/PolicyPageView';
import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';

export async function generateMetadata() { return getPageMetadata('/affiliate-policy', await getRequestLocale(), { title: 'Affiliate Policy | SabiPredict AI', description: 'Referral eligibility, commission timing, and payout terms.' }); }

export default function AffiliatePolicyPage() {
  return <PolicyPageView slug="affiliate-policy" />;
}