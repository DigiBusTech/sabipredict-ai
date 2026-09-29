import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { 
  Prediction, 
  BlogPost, 
  UserProfile, 
  SubscriptionPlan, 
  PredictionOutcome,
  PredictionTier,
  PredictionStatus,
  SiteBrandingSettings,
  SubscriptionReminderLog
} from './types';

// =============================================================================
// PROFILES & AUTH RBAC
// =============================================================================

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return (profile as UserProfile) || null;
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return (profile as UserProfile) || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// =============================================================================
// PREDICTIONS
// =============================================================================

export async function getPredictions(options?: {
  date?: string;
  status?: PredictionStatus | 'all';
  tier?: PredictionTier | 'all';
  limit?: number;
}): Promise<Prediction[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from('predictions').select('*');

    if (options?.date) {
      query = query.eq('match_date', options.date);
    }
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }
    if (options?.tier && options.tier !== 'all') {
      query = query.eq('tier', options.tier);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query
      .order('match_time', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getPredictions error:', error);
      return [];
    }

    return (data as Prediction[]) || [];
  } catch (error) {
    console.error('getPredictions error:', error);
    return [];
  }
}

export async function getAdminPredictions(options?: {
  date?: string;
  status?: PredictionStatus | 'all';
}): Promise<Prediction[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('predictions').select('*');

    if (options?.date) {
      query = query.eq('match_date', options.date);
    }
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin getPredictions error:', error);
      return [];
    }

    return (data as Prediction[]) || [];
  } catch (error) {
    console.error('Admin getPredictions error:', error);
    return [];
  }
}

export async function getPredictionById(id: string): Promise<Prediction | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return (data as Prediction) || null;
  } catch {
    return null;
  }
}

export interface InsertPredictionsResult {
  success: boolean;
  count: number;
  error?: string;
}

export async function upsertPredictions(
  predictions: Partial<Prediction>[]
): Promise<InsertPredictionsResult> {
  if (!predictions || !predictions.length) {
    return { success: true, count: 0 };
  }

  try {
    const supabase = createAdminClient();

    // Sanitize records to ensure valid schema types and omit non-existent columns
    const sanitized = predictions.map((p) => {
      const rec: any = {
        fixture_id: String(p.fixture_id || `fix-${Date.now()}`),
        home_team: p.home_team || 'Home Team',
        away_team: p.away_team || 'Away Team',
        home_logo: p.home_logo || '',
        away_logo: p.away_logo || '',
        league: p.league || 'Top Flight League',
        country: p.country || 'International',
        match_date: p.match_date || new Date().toISOString().split('T')[0],
        match_time: p.match_time || new Date().toISOString(),
        market: p.market || 'Over 1.5 Goals',
        odds: Math.max(1.05, Number(p.odds) || 1.35),
        confidence_score: Math.min(100, Math.max(1, Math.round(Number(p.confidence_score) || 75))),
        ai_analysis: p.ai_analysis || '',
        tier: p.tier || 'free',
        status: p.status || 'pending',
        prediction_outcome: p.prediction_outcome || 'Pending',
      };
      if (p.home_score !== undefined && p.home_score !== null) rec.home_score = p.home_score;
      if (p.away_score !== undefined && p.away_score !== null) rec.away_score = p.away_score;
      return rec;
    });

    // Check for existing predictions by fixture_id
    const fixtureIds = sanitized.map((r) => r.fixture_id);
    const { data: existing, error: queryErr } = await supabase
      .from('predictions')
      .select('id, fixture_id')
      .in('fixture_id', fixtureIds);

    if (queryErr) {
      console.warn('[Supabase DB Query Warning] Checking existing fixture_ids:', queryErr.message);
    }

    const existingMap = new Map<string, string>();
    if (existing && Array.isArray(existing)) {
      for (const e of existing) {
        if (e.fixture_id) existingMap.set(e.fixture_id, e.id);
      }
    }

    const toInsert: any[] = [];
    const toUpdate: { id: string; data: any }[] = [];

    for (const item of sanitized) {
      const existingId = existingMap.get(item.fixture_id);
      if (existingId) {
        toUpdate.push({ id: existingId, data: item });
      } else {
        toInsert.push(item);
      }
    }

    let insertedCount = 0;
    let updatedCount = 0;

    // Execute inserts for new fixtures
    if (toInsert.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('predictions')
        .insert(toInsert)
        .select('id');

      if (insertErr) {
        console.error('[Supabase DB Error] insert predictions failed:', insertErr);
        return {
          success: false,
          count: 0,
          error: `Database insertion failed: ${insertErr.message} (${insertErr.code || 'unknown'})`,
        };
      }
      insertedCount = inserted?.length || toInsert.length;
    }

    // Execute updates for existing fixtures
    if (toUpdate.length > 0) {
      for (const item of toUpdate) {
        const { error: updateErr } = await supabase
          .from('predictions')
          .update({ ...item.data, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        if (updateErr) {
          console.error('[Supabase DB Error] update prediction failed:', updateErr);
        } else {
          updatedCount++;
        }
      }
    }

    return {
      success: true,
      count: insertedCount + updatedCount,
    };
  } catch (err: any) {
    console.error('[Supabase DB Error] Exception during upsertPredictions:', err);
    return {
      success: false,
      count: 0,
      error: err.message || 'Database transaction error',
    };
  }
}

export async function insertPredictions(
  predictions: Partial<Prediction>[]
): Promise<boolean> {
  const res = await upsertPredictions(predictions);
  return res.success;
}

export async function updatePrediction(
  id: string,
  updates: Partial<Prediction>
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('predictions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('updatePrediction error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('updatePrediction exception:', err);
    return false;
  }
}

export async function deletePrediction(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('predictions').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
export async function bulkUpdatePredictions(
  ids: string[],
  updates: Partial<Prediction>
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('predictions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ids);

    return !error;
  } catch (err) {
    console.error('bulkUpdatePredictions exception:', err);
    return false;
  }
}

export async function bulkDeletePredictions(ids: string[]): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('predictions').delete().in('id', ids);
    return !error;
  } catch {
    return false;
  }
}


// =============================================================================
// BLOG POSTS
// =============================================================================

export async function getBlogPosts(onlyPublished = true): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from('blog_posts').select('*');
    if (onlyPublished) {
      query = query.eq('published', true);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('getBlogPosts error:', error);
      return [];
    }
    return (data as BlogPost[]) || [];
  } catch (err) {
    console.error('getBlogPosts exception:', err);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return (data as BlogPost) || null;
  } catch {
    return null;
  }
}

export async function upsertBlogPost(post: Partial<BlogPost>): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('blog_posts')
      .upsert({ ...post, updated_at: new Date().toISOString() }, { onConflict: 'slug' });

    if (error) {
      console.error('upsertBlogPost error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('upsertBlogPost exception:', err);
    return false;
  }
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// =============================================================================
// SYSTEM SETTINGS (API Keys, LLM & Payments)
// =============================================================================

export async function getSystemSettings<T = any>(key: string): Promise<T | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data.value as T;
  } catch {
    return null;
  }
}

export async function updateSystemSettings(key: string, value: any, description?: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const payload: any = {
      key,
      value,
      updated_at: new Date().toISOString(),
    };
    if (description) payload.description = description;

    const { error } = await supabase
      .from('system_settings')
      .upsert(payload, { onConflict: 'key' });

    return !error;
  } catch {
    return false;
  }
}

// =============================================================================
// SUBSCRIPTION PLANS
// =============================================================================

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) return [];
    return (data as SubscriptionPlan[]) || [];
  } catch {
    return [];
  }
}

export async function upsertSubscriptionPlan(plan: SubscriptionPlan): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('subscription_plans')
      .upsert(plan, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

export async function deleteSubscriptionPlan(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
// =============================================================================
// SITE BRANDING
// =============================================================================

export async function getSiteBranding(): Promise<SiteBrandingSettings | null> {
  return getSystemSettings<SiteBrandingSettings>('site_branding');
}

export async function saveSiteBranding(settings: SiteBrandingSettings): Promise<boolean> {
  return updateSystemSettings('site_branding', settings, 'Site branding configuration');
}

// =============================================================================
// SUBSCRIPTION REMINDER LOGS & VIP EXPIRATIONS
// =============================================================================

export async function getVipProfiles(): Promise<UserProfile[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or('role.eq.vip_user,subscription_tier.eq.vip');

    if (error) {
      console.warn('getVipProfiles query warning:', error.message || error);
      return [];
    }
    const profiles = (data as UserProfile[]) || [];
    // Sort in JavaScript by vip_until if present
    profiles.sort((a, b) => {
      if (!a.vip_until) return 1;
      if (!b.vip_until) return -1;
      return new Date(a.vip_until).getTime() - new Date(b.vip_until).getTime();
    });
    return profiles;
  } catch {
    return [];
  }
}

export async function getSubscriptionReminderLogs(limit = 50): Promise<SubscriptionReminderLog[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('subscription_reminder_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist yet, gracefully read from system_settings fallback
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        const fallback = await getSystemSettings<SubscriptionReminderLog[]>('subscription_reminder_logs');
        return Array.isArray(fallback) ? fallback.slice(0, limit) : [];
      }
      console.warn('getSubscriptionReminderLogs warning:', error.message || error);
      return [];
    }
    return (data as SubscriptionReminderLog[]) || [];
  } catch {
    return [];
  }
}

export async function insertSubscriptionReminderLog(
  log: Partial<SubscriptionReminderLog>
): Promise<boolean> {
  const newLog: SubscriptionReminderLog = {
    id: (log.id as string) || `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: log.user_id || '',
    email: log.email || '',
    stage: log.stage || 'manual',
    status: log.status || 'sent',
    vip_until: log.vip_until || null,
    error_message: log.error_message || null,
    sent_at: log.sent_at || new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('subscription_reminder_logs')
      .insert([newLog]);

    if (!error) return true;

    // If table doesn't exist in Supabase yet, store in system_settings fallback
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      const existing = (await getSystemSettings<SubscriptionReminderLog[]>('subscription_reminder_logs')) || [];
      const updated = [newLog, ...(Array.isArray(existing) ? existing : [])].slice(0, 100);
      await updateSystemSettings('subscription_reminder_logs', updated, 'Audit log of sent VIP renewal reminder emails');
      return true;
    }

    console.warn('insertSubscriptionReminderLog warning:', error.message || error);
    return false;
  } catch (err: any) {
    console.warn('insertSubscriptionReminderLog fallback caught error:', err.message || err);
    return false;
  }
}


