import { Prediction } from './types';
import { getSystemSettings } from './db';

const SPORTSMONKS_BASE_URL = 'https://api.sportmonks.com/v3/football';

export interface SportsmonksRawFixture {
  id: number;
  name: string;
  starting_at: string;
  state?: { short_name: string };
  league?: { name: string; country?: { name: string } };
  participants?: Array<{
    id: number;
    name: string;
    image_path?: string;
    meta?: { location: 'home' | 'away' };
  }>;
}

export async function fetchSportsmonksFixtures(
  startDate: string,
  endDate: string,
  customApiKey?: string
): Promise<Partial<Prediction>[]> {
  let apiKey = customApiKey;
  if (!apiKey) {
    const settings = await getSystemSettings<{ api_key: string }>('sportsmonks');
    apiKey = settings?.api_key || process.env.SPORTSMONKS_API_KEY;
  }

  if (apiKey && apiKey.trim() && apiKey !== 'your_sportsmonks_api_key_here') {
    try {
      const url = `${SPORTSMONKS_BASE_URL}/fixtures/between/${startDate}/${endDate}?api_token=${apiKey}&include=league.country;participants;odds`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 },
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          return json.data.map((raw: SportsmonksRawFixture) => {
            const home = raw.participants?.find((p) => p.meta?.location === 'home') || raw.participants?.[0];
            const away = raw.participants?.find((p) => p.meta?.location === 'away') || raw.participants?.[1];

            return {
              fixture_id: String(raw.id),
              home_team: home?.name || 'Home Team',
              away_team: away?.name || 'Away Team',
              home_logo: home?.image_path || 'https://media.api-sports.io/football/teams/50.png',
              away_logo: away?.image_path || 'https://media.api-sports.io/football/teams/40.png',
              league: raw.league?.name || 'Top Flight League',
              country: raw.league?.country?.name || 'International',
              match_date: raw.starting_at ? raw.starting_at.split('T')[0] : startDate,
              match_time: raw.starting_at || `${startDate}T18:00:00Z`,
              market: 'Over 2.5 Goals',
              odds: 1.85,
              confidence_score: 75,
              ai_analysis: 'Ingested from Sportsmonks. Awaiting AI quantitative generation.',
              tier: 'free',
              status: 'pending',
              prediction_outcome: 'Pending',
            };
          });
        }
      }
    } catch (err) {
      console.error('Error fetching live Sportsmonks fixtures:', err);
    }
  }

  return generateFallbackFixtures(startDate, endDate);
}

function generateFallbackFixtures(startDate: string, endDate: string): Partial<Prediction>[] {
  const clubs = [
    { name: 'Manchester City', league: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/teams/50.png' },
    { name: 'Liverpool', league: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/teams/40.png' },
    { name: 'Arsenal', league: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/teams/42.png' },
    { name: 'Chelsea', league: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/teams/49.png' },
    { name: 'Real Madrid', league: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/teams/541.png' },
    { name: 'Barcelona', league: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/teams/529.png' },
    { name: 'Bayern Munich', league: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/teams/157.png' },
    { name: 'Borussia Dortmund', league: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/teams/165.png' },
    { name: 'Inter Milan', league: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/teams/505.png' },
    { name: 'Juventus', league: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/teams/496.png' },
  ];

  const results: Partial<Prediction>[] = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);

  let idCounter = 200;
  while (cur <= end) {
    const curStr = cur.toISOString().split('T')[0];
    const pairs = [[0, 1], [4, 5], [6, 7]];

    pairs.forEach(([hIdx, aIdx], matchIdx) => {
      const h = clubs[hIdx % clubs.length];
      const a = clubs[aIdx % clubs.length];
      const hour = 16 + matchIdx * 2;

      results.push({
        fixture_id: `sm-${curStr}-${matchIdx}-${idCounter++}`,
        home_team: h.name,
        away_team: a.name,
        home_logo: h.logo,
        away_logo: a.logo,
        league: h.league,
        country: h.country,
        match_date: curStr,
        match_time: `${curStr}T${hour.toString().padStart(2, '0')}:00:00Z`,
        market: 'Both Teams to Score',
        odds: 1.75,
        confidence_score: 78,
        ai_analysis: 'Awaiting AI model evaluation.',
        tier: 'free',
        status: 'pending',
        prediction_outcome: 'Pending',
      });
    });

    cur.setDate(cur.getDate() + 1);
  }

  return results;
}
