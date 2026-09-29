'use server';

import { revalidatePath } from 'next/cache';
import { updateSystemSettings } from '@/lib/db';
import { getCurrentUser } from './auth';
import { PaymentGatewaySettings, AILLMSettings, SportsmonksSettings, DataProviderSettings, SiteBrandingSettings } from '@/lib/types';
import { createAdminClient } from '@/utils/supabase/admin';

async function verifyAdmin() {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function saveDataProviderSettingsAction(settings: DataProviderSettings) {
  await verifyAdmin();
  await updateSystemSettings(
    'data_provider_settings',
    settings,
    'Active football data provider (Sportsmonks or The Odds API v4) and API keys'
  );
  if (settings.sportsmonks_api_key) {
    await updateSystemSettings('sportsmonks', { api_key: settings.sportsmonks_api_key });
  }
  revalidatePath('/admin');
  return { success: true, message: `Active provider updated to ${settings.active_provider === 'the-odds-api' ? 'The Odds API (v4)' : 'Sportsmonks'}.` };
}

export async function saveSportsmonksSettingsAction(apiKey: string) {
  await verifyAdmin();
  const success = await updateSystemSettings(
    'sportsmonks',
    { api_key: apiKey },
    'Sportsmonks Football API v3 credentials'
  );
  revalidatePath('/admin');
  return { success, message: 'Sportsmonks API key updated successfully.' };
}

export async function savePaymentSettingsAction(settings: PaymentGatewaySettings) {
  await verifyAdmin();
  const success = await updateSystemSettings(
    'payment_gateways',
    settings,
    'Stripe, Paystack, and manual bank payment configuration'
  );
  revalidatePath('/admin');
  revalidatePath('/pricing');
  return { success, message: 'Payment gateway configuration saved.' };
}

export async function saveAILLMSettingsAction(settings: AILLMSettings) {
  await verifyAdmin();
  const success = await updateSystemSettings(
    'ai_llm_settings',
    settings,
    'Active LLM provider, model, and system prompt template'
  );
  revalidatePath('/admin');
  return { success, message: 'AI & LLM engine settings updated.' };
}

export async function saveSiteBrandingAction(settings: SiteBrandingSettings) {
  await verifyAdmin();
  const success = await updateSystemSettings(
    'site_branding',
    settings,
    'Site branding configuration including logo and favicon'
  );
  revalidatePath('/admin');
  revalidatePath('/');
  return { success, message: 'Global site branding saved successfully.' };
}

export async function uploadBrandingAssetAction(formData: FormData) {
  await verifyAdmin();
  const file = formData.get('file') as File;
  const assetType = (formData.get('type') as 'logo' | 'favicon') || 'logo';

  if (!file || file.size === 0) {
    return { success: false, error: 'No file provided.' };
  }

  try {
    const supabase = createAdminClient();
    const bucket = 'branding';

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b) => b.name === bucket)) {
      await supabase.storage.createBucket(bucket, { public: true });
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${assetType}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type || (assetType === 'favicon' ? 'image/x-icon' : 'image/png'),
        upsert: true,
      });

    if (uploadError) {
      console.warn('Storage upload warning, fallback to base64 data url:', uploadError.message);
      // Fallback: Return base64 data url for seamless offline / zero-storage config environments
      const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      return { success: true, url: dataUrl, message: `${assetType} uploaded.` };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      message: `${assetType === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully.`,
    };
  } catch (err: any) {
    console.error('uploadBrandingAssetAction exception:', err);
    return { success: false, error: err.message || 'Asset upload failed.' };
  }
}

