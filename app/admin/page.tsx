import React from 'react';
import { 
  getAdminPredictions, 
  getBlogPosts, 
  getSystemSettings, 
  getSubscriptionPlans,
  getSiteBranding,
  getVipProfiles,
  getSubscriptionReminderLogs,
  getManualPaymentMethods,
  getPendingSubscriptions
} from '@/lib/db';
import { fetchAvailableLeagues } from '@/lib/fixtures-service';
import { 
  SportsmonksSettings, 
  PaymentGatewaySettings, 
  AILLMSettings,
  DataProviderSettings
} from '@/lib/types';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export default async function AdminDashboardPage() {
  const [
    predictions,
    posts,
    dataProviderSettings,
    sportsmonksSettings,
    paymentSettings,
    aiSettings,
    plans,
    brandingSettings,
    vipProfiles,
    reminderLogs,
    manualMethods,
    pendingSubscriptions,
  ] = await Promise.all([
    getAdminPredictions(),
    getBlogPosts(false),
    getSystemSettings<DataProviderSettings>('data_provider_settings'),
    getSystemSettings<SportsmonksSettings>('sportsmonks'),
    getSystemSettings<PaymentGatewaySettings>('payment_gateways'),
    getSystemSettings<AILLMSettings>('ai_llm_settings'),
    getSubscriptionPlans(),
    getSiteBranding(),
    getVipProfiles(),
    getSubscriptionReminderLogs(100),
    getManualPaymentMethods(),
    getPendingSubscriptions(),
  ]);

  const { leagues, activeProvider } = await fetchAvailableLeagues();

  return (
    <AdminDashboardClient
      predictions={predictions}
      posts={posts}
      dataProviderSettings={dataProviderSettings}
      sportsmonksSettings={sportsmonksSettings}
      paymentSettings={paymentSettings}
      aiSettings={aiSettings}
      plans={plans}
      brandingSettings={brandingSettings}
      vipProfiles={vipProfiles}
      reminderLogs={reminderLogs}
      initialLeagues={leagues}
      initialProvider={activeProvider}
      manualMethods={manualMethods}
      pendingSubscriptions={pendingSubscriptions}
    />
  );
}


