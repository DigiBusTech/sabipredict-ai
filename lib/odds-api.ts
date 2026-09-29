import { Prediction, LeagueOption } from './types';
import { getSystemSettings } from './db';

const THE_ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

export const FALLBACK_THE_ODDS_API_LEAGUES: LeagueOption[] = [
  { id: 'soccer_epl', name: 'EPL (Premier League)', country: 'England', provider: 'the-odds-api', sport_key: 'soccer_epl', is_active: true },
  { id: 'soccer_spain_la_liga', name: 'La Liga', country: 'Spain', provider: 'the-odds-api', sport_key: 'soccer_spain_la_liga', is_active: true },
  { id: 'soccer_germany_bundesliga', name: 'Bundesliga', country: 'Germany', provider: 'the-odds-api', sport_key: 'soccer_germany_bundesliga', is_active: true },
  { id: 'soccer_italy_serie_a', name: 'Serie A', country: 'Italy', provider: 'the-odds-api', sport_key: 'soccer_italy_serie_a', is_active: true },
  { id: 'soccer_france_ligue_one', name: 'Ligue 1', country: 'France', provider: 'the-odds-api', sport_key: 'soccer_france_ligue_one', is_active: true },
  { id: 'soccer_uefa_champs_league', name: 'UEFA Champions League', country: 'Europe', provider: 'the-odds-api', sport_key: 'soccer_uefa_champs_league', is_active: true },
  { id: 'soccer_uefa_europa_league', name: 'UEFA Europa League', country: 'Europe', provider: 'the-odds-api', sport_key: 'soccer_uefa_europa_league', is_active: true },
  { id: 'soccer_usa_mls', name: 'MLS', country: 'USA', provider: 'the-odds-api', sport_key: 'soccer_usa_mls', is_active: true },
  { id: 'soccer_netherlands_eredivisie', name: 'Eredivisie', country: 'Netherlands', provider: 'the-odds-api', sport_key: 'soccer_netherlands_eredivisie', is_active: true },
  { id: 'soccer_brazil_campeonato', name: 'Brazil Serie A', country: 'Brazil', provider: 'the-odds-api', sport_key: 'soccer_brazil_campeonato', is_active: true },
];

export async function fetchTheOddsApiLeagues(customApiKey?: string): Promise<LeagueOption[]> {
  let apiKey = customApiKey?.trim();
  if (!apiKey) {
    const settings = await getSystemSettings<{ the_odds_api_key?: string }>('data_provider_settings');
    apiKey = settings?.the_odds_api_key?.trim() || process.env.THE_ODDS_API_KEY?.trim();
  }

  if (apiKey && !apiKey.includes('your_')) {
    try {
      const url = `${THE_ODDS_API_BASE}/sports/?apiKey=${apiKey}&all=true`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const sports: any[] = await res.json();
        if (Array.isArray(sports)) {
          const soccerSports = sports.filter((s) => s.group === 'Soccer' || s.key.startsWith('soccer_'));
          if (soccerSports.length > 0) {
            return soccerSports.map((s) => ({
              id: s.key,
              name: s.title,
              country: deriveCountry(s.key),
              provider: 'the-odds-api' as const,
              sport_key: s.key,
              is_active: s.active ?? true,
            }));
          }
        }
      }
    } catch (err) {
      console.warn('[The Odds API] Failed to fetch live sports list, using fallback leagues:', err);
    }
  }

  return FALLBACK_THE_ODDS_API_LEAGUES;
}

/**
 * Fetches soccer match odds from The Odds API v4 and maps them into
 * standard SabiPredict pending prediction records.
 */
