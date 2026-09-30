export interface SocialProofNotification {
  id: string;
  name: string;
  country: string;
  flag: string;
  action: string;
  amount?: string;
  detail?: string;
  time: string;
  iconType: 'vip' | 'win';
}

export interface CountryItem {
  name: string;
  flag: string;
}

// 50+ diverse global countries with accurate emoji flags
export const COUNTRIES: CountryItem[] = [
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Austria', flag: '🇦🇹' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Greece', flag: '🇬🇷' },
  { name: 'Egypt', flag: '🇪🇬' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Senegal', flag: '🇸🇳' },
  { name: 'Ivory Coast', flag: '🇨🇮' },
  { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Uganda', flag: '🇺🇬' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'UAE', flag: '🇦🇪' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Czechia', flag: '🇨🇿' },
  { name: 'Hungary', flag: '🇭🇺' },
  { name: 'Romania', flag: '🇷🇴' },
  { name: 'Croatia', flag: '🇭🇷' },
  { name: 'Serbia', flag: '🇷🇸' },
];

// 60+ realistic international first names with initials
export const NAMES: string[] = [
  'Mateo G.',
  'Liam K.',
  'David O.',
  'Carlos M.',
  'Jean P.',
  'Chloe W.',
  'Kwame B.',
  'Santiago R.',
  'Sofia T.',
  'Marcus A.',
  'Emmanuel N.',
  'Lucas D.',
  'Oliver S.',
  'Noah H.',
  'Gabriel V.',
  'Alexander B.',
  'Tariq M.',
  'Elena R.',
  'Samuel E.',
  'Felipe C.',
  'Daniel F.',
  'Amara K.',
  'Kenji T.',
  'Julian M.',
  'Sebastian P.',
  'Victor A.',
  'Bruno L.',
  'Mason C.',
  'Ethan W.',
  'James R.',
  'Benjamin L.',
  'Hugo B.',
  'Diego S.',
  'Andre V.',
  'Rafael M.',
  'Blessing J.',
  'Chidi E.',
  'Kofi A.',
  'Babatunde A.',
  'Tendai M.',
  'Johan N.',
  'Henrik O.',
  'Lars K.',
  'Marco B.',
  'Leonardo F.',
  'Luca R.',
  'Alvaro G.',
  'Pablo N.',
  'Javier D.',
  'Sean M.',
  'Callum P.',
  'Lewis T.',
  'Jack D.',
  'Harry F.',
  'Ryan B.',
  'Nathan S.',
  'Mia L.',
  'Emma S.',
  'Isabella C.',
  'Olivia M.',
];

export interface ActivityTemplate {
  action: string;
  amount?: string;
  detail: string;
  iconType: 'vip' | 'win';
}

