import {
  Prediction,
  MatchAnalytics,
  FormMatch,
  PlayerInjury,
  MatchStatMetric,
} from './types';

const SPORTSMONKS_BASE_URL = 'https://api.sportmonks.com/v3/football';

/**
 * Determines whether a fixture or league is an international/national team context.
 */
export function isNationalContext(league?: string, country?: string): boolean {
  const text = `${league || ''} ${country || ''}`.toLowerCase();
  return (
    text.includes('nation') ||
    text.includes('international') ||
    text.includes('euro') ||
    text.includes('world cup') ||
    text.includes('copa') ||
    text.includes('afcon') ||
    text.includes('friendly') ||
    text.includes('friendlies') ||
    text.includes('qualifier') ||
    text.includes('fifa')
  );
}

/**
 * Clean empty analytics payload.
 * Strictly free of any hardcoded mock matches or dummy arrays.
 */
export function getEmptyAnalytics(): MatchAnalytics {
  return {
    home_form: [],
    away_form: [],
    h2h_matches: [],
    h2h_summary: {
      home_wins: 0,
      draws: 0,
      away_wins: 0,
      total_goals: 0,
    },
    injuries: [],
    stats: [],
    xg_trends: [],
  };
}

/**
 * Synchronous resolver fallback.
 * Strictly returns an empty structure with NO fake matches, NO dummy clubs,
 * and NO fabricated statistics.
 */
export function getMatchAnalytics(prediction: Prediction): MatchAnalytics {
  return getEmptyAnalytics();
}

/**
 * Queries Sportsmonks API to resolve a team's exact numeric ID by name.
 * Used when fixtures originate from The Odds API which does not supply provider team IDs.
 */
