import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { 
  Prediction, 
  BlogPost, 
  UserProfile, 
  SubscriptionPlan, 
  PredictionOutcome,
  PredictionTier,
  PredictionStatus
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

export async function insertPredictions(predictions: Partial<Prediction>[]): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('predictions').insert(predictions);
    if (error) {
      console.error('insertPredictions error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('insertPredictions exception:', err);
    return false;
  }
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

