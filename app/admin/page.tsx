import React from 'react';
import { 
  getAdminPredictions, 
  getBlogPosts, 
  getSystemSettings, 
  getSubscriptionPlans 
} from '@/lib/db';
import { 
  SportsmonksSettings, 
  PaymentGatewaySettings, 
  AILLMSettings 
} from '@/lib/types';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export default async function AdminDashboardPage() {
  const [predictions, posts, sportsmonksSettings, paymentSettings, aiSettings, plans] =
    await Promise.all([
      getAdminPredictions(),
      getBlogPosts(false), // Fetch all posts including drafts
      getSystemSettings<SportsmonksSettings>('sportsmonks'),
      getSystemSettings<PaymentGatewaySettings>('payment_gateways'),
      getSystemSettings<AILLMSettings>('ai_llm_settings'),
      getSubscriptionPlans(),
    ]);

  return (
    <AdminDashboardClient
      predictions={predictions}
      posts={posts}
      sportsmonksSettings={sportsmonksSettings}
      paymentSettings={paymentSettings}
      aiSettings={aiSettings}
      plans={plans}
    />
  );
}

