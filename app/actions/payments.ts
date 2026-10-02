'use server';

import { revalidatePath } from 'next/cache';
import { 
  getManualPaymentMethods,
  saveManualPaymentMethod,
  deleteManualPaymentMethod,
  getPendingSubscriptions,
  createPendingSubscription,
  approvePendingSubscription,
  rejectPendingSubscription
} from '@/lib/db';
import { getCurrentUser } from './auth';
import { ManualPaymentMethod, PendingSubscriptionStatus } from '@/lib/types';
import { createAdminClient } from '@/utils/supabase/admin';

async function verifyAdmin() {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized. Admin privileges required.');
  }
}

export async function uploadPaymentProofAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const { user } = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Authentication required to upload proof.' };
  }

  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { success: false, error: 'No receipt file provided.' };
  }

  // 5MB limit
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'File size exceeds maximum 5MB limit.' };
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { 
      success: false, 
      error: 'Invalid file format. Only PNG, JPG, JPEG, and PDF documents are supported.' 
    };
  }

  try {
    const supabase = createAdminClient();
    const bucket = 'payment-proofs';

    // Ensure bucket exists in Supabase Storage
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find((b) => b.name === bucket)) {
        await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: MAX_SIZE,
          allowedMimeTypes: allowedTypes,
        });
      }
    } catch (bErr) {
      console.warn('Storage bucket check warning:', bErr);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || (file.type.includes('pdf') ? 'pdf' : 'png');
    const filename = `proof-${user.id}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error, fallback to base64 data URL:', uploadError.message);
      // Fallback to base64 Data URL so proof is preserved even in zero-storage environments
      const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      return { success: true, url: dataUrl };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    console.error('uploadPaymentProofAction exception:', err);
    return { success: false, error: err.message || 'File upload failed.' };
  }
}

export async function getManualPaymentMethodsAction(onlyActive = false) {
  return getManualPaymentMethods(onlyActive);
}

export async function saveManualPaymentMethodAction(data: Partial<ManualPaymentMethod>) {
  await verifyAdmin();
  if (!data.method_name?.trim() || !data.account_details?.trim()) {
    return { success: false, error: 'Method title and account details are required.' };
  }

  const saved = await saveManualPaymentMethod(data);
  revalidatePath('/admin');
  revalidatePath('/pricing');
  return { success: !!saved, data: saved };
}

export async function deleteManualPaymentMethodAction(id: string) {
  await verifyAdmin();
  const success = await deleteManualPaymentMethod(id);
  revalidatePath('/admin');
  revalidatePath('/pricing');
  return { success };
}

export async function toggleManualPaymentMethodAction(id: string, isActive: boolean) {
  await verifyAdmin();
  const methods = await getManualPaymentMethods();
  const target = methods.find((m) => m.id === id);
  if (!target) {
    return { success: false, error: 'Payment method not found.' };
  }

  const saved = await saveManualPaymentMethod({ ...target, is_active: isActive });
  revalidatePath('/admin');
  revalidatePath('/pricing');
  return { success: !!saved };
}

export async function submitManualPaymentProofAction(
  planId: string,
  paymentMethodUsed: string,
  transactionReference: string,
  proofFileUrl?: string
) {
  const { user } = await getCurrentUser();
  if (!user) {
    return { 
      success: false, 
      error: 'Please sign in to submit a VIP membership payment request.',
      redirect: '/login?redirect=/pricing' 
    };
  }

  if (!planId || !paymentMethodUsed || !transactionReference?.trim()) {
    return { 
      success: false, 
      error: 'Please select a payment method and provide your transaction reference or hash.' 
    };
  }

  const supabase = createAdminClient();
  const [planResult, methodResult, moderationResult] = await Promise.all([
    supabase.from('subscription_plans').select('id, tier, price, is_active').eq('id', planId).maybeSingle(),
    supabase.from('manual_payment_methods').select('require_file_proof').eq('method_name', paymentMethodUsed).eq('is_active', true).maybeSingle(),
    supabase.from('account_moderation').select('status').eq('user_id', user.id).maybeSingle(),
  ]);
  if (!planResult.data || !planResult.data.is_active || planResult.data.tier === 'free' || Number(planResult.data.price) <= 0) {
    return { success: false, error: 'This membership plan is no longer available.' };
  }
  if (!methodResult.data) {
    return { success: false, error: 'This payment method is no longer available.' };
  }
  if (methodResult.data.require_file_proof && !proofFileUrl) {
    return { success: false, error: 'A payment receipt is required for this method.' };
  }
  if (moderationResult.data && ['flagged', 'suspended', 'banned'].includes(moderationResult.data.status)) {
    return { success: false, error: 'Your account is restricted. Visit the appeal center for details.' };
  }

  const res = await createPendingSubscription({
    user_id: user.id,
    plan_id: planId,
    payment_method_used: paymentMethodUsed,
    transaction_reference: transactionReference.trim(),
    proof_file_url: proofFileUrl,
  });

  if (res.success) {
    revalidatePath('/admin');
    revalidatePath('/account');
    revalidatePath('/pricing');
  }

  return res;
}

export async function getPendingSubscriptionsAction(status?: PendingSubscriptionStatus) {
  await verifyAdmin();
  return getPendingSubscriptions(status);
}

export async function approvePendingSubscriptionAction(pendingId: string, notes?: string) {
  await verifyAdmin();
  const res = await approvePendingSubscription(pendingId, notes);
  revalidatePath('/admin');
  revalidatePath('/pricing');
  revalidatePath('/vip');
  return res;
}

export async function rejectPendingSubscriptionAction(pendingId: string, reason?: string) {
  await verifyAdmin();
  const res = await rejectPendingSubscription(pendingId, reason);
  revalidatePath('/admin');
  return res;
}