export async function fetchTheOddsApiFixtures(
  apiKey?: string,
  selectedLeagues?: string[],
  startDate?: string,
  endDate?: string
): Promise<Partial<Prediction>[]> {
  const trimmedKey = apiKey?.trim();

  if (trimmedKey && !trimmedKey.includes('your_')) {
    try {
      const results: Partial<Prediction>[] = [];
      const defaultSports = ['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a'];
      const targetSports =
        selectedLeagues && selectedLeagues.length > 0
          ? selectedLeagues
          : defaultSports;

      let lastHttpError: string | null = null;

      for (const sport of targetSports) {
        const url = `${THE_ODDS_API_BASE}/sports/${sport}/odds/?apiKey=${trimmedKey}&regions=eu,uk,us&markets=h2h,totals&oddsFormat=decimal`;
        console.log(`[The Odds API] Requesting live odds for ${sport}...`);

        const res = await fetch(url, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          const errText = await res.text();
          lastHttpError = `HTTP ${res.status} (${res.statusText}): ${errText}`;
          console.error(`[The Odds API] Failed to fetch ${sport}:`, lastHttpError);
          if (res.status === 401 || res.status === 429) {
            throw new Error(`The Odds API error (${lastHttpError})`);
          }
          continue;
        }

        const games: any[] = await res.json();
        if (Array.isArray(games)) {
          console.log(`[The Odds API] Ingested ${games.length} fixtures from ${sport}`);

          for (const g of games) {
            // Check date range boundary
            const commenceTime = g.commence_time || new Date().toISOString();
            const matchDate = commenceTime.includes('T') ? commenceTime.split('T')[0] : commenceTime;

            if (startDate && matchDate < startDate) continue;
            if (endDate && matchDate > endDate) continue;

            // Find primary bookmaker with markets
            const bookie = Array.isArray(g.bookmakers)
              ? g.bookmakers.find((b: any) => b.markets && b.markets.length > 0) || g.bookmakers[0]
              : null;

            let market = 'Over 1.5 Goals';
            let odds = 1.35;

            if (bookie?.markets && Array.isArray(bookie.markets)) {
              const totalsMarket = bookie.markets.find((m: any) => m.key === 'totals');
              const h2hMarket = bookie.markets.find((m: any) => m.key === 'h2h');

              if (totalsMarket?.outcomes && Array.isArray(totalsMarket.outcomes)) {
                const over15 = totalsMarket.outcomes.find((o: any) => o.name === 'Over' && o.point === 1.5);
                const anyOver = totalsMarket.outcomes.find((o: any) => o.name === 'Over');
                if (over15 && Number(over15.price) > 1.0) {
                  market = 'Over 1.5 Goals';
                  odds = Number(over15.price);
                } else if (anyOver && Number(anyOver.price) > 1.0) {
                  market = `Over ${anyOver.point || 1.5} Goals`;
                  odds = Number(anyOver.price);
                }
              } else if (h2hMarket?.outcomes && Array.isArray(h2hMarket.outcomes)) {
                const homeOutcome = h2hMarket.outcomes.find((o: any) => o.name === g.home_team);
                if (homeOutcome && Number(homeOutcome.price) > 1.0) {
                  const hPrice = Number(homeOutcome.price);
                  if (hPrice <= 2.20) {
                    market = 'Double Chance (1X)';
                    odds = Number((hPrice > 1.5 ? Math.max(1.15, hPrice * 0.72) : 1.25).toFixed(2));
                  } else {
                    market = 'Both Teams to Score (BTTS)';
                    odds = 1.70;
                  }
                }
              }
            }

            const safeOdds = Math.max(1.05, Number(Number(odds).toFixed(2)) || 1.35);

            results.push({
              fixture_id: String(g.id),
              home_team: g.home_team,
              away_team: g.away_team,
              league: g.sport_title || 'Top Soccer',
              country: deriveCountry(g.sport_key || sport),
              match_date: matchDate,
              match_time: commenceTime,
              starting_at: commenceTime,
              market,
              odds: safeOdds,
              confidence_score: 80,
              ai_analysis: 'Ingested from The Odds API v4. Staged for moderation.',
              tier: 'free',
              status: 'pending',
              prediction_outcome: 'Pending',
              result: 'pending',
              raw_data: {
                provider: 'the-odds-api',
                sport: g.sport_key || sport,
                league: g.sport_title,
                commence_time: g.commence_time,
                bookmakers: g.bookmakers?.slice(0, 2) || [],
              },
            });
          }
        }
      }

      if (results.length > 0) {
        console.log(`[The Odds API] Successfully mapped ${results.length} fixtures across target leagues.`);
        return results;
      }

      if (lastHttpError) {
        throw new Error(lastHttpError);
      }
    } catch (err: any) {
      console.error('[The Odds API] Exception in fetchTheOddsApiFixtures:', err);
      throw err;
    }
  }

  // Fallback for development/testing when no key is configured
  console.log('[The Odds API] No active API key found, generating mock fallback fixtures.');
  return generateOddsApiFallback(selectedLeagues, startDate, endDate);
}

function deriveCountry(sportKey: string): string {
  if (sportKey.includes('epl')) return 'England';
  if (sportKey.includes('la_liga') || sportKey.includes('spain')) return 'Spain';
  if (sportKey.includes('bundesliga') || sportKey.includes('germany')) return 'Germany';
  if (sportKey.includes('serie_a') || sportKey.includes('italy')) return 'Italy';
  if (sportKey.includes('ligue_one') || sportKey.includes('france')) return 'France';
  if (sportKey.includes('champs_league') || sportKey.includes('europa')) return 'Europe';
  if (sportKey.includes('mls') || sportKey.includes('usa')) return 'USA';
  if (sportKey.includes('eredivisie') || sportKey.includes('netherlands')) return 'Netherlands';
  if (sportKey.includes('brazil')) return 'Brazil';
  return 'International';
}