export async function fetchTeamIdByName(
  teamName: string,
  apiKey: string
): Promise<number | null> {
  if (!teamName || !apiKey || apiKey === 'your_sportsmonks_api_key_here') {
    return null;
  }

  // Strip club acronyms for search fallback: "Arsenal FC" -> "Arsenal"
  const cleanName = teamName.replace(/\b(FC|CF|SC|AFC|FK|BSC)\b/gi, '').trim();
  const queries = [teamName.trim()];
  if (cleanName && cleanName !== teamName.trim()) {
    queries.push(cleanName);
  }

  for (const q of queries) {
    try {
      const url = `${SPORTSMONKS_BASE_URL}/teams/search/${encodeURIComponent(q)}?api_token=${apiKey}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        // Exact name match priority
        const exact = json.data.find(
          (t: any) => t.name?.toLowerCase() === q.toLowerCase()
        );
        if (exact) return exact.id;

        // Starts with query match
        const startsWith = json.data.find((t: any) =>
          t.name?.toLowerCase().startsWith(q.toLowerCase())
        );
        if (startsWith) return startsWith.id;

        return json.data[0].id;
      }
    } catch (err) {
      console.warn(`[Sportsmonks] Team search error for "${q}":`, err);
    }
  }

  return null;
}

/**
 * Queries past fixtures using the exact, validated team_id from Sportsmonks.
 * Performs rigorous data integrity validation:
 * - Opponents must be real match participants (never static mock arrays).
 * - Matches must have matching league context (national matches for national teams, club matches for clubs).
 * - Returns an empty array if data is missing or unsupported.
 */
export async function fetchTeamForm(
  teamId: number | null,
  teamName: string,
  apiKey?: string,
  isNational = false
): Promise<FormMatch[]> {
  if (!teamId || !apiKey || apiKey === 'your_sportsmonks_api_key_here') {
    return [];
  }

  try {
    const url = `${SPORTSMONKS_BASE_URL}/teams/${teamId}?api_token=${apiKey}&include=latest.league;latest.participants;latest.scores`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const latestList = json.data?.latest;
    if (!Array.isArray(latestList) || latestList.length === 0) {
      return [];
    }

    const form: FormMatch[] = [];

    for (const match of latestList) {
      const participants = match.participants || [];
      const teamPart = participants.find(
        (p: any) =>
          p.id === teamId ||
          p.name?.toLowerCase() === teamName.toLowerCase()
      );
      const oppPart = participants.find(
        (p: any) =>
          p.id !== teamId &&
          p.name?.toLowerCase() !== teamName.toLowerCase()
      );

      // Require a verified second participant (the opponent)
      if (!oppPart) continue;

      const leagueName = match.league?.name || '';
      const leagueSubType = match.league?.sub_type || '';
      const isMatchNational =
        leagueSubType === 'international' || isNationalContext(leagueName);

      // DATA INTEGRITY CHECK: Strict league context matching
      // Discard club matches if querying for a national team and vice-versa
      if (isNational && !isMatchNational) {
        continue;
      }
      if (!isNational && isMatchNational) {
        continue;
      }

      const isHome = teamPart?.meta?.location === 'home';
      const scores = match.scores || [];
      const currentScores = scores.filter(
        (s: any) => s.description === 'CURRENT'
      );

      let teamGoals = 0;
      let oppGoals = 0;

      if (currentScores.length >= 2) {
        const teamScoreObj = currentScores.find(
          (s: any) => s.participant_id === teamId
        );
        const oppScoreObj = currentScores.find(
          (s: any) => s.participant_id === oppPart.id
        );

        teamGoals = teamScoreObj?.score?.goals ?? 0;
        oppGoals = oppScoreObj?.score?.goals ?? 0;
      } else {
        continue;
      }

      let result: 'W' | 'D' | 'L' = 'D';
      if (teamGoals > oppGoals) result = 'W';
      else if (teamGoals < oppGoals) result = 'L';

      form.push({
        opponent: oppPart.name,
        is_home: isHome,
        score: isHome ? `${teamGoals}-${oppGoals}` : `${oppGoals}-${teamGoals}`,
        result,
        date: match.starting_at ? match.starting_at.split(' ')[0] : 'Recent',
        league: leagueName || (isNational ? 'International' : 'Domestic League'),
      });

      if (form.length >= 5) break;
    }

    return form;
  } catch (err) {
    console.error(`[Sportsmonks] Failed to fetch team form for ${teamName} (${teamId}):`, err);
    return [];
  }
}

/**
 * Fetches verified head-to-head fixtures between two teams via Sportsmonks.
 * Returns empty records if unsupported or unavailable.
 */
export async function fetchH2H(
  homeId: number | null,
  awayId: number | null,
  apiKey?: string
): Promise<{
  h2h_matches: {
    date: string;
    home_score: number;
    away_score: number;
    winner: 'home' | 'away' | 'draw';
  }[];
  h2h_summary: {
    home_wins: number;
    draws: number;
    away_wins: number;
    total_goals: number;
  };
}> {
  const empty = {
    h2h_matches: [],
    h2h_summary: { home_wins: 0, draws: 0, away_wins: 0, total_goals: 0 },
  };

  if (!homeId || !awayId || !apiKey || apiKey === 'your_sportsmonks_api_key_here') {
    return empty;
  }

  try {
    const url = `${SPORTSMONKS_BASE_URL}/fixtures/head-to-head/${homeId}/${awayId}?api_token=${apiKey}&include=league;participants;scores`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) return empty;

    const json = await res.json();
    const list = json.data;
    if (!Array.isArray(list) || list.length === 0) return empty;

    const matches: {
      date: string;
      home_score: number;
      away_score: number;
      winner: 'home' | 'away' | 'draw';
    }[] = [];

    let totalGoals = 0;

    for (const match of list.slice(0, 5)) {
      const currentScores = (match.scores || []).filter(
        (s: any) => s.description === 'CURRENT'
      );
      if (currentScores.length < 2) continue;

      const homeS = currentScores.find((s: any) => s.participant_id === homeId);
      const awayS = currentScores.find((s: any) => s.participant_id === awayId);

      const hGoals = homeS?.score?.goals ?? 0;
      const aGoals = awayS?.score?.goals ?? 0;
      totalGoals += hGoals + aGoals;

      let winner: 'home' | 'away' | 'draw' = 'draw';
      if (hGoals > aGoals) winner = 'home';
      else if (aGoals > hGoals) winner = 'away';

      const matchDate = match.starting_at ? match.starting_at.split(' ')[0] : 'Past';
      const leagueName = match.league?.name ? ` (${match.league.name})` : '';

      matches.push({
        date: `${matchDate}${leagueName}`,
        home_score: hGoals,
        away_score: aGoals,
        winner,
      });
    }

    const homeWins = matches.filter((m) => m.winner === 'home').length;
    const awayWins = matches.filter((m) => m.winner === 'away').length;
    const draws = matches.filter((m) => m.winner === 'draw').length;

    return {
      h2h_matches: matches,
      h2h_summary: {
        home_wins: homeWins,
        draws,
        away_wins: awayWins,
        total_goals: totalGoals,
      },
    };
  } catch (err) {
    console.error('[Sportsmonks] H2H fetch error:', err);
    return empty;
  }
}

/**
 * Computes legitimate statistical metrics directly from validated recent form.
 * Returns empty if recent fixtures are unavailable.
 */
export function calculateMatchStats(
  homeForm: FormMatch[],
  awayForm: FormMatch[]
): MatchStatMetric[] {
  if (!homeForm.length || !awayForm.length) {
    return [];
  }

  let homeGoalsScored = 0;
  let homeGoalsConceded = 0;
  let homeCleanSheets = 0;
  let homeWins = 0;

  for (const m of homeForm) {
    const parts = m.score.split('-').map(Number);
    const scored = m.is_home ? parts[0] : parts[1];
    const conceded = m.is_home ? parts[1] : parts[0];
    if (!isNaN(scored)) homeGoalsScored += scored;
    if (!isNaN(conceded)) {
      homeGoalsConceded += conceded;
      if (conceded === 0) homeCleanSheets++;
    }
    if (m.result === 'W') homeWins++;
  }

  let awayGoalsScored = 0;
  let awayGoalsConceded = 0;
  let awayCleanSheets = 0;
  let awayWins = 0;

  for (const m of awayForm) {
    const parts = m.score.split('-').map(Number);
    const scored = m.is_home ? parts[0] : parts[1];
    const conceded = m.is_home ? parts[1] : parts[0];
    if (!isNaN(scored)) awayGoalsScored += scored;
    if (!isNaN(conceded)) {
      awayGoalsConceded += conceded;
      if (conceded === 0) awayCleanSheets++;
    }
    if (m.result === 'W') awayWins++;
  }

  const hLen = homeForm.length;
  const aLen = awayForm.length;

  return [
    {
      label: 'Avg Goals Scored / Match',
      homeValue: Number((homeGoalsScored / hLen).toFixed(2)),
      awayValue: Number((awayGoalsScored / aLen).toFixed(2)),
    },
    {
      label: 'Avg Goals Conceded / Match',
      homeValue: Number((homeGoalsConceded / hLen).toFixed(2)),
      awayValue: Number((awayGoalsConceded / aLen).toFixed(2)),
    },
    {
      label: 'Win Rate (Last 5)',
      homeValue: Math.round((homeWins / hLen) * 100),
      awayValue: Math.round((awayWins / aLen) * 100),
      unit: '%',
    },
    {
      label: 'Clean Sheet Rate',
      homeValue: Math.round((homeCleanSheets / hLen) * 100),
      awayValue: Math.round((awayCleanSheets / aLen) * 100),
      unit: '%',
    },
  ];
}

/**
 * Asynchronously resolves live VIP match telemetry and form records.
 * Queries verified provider endpoints and strictly refuses to inject fake club
 * data or fabricated matches when live records are unavailable.
 */
export async function fetchMatchAnalytics(
  prediction: Prediction,
  customApiKey?: string
): Promise<MatchAnalytics> {
  const apiKey =
    customApiKey?.trim() ||
    process.env.SPORTSMONKS_API_KEY?.trim();

  if (!apiKey || apiKey === 'your_sportsmonks_api_key_here') {
    return getEmptyAnalytics();
  }

  const isNational = isNationalContext(prediction.league, prediction.country);
  let homeTeamId: number | null = null;
  let awayTeamId: number | null = null;

  // 1. If fixture_id is numeric (Sportsmonks fixture ID), fetch exact participant IDs
  if (prediction.fixture_id && /^\d+$/.test(prediction.fixture_id)) {
    try {
      const url = `${SPORTSMONKS_BASE_URL}/fixtures/${prediction.fixture_id}?api_token=${apiKey}&include=participants`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const json = await res.json();
        const participants = json.data?.participants || [];
        const homePart =
          participants.find((p: any) => p.meta?.location === 'home') ||
          participants[0];
        const awayPart =
          participants.find((p: any) => p.meta?.location === 'away') ||
          participants[1];
        if (homePart?.id) homeTeamId = homePart.id;
        if (awayPart?.id) awayTeamId = awayPart.id;
      }
    } catch (err) {
      console.warn('[Sportsmonks] Failed to resolve fixture participants:', err);
    }
  }

  // 2. Fallback to exact team-name lookup against Sportsmonks (e.g. for The Odds API fixtures)
  if (!homeTeamId) {
    homeTeamId = await fetchTeamIdByName(prediction.home_team, apiKey);
  }
  if (!awayTeamId) {
    awayTeamId = await fetchTeamIdByName(prediction.away_team, apiKey);
  }

  // 3. Fetch past fixtures for Home and Away using exact validated team IDs
  const [homeForm, awayForm, h2hData] = await Promise.all([
    fetchTeamForm(homeTeamId, prediction.home_team, apiKey, isNational),
    fetchTeamForm(awayTeamId, prediction.away_team, apiKey, isNational),
    fetchH2H(homeTeamId, awayTeamId, apiKey),
  ]);

  // 4. Calculate legitimate statistics from the retrieved form
  const stats = calculateMatchStats(homeForm, awayForm);

  return {
    home_form: homeForm,
    away_form: awayForm,
    h2h_matches: h2hData.h2h_matches,
    h2h_summary: h2hData.h2h_summary,
    injuries: [], // Verified provider injury feed only; no fake mock players
    stats,
    xg_trends: [], // No fake xG curves; only populated when historical xG telemetry is recorded
  };
}
