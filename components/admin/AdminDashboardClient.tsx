'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, BookOpen, Key, Cpu, CreditCard, 
  Layers 
} from 'lucide-react';
import { 
  Prediction, BlogPost, SportsmonksSettings, 
  PaymentGatewaySettings, AILLMSettings, SubscriptionPlan 
} from '@/lib/types';
import PredictionsTab from './PredictionsTab';
import BlogTab from './BlogTab';
import ApiTab from './ApiTab';
import AiTab from './AiTab';
import PlansTab from './PlansTab';

interface AdminDashboardClientProps {
  predictions: Prediction[];
  posts: BlogPost[];
  sportsmonksSettings: SportsmonksSettings | null;
  paymentSettings: PaymentGatewaySettings | null;
  aiSettings: AILLMSettings | null;
  plans: SubscriptionPlan[];
}

export default function AdminDashboardClient({
  predictions,
  posts,
  sportsmonksSettings,
  paymentSettings,
  aiSettings,
  plans,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'predictions' | 'blog' | 'api' | 'ai' | 'plans'>('predictions');

  const tabs = [
    { id: 'predictions', label: 'Predictions Moderation', icon: CheckSquare, badge: predictions.filter(p => p.status === 'pending').length },
    { id: 'blog', label: 'Blog Management', icon: BookOpen, badge: posts.length },
    { id: 'api', label: 'API Management', icon: Key },
    { id: 'ai', label: 'AI & LLM Management', icon: Cpu },
    { id: 'plans', label: 'Subscription Plans', icon: CreditCard, badge: plans.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* 4 Distinct Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1C2541] pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#48CAE4] text-[#0B132B] shadow-lg shadow-[#48CAE4]/20'
                  : 'bg-[#111C38] text-slate-300 hover:bg-[#1C2541] hover:text-white border border-[#1C2541]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {'badge' in tab && tab.badge !== undefined && tab.badge > 0 && (
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  isActive ? 'bg-[#0B132B] text-[#48CAE4]' : 'bg-[#1C2541] text-amber-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'predictions' && <PredictionsTab predictions={predictions} />}
        {activeTab === 'blog' && <BlogTab posts={posts} />}
        {activeTab === 'api' && <ApiTab sportsmonksSettings={sportsmonksSettings} paymentSettings={paymentSettings} />}
        {activeTab === 'ai' && <AiTab initialSettings={aiSettings} />}
        {activeTab === 'plans' && <PlansTab plans={plans} />}
      </div>
    </div>
  );
}
