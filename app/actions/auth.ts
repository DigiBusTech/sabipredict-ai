'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { UserProfile } from '@/lib/types';

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirect') as string) || '/';

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: moderation } = await supabase
      .from('account_moderation')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();
    if (moderation && ['flagged', 'suspended', 'banned'].includes(moderation.status)) {
      revalidatePath('/', 'layout');
      redirect('/support/appeal');
    }
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function signUpAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const fullName = (formData.get('fullName') as string)?.trim();
  const referralCode = (formData.get('referralCode') as string | null)?.trim().toUpperCase();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (confirmPassword !== undefined && confirmPassword !== null && password !== confirmPassword) {
    return { error: 'Passwords do not match. Please ensure both passwords match.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || splitEmail(email),
        role: 'free_user',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user?.id && referralCode && /^[A-Z0-9]{8,16}$/.test(referralCode)) {
    try {
      const admin = createAdminClient();
      const { data: affiliate } = await admin
        .from('affiliate_profiles')
        .select('user_id')
        .eq('referral_code', referralCode)
        .maybeSingle();
      if (affiliate && affiliate.user_id !== data.user.id) {
        await admin.from('referral_attributions').insert({
          referrer_id: affiliate.user_id,
          referred_user_id: data.user.id,
        });
      }
    } catch (referralError) {
      console.error('Referral attribution could not be recorded:', referralError);
    }
  }

  revalidatePath('/', 'layout');
  return { success: true, message: 'Account created! You can now log in.' };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getCurrentUser(): Promise<{
  user: any;
  profile: UserProfile | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile: (profile as UserProfile) || null };
  } catch {
    return { user: null, profile: null };
  }
}

function splitEmail(email: string) {
  return email.split('@')[0];
}