// Curated high-impact templates for VIP conversions and Big Wins
export const ACTIVITIES: ActivityTemplate[] = [
  // VIP Subscriptions
  {
    action: 'just subscribed to VIP Lounge',
    detail: 'Quarterly VIP Pass Activated',
    iconType: 'vip',
  },
  {
    action: 'upgraded to 3-Month VIP Pass',
    detail: 'Full Model Probability Access',
    iconType: 'vip',
  },
  {
    action: 'renewed VIP Membership',
    detail: 'Unlimited AI Analytics & Telemetry',
    iconType: 'vip',
  },
  {
    action: 'unlocked VIP Banker Tips',
    detail: 'Daily High-Confidence Algorithmic Pick',
    iconType: 'vip',
  },
  {
    action: 'joined VIP Lounge',
    detail: 'Instant Access to +EV Matches',
    iconType: 'vip',
  },
  {
    action: 'activated Annual VIP Pass',
    detail: 'Yearly Pro Predictor Access',
    iconType: 'vip',
  },

  // Winning Tips & Payouts (No team names - shows markets, odds, models, & edge telemetry)
  {
    action: 'just won $5,340 on VIP Banker Tip',
    amount: '$5,340',
    detail: 'Over 2.5 Goals Banker (Odds @1.95)',
    iconType: 'win',
  },
  {
    action: 'cashed out $1,280 on +EV Odds',
    amount: '$1,280',
    detail: 'Both Teams To Score (BTTS) & Win',
    iconType: 'win',
  },
  {
    action: 'hit a 14.2x Accumulator Tip ($3,850)',
    amount: '$3,850',
    detail: '5-Fold Multi-League Accumulator',
    iconType: 'win',
  },
  {
    action: 'won $920 on Over 1.5 Goals Daily Tip',
    amount: '$920',
    detail: 'Over 1.5 Goals High-Confidence Pick',
    iconType: 'win',
  },
  {
    action: 'cashed in $2,460 on VIP Value Bet',
    amount: '$2,460',
    detail: 'Draw No Bet Market (Model Edge 89%)',
    iconType: 'win',
  },
  {
    action: 'hit a 8.5x Weekend Banker ($1,750)',
    amount: '$1,750',
    detail: '3-Match Algorithm Slip (@3.40)',
    iconType: 'win',
  },
  {
    action: 'just won $4,120 on Double Chance VIP Pick',
    amount: '$4,120',
    detail: 'Double Chance Market (1X @1.85)',
    iconType: 'win',
  },
  {
    action: 'won $860 on Under 3.5 Goals Safe Tip',
    amount: '$860',
    detail: 'Under 3.5 Goals Quantitative Lock',
    iconType: 'win',
  },
  {
    action: 'cashed out $3,210 on Live Telemetry Signal',
    amount: '$3,210',
    detail: 'Dynamic In-Play Edge Signal (+EV)',
    iconType: 'win',
  },
  {
    action: 'hit a 11.8x High-EV Parlay ($2,940)',
    amount: '$2,940',
    detail: 'European Multi-Match Parlay',
    iconType: 'win',
  },
  {
    action: 'won $1,590 on First Half Asian Handicap',
    amount: '$1,590',
    detail: 'First Half Asian Handicap (-0.5)',
    iconType: 'win',
  },
  {
    action: 'cashed in $3,650 on Poisson Model Pick',
    amount: '$3,650',
    detail: 'Poisson Expected Goals (xG) Edge',
    iconType: 'win',
  },
  {
    action: 'won $1,140 on Clean Sheet Probability Lock',
    amount: '$1,140',
    detail: 'Clean Sheet Probability Edge (78%)',
    iconType: 'win',
  },
];

export const TIME_INDICATORS: string[] = [
  'just now',
  '2 seconds ago',
  '7 seconds ago',
  '14 seconds ago',
  '28 seconds ago',
  '45 seconds ago',
  '1 minute ago',
  '2 minutes ago',
  '3 minutes ago',
  '4 minutes ago',
];

let lastGeneratedId = 0;
let lastCountryIndex = -1;
let lastNameIndex = -1;
let lastActivityIndex = -1;

/**
 * Generates a randomized, realistic social proof notification.
 * Combines distinct data pools to create 50,000+ plausible variations.
 * Avoids consecutive identical names or activities.
 */
export function generateRandomSocialProof(): SocialProofNotification {
  lastGeneratedId += 1;

  // Pick unique country
  let countryIdx = Math.floor(Math.random() * COUNTRIES.length);
  if (countryIdx === lastCountryIndex) {
    countryIdx = (countryIdx + 1) % COUNTRIES.length;
  }
  lastCountryIndex = countryIdx;
  const country = COUNTRIES[countryIdx];

  // Pick unique name
  let nameIdx = Math.floor(Math.random() * NAMES.length);
  if (nameIdx === lastNameIndex) {
    nameIdx = (nameIdx + 1) % NAMES.length;
  }
  lastNameIndex = nameIdx;
  const name = NAMES[nameIdx];

  // Pick unique activity
  let actIdx = Math.floor(Math.random() * ACTIVITIES.length);
  if (actIdx === lastActivityIndex) {
    actIdx = (actIdx + 1) % ACTIVITIES.length;
  }
  lastActivityIndex = actIdx;
  const activity = ACTIVITIES[actIdx];

  // Pick fresh time indicator
  const timeIdx = Math.floor(Math.random() * TIME_INDICATORS.length);
  const time = TIME_INDICATORS[timeIdx];

  return {
    id: `sp-${Date.now()}-${lastGeneratedId}`,
    name,
    country: country.name,
    flag: country.flag,
    action: activity.action,
    amount: activity.amount,
    detail: activity.detail,
    time,
    iconType: activity.iconType,
  };
}