function generateOddsApiFallback(
  selectedLeagues?: string[],
  startDate?: string,
  endDate?: string
): Partial<Prediction>[] {
  const baseDate = startDate ? new Date(startDate) : new Date();
  const todayStr = baseDate.toISOString().split('T')[0];
  const nextDay = new Date(baseDate);
  nextDay.setDate(baseDate.getDate() + 1);
  const tomStr = nextDay.toISOString().split('T')[0];

  const allMocks = [
    {
      fixture_id: `c54a8070624a9dddf436a56e0dbe9a81-${todayStr}`,
      sport_key: 'soccer_epl',
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      league: 'Premier League',
      country: 'England',
      match_date: todayStr,
      match_time: `${todayStr}T17:30:00Z`,
      starting_at: `${todayStr}T17:30:00Z`,
      market: 'Over 1.5 Goals',
      odds: 1.32,
      confidence_score: 85,
      ai_analysis: 'Ingested from The Odds API v4. Staged for moderation.',
      tier: 'free' as const,
      status: 'pending' as const,
      prediction_outcome: 'Pending' as const,
      result: 'pending',
      raw_data: { provider: 'the-odds-api', sport: 'soccer_epl' },
    },
    {
      fixture_id: `d91b3081735b0eeef547b67f1ecf0b92-${todayStr}`,
      sport_key: 'soccer_spain_la_liga',
      home_team: 'Barcelona',
      away_team: 'Atletico Madrid',
      league: 'La Liga',
      country: 'Spain',
      match_date: todayStr,
      match_time: `${todayStr}T20:00:00Z`,
      starting_at: `${todayStr}T20:00:00Z`,
      market: 'Double Chance (1X)',
      odds: 1.28,
      confidence_score: 82,
      ai_analysis: 'Ingested from The Odds API v4. Staged for moderation.',
      tier: 'free' as const,
      status: 'pending' as const,
      prediction_outcome: 'Pending' as const,
      result: 'pending',
      raw_data: { provider: 'the-odds-api', sport: 'soccer_spain_la_liga' },
    },
    {
      fixture_id: `e82c4092846c1ffff658c78g2fd01c03-${tomStr}`,
      sport_key: 'soccer_germany_bundesliga',
      home_team: 'Bayern Munich',
      away_team: 'Borussia Dortmund',
      league: 'Bundesliga',
      country: 'Germany',
      match_date: tomStr,
      match_time: `${tomStr}T17:30:00Z`,
      starting_at: `${tomStr}T17:30:00Z`,
      market: 'Over 1.5 Goals',
      odds: 1.22,
      confidence_score: 90,
      ai_analysis: 'Ingested from The Odds API v4. Staged for moderation.',
      tier: 'free' as const,
      status: 'pending' as const,
      prediction_outcome: 'Pending' as const,
      result: 'pending',
      raw_data: { provider: 'the-odds-api', sport: 'soccer_germany_bundesliga' },
    },
    {
      fixture_id: `f73d5083957d2aaaa769d89h3ge12d14-${tomStr}`,
      sport_key: 'soccer_italy_serie_a',
      home_team: 'Inter Milan',
      away_team: 'Juventus',
      league: 'Serie A',
      country: 'Italy',
      match_date: tomStr,
      match_time: `${tomStr}T19:45:00Z`,
      starting_at: `${tomStr}T19:45:00Z`,
      market: 'Both Teams to Score (BTTS)',
      odds: 1.68,
      confidence_score: 81,
      ai_analysis: 'Ingested from The Odds API v4. Staged for moderation.',
      tier: 'free' as const,
      status: 'pending' as const,
      prediction_outcome: 'Pending' as const,
      result: 'pending',
      raw_data: { provider: 'the-odds-api', sport: 'soccer_italy_serie_a' },
    },
  ];

  let filtered = allMocks;

  if (selectedLeagues && selectedLeagues.length > 0) {
    filtered = filtered.filter(
      (m) =>
        selectedLeagues.includes(m.sport_key) ||
        selectedLeagues.some((sl) => m.league.toLowerCase().includes(sl.toLowerCase()))
    );
  }

  if (startDate) {
    filtered = filtered.filter((m) => m.match_date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((m) => m.match_date <= endDate);
  }

  return filtered.length > 0 ? filtered : allMocks;
}