-- =============================================================================
-- SABIPREDICT AI - SAMPLE SEED DATA WITH OUTCOMES & SCORES
-- =============================================================================

INSERT INTO public.predictions (
    id, fixture_id, home_team, away_team, home_logo, away_logo, league, country,
    match_date, match_time, market, odds, confidence_score, ai_analysis,
    tier, status, home_score, away_score, prediction_outcome
) VALUES
-- Yesterday's Settled Matches (Won and Lost with real scores)
(
    '11111111-1111-1111-1111-111111111101',
    'sm-101',
    'Arsenal',
    'Chelsea',
    'https://media.api-sports.io/football/teams/42.png',
    'https://media.api-sports.io/football/teams/49.png',
    'Premier League',
    'England',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '1 day' + INTERVAL '16 hours 30 mins',
    'Over 2.5 Goals',
    1.78,
    86,
    'Arsenal generated 2.34 xG across prior home matches while Chelsea conceded 1.62 away. Fast transitions created high-volume scoring chances, easily clearing the Over 2.5 line.',
    'free',
    'approved',
    3,
    1,
    'Won'
),
(
    '11111111-1111-1111-1111-111111111102',
    'sm-102',
    'Barcelona',
    'Atletico Madrid',
    'https://media.api-sports.io/football/teams/529.png',
    'https://media.api-sports.io/football/teams/530.png',
    'La Liga',
    'Spain',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '1 day' + INTERVAL '20 hours 00 mins',
    'Home Win',
    1.92,
    79,
    'Barcelona dominated possession at Montjuïc, breaking through Atletico low block via inverted wide overloads and generating 2.15 xG.',
    'vip',
    'approved',
    2,
    0,
    'Won'
),
(
    '11111111-1111-1111-1111-111111111103',
    'sm-103',
    'Inter Milan',
    'Juventus',
    'https://media.api-sports.io/football/teams/505.png',
    'https://media.api-sports.io/football/teams/496.png',
    'Serie A',
    'Italy',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '1 day' + INTERVAL '19 hours 45 mins',
    'Under 2.5 Goals',
    1.85,
    74,
    'Derby dItalia encounters average 1.7 goals over recent meetings. Both squads deployed disciplined double pivots.',
    'free',
    'approved',
    1,
    0,
    'Won'
),
(
    '11111111-1111-1111-1111-111111111104',
    'sm-104',
    'Napoli',
    'Lazio',
    'https://media.api-sports.io/football/teams/492.png',
    'https://media.api-sports.io/football/teams/487.png',
    'Serie A',
    'Italy',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '1 day' + INTERVAL '17 hours 00 mins',
    'Both Teams to Score',
    1.70,
    75,
    'Lazio suffered defensive restructuring which limited offensive output, leading to an upset clean sheet.',
    'free',
    'approved',
    1,
    0,
    'Lost'
),

-- Today's Matches (Pending live kickoffs)
(
    '22222222-2222-2222-2222-222222222201',
    'sm-105',
    'Manchester City',
    'Liverpool',
    'https://media.api-sports.io/football/teams/50.png',
    'https://media.api-sports.io/football/teams/40.png',
    'Premier League',
    'England',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '16 hours 30 mins',
    'Both Teams to Score',
    1.65,
    88,
    'Guardiola vs Slot tactical battle produces high turnover rates in attacking zones. City has scored in 21 straight home games.',
    'free',
    'approved',
    NULL,
    NULL,
    'Pending'
),
(
    '22222222-2222-2222-2222-222222222202',
    'sm-106',
    'Real Madrid',
    'Sevilla',
    'https://media.api-sports.io/football/teams/541.png',
    'https://media.api-sports.io/football/teams/536.png',
    'La Liga',
    'Spain',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '19 hours 00 mins',
    'Home Win',
    1.88,
    84,
    'Real Madrid boasts an undefeated home record at the Bernabéu. Sevillas away metrics reveal vulnerabilities against quick diagonal switches.',
    'vip',
    'approved',
    NULL,
    NULL,
    'Pending'
),
(
    '22222222-2222-2222-2222-222222222203',
    'sm-107',
    'Bayern Munich',
    'Borussia Dortmund',
    'https://media.api-sports.io/football/teams/157.png',
    'https://media.api-sports.io/football/teams/165.png',
    'Bundesliga',
    'Germany',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '17 hours 30 mins',
    'Over 2.5 Goals',
    1.52,
    91,
    'Der Klassiker has cleared Over 2.5 in 9 of the last 10 meetings. Bayern leads Europe with 2.61 xG per match.',
    'free',
    'approved',
    NULL,
    NULL,
    'Pending'
),
(
    '22222222-2222-2222-2222-222222222204',
    'sm-108',
    'Paris Saint-Germain',
    'Marseille',
    'https://media.api-sports.io/football/teams/85.png',
    'https://media.api-sports.io/football/teams/81.png',
    'Ligue 1',
    'France',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '20 hours 45 mins',
    'Home Win',
    1.72,
    82,
    'Le Classique advantage at Parc des Princes. PSG has won 4 of the last 5 head-to-heads with superior pressing recovery numbers in the final third.',
    'vip',
    'approved',
    NULL,
    NULL,
    'Pending'
);

