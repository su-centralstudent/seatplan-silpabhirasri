import React from 'react';
import { Seat } from '../types';
import { Search, Flower2, Users, CheckCircle2, Armchair, Sparkles } from 'lucide-react';

interface StatsBannerProps {
  seats: Record<string, Seat>;
  highlightFilter: string;
  onFilterChange: (val: string) => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  seats,
  highlightFilter,
  onFilterChange,
}) => {
  const seatList = Object.values(seats) as Seat[];

  const totalSeats = seatList.length;
  const occupiedSeats = seatList.filter(s => s.position || s.guestName || s.label).length;
  const emptySeats = totalSeats - occupiedSeats;
  const flowerBaskets = seatList.filter(s => s.hasFlowerBasket).length;
  const checkedIn = seatList.filter(s => s.status === 'checked_in').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3 no-print">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Quick Search Highlight */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={highlightFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="ค้นหาบนผัง (เช่น ท่านทูต, A5, ศิลปิน, Set 1*, Maria)..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          {highlightFilter && (
            <button
              type="button"
              onClick={() => onFilterChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-semibold"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Filter Quick Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onFilterChange(highlightFilter === 'ดอกไม้' ? '' : 'ดอกไม้')}
            className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
              highlightFilter === 'ดอกไม้'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flower2 className="w-3.5 h-3.5 text-rose-500" />
            <span>กระเช้าดอกไม้ ({flowerBaskets})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange(highlightFilter === 'Set 1' ? '' : 'Set 1')}
            className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
              highlightFilter.includes('Set 1')
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Set 1 - 5 (VIP)</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange(highlightFilter === 'checked_in' ? '' : 'checked_in')}
            className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
              highlightFilter === 'checked_in'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ลงทะเบียนแล้ว ({checkedIn})</span>
          </button>
        </div>
      </div>

      {/* Numerical Stats summary */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-4">
          <span>ที่นั่งทั้งหมด: <strong className="text-slate-800 font-semibold">{totalSeats}</strong></span>
          <span>ระบุรายชื่อแล้ว: <strong className="text-slate-800 font-semibold">{occupiedSeats}</strong></span>
          <span>ว่าง: <strong className="text-slate-600 font-semibold">{emptySeats}</strong></span>
        </div>
        <span className="text-[11px] text-slate-400">
          สามารถค้นหาตามชื่อ ตำแหน่ง หรือหมายเลขที่นั่งได้
        </span>
      </div>
    </div>
  );
};
