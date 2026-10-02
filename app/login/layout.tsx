import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';

export async function generateMetadata() {
  return getPageMetadata('/login', await getRequestLocale(), {
    title: 'Sign In | SabiPredict AI',
    description: 'Sign in to your SabiPredict AI account.',
  });
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}