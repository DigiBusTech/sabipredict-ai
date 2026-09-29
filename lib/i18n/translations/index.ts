import { Locale, TranslationDictionary } from '../types';
import { en } from './en';
import { fr } from './fr';
import { es } from './es';
import { pt } from './pt';

export const translations: Record<Locale, TranslationDictionary> = {
  en,
  fr,
  es,
  pt,
};

export { en, fr, es, pt };
