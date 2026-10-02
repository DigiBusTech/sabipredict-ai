import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';

export async function generateMetadata() {
  return getPageMetadata('/signup', await getRequestLocale(), {
    title: 'Create an Account | SabiPredict AI',
    description: 'Create a SabiPredict AI account to access football analytics and predictions.',
  });
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}