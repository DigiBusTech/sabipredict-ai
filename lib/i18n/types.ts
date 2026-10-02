export type Locale = 'en' | 'fr' | 'es' | 'pt';

export interface LanguageOption {
  code: Locale;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

export interface TranslationDictionary {
  nav: {
    predictions: string;
    pricing: string;
    vipLounge: string;
    blog: string;
    reviews: string;
    affiliate: string;
    mySubscription: string;
    dashboard: string;
    adminPanel: string;
    downloadApp: string;
    signIn: string;
    getStarted: string;
    signOut: string;
  };
  hero: {
    topBadge: string;
    headline: string;
    headlineHighlight: string;
    subheadline: string;
    accuracyBadge: string;
    verifiedDataBadge: string;
    bankerBadge: string;
  };
  predictions: {
    header: string;
    subtext: string;
    vipLoungeLink: string;
  };
  dates: {
    yesterday: string;
    today: string;
    tomorrow: string;
    calendar: string;
    tips: string;
    audit: string;
    upcoming: string;
  };
  vip: {
    badge: string;
    title: string;
    description: string;
    historical: string;
    bankroll: string;
    liveFeed: string;
    restricted: string;
    restrictedDescription: string;
    viewPlans: string;
    loading: string;
    noSelections: string;
    noSelectionsDescription: string;
    topPick: string;
    topPickBadge: string;
  };
  predictionCard: {
    won: string;
    lost: string;
    pending: string;
    void: string;
    vip: string;
    free: string;
    locked: string;
    lockedDescription: string;
    upgrade: string;
    market: string;
    probability: string;
    rationale: string;
    analytics: string;
  };
  insights: {
    topBadge: string;
    header: string;
    subtext: string;
    viewAll: string;
    readArticle: string;
  };
  footer: {
    aboutText: string;
    apiBadgeText: string;
    platform: string;
    dailyPredictions: string;
    vipMemberships: string;
    vipLounge: string;
    quantBlog: string;
    disclaimerTitle: string;
    disclaimerText: string;
    termsLink: string;
    responsibleLink: string;
    allRightsReserved: string;
  };
}

