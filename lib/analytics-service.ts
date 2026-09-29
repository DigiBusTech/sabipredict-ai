import { Prediction, MatchAnalytics, FormMatch, PlayerInjury, MatchStatMetric } from './types';

/**
 * Generates deterministic, high-fidelity quantitative analytics, form records,
 * H2H metrics, injury feeds, and xG trend data for any prediction.
 */
export function getMatchAnalytics(prediction: Prediction): MatchAnalytics {
  const home = prediction.home_team;
  const away = prediction.away_team;
  const hash = Math.abs(
    home.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 17 +
    away.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 31
  );

  // Deterministic form generation
  const opponentsHome = ['Newcastle', 'Aston Villa', 'Brighton', 'West Ham', 'Wolves', 'Everton', 'Fulham', 'Brentford'];
  const opponentsAway = ['Sevilla', 'Villarreal', 'Real Sociedad', 'Athletic Club', 'Betis', 'Getafe', 'Osasuna', 'Celta Vigo'];

  const homeForm: FormMatch[] = [
    { opponent: opponentsHome[hash % opponentsHome.length], is_home: true, score: '2-1', result: 'W', xg: 2.14, date: '5 days ago' },
    { opponent: opponentsHome[(hash + 1) % opponentsHome.length], is_home: false, score: '1-1', result: 'D', xg: 1.45, date: '9 days ago' },
    { opponent: opponentsHome[(hash + 2) % opponentsHome.length], is_home: true, score: '3-0', result: 'W', xg: 2.85, date: '14 days ago' },
    { opponent: opponentsHome[(hash + 3) % opponentsHome.length], is_home: false, score: '0-1', result: 'L', xg: 0.92, date: '19 days ago' },
    { opponent: opponentsHome[(hash + 4) % opponentsHome.length], is_home: true, score: '2-0', result: 'W', xg: 1.88, date: '24 days ago' },
  ];

  const awayForm: FormMatch[] = [
    { opponent: opponentsAway[hash % opponentsAway.length], is_home: false, score: '1-2', result: 'L', xg: 1.15, date: '4 days ago' },
    { opponent: opponentsAway[(hash + 1) % opponentsAway.length], is_home: true, score: '2-2', result: 'D', xg: 1.78, date: '8 days ago' },
    { opponent: opponentsAway[(hash + 2) % opponentsAway.length], is_home: false, score: '0-2', result: 'L', xg: 0.81, date: '13 days ago' },
    { opponent: opponentsAway[(hash + 3) % opponentsAway.length], is_home: true, score: '1-0', result: 'W', xg: 1.40, date: '18 days ago' },
    { opponent: opponentsAway[(hash + 4) % opponentsAway.length], is_home: false, score: '1-1', result: 'D', xg: 1.25, date: '23 days ago' },
  ];

  // Head-to-head recent meetings
  const h2hMatches = [
    { date: 'Last Season (H)', home_score: 2, away_score: 1, winner: 'home' as const },
    { date: 'Last Season (A)', home_score: 1, away_score: 1, winner: 'draw' as const },
    { date: '2024 Cup', home_score: 3, away_score: 0, winner: 'home' as const },
    { date: '2023 League (H)', home_score: 1, away_score: 2, winner: 'away' as const },
    { date: '2023 League (A)', home_score: 2, away_score: 2, winner: 'draw' as const },
  ];

  const homeWins = h2hMatches.filter((m) => m.winner === 'home').length;
  const awayWins = h2hMatches.filter((m) => m.winner === 'away').length;
  const draws = h2hMatches.filter((m) => m.winner === 'draw').length;

  // Realistic injury roster
  const sampleInjuries: PlayerInjury[] = [
    {
      player: `${home.split(' ')[0]} Striker (Starter)`,
      team: home,
      position: 'Forward',
      status: (hash % 2 === 0 ? 'Out' : 'Doubtful'),
      reason: 'Hamstring muscle strain (7-10 days)',
    },
    {
      player: `${home.split(' ')[0]} Midfield Anchor`,
      team: home,
      position: 'Midfielder',
      status: 'Out',
      reason: 'Ankle ligament sprain',
    },
    {
      player: `${away.split(' ')[0]} Centre-Back`,
      team: away,
      position: 'Defender',
      status: (hash % 3 === 0 ? 'Suspended' : 'Out'),
      reason: 'Accumulated yellow card threshold',
    },
    {
      player: `${away.split(' ')[0]} First-Choice Goalkeeper`,
      team: away,
      position: 'Goalkeeper',
      status: 'Doubtful',
      reason: 'Late fitness test (Groin discomfort)',
    },
  ];

  // Performance comparison metrics
  const stats: MatchStatMetric[] = [
    { label: 'Average Possession', homeValue: 56.4 + (hash % 6), awayValue: 43.6 - (hash % 6), unit: '%' },
    { label: 'Expected Goals (xG) / 90', homeValue: Number((1.82 + (hash % 5) * 0.1).toFixed(2)), awayValue: Number((1.24 + ((hash + 2) % 4) * 0.1).toFixed(2)) },
    { label: 'Shots on Target / Match', homeValue: 6.2, awayValue: 4.1 },
    { label: 'Clean Sheet Rate', homeValue: 45, awayValue: 30, unit: '%' },
    { label: 'Dangerous Attacks / 90', homeValue: 68, awayValue: 49 },
    { label: 'Shot Conversion Rate', homeValue: 14.8, awayValue: 11.2, unit: '%' },
  ];

  // xG trend data for Recharts area graph
  const xgTrends = [
    { match_num: 'Match 1', home_xg: 1.88, away_xg: 1.25 },
    { match_num: 'Match 2', home_xg: 0.92, away_xg: 1.40 },
    { match_num: 'Match 3', home_xg: 2.85, away_xg: 0.81 },
    { match_num: 'Match 4', home_xg: 1.45, away_xg: 1.78 },
    { match_num: 'Match 5', home_xg: 2.14, away_xg: 1.15 },
  ];

  return {
    home_form: homeForm,
    away_form: awayForm,
    h2h_matches: h2hMatches,
    h2h_summary: {
      home_wins: homeWins,
      draws: draws,
      away_wins: awayWins,
      total_goals: 15,
    },
    injuries: sampleInjuries,
    stats: stats,
    xg_trends: xgTrends,
  };
}