-- Blog Posts Seed
INSERT INTO public.blog_posts (id, title, slug, content, excerpt, author, cover_image, category, read_time, published) VALUES
(
    '55555555-5555-5555-5555-555555555501',
    'Mastering Expected Goals (xG) & Value Betting in Modern Football',
    'mastering-xg-and-value-betting-football',
    '### Why Traditional Betting Stats Are Misleading
Most amateur bettors look solely at recent match results: win streaks, clean sheets, and simple goal averages. However, football is an inherently low-scoring game where variance and luck dictate up to 35% of individual match outcomes. 

A team can dominate a game with 22 shots, hit the post three times, accumulate 2.80 Expected Goals (xG), and still lose 0-1 to a deflected counter-attack. Traditional betting tables treat this as an outright loss, lowering the market confidence on that squad for the following week. 

### How SabiPredict AI Calculates Expected Value (EV)
Our algorithmic prediction engine looks beyond the scoreboard to quantify true underlying performance. By factoring in shot distance, angle, assist type, defender proximity, and transitional phases, we establish an objective expected goals probability distribution.

The mathematical formula for Expected Value (EV) is:
EV = (Probability * Odds) - 1

When the bookmaker prices an outcome at 2.00 (implied probability of 50%), but our Poisson xG model assigns a 60% probability, the positive EV is:
(0.60 * 2.00) - 1 = +0.20 (+20% edge)

Consistent compounding of positive EV bets is the sole proven methodology for long-term sports betting profitability.',
    'Discover how SabiPredict AI leverages Expected Goals (xG) and Poisson probability modeling to calculate positive expected value (+EV) and beat the sportsbooks.',
    'Dr. Alex Sterling, Quantitative Sports Analyst',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&h=600&fit=crop',
    'Quantitative Strategy',
    '5 min read',
    true
),
(
    '55555555-5555-5555-5555-555555555502',
    'Bankroll Management 101: The Kelly Criterion for Football Punters',
    'bankroll-management-kelly-criterion-football',
    '### The Number One Reason 95% of Bettors Lose Money
You can possess the greatest prediction model on earth, but without disciplined bankroll management, mathematical drawdown will eventually wipe out your capital. 

Emotional staking, chasing losses after a bad beat, and betting inconsistent unit percentages are the primary pitfalls.

### The Fractional Kelly Criterion
The Kelly Criterion determines the optimal stake percentage based on your calculated statistical edge:
f = (b * p - q) / b

Where:
- b = decimal odds minus 1
- p = probability of winning
- q = probability of losing (1 - p)

To protect against short-term variance and inevitable model errors, professional syndicates use Quarter-Kelly (0.25x). This dramatically flattens volatility while preserving logarithmic capital growth.',
    'Learn how professional quantitative syndicates use the Kelly Criterion and unit staking to preserve capital and compound betting profits.',
    'Elena Vance, Risk Management Specialist',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=600&fit=crop',
    'Bankroll Management',
    '6 min read',
    true
);

