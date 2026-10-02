import { cookies } from 'next/headers';
import { Locale } from './types';

const supportedLocales: Locale[] = ['en', 'fr', 'es', 'pt'];

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  return supportedLocales.includes(locale as Locale) ? locale as Locale : 'en';
}