import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SeatingPlanState, Seat, UnassignedGuest } from './types';
import { 
  loadSeatingPlan, saveSeatingPlan, resetToDefaultPlan, 
  exportToJsonFile, exportToCsv 
} from './utils/storage';
import { Navbar, AppTab } from './components/Navbar';
import { StatsBanner } from './components/StatsBanner';
import { SeatingCanvas } from './components/SeatingCanvas';
import { CeremonyFlowMap } from './components/CeremonyFlowMap';
import { GuestListTable } from './components/GuestListTable';
import { SeatEditModal } from './components/SeatEditModal';
import { ImportModal } from './components/ImportModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { PrintLayout } from './components/PrintLayout';
import { RouteEditorModal } from './components/RouteEditorModal';
import { CeremonyRoute } from './types';
import { loadCeremonyRoutes, saveCeremonyRoutes, resetCeremonyRoutes } from './data/defaultRoutes';
import { exportSeatingPlanToPdf } from './utils/pdfExport';
import { Check, Info, AlertCircle } from 'lucide-react';
import { 
  saveDriveImageLinkToGoogleSheet, 
  extractSpreadsheetId, 
  fetchGoogleSheetData 
} from './utils/googleSheetSync';
import { 
  getConfiguredSheetUrl, 
  getSavedDriveImageUrl, 
  setSavedDriveImageUrl, 
  convertGoogleDriveUrl, 
  isAutoSyncEnabled 
} from './data/googleSheetConfig';
import { getAccessToken } from './utils/googleAuth';

export default function App() {
  const [planState, setPlanState] = useState<SeatingPlanState>(() => loadSeatingPlan());
  const [ceremonyRoutes, setCeremonyRoutes] = useState<CeremonyRoute[]>(() => loadCeremonyRoutes());
  const [isRouteModalOpen, setIsRouteModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTab>('canvas');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [highlightFilter, setHighlightFilter] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save to localStorage on change
  useEffect(() => {
    saveSeatingPlan(planState);
  }, [planState]);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Handler to write Google Drive plan image link back to Google Sheet
  const handleSaveDriveLinkToGoogleSheet = async (driveUrl: string): Promise<{ success: boolean; message: string }> => {
    const sheetUrl = getConfiguredSheetUrl();
    if (!sheetUrl) {
      return {
        success: false,
        message: 'ยังไม่ได้ระบุลิงก์ Google Sheet กรุณากดปุ่ม "ซิงก์ Google Sheets" เพื่อระบุลิงก์ตารางก่อน',
      };
    }
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return {
        success: false,
        message: 'ไม่สามารถระบุ Spreadsheet ID จากลิงก์ Google Sheets ได้',
      };
    }
    const token = getAccessToken();
    if (!token) {
      return {
        success: false,
        message: 'ต้องเข้าสู่ระบบ Google เพื่อขอสิทธิ์แก้ไขชีต (กดที่ปุ่ม "ซิงก์ Google Sheets" แล้ว Sign in with Google)',
      };
    }
    const res = await saveDriveImageLinkToGoogleSheet(spreadsheetId, token, driveUrl);
    if (res.success) {
      setSavedDriveImageUrl(driveUrl);
      setPlanState(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          bgDriveUrl: driveUrl,
          bgImageUrl: convertGoogleDriveUrl(driveUrl),
        }
      }));
      showToast('บันทึกลิงก์ Google Drive ลง Google Sheet (#PLAN_IMAGE) สำเร็จแล้ว');
    }
    return res;
  };

  // Google Sheet sync handler
  const handleGoogleSheetSync = (
    updatedSeats: Record<string, Seat>, 
    summaryMsg: string, 
    unassigned?: UnassignedGuest[],
    planImageUrl?: string,
    planDriveUrl?: string
  ) => {
    if (planDriveUrl) {
      setSavedDriveImageUrl(planDriveUrl);
    }
    setPlanState(prev => ({
      ...prev,
      seats: updatedSeats,
      metadata: {
        ...prev.metadata,
        ...(planImageUrl ? { bgImageUrl: planImageUrl } : {}),
        ...(planDriveUrl ? { bgDriveUrl: planDriveUrl } : {}),
      },
      ...(unassigned ? { unassignedGuests: unassigned } : {}),
    }));
    showToast(summaryMsg);
  };

  // Auto-sync on web load & tab focus (supports GitHub Pages & all browsers)
  useEffect(() => {
    const autoSyncFromSheet = async () => {
      const sheetUrl = getConfiguredSheetUrl();
      if (!sheetUrl) return;

      const isEnabled = isAutoSyncEnabled();
      if (!isEnabled) return;

      try {
        const token = getAccessToken();
        const result = await fetchGoogleSheetData(sheetUrl, token);
        if (result.success && result.rows.length > 0) {
          setPlanState(prev => {
            const nextSeats = { ...prev.seats };
            let hasChanges = false;
            result.rows.forEach(row => {
              const seatId = row.seatId;
              const existing = nextSeats[seatId];
              if (existing) {
                if (
                  (row.guestName !== undefined && row.guestName !== existing.guestName) ||
                  (row.position !== undefined && row.position !== existing.position) ||
                  (row.organization !== undefined && row.organization !== existing.organization) ||
                  (row.setGroup !== undefined && row.setGroup !== existing.setGroup) ||
                  (row.hasFlowerBasket !== undefined && row.hasFlowerBasket !== existing.hasFlowerBasket) ||
                  (row.hasArtSet !== undefined && row.hasArtSet !== existing.hasArtSet)
                ) {
                  hasChanges = true;
                  nextSeats[seatId] = {
                    ...existing,
                    guestName: row.guestName !== undefined ? row.guestName : existing.guestName,
                    position: row.position !== undefined ? row.position : existing.position,
                    organization: row.organization !== undefined ? row.organization : existing.organization,
                    setGroup: row.setGroup !== undefined ? row.setGroup : existing.setGroup,
                    hasFlowerBasket: row.hasFlowerBasket !== undefined ? row.hasFlowerBasket : existing.hasFlowerBasket,
                    hasArtSet: row.hasArtSet !== undefined ? row.hasArtSet : existing.hasArtSet,
                    category: row.category || existing.category,
                  };
                }
              }
            });

            const unassignedList = (result.unassigned || []).map((u, i) => ({
              id: `UNASSIGNED-${i + 1}`,
              name: u.guestName || '',
              position: u.position,
              organization: u.organization,
              setGroup: u.setGroup,
              hasFlowerBasket: u.hasFlowerBasket,
              hasArtSet: u.hasArtSet,
              status: u.status || 'confirmed',
              notes: u.notes,
            }));

            let nextMetadata = prev.metadata;
            if (result.planImageUrl || result.planDriveUrl) {
              if (result.planDriveUrl) {
                setSavedDriveImageUrl(result.planDriveUrl);
              }
              nextMetadata = {
                ...prev.metadata,
                ...(result.planImageUrl ? { bgImageUrl: result.planImageUrl } : {}),
                ...(result.planDriveUrl ? { bgDriveUrl: result.planDriveUrl } : {}),
              };
            }

            if (!hasChanges && unassignedList.length === 0 && !result.planImageUrl) {
              return prev;
            }

            return {
              ...prev,
              seats: nextSeats,
              metadata: nextMetadata,
              ...(unassignedList.length > 0 ? { unassignedGuests: unassignedList } : {}),
            };
          });

          const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          localStorage.setItem('google_sheet_last_sync_time', nowStr);
        }
      } catch (err) {
        console.warn('Silent auto-sync info:', err);
      }
    };

    // Run on startup
    const timer = setTimeout(autoSyncFromSheet, 600);

    // Run when user switches back to browser tab
    const handleWindowFocus = () => {
      autoSyncFromSheet();
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Assign an unassigned guest to an empty/target seat
  const handleAssignGuestToSeat = (guest: UnassignedGuest, seatId: string) => {
    setPlanState(prev => {
      const target = prev.seats[seatId];
      if (!target) return prev;
      const updatedSeat: Seat = {
        ...target,
        guestName: guest.name,
        position: guest.position || target.position,
        organization: guest.organization || target.organization,
        setGroup: guest.setGroup || target.setGroup,
        hasFlowerBasket: guest.hasFlowerBasket ?? target.hasFlowerBasket,
        hasArtSet: guest.hasArtSet ?? target.hasArtSet,
        status: guest.status || 'confirmed',
        notes: guest.notes || target.notes,
      };
      const remainingUnassigned = (prev.unassignedGuests || []).filter(g => g.id !== guest.id);
      return {
        ...prev,
        seats: {
          ...prev.seats,
          [seatId]: updatedSeat,
        },
        unassignedGuests: remainingUnassigned,
      };
    });
    showToast(`จัดที่นั่ง ${seatId} ให้แก่ ${guest.name} เรียบร้อยแล้ว`);
  };

  // Route handlers
  const handleSaveRoutes = (updatedRoutes: CeremonyRoute[]) => {
    setCeremonyRoutes(updatedRoutes);
    saveCeremonyRoutes(updatedRoutes);
    showToast(`บันทึกเส้นทางเดินพิธีการ (${updatedRoutes.length} เส้นทาง) เรียบร้อยแล้ว`);
  };

  const handleResetRoutes = () => {
    const reset = resetCeremonyRoutes();
    setCeremonyRoutes(reset);
    showToast('รีเซ็ตเส้นทางเดินกลับเป็นค่ามาตรฐานแล้ว');
  };

  // Update a single seat
  const handleSaveSeat = (updatedSeat: Seat) => {
    setPlanState(prev => {
      const nextSeats = {
        ...prev.seats,
        [updatedSeat.id]: updatedSeat,
      };
      return {
        ...prev,
        seats: nextSeats,
      };
    });
    showToast(`อัปเดตข้อมูลที่นั่ง ${updatedSeat.label || updatedSeat.id} สำเร็จ`);
  };

  // Swap two seats
  const handleSwapSeats = (seatId1: string, seatId2: string) => {
    const seat1 = planState.seats[seatId1];
    const seat2 = planState.seats[seatId2];
    if (!seat1 || !seat2) return;

    // Preserve seat ID, row, and number, but swap content (guestName, position, organization, setGroup, category, colorBg, notes, hasFlowerBasket, hasArtSet)
    const newSeat1: Seat = {
      ...seat1,
      guestName: seat2.guestName,
      position: seat2.position,
      organization: seat2.organization,
      setGroup: seat2.setGroup,
      hasFlowerBasket: seat2.hasFlowerBasket,
      hasArtSet: seat2.hasArtSet,
      category: seat2.category,
      colorBg: seat2.colorBg,
      notes: seat2.notes,
      status: seat2.status,
    };

    const newSeat2: Seat = {
      ...seat2,
      guestName: seat1.guestName,
      position: seat1.position,
      organization: seat1.organization,
      setGroup: seat1.setGroup,
      hasFlowerBasket: seat1.hasFlowerBasket,
      hasArtSet: seat1.hasArtSet,
      category: seat1.category,
      colorBg: seat1.colorBg,
      notes: seat1.notes,
      status: seat1.status,
    };

    setPlanState(prev => ({
      ...prev,
      seats: {
        ...prev.seats,
        [seatId1]: newSeat1,
        [seatId2]: newSeat2,
      },
    }));

    showToast(`สลับตำแหน่งที่นั่ง ${seat1.label || seat1.id} ↔ ${seat2.label || seat2.id} เรียบร้อยแล้ว`);
  };

  // Clear a seat
  const handleClearSeat = (seatId: string) => {
    setPlanState(prev => {
      const current = prev.seats[seatId];
      if (!current) return prev;

      const cleared: Seat = {
        id: current.id,
        row: current.row,
        number: current.number,
        label: current.label,
        position: '',
        guestName: '',
        organization: '',
        setGroup: '',
        hasFlowerBasket: false,
        hasArtSet: false,
        status: 'empty',
        category: 'general',
        colorBg: '',
        notes: '',
      };

      return {
        ...prev,
        seats: {
          ...prev.seats,
          [seatId]: cleared,
        },
      };
    });
    showToast(`ล้างข้อมูลที่นั่ง ${seatId} เรียบร้อยแล้ว`);
  };

  // Add a new seat to any row (A - K)
  const handleAddSeatToRow = (rowName: string) => {
    let createdSeatId = '';
    setPlanState(prev => {
      const rowSeats = (Object.values(prev.seats) as Seat[]).filter(s => s.row === rowName);
      const maxNum = rowSeats.reduce((max, s) => Math.max(max, s.number), 0);
      const newNum = maxNum + 1;
      const newSeatId = `${rowName}${newNum}`;
      createdSeatId = newSeatId;

      let defaultCat: Seat['category'] = 'general';
      if (['A', 'B'].includes(rowName)) defaultCat = 'national_artist';
      else if (['C', 'D', 'E'].includes(rowName)) defaultCat = 'dean';
      else if (['F', 'G', 'H'].includes(rowName)) defaultCat = 'general';
      else if (rowName === 'I') defaultCat = 'executive';
      else if (['J', 'K'].includes(rowName)) defaultCat = 'awardee';

      const newSeat: Seat = {
        id: newSeatId,
        row: rowName,
        number: newNum,
        label: newSeatId,
        position: `ที่นั่งเพิ่มเติม ${newSeatId}`,
        guestName: '',
        organization: '',
        setGroup: '',
        status: 'empty',
        category: defaultCat,
      };

      return {
        ...prev,
        seats: {
          ...prev.seats,
          [newSeatId]: newSeat,
        },
      };
    });
    showToast(`เพิ่มที่นั่ง ${createdSeatId || rowName} ในแถว ${rowName} เรียบร้อยแล้ว`);
  };

  // Remove the last seat from a row
  const handleRemoveLastSeatFromRow = (rowName: string) => {
    const rowSeats = (Object.values(planState.seats) as Seat[]).filter(s => s.row === rowName);
    if (rowSeats.length === 0) {
      showToast(`ไม่มีที่นั่งในแถว ${rowName} ให้ลดแล้ว`);
      return;
    }
    const maxSeat = rowSeats.reduce((prev, curr) => curr.number > prev.number ? curr : prev, rowSeats[0]);
    handleRemoveSeat(maxSeat.id);
  };

  // Remove a specific seat completely from the plan
  const handleRemoveSeat = (seatId: string) => {
    setPlanState(prev => {
      if (!prev.seats[seatId]) return prev;
      const nextSeats = { ...prev.seats };
      delete nextSeats[seatId];
      return {
        ...prev,
        seats: nextSeats,
      };
    });
    if (selectedSeat?.id === seatId) {
      setSelectedSeat(null);
    }
    showToast(`ลด/ลบที่นั่ง ${seatId} เรียบร้อยแล้ว`);
  };

  // Quick field update from Table view
  const handleUpdateSeatField = (seatId: string, field: keyof Seat, value: any) => {
    setPlanState(prev => {
      const target = prev.seats[seatId];
      if (!target) return prev;
      return {
        ...prev,
        seats: {
          ...prev.seats,
          [seatId]: {
            ...target,
            [field]: value,
          },
        },
      };
    });
  };

  // Check-in status toggle
  const handleUpdateSeatStatus = (seatId: string, status: Seat['status'], checkInTime?: string) => {
    setPlanState(prev => {
      const target = prev.seats[seatId];
      if (!target) return prev;
      return {
        ...prev,
        seats: {
          ...prev.seats,
          [seatId]: {
            ...target,
            status,
            checkInTime: checkInTime !== undefined ? checkInTime : target.checkInTime,
          },
        },
      };
    });
    showToast(`อัปเดตสถานะที่นั่ง ${seatId}`);
  };

  // Batch assign names from text
  const handleBatchAssignGuests = (textLines: string[], targetRow: string) => {
    setPlanState(prev => {
      const nextSeats = { ...prev.seats };
      textLines.forEach((line, index) => {
        const seatNumber = index + 1;
        const seatId = `${targetRow}${seatNumber}`;
        if (nextSeats[seatId]) {
          nextSeats[seatId] = {
            ...nextSeats[seatId],
            guestName: line,
            position: nextSeats[seatId].position || line,
            status: 'confirmed',
          };
        }
      });
      return { ...prev, seats: nextSeats };
    });
    showToast(`นำเข้ารายชื่อ ${textLines.length} ท่าน ลงแถว ${targetRow} เรียบร้อยแล้ว`);
  };

  // Reset to default
  const handleResetDefault = () => {
    const defaultState = resetToDefaultPlan();
    setPlanState(defaultState);
    showToast('รีเซ็ตผังที่นั่งกลับสู่ร่างเริ่มต้นเรียบร้อยแล้ว');
  };

  // Import JSON file
  const handleImportJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.seats && parsed.metadata) {
        setPlanState(parsed);
        showToast('นำเข้าข้อมูลสำเร็จ');
      }
    } catch (err) {
      showToast('ไฟล์ JSON ไม่ถูกต้อง');
    }
  };

  const handleSavePdf = async () => {
    showToast('กำลังประมวลผลและสร้างไฟล์ PDF ผังรวมและผังย่อย 5 หน้า (A4 แนวนอน)...');
    try {
      // Switch to visual canvas tab if not already active to ensure DOM SVG is mounted
      if (activeTab !== 'canvas') {
        setActiveTab('canvas');
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      const success = await exportSeatingPlanToPdf();
      if (success) {
        showToast('บันทึกไฟล์ PDF เรียบร้อย (ผังรวม + ผังย่อย 4 โซน 5 หน้า A4)');
      }
    } catch (error) {
      console.error('Save PDF error:', error);
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        metadata={planState.metadata}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPrint={() => window.print()}
        onSavePdf={handleSavePdf}
        onExportJson={() => exportToJsonFile(planState)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetModalOpen(true)}
        onResetDefault={handleResetDefault}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-6 py-2.5 sm:py-6 flex-1 flex flex-col gap-3 sm:gap-4 no-print">
        {/* Quick Stats & Highlight Bar */}
        <StatsBanner
          seats={planState.seats}
          highlightFilter={highlightFilter}
          onFilterChange={setHighlightFilter}
        />

        {/* Animated Window / Tab Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-1 flex flex-col"
          >
            {/* Tab 1: Visual Seating Canvas */}
            {activeTab === 'canvas' && (
              <SeatingCanvas
                metadata={planState.metadata}
                seats={planState.seats}
                selectedSeat={selectedSeat}
                highlightFilter={highlightFilter}
                onSelectSeat={(seat) => setSelectedSeat(seat)}
                onSwapSeats={handleSwapSeats}
                onAddSeatToRow={handleAddSeatToRow}
                onRemoveLastSeatFromRow={handleRemoveLastSeatFromRow}
                onRemoveSeat={handleRemoveSeat}
                routes={ceremonyRoutes}
                onOpenRouteManager={() => setIsRouteModalOpen(true)}
                onSaveDriveLinkToGoogleSheet={handleSaveDriveLinkToGoogleSheet}
              />
            )}

            {/* Tab 2: Guest List Table */}
            {activeTab === 'table' && (
              <GuestListTable
                seats={planState.seats}
                unassignedGuests={planState.unassignedGuests}
                onAssignGuestToSeat={handleAssignGuestToSeat}
                onEditSeat={(seat) => setSelectedSeat(seat)}
                onUpdateSeatField={handleUpdateSeatField}
                onAddSeatToRow={handleAddSeatToRow}
                onRemoveSeat={handleRemoveSeat}
                onExportCsv={() => exportToCsv(planState.seats)}
                onOpenGoogleSheets={() => setIsGoogleSheetModalOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Walking Route Manager Modal */}
      <RouteEditorModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        routes={ceremonyRoutes}
        onSaveRoutes={handleSaveRoutes}
        onResetRoutes={handleResetRoutes}
      />

      {/* Edit Seat Modal */}
      <SeatEditModal
        seat={selectedSeat}
        allSeats={planState.seats}
        isOpen={!!selectedSeat}
        onClose={() => setSelectedSeat(null)}
        onSave={handleSaveSeat}
        onSwapSeats={handleSwapSeats}
        onClearSeat={handleClearSeat}
        onDeleteSeat={handleRemoveSeat}
        onAddSeatToRow={handleAddSeatToRow}
      />

      {/* Batch Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportJson={handleImportJson}
        onBatchAssignGuests={handleBatchAssignGuests}
        onOpenGoogleSheets={() => setIsGoogleSheetModalOpen(true)}
      />

      {/* Google Sheets Live Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        seats={planState.seats}
        onApplySync={handleGoogleSheetSync}
        currentDriveUrl={getSavedDriveImageUrl() || planState.metadata?.bgDriveUrl || undefined}
        onDriveUrlSaved={(url) => setSavedDriveImageUrl(url)}
      />

      {/* Printable Output View for Browser Print */}
      <PrintLayout planState={planState} />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2 text-xs font-medium animate-in slide-in-from-bottom-5 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
