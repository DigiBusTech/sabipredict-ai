'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, X, Check } from 'lucide-react';

interface CalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export default function CalendarPickerModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}: CalendarPickerModalProps) {
  if (!isOpen) return null;

  const [inputDate, setInputDate] = useState(selectedDate);

  const jump = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const dateStr = target.toISOString().split('T')[0];
    onSelectDate(dateStr);
    onClose();
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputDate) {
      onSelectDate(inputDate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[#3A506B] bg-[#111C38] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1C2541]">
          <div className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-xl bg-[#48CAE4]/20 text-[#48CAE4]">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Select Prediction Date</h3>
              <p className="text-xs text-slate-400">View past accuracy audits or upcoming fixtures</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Jump</span>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button onClick={() => jump(-3)} className="rounded-xl border border-[#223156] bg-[#0B132B] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-[#48CAE4]">
              3 Days Ago
            </button>
            <button onClick={() => jump(-1)} className="rounded-xl border border-[#223156] bg-[#0B132B] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-[#48CAE4]">
              Yesterday
            </button>
            <button onClick={() => jump(0)} className="rounded-xl bg-[#48CAE4] px-3 py-2 text-xs font-bold text-[#0B132B]">
              Today
            </button>
            <button onClick={() => jump(1)} className="rounded-xl border border-[#223156] bg-[#0B132B] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-[#48CAE4]">
              Tomorrow
            </button>
            <button onClick={() => jump(2)} className="rounded-xl border border-[#223156] bg-[#0B132B] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-[#48CAE4]">
              In 2 Days
            </button>
            <button onClick={() => jump(5)} className="rounded-xl border border-[#223156] bg-[#0B132B] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-[#48CAE4]">
              In 5 Days
            </button>
          </div>
        </div>

        <form onSubmit={handleApply} className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Specific Date</label>
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="w-full rounded-xl border border-[#223156] bg-[#0B132B] px-3.5 py-2 text-xs text-white focus:border-[#48CAE4] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1C2541]">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs text-slate-400">Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-[#48CAE4] px-4 py-2 text-xs font-bold text-[#0B132B] hover:bg-[#00B4D8]">
              <Check className="h-4 w-4" /> Apply Date
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

