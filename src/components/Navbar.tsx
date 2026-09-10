import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SeatingPlanMetadata } from '../types';
import { 
  LayoutGrid, List,
  Printer, Download, Upload, RotateCcw,
  Menu, X, ChevronRight, Check, FileDown, FileSpreadsheet
} from 'lucide-react';

export type AppTab = 'canvas' | 'table';

interface NavbarProps {
  metadata: SeatingPlanMetadata;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onPrint: () => void;
  onSavePdf?: () => void;
  onExportJson: () => void;
  onOpenImport: () => void;
  onOpenGoogleSheets?: () => void;
  onResetDefault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  metadata,
  activeTab,
  onTabChange,
  onPrint,
  onSavePdf,
  onExportJson,
  onOpenImport,
  onOpenGoogleSheets,
  onResetDefault,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Prevent background scroll when side menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Handle tab change and close drawer smoothly
  const handleTabClick = (tab: AppTab) => {
    onTabChange(tab);
    setIsMenuOpen(false);
  };

  const activeTabLabel = 
    activeTab === 'canvas' ? 'ผังที่นั่งภาพรวม' : 'รายชื่อแขกผู้มีเกียรติ';

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Logo with no border */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
                <img 
                  src="https://lh3.googleusercontent.com/d/1QdEWReQB6ujnKpX9O9q1Gx1i7akY9Wqb" 
                  alt="ตราสัญลักษณ์งานวันศิลป์ พีระศรี" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Title and Venue on two neat lines */}
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="font-bold text-slate-900 text-xs sm:text-base tracking-tight leading-tight whitespace-nowrap">
                  ผังที่นั่งงานวันศิลป์ พีระศรี
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-normal leading-tight mt-0.5 truncate">
                  {metadata.venueName || 'ลานศาสตราจารย์ศิลป์ พีระศรี'}
                </p>
              </div>
            </div>

            {/* Right Header: Clean Menu Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Active Tab Indicator (Visual indicator) */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg border border-slate-200/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{activeTabLabel}</span>
              </div>

              {/* Quick Google Sheets Sync Button */}
              {onOpenGoogleSheets && (
                <button
                  type="button"
                  onClick={onOpenGoogleSheets}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="เชื่อมต่อ & ซิงก์ข้อมูลกับ Google Sheets"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ซิงก์ Google Sheets</span>
                </button>
              )}

              {/* Smooth Sidemenu Trigger Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 active:scale-95 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
                aria-label="เปิดเมนูแผนผัง"
              >
                <Menu className="w-4 h-4 text-slate-700" />
                <span>เมนู</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Smooth Animated Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex no-print">
            {/* Backdrop Fade */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Drawer Sliding from Right */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative ml-auto w-[300px] sm:w-[350px] h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-200 select-none"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                    <img 
                      src="https://lh3.googleusercontent.com/d/1QdEWReQB6ujnKpX9O9q1Gx1i7akY9Wqb" 
                      alt="ตราสัญลักษณ์" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm leading-tight">
                      เมนูระบบผังที่นั่ง
                    </h2>
                    <p className="text-2xs text-slate-500">
                      {metadata.venueName || 'ลานศาสตราจารย์ศิลป์ พีระศรี'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  aria-label="ปิดเมนู"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Section 1: Navigation Tabs */}
                <div className="space-y-1.5">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block px-2">
                    เลือกมุมมองแผนผัง
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTabClick('canvas')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      activeTab === 'canvas'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid className={`w-4 h-4 ${activeTab === 'canvas' ? 'text-white' : 'text-slate-500'}`} />
                      <span>ผังที่นั่งภาพรวม</span>
                    </div>
                    {activeTab === 'canvas' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabClick('table')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      activeTab === 'table'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <List className={`w-4 h-4 ${activeTab === 'table' ? 'text-white' : 'text-slate-500'}`} />
                      <span>รายชื่อแขกผู้มีเกียรติ</span>
                    </div>
                    {activeTab === 'table' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    )}
                  </button>
                </div>

                {/* Section 2: Actions & Tools */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block px-2">
                    คำสั่งการจัดการ & ส่งออก
                  </span>

                  {/* Google Sheets Sync Button */}
                  {onOpenGoogleSheets && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenGoogleSheets();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-300/80 transition-all cursor-pointer group shadow-2xs"
                      title="เชื่อมต่อ & ซิงก์ข้อมูลกับ Google Sheets"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-emerald-700 transition-colors">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-emerald-950 text-xs sm:text-sm leading-tight">
                            เชื่อมต่อ Google Sheets
                          </div>
                          <div className="text-2xs text-emerald-700 mt-0.5">
                            ซิงก์รายชื่อแขกและที่นั่งอัตโนมัติ
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-emerald-800 rounded-md border border-emerald-300 shrink-0">
                        Sync
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onSavePdf) {
                        onSavePdf();
                      } else {
                        onPrint();
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-slate-800 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/80 transition-all cursor-pointer group"
                    title="บันทึกเป็น PDF 5 หน้า: ผังรวม + ผังย่อยโซนสีเขียว, สีฟ้า, สีฟ้าขวา, สีเหลืองขวา (A4 แนวนอน)"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-300/80 flex items-center justify-center shrink-0 group-hover:bg-rose-200 transition-colors">
                        <FileDown className="w-4 h-4 text-rose-700" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm leading-tight">
                          บันทึกเป็น PDF (Save as PDF)
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5">
                          ผังรวม + ผังย่อย 4 โซน (5 หน้า A4 แนวนอน)
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white text-rose-700 rounded border border-rose-200 shrink-0">
                      5 หน้า A4
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onPrint();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>พิมพ์ผ่านเบราว์เซอร์ (Browser Print)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenImport();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>นำเข้ารายชื่อแขก (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExportJson();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>บันทึกและส่งออกข้อมูล (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (confirm('คุณต้องการรีเซ็ตข้อมูลผังที่นั่งกลับสู่ค่าเริ่มต้นใช่หรือไม่?')) {
                        onResetDefault();
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer mt-2"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <span>รีเซ็ตผังกลับสู่ค่าเริ่มต้น</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-3.5 border-t border-slate-100 bg-slate-50 text-2xs text-slate-500">
                <p className="font-semibold text-slate-700 truncate">{metadata.venueName || 'ลานศาสตราจารย์ศิลป์ พีระศรี'}</p>
                <p className="text-slate-400 mt-0.5">ระบบจัดการผังที่นั่งพิธีการวันศิลป์ พีระศรี</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
