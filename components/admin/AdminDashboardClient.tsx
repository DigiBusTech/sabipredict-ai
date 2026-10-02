'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, BookOpen, Key, Cpu, CreditCard, 
  Palette, Bell, ShieldCheck 
} from 'lucide-react';
import { 
  Prediction, BlogPost, SportsmonksSettings, 
  PaymentGatewaySettings, AILLMSettings, SubscriptionPlan,
  DataProviderSettings, SiteBrandingSettings, UserProfile,
  SubscriptionReminderLog, LeagueOption, DataProviderType, WinningTicket
} from '@/lib/types';
import PredictionsTab from './PredictionsTab';
import BlogTab from './BlogTab';
import ApiTab from './ApiTab';
import AiTab from './AiTab';
import PlansTab from './PlansTab';
import BrandingTab from './BrandingTab';
import RemindersTab from './RemindersTab';
import PendingPaymentsTab from './PendingPaymentsTab';
import { ManualPaymentMethod, PendingSubscription } from '@/lib/types';
import WinningTicketsTab from './WinningTicketsTab';

interface AdminDashboardClientProps {
  predictions: Prediction[];
  posts: BlogPost[];
  dataProviderSettings?: DataProviderSettings | null;
  sportsmonksSettings: SportsmonksSettings | null;
  paymentSettings: PaymentGatewaySettings | null;
  aiSettings: AILLMSettings | null;
  plans: SubscriptionPlan[];
  brandingSettings?: SiteBrandingSettings | null;
  vipProfiles?: UserProfile[];
  reminderLogs?: SubscriptionReminderLog[];
  initialLeagues?: LeagueOption[];
  initialProvider?: DataProviderType;
  manualMethods?: ManualPaymentMethod[];
  pendingSubscriptions?: PendingSubscription[];
  winningTickets?: WinningTicket[];
}

export default function AdminDashboardClient({
  predictions,
  posts,
  dataProviderSettings,
  sportsmonksSettings,
  paymentSettings,
  aiSettings,
  plans,
  brandingSettings,
  vipProfiles = [],
  reminderLogs = [],
  initialLeagues,
  initialProvider,
  manualMethods = [],
  pendingSubscriptions = [],
  winningTickets = [],
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<
    'predictions' | 'blog' | 'api' | 'ai' | 'plans' | 'branding' | 'reminders' | 'pending-payments' | 'winning-tickets'
  >('predictions');

  const pendingCount = predictions.filter((p) => p.status === 'pending').length;
  const pendingSubsCount = pendingSubscriptions.filter((s) => s.status === 'pending').length;
  const pendingTicketsCount = winningTickets.filter((ticket) => ticket.status === 'pending').length;

  const tabs = [
    { id: 'predictions', label: 'Predictions Moderation', icon: CheckSquare, badge: pendingCount },
    { id: 'pending-payments', label: 'Subscription Approvals', icon: ShieldCheck, badge: pendingSubsCount },
    { id: 'winning-tickets', label: 'Winning Tickets', icon: ShieldCheck, badge: pendingTicketsCount },
    { id: 'blog', label: 'Blog Management', icon: BookOpen, badge: posts.length },
    { id: 'api', label: 'API Management', icon: Key },
    { id: 'ai', label: 'AI & LLM Management', icon: Cpu },
    { id: 'plans', label: 'Subscription Plans', icon: CreditCard, badge: plans.length },
    { id: 'branding', label: 'Global Branding', icon: Palette },
    { id: 'reminders', label: 'Subscription Reminders', icon: Bell, badge: vipProfiles.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Dynamic Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1C2541] pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#48CAE4] text-[#0B132B] shadow-lg shadow-[#48CAE4]/20'
                  : 'bg-[#111C38] text-slate-300 hover:bg-[#1C2541] hover:text-white border border-[#1C2541]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {'badge' in tab && tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    isActive ? 'bg-[#0B132B] text-[#48CAE4]' : 'bg-[#1C2541] text-amber-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'predictions' && (
          <PredictionsTab
            predictions={predictions}
            initialLeagues={initialLeagues}
            initialProvider={initialProvider}
          />
        )}
        {activeTab === 'pending-payments' && (
          <PendingPaymentsTab initialItems={pendingSubscriptions} />
        )}
        {activeTab === 'winning-tickets' && <WinningTicketsTab initialTickets={winningTickets} />}
        {activeTab === 'blog' && <BlogTab posts={posts} />}
        {activeTab === 'api' && (
          <ApiTab
            dataProviderSettings={dataProviderSettings}
            sportsmonksSettings={sportsmonksSettings}
            paymentSettings={paymentSettings}
            initialManualMethods={manualMethods}
          />
        )}
        {activeTab === 'ai' && <AiTab initialSettings={aiSettings} />}
        {activeTab === 'plans' && <PlansTab plans={plans} />}
        {activeTab === 'branding' && <BrandingTab initialSettings={brandingSettings} />}
        {activeTab === 'reminders' && (
          <RemindersTab vipProfiles={vipProfiles} reminderLogs={reminderLogs} />
        )}
      </div>
    </div>
  );
}