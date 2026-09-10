import React, { useState, useEffect } from 'react';
import { Seat, UnassignedGuest } from '../types';
import { 
  X, RefreshCw, Download, Copy, ExternalLink, 
  CheckCircle2, AlertCircle, FileSpreadsheet, Link2, 
  Clipboard, HelpCircle, Check, ArrowRight, UserPlus
} from 'lucide-react';
import { 
  fetchGoogleSheetData, 
  parseCsvOrTsv, 
  mapSheetRowsToSeats, 
  ParsedGoogleSheetRow,
  generateSheetTemplateTsv,
  downloadGoogleSheetTemplateCsv
} from '../utils/googleSheetSync';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  seats: Record<string, Seat>;
  onApplySync: (updatedSeats: Record<string, Seat>, summaryMsg: string, unassigned?: UnassignedGuest[]) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  seats,
  onApplySync,
}) => {
  const [activeMethod, setActiveMethod] = useState<'url' | 'paste'>('url');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [pasteData, setPasteData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedGoogleSheetRow[]>([]);
  const [parsedUnassigned, setParsedUnassigned] = useState<UnassignedGuest[]>([]);
  const [syncMode, setSyncMode] = useState<'keep_status' | 'overwrite_all'>('keep_status');
  const [allowNewSeats, setAllowNewSeats] = useState<boolean>(true);
  const [isCopiedTemplate, setIsCopiedTemplate] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Load saved URL and last sync time from localStorage on open
  useEffect(() => {
    if (isOpen) {
      const savedUrl = localStorage.getItem('google_sheet_sync_url') || '';
      const savedTime = localStorage.getItem('google_sheet_last_sync_time');
      if (savedUrl) setSheetUrl(savedUrl);
      if (savedTime) setLastSyncTime(savedTime);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle URL fetch
  const handleFetchFromUrl = async () => {
    if (!sheetUrl.trim()) {
      setErrorMsg('กรุณาระบุลิงก์ Google Sheets');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setParsedRows([]);
    setParsedUnassigned([]);

    try {
      const result = await fetchGoogleSheetData(sheetUrl.trim());
      if (result.success) {
        setParsedRows(result.rows);
        const unassignedList: UnassignedGuest[] = (result.unassigned || []).map((u, i) => ({
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
        setParsedUnassigned(unassignedList);
        setSuccessMsg(`ดึงข้อมูลสำเร็จ! พบที่นั่งระบุตำแหน่ง ${result.rows.length} รายการ${unassignedList.length > 0 ? ` และผู้มีเกียรติที่ยังไม่ระบุที่นั่ง ${unassignedList.length} ท่าน` : ''}`);
        // Save to localStorage
        localStorage.setItem('google_sheet_sync_url', sheetUrl.trim());
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใช้แท็บ "วางตารางจาก Google Sheet"');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Paste Data parsing
  const handleParsePastedData = () => {
    if (!pasteData.trim()) {
      setErrorMsg('กรุณาวางข้อมูลตารางที่คัดลอกจาก Google Sheets');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setParsedRows([]);
    setParsedUnassigned([]);

    try {
      const table = parseCsvOrTsv(pasteData);
      const result = mapSheetRowsToSeats(table);
      if (result.success) {
        setParsedRows(result.rows);
        const unassignedList: UnassignedGuest[] = (result.unassigned || []).map((u, i) => ({
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
        setParsedUnassigned(unassignedList);
        setSuccessMsg(`อ่านข้อมูลสำเร็จ! พบที่นั่งระบุตำแหน่ง ${result.rows.length} รายการ${unassignedList.length > 0 ? ` และผู้มีเกียรติที่ยังไม่ระบุที่นั่ง ${unassignedList.length} ท่าน` : ''}`);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg('รูปแบบข้อมูลตารางไม่ถูกต้อง กรุณาคัดลอกทั้งตารางรวมแถวหัวข้อ');
    }
  };

  // Confirm and apply updates to App State
  const handleConfirmSync = () => {
    if (parsedRows.length === 0 && parsedUnassigned.length === 0) return;

    const nextSeats = { ...seats };
    let updatedCount = 0;
    let addedCount = 0;

    parsedRows.forEach((row) => {
      const seatId = row.seatId;
      const existing = nextSeats[seatId];

      if (existing) {
        // Update existing seat
        nextSeats[seatId] = {
          ...existing,
          guestName: row.guestName !== undefined ? row.guestName : existing.guestName,
          position: row.position !== undefined ? row.position : existing.position,
          organization: row.organization !== undefined ? row.organization : existing.organization,
          setGroup: row.setGroup !== undefined ? row.setGroup : existing.setGroup,
          hasFlowerBasket: row.hasFlowerBasket !== undefined ? row.hasFlowerBasket : existing.hasFlowerBasket,
          hasArtSet: row.hasArtSet !== undefined ? row.hasArtSet : existing.hasArtSet,
          category: row.category || existing.category,
          notes: row.notes !== undefined ? row.notes : existing.notes,
          status: syncMode === 'overwrite_all' ? (row.status || existing.status) : (existing.status === 'empty' && row.guestName ? 'confirmed' : existing.status),
          checkInTime: syncMode === 'overwrite_all' && row.checkInTime ? row.checkInTime : existing.checkInTime,
        };
        updatedCount++;
      } else if (allowNewSeats) {
        // Add new seat if allowed
        const rowLetter = row.row || seatId.charAt(0);
        const numberVal = row.number || parseInt(seatId.slice(1), 10) || 1;
        nextSeats[seatId] = {
          id: seatId,
          row: rowLetter,
          number: numberVal,
          label: seatId,
          guestName: row.guestName || '',
          position: row.position || '',
          organization: row.organization || '',
          setGroup: row.setGroup || '',
          hasFlowerBasket: !!row.hasFlowerBasket,
          hasArtSet: !!row.hasArtSet,
          category: row.category || 'general',
          status: row.status || (row.guestName ? 'confirmed' : 'empty'),
          notes: row.notes || '',
          checkInTime: row.checkInTime || '',
        };
        addedCount++;
      }
    });

    const now = new Date();
    const timeString = `${now.toLocaleDateString('th-TH')} เวลา ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
    localStorage.setItem('google_sheet_last_sync_time', timeString);
    setLastSyncTime(timeString);

    const summary = `ซิงก์ข้อมูลจาก Google Sheets สำเร็จ! (อัปเดต ${updatedCount} ที่นั่ง${addedCount > 0 ? `, เพิ่มใหม่ ${addedCount} ที่นั่ง` : ''}${parsedUnassigned.length > 0 ? `, บันทึกรายชื่อรอจัดที่นั่ง ${parsedUnassigned.length} ท่าน` : ''})`;
    onApplySync(nextSeats, summary, parsedUnassigned.length > 0 ? parsedUnassigned : undefined);
    onClose();
  };

  // Copy template to clipboard
  const handleCopyTemplate = () => {
    try {
      const tsv = generateSheetTemplateTsv(seats);
      navigator.clipboard.writeText(tsv);
      setIsCopiedTemplate(true);
      setTimeout(() => setIsCopiedTemplate(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    downloadGoogleSheetTemplateCsv(seats);
  };

  // Match statistics
  const matchedExistingCount = parsedRows.filter(r => !!seats[r.seatId]).length;
  const newSeatsCount = parsedRows.filter(r => !seats[r.seatId]).length;
  const guestsWithNameCount = parsedRows.filter(r => !!r.guestName).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto text-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  เชื่อมต่อ Google Sheets
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                  Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ซิงก์ข้อมูลรายชื่อแขก, ตำแหน่ง และการกำหนดที่นั่งจาก Google Sheets เข้าสู่ผังอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* Sync Method Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveMethod('url'); setErrorMsg(''); }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMethod === 'url'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>ซิงก์ผ่านลิงก์ Google Sheets (Link Sync)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMethod('paste'); setErrorMsg(''); }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMethod === 'paste'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>คัดลอก & วางตาราง (Copy-Paste)</span>
            </button>
          </div>

          {/* Tab 1: URL Input */}
          {activeMethod === 'url' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>วางลิงก์ Google Sheets ของคุณ:</span>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-2xs cursor-pointer font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showInstructions ? 'ซ่อนคำแนะนำ' : 'วิธีเปิดสิทธิ์แชร์ใน Google Sheet'}</span>
                  </button>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit"
                      className="w-full pl-3 pr-8 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                    />
                    {sheetUrl && (
                      <button
                        type="button"
                        onClick={() => setSheetUrl('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ล้าง
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchFromUrl}
                    disabled={isLoading || !sheetUrl.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูล (Fetch)'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible 3-Step Guide */}
              {showInstructions && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-2 animate-in fade-in duration-150">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>วิธีตั้งค่าแชร์ใน Google Sheet ให้ระบบดึงข้อมูลได้ (3 ขั้นตอน):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                    <li>เปิด Google Sheet ของท่าน</li>
                    <li>กดปุ่ม <strong>"แชร์ (Share)"</strong> ที่มุมขวาบน &gt; ตรงการเข้าถึงทั่วไป ให้เลือก <strong>"ทุกคนที่มีลิงก์ (Anyone with the link)"</strong> เป็น <strong>"ผู้มีสิทธิ์อ่าน (Viewer)"</strong></li>
                    <li>คัดลอกลิงก์มาวางในช่องด้านบน แล้วกดปุ่ม <strong>"ดึงข้อมูล (Fetch)"</strong></li>
                  </ol>
                  <p className="text-2xs text-slate-500 italic mt-1">
                    * หากต้องการเชื่อมต่อแบบเป็นส่วนตัวโดยไม่ต้องเปิดแชร์ลิงก์ สามารถสลับไปใช้แท็บ <strong>"คัดลอก &amp; วางตาราง"</strong> เพื่อวางข้อมูลโดยตรงได้ทันที
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Paste Data */}
          {activeMethod === 'paste' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    คัดลอกจาก Google Sheet แล้วกด Ctrl+V วางที่นี่:
                  </label>
                  <span className="text-2xs text-slate-500">
                    (แนะนำ: ลากคลุมข้อมูลใน Google Sheet รวมหัวตาราง แล้วกด Ctrl+C)
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder={`รหัสที่นั่ง\tชื่อ-นามสกุล\tตำแหน่ง\tสังกัด\tกระเช้า\nA1\tศ.เกียรติคุณ ดร....\tประธานในพิธี\tมหาวิทยาลัยศิลปากร\tYES\nA2\tนายกสภามหาวิทยาลัย\tนายกสภามศก.\tมหาวิทยาลัยศิลปากร\tYES`}
                  className="w-full p-3 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono transition-all"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedData}
                  disabled={!pasteData.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>อ่านและตรวจสอบข้อมูล (Parse)</span>
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {errorMsg}
              </div>
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 font-medium">
                {successMsg}
              </div>
            </div>
          )}

          {/* Data Preview Section when parsedRows > 0 */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <span>ตัวอย่างข้อมูลที่ตรวจพบ</span>
                  <span className="px-2 py-0.5 text-2xs font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {parsedRows.length} รายการ
                  </span>
                </h4>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-2xs font-medium">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    ✓ ตรงกับผังเดิม {matchedExistingCount} ที่นั่ง
                  </span>
                  {newSeatsCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                      + ที่นั่งใหม่ {newSeatsCount} ที่นั่ง
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md">
                    มีชื่อแขก {guestsWithNameCount} ท่าน
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 sticky top-0 text-2xs font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3 border-b border-slate-200">ที่นั่ง</th>
                      <th className="py-2 px-3 border-b border-slate-200">ชื่อแขก</th>
                      <th className="py-2 px-3 border-b border-slate-200">ตำแหน่ง</th>
                      <th className="py-2 px-3 border-b border-slate-200">สังกัด</th>
                      <th className="py-2 px-3 border-b border-slate-200 text-center">กระเช้า</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.slice(0, 8).map((row) => (
                      <tr key={row.seatId} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                          {row.seatId}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 truncate max-w-[140px]">
                          {row.guestName || <span className="text-slate-400 italic">(ว่าง)</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[120px]">
                          {row.position || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">
                          {row.organization || '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.hasFlowerBasket ? (
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-[10px] rounded border border-rose-200">
                              มี
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 8 && (
                  <div className="py-1.5 px-3 bg-slate-50 border-t border-slate-200 text-2xs text-center text-slate-500">
                    และอีก {parsedRows.length - 8} รายการ...
                  </div>
                )}
              </div>

              {/* Sync Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-800">
                  ตัวเลือกการอัปเดตข้อมูล:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="sync_mode"
                      checked={syncMode === 'keep_status'}
                      onChange={() => setSyncMode('keep_status')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800">อัปเดตข้อมูลแขก (แนะนำ)</div>
                      <div className="text-2xs text-slate-500">อัปเดตชื่อ, ตำแหน่ง, สังกัด, กระเช้า โดยคงสถานะเช็คอินเดิมไว้</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="sync_mode"
                      checked={syncMode === 'overwrite_all'}
                      onChange={() => setSyncMode('overwrite_all')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800">เขียนทับทั้งหมด</div>
                      <div className="text-2xs text-slate-500">แทนที่ข้อมูลทั้งหมดรวมถึงสถานะเช็คอินจาก Google Sheet</div>
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="allow_new_seats"
                    checked={allowNewSeats}
                    onChange={(e) => setAllowNewSeats(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="allow_new_seats" className="text-xs text-slate-700 cursor-pointer">
                    เพิ่มที่นั่งใหม่เข้าผังอัตโนมัติ หากพบรหัสที่นั่งที่ยังไม่มีในระบบ
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Template Helpers Box */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-2xs font-bold text-slate-500 uppercase tracking-wider">
              <span>ตัวช่วยสร้างแม่แบบ Google Sheets</span>
              {lastSyncTime && (
                <span className="text-emerald-700 font-normal normal-case">
                  ซิงก์ล่าสุด: {lastSyncTime}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>ดาวน์โหลดแม่แบบ .CSV สำหรับ Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTemplate}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                {isCopiedTemplate ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">คัดลอกตารางแล้ว! นำไป Ctrl+V วางใน Google Sheet ได้เลย</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>คัดลอกตาราง 103 ที่นั่งไปวางใน Google Sheet</span>
                  </>
                )}
              </button>

              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs ml-auto"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>เปิดสร้าง Google Sheet ใหม่</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleConfirmSync}
            disabled={parsedRows.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span>นำเข้าและบันทึกสู่ผังที่นั่ง ({parsedRows.length} รายการ)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
