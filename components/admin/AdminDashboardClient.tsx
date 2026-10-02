'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, BookOpen, Key, Cpu, CreditCard, LayoutDashboard,
  Palette, Bell, ShieldCheck, MessageSquareQuote, Users, Wallet, FileText, AlertTriangle
  ,Megaphone, Search
} from 'lucide-react';
import { 
  Prediction, BlogPost, SportsmonksSettings, 
  PaymentGatewaySettings, AILLMSettings, SubscriptionPlan,
  DataProviderSettings, SiteBrandingSettings, UserProfile,
  SubscriptionReminderLog, LeagueOption, DataProviderType, WinningTicket,
  Testimonial, AffiliatePayoutRequest, AffiliateSettings, AccountAppeal, AdminManagedUser, PolicyPage
  ,HomepageContent, PromoSlot, PageSeoMetadata
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
import TestimonialsTab from './TestimonialsTab';
import AffiliatesTab from './AffiliatesTab';
import AppealsTab from './AppealsTab';
import UsersTab from './UsersTab';
import PoliciesTab from './PoliciesTab';
import AdminOverview from './AdminOverview';
import ContentManagementTab from './ContentManagementTab';
import SeoManagementTab from './SeoManagementTab';

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
  testimonials?: Testimonial[];
  affiliateSettings?: AffiliateSettings;
  affiliatePayouts?: AffiliatePayoutRequest[];
  appeals?: AccountAppeal[];
  managedUsers?: AdminManagedUser[];
  policyPages?: PolicyPage[];
  asOf: string;
  homepageContent?: HomepageContent;
  promoSlots?: PromoSlot[];
  seoMetadata?: PageSeoMetadata[];
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
  testimonials = [],
  affiliateSettings = { commission_percent: 15, minimum_payout: 20 },
  affiliatePayouts = [],
  appeals = [],
  managedUsers = [],
  policyPages = [],
  asOf,
  homepageContent = { translations: {}, hero_image_url: '', hero_image_alt: {} },
  promoSlots = [],
  seoMetadata = [],
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'predictions' | 'blog' | 'api' | 'ai' | 'plans' | 'branding' | 'reminders' | 'pending-payments' | 'winning-tickets' | 'testimonials' | 'affiliates' | 'appeals' | 'users' | 'policies' | 'content' | 'seo'
  >('overview');

  const pendingCount = predictions.filter((p) => p.status === 'pending').length;
  const pendingSubsCount = pendingSubscriptions.filter((s) => s.status === 'pending').length;
  const pendingTicketsCount = winningTickets.filter((ticket) => ticket.status === 'pending').length;
  const pendingAppealsCount = appeals.filter((appeal) => appeal.status === 'pending').length;
  const pendingPayoutsCount = affiliatePayouts.filter((payout) => payout.status === 'pending').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'predictions', label: 'Predictions Moderation', icon: CheckSquare, badge: pendingCount },
    { id: 'pending-payments', label: 'Subscription Approvals', icon: ShieldCheck, badge: pendingSubsCount },
    { id: 'winning-tickets', label: 'Winning Tickets', icon: ShieldCheck, badge: pendingTicketsCount },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote, badge: testimonials.filter((item) => item.status === 'pending').length },
    { id: 'affiliates', label: 'Affiliates & Payouts', icon: Wallet, badge: pendingPayoutsCount },
    { id: 'users', label: 'Users', icon: Users, badge: managedUsers.length },
    { id: 'appeals', label: 'Appeals', icon: AlertTriangle, badge: pendingAppealsCount },
    { id: 'policies', label: 'Policy Pages', icon: FileText },
    { id: 'content', label: 'Home & promotions', icon: Megaphone },
    { id: 'seo', label: 'SEO & sharing', icon: Search },
    { id: 'blog', label: 'Blog Management', icon: BookOpen, badge: posts.length },
    { id: 'api', label: 'API Management', icon: Key },
    { id: 'ai', label: 'AI & LLM Management', icon: Cpu },
    { id: 'plans', label: 'Subscription Plans', icon: CreditCard, badge: plans.length },
    { id: 'branding', label: 'Global Branding', icon: Palette },
    { id: 'reminders', label: 'Subscription Reminders', icon: Bell, badge: vipProfiles.length },
  ] as const;

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-xl border border-[#1C2541] bg-[#0D172F] p-2 lg:sticky lg:top-24">
      <nav aria-label="Admin navigation" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-bold transition-all ${
                isActive
                  ? 'bg-[#48CAE4] text-[#0B132B] shadow-lg shadow-[#48CAE4]/20'
                  : 'bg-[#111C38] text-slate-300 hover:bg-[#1C2541] hover:text-white border border-[#1C2541]'
              }`}
            >
              <Icon className="h-4 w-4" />
                <span className="min-w-0 flex-1 truncate">{tab.label}</span>
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
      </nav>
      </aside>

      <main className="min-w-0">
        {activeTab === 'overview' && <AdminOverview users={managedUsers} predictions={predictions} payments={pendingSubscriptions} tickets={winningTickets} testimonials={testimonials} appeals={appeals} payouts={affiliatePayouts} posts={posts} asOf={asOf} />}
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
        {activeTab === 'testimonials' && <TestimonialsTab initialItems={testimonials} />}
        {activeTab === 'affiliates' && <AffiliatesTab initialSettings={affiliateSettings} initialPayouts={affiliatePayouts} />}
        {activeTab === 'users' && <UsersTab initialUsers={managedUsers} />}
        {activeTab === 'appeals' && <AppealsTab initialItems={appeals} />}
        {activeTab === 'policies' && <PoliciesTab initialPages={policyPages} />}
        {activeTab === 'content' && <ContentManagementTab initialContent={homepageContent} initialPromos={promoSlots} />}
        {activeTab === 'seo' && <SeoManagementTab initialItems={seoMetadata} />}
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
      </main>
    </div>
  );
}