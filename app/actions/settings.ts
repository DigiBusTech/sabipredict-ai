'use server';

import { revalidatePath } from 'next/cache';
import { updateSystemSettings } from '@/lib/db';
import { getCurrentUser } from './auth';
import { PaymentGatewaySettings, AILLMSettings, SportsmonksSettings } from '@/lib/types';

async function verifyAdmin() {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized. Admin access required.');
  }
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
