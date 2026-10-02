'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, History, Sparkles } from 'lucide-react';
import CalendarPickerModal from './CalendarPickerModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface DateSelectorBarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  yesterdayStr: string;
  todayStr: string;
  tomorrowStr: string;
  predictionsCount?: number;
}

export default function DateSelectorBar({
  selectedDate,
  onSelectDate,
  yesterdayStr,
  todayStr,
  tomorrowStr,
  predictionsCount,
}: DateSelectorBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { t, locale } = useTranslation();

  const isYesterday = selectedDate === yesterdayStr;
  const isToday = selectedDate === todayStr;
  const isTomorrow = selectedDate === tomorrowStr;
  const isCustom = !isYesterday && !isToday && !isTomorrow;

  const parsedDate = new Date(selectedDate + 'T00:00:00');
  const formattedFriendly = parsedDate.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isPast = selectedDate < todayStr;
  const isFuture = selectedDate > todayStr;

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-2 sm:p-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Quick Date Tabs: Yesterday, Today, Tomorrow */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectDate(yesterdayStr)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isYesterday
                  ? 'bg-[#48CAE4] text-[#0B132B] font-bold shadow'
                  : 'text-slate-300 hover:bg-[#1C2541] hover:text-white border border-[#223156]'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>{t('dates.yesterday')}</span>
            </button>

            <button
              onClick={() => onSelectDate(todayStr)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isToday
                  ? 'bg-[#48CAE4] text-[#0B132B] font-black shadow-md ring-1 ring-[#48CAE4]/50'
                  : 'text-slate-300 hover:bg-[#1C2541] hover:text-white border border-[#223156]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('dates.today')}</span>
            </button>

            <button
              onClick={() => onSelectDate(tomorrowStr)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isTomorrow
                  ? 'bg-[#48CAE4] text-[#0B132B] font-bold shadow'
                  : 'text-slate-300 hover:bg-[#1C2541] hover:text-white border border-[#223156]'
              }`}
            >
              <span>{t('dates.tomorrow')}</span>
            </button>
          </div>

          {/* Date Label & Calendar Modal Trigger */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-[#1C2541]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B132B] px-2.5 py-1 text-xs font-semibold text-[#48CAE4] border border-[#223156]">
                {formattedFriendly}
                {isPast && <span className="text-[10px] text-amber-400 font-normal">({t('dates.audit')})</span>}
                {isFuture && <span className="text-[10px] text-teal-400 font-normal">({t('dates.upcoming')})</span>}
              </span>
              {predictionsCount !== undefined && (
                <span className="rounded-full bg-[#1C2541] border border-[#3A506B] px-2 py-0.5 text-[11px] font-bold text-slate-300">
                  {predictionsCount} {t('dates.tips')}
                </span>
              )}
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isCustom
                  ? 'bg-[#48CAE4]/20 border-[#48CAE4] text-[#48CAE4]'
                  : 'bg-[#0B132B] border-[#223156] text-slate-300 hover:border-[#48CAE4]'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5 text-[#48CAE4]" />
              <span>{t('dates.calendar')}</span>
            </button>
          </div>
        </div>
      </div>

      <CalendarPickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />
    </div>
  );
}
