import PolicyPageView from '@/components/PolicyPageView';
import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';

export async function generateMetadata() { return getPageMetadata('/terms', await getRequestLocale(), { title: 'Terms and Conditions | SabiPredict AI', description: 'Terms for SabiPredict AI services and memberships.' }); }

export default function TermsPage() {
  return <PolicyPageView slug="terms" />;
}