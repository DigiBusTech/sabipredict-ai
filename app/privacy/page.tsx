import PolicyPageView from '@/components/PolicyPageView';
import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';

export async function generateMetadata() { return getPageMetadata('/privacy', await getRequestLocale(), { title: 'Privacy Policy | SabiPredict AI', description: 'How SabiPredict AI handles account and site data.' }); }

export default function PrivacyPage() {
  return <PolicyPageView slug="privacy" />;
}