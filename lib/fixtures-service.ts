import { Prediction, DataProviderSettings, LeagueOption, DataProviderType } from './types';
import { getSystemSettings } from './db';
import { fetchSportsmonksFixtures, fetchSportsmonksLeagues } from './sportsmonks';
import { fetchTheOddsApiFixtures, fetchTheOddsApiLeagues } from './odds-api';

/**
 * Retrieves the available active leagues for the currently selected API provider
 * (Sportsmonks v3 or The Odds API v4) based on system_settings.
 */
export async function fetchAvailableLeagues(): Promise<{
  leagues: LeagueOption[];
  activeProvider: DataProviderType;
}> {
  const providerSettings = await getSystemSettings<DataProviderSettings>('data_provider_settings');
  const activeProvider = providerSettings?.active_provider || 'sportsmonks';

  if (activeProvider === 'the-odds-api') {
    const apiKey = providerSettings?.the_odds_api_key?.trim() || process.env.THE_ODDS_API_KEY?.trim();
    const leagues = await fetchTheOddsApiLeagues(apiKey);
    return { leagues, activeProvider };
  }

  const apiKey = providerSettings?.sportsmonks_api_key?.trim() || process.env.SPORTSMONKS_API_KEY?.trim();
  const leagues = await fetchSportsmonksLeagues(apiKey);
  return { leagues, activeProvider };
}

/**
 * Routes the fixture and live odds requests to the active data provider
 * (Sportsmonks v3 or The Odds API v4) based on system_settings, filtering
 * by the requested date boundaries and selected league IDs or sport keys.
 */
export async function fetchFixturesFromActiveProvider(
  startDate: string,
  endDate: string,
  selectedLeagues?: string[]
): Promise<Partial<Prediction>[]> {
  const providerSettings = await getSystemSettings<DataProviderSettings>('data_provider_settings');
  const activeProvider = providerSettings?.active_provider || 'sportsmonks';

  if (activeProvider === 'the-odds-api') {
    const apiKey = providerSettings?.the_odds_api_key?.trim() || process.env.THE_ODDS_API_KEY?.trim();
    return fetchTheOddsApiFixtures(apiKey, selectedLeagues, startDate, endDate);
  }

  // Default: Sportsmonks
  const apiKey = providerSettings?.sportsmonks_api_key?.trim() || process.env.SPORTSMONKS_API_KEY?.trim();
  return fetchSportsmonksFixtures(startDate, endDate, apiKey, selectedLeagues);
}

