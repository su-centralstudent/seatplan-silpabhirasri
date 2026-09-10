import { Seat, SeatStatus, SeatCategory } from '../types';

export interface ParsedGoogleSheetRow {
  seatId: string;
  row?: string;
  number?: number;
  guestName?: string;
  position?: string;
  organization?: string;
  setGroup?: string;
  hasFlowerBasket?: boolean;
  hasArtSet?: boolean;
  category?: SeatCategory;
  status?: SeatStatus;
  notes?: string;
  checkInTime?: string;
  rawData?: Record<string, string>;
}

export interface GoogleSheetSyncResult {
  success: boolean;
  message: string;
  rows: ParsedGoogleSheetRow[];
  unassigned?: ParsedGoogleSheetRow[];
  headers: string[];
  totalRows: number;
}

/**
 * Extracts the Google Spreadsheet ID and GID from any valid Google Sheets link
 */
export function parseGoogleSheetUrl(url: string): { spreadsheetId: string | null; gid: string | null } {
  if (!url || typeof url !== 'string') {
    return { spreadsheetId: null, gid: null };
  }

  const trimmed = url.trim();

  // Pattern: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = idMatch ? idMatch[1] : null;

  // Pattern: gid=([0-9]+)
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return { spreadsheetId, gid };
}

/**
 * Builds the direct CSV export URLs for a Google Sheet
 */
export function buildGoogleSheetCsvUrls(spreadsheetId: string, gid: string = '0'): string[] {
  return [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
  ];
}

/**
 * Splits CSV / TSV text into rows and columns, handling quotes and line breaks
 */
export function parseCsvOrTsv(text: string): string[][] {
  const isTsv = text.includes('\t') && (!text.includes(',') || text.indexOf('\t') < text.indexOf(','));
  const delimiter = isTsv ? '\t' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header strings for flexible Thai/English matching
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F]/g, '');
}

/**
 * Maps CSV/TSV table rows to structured ParsedGoogleSheetRow items
 */
export function mapSheetRowsToSeats(table: string[][]): GoogleSheetSyncResult {
  if (!table || table.length < 2) {
    return {
      success: false,
      message: 'ตารางข้อมูลว่างเปล่า หรือไม่มีข้อมูลแถวแขก',
      rows: [],
      headers: [],
      totalRows: 0,
    };
  }

  const rawHeaders = table[0].map(h => h.trim());
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Column index finders with priority
  const findCol = (keywords: string[]): number => {
    return normalizedHeaders.findIndex(h => 
      keywords.some(k => h.includes(normalizeHeader(k)))
    );
  };

  const idCol = findCol(['seatid', 'รหัสที่นั่ง', 'ที่นั่ง', 'seat', 'ลำดับที่นั่ง', 'เลขที่นั่ง', 'id']);
  const rowCol = findCol(['row', 'แถว', 'โซน']);
  const numCol = findCol(['number', 'no', 'ลำดับที่', 'หมายเลข', 'ลำดับ']);

  // If column 0 is "รายชื่อ/ตำแหน่ง" and column 1 is "ตำแหน่ง/สังกัด"
  let nameCol = normalizedHeaders.findIndex(h => h.includes('รายชื่อ') || h.includes('ชื่อแขก') || h.includes('ชื่อนามสกุล') || h.includes('guestname'));
  if (nameCol === -1) {
    nameCol = findCol(['guestname', 'ชื่อ', 'ผู้รับรางวัล', 'แขก', 'name']);
  }

  let posCol = normalizedHeaders.findIndex((h, idx) => idx !== nameCol && (h.includes('ตำแหน่ง') || h.includes('position') || h.includes('title') || h.includes('role')));
  let orgCol = normalizedHeaders.findIndex((h, idx) => idx !== nameCol && idx !== posCol && (h.includes('สังกัด') || h.includes('หน่วยงาน') || h.includes('organization') || h.includes('สถาบัน') || h.includes('คณะ')));

  // Fallback if organization is combined with position (e.g. ตำแหน่ง/สังกัด)
  if (orgCol === -1 && posCol !== -1 && (normalizedHeaders[posCol].includes('สังกัด') || normalizedHeaders[posCol].includes('คณะ'))) {
    orgCol = posCol;
  }

  const setCol = findCol(['setgroup', 'set', 'ชุด', 'กลุ่ม', 'รอบ', 'ลำดับการวาง']);
  const flowerCol = findCol(['flowerbasket', 'วางกระเช้าดอกไม้', 'กระเช้าดอกไม้', 'กระเช้า', 'flower']);
  const artCol = findCol(['artset', 'วางartset', 'art', 'ของที่ระลึก']);
  const catCol = findCol(['category', 'หมวดหมู่', 'หมวด']);
  const statusCol = findCol(['สถานะการตอบกลับ', 'status', 'สถานะ', 'เช็คอิน', 'การตอบรับ']);
  const notesCol = findCol(['notes', 'หมายเหตุ', 'note', 'รางวัล']);
  const timeCol = findCol(['checkintime', 'เวลาเช็คอิน', 'เวลา']);

  const parsedRows: ParsedGoogleSheetRow[] = [];
  const unassignedRows: ParsedGoogleSheetRow[] = [];

  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    if (!row || row.every(cell => !cell.trim())) continue;

    let rawSeatId = (idCol !== -1 ? row[idCol] : '').trim();
    if (rawSeatId === '-' || rawSeatId === '–' || rawSeatId === '—') {
      rawSeatId = '';
    }
    let seatId = rawSeatId.toUpperCase();
    const rowLetter = (rowCol !== -1 ? row[rowCol] : '').trim().toUpperCase();
    const numVal = numCol !== -1 ? parseInt(row[numCol], 10) : NaN;

    // If seatId is not directly found, try to assemble from Row + Number
    if (!seatId && rowLetter && !isNaN(numVal)) {
      seatId = `${rowLetter}${numVal}`;
    }

    // Try finding seat ID from first cell or last cell if it looks like A1, B12, I4, J2, K8
    if (!seatId) {
      for (const cell of row) {
        const match = cell.trim().toUpperCase().match(/^([A-K])([0-9]{1,2})$/);
        if (match) {
          seatId = match[0];
          break;
        }
      }
    }

    // Parse status
    let parsedStatus: SeatStatus = 'empty';
    const rawStatus = (statusCol !== -1 ? row[statusCol] : '').trim().toLowerCase();
    if (rawStatus.includes('check') || rawStatus.includes('เช็คอินแล้ว') || rawStatus === 'checked_in') {
      parsedStatus = 'checked_in';
    } else if (rawStatus.includes('confirm') || rawStatus.includes('ยืนยัน') || rawStatus.includes('เข้าร่วม') || rawStatus === 'confirmed') {
      parsedStatus = 'confirmed';
    } else if (rawStatus.includes('absent') || rawStatus.includes('ไม่มา') || rawStatus.includes('สละสิทธิ์') || rawStatus.includes('ไม่เข้าร่วม')) {
      parsedStatus = 'absent';
    } else if (rawStatus.includes('pend') || rawStatus.includes('รอ')) {
      parsedStatus = 'pending';
    }

    const guestName = nameCol !== -1 ? row[nameCol]?.trim() : '';
    if (guestName && parsedStatus === 'empty') {
      parsedStatus = 'confirmed';
    }

    // Parse flower basket
    const rawFlower = flowerCol !== -1 ? row[flowerCol]?.trim().toLowerCase() : '';
    const hasFlower = rawFlower === 'yes' || rawFlower === 'true' || rawFlower === '1' || rawFlower.includes('มี') || rawFlower.includes('*');

    // Parse Art Set
    const rawArt = artCol !== -1 ? row[artCol]?.trim().toLowerCase() : '';
    const hasArt = rawArt === 'yes' || rawArt === 'true' || rawArt === '1' || rawArt.includes('มี');

    const posStr = posCol !== -1 ? row[posCol]?.trim() : '';
    const orgStr = orgCol !== -1 ? row[orgCol]?.trim() : '';
    const setVal = setCol !== -1 ? row[setCol]?.trim() : '';

    // Auto-infer category based on role/title
    let inferredCat: SeatCategory = 'general';
    const combinedInfo = `${guestName} ${posStr} ${orgStr}`.toLowerCase();
    if (combinedInfo.includes('ประธาน') || combinedInfo.includes('นายกสภา') || combinedInfo.includes('อธิการบดี') || combinedInfo.includes('ทูต') || combinedInfo.includes('ปาฐกถา')) {
      inferredCat = 'vip_president';
    } else if (combinedInfo.includes('รัฐมนตรี') || combinedInfo.includes('ปลัด') || combinedInfo.includes('อธิบดี') || combinedInfo.includes('วธ.') || combinedInfo.includes('อว.') || combinedInfo.includes('กระทรวง')) {
      inferredCat = 'vip_minister';
    } else if (combinedInfo.includes('ศิลปินแห่งชาติ')) {
      inferredCat = 'national_artist';
    } else if (combinedInfo.includes('รองอธิการ') || combinedInfo.includes('ผู้ช่วยอธิการ')) {
      inferredCat = 'executive';
    } else if (combinedInfo.includes('คณบดี')) {
      inferredCat = 'dean';
    } else if (combinedInfo.includes('ผู้อำนวยการ') || combinedInfo.includes('ผอ.') || combinedInfo.includes('ประธานสภาคณาจารย์')) {
      inferredCat = 'director';
    } else if (combinedInfo.includes('ผู้ติดตาม') || combinedInfo.includes('ล่าม')) {
      inferredCat = 'guest_follower';
    } else if (seatId.startsWith('J') || seatId.startsWith('K')) {
      inferredCat = 'awardee';
    }

    if (!seatId) {
      if (guestName) {
        unassignedRows.push({
          seatId: `UNASSIGNED-${r}`,
          guestName,
          position: posStr,
          organization: orgStr,
          setGroup: setVal,
          hasFlowerBasket: hasFlower,
          hasArtSet: hasArt,
          category: inferredCat,
          status: parsedStatus,
          notes: notesCol !== -1 ? row[notesCol]?.trim() : '',
          checkInTime: timeCol !== -1 ? row[timeCol]?.trim() : '',
        });
      }
      continue;
    }

    const parsedRow: ParsedGoogleSheetRow = {
      seatId,
      row: rowLetter || seatId.charAt(0),
      number: !isNaN(numVal) ? numVal : parseInt(seatId.slice(1), 10) || 1,
      guestName,
      position: posStr,
      organization: orgStr,
      setGroup: setVal,
      hasFlowerBasket: hasFlower,
      hasArtSet: hasArt,
      category: inferredCat,
      status: parsedStatus,
      notes: notesCol !== -1 ? row[notesCol]?.trim() : '',
      checkInTime: timeCol !== -1 ? row[timeCol]?.trim() : '',
    };

    parsedRows.push(parsedRow);
  }

  return {
    success: parsedRows.length > 0 || unassignedRows.length > 0,
    message: parsedRows.length > 0 
      ? `พบข้อมูลที่นั่ง ${parsedRows.length} ที่นั่ง${unassignedRows.length > 0 ? ` (และผู้มีเกียรติที่ยังไม่ระบุที่นั่ง ${unassignedRows.length} ท่าน)` : ''}`
      : 'ไม่พบรหัสที่นั่ง (Seat ID) ที่ถูกต้องในตาราง กรุณาตรวจสอบหัวตาราง',
    rows: parsedRows,
    unassigned: unassignedRows,
    headers: rawHeaders,
    totalRows: parsedRows.length + unassignedRows.length,
  };
}

/**
 * Fetches Google Sheet content via CSV endpoint or GViz API
 */
export async function fetchGoogleSheetData(sheetUrl: string): Promise<GoogleSheetSyncResult> {
  const { spreadsheetId, gid } = parseGoogleSheetUrl(sheetUrl);

  if (!spreadsheetId) {
    return {
      success: false,
      message: 'ลิงก์ Google Sheets ไม่ถูกต้อง กรุณาวาง URL ที่มี /spreadsheets/d/...',
      rows: [],
      headers: [],
      totalRows: 0,
    };
  }

  const endpoints = buildGoogleSheetCsvUrls(spreadsheetId, gid || '0');
  let lastError = '';

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv, text/plain, */*',
        },
      });

      if (!response.ok) {
        lastError = `การดึงข้อมูลล้มเหลว (HTTP ${response.status})`;
        continue;
      }

      const text = await response.text();

      // Check if Google returned HTML login page instead of CSV
      if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('accounts.google.com')) {
        return {
          success: false,
          message: 'Google Sheet นี้ยังไม่ได้เปิดสิทธิ์ให้เข้าถึง กรุณาไปที่ Google Sheet > คลิกปุ่ม "แชร์ (Share)" > เปลี่ยนเป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" หรือใช้แถบ "วางข้อมูลตาราง" แทนได้ทันที',
          rows: [],
          headers: [],
          totalRows: 0,
        };
      }

      const table = parseCsvOrTsv(text);
      const parsedResult = mapSheetRowsToSeats(table);
      if (parsedResult.success) {
        return parsedResult;
      } else {
        lastError = parsedResult.message;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ (อาจติดสิทธิ์ CORS)';
    }
  }

  return {
    success: false,
    message: `ไม่สามารถดึงข้อมูลผ่านลิงก์ได้ (${lastError}) แนะนำให้ตรวจสอบการแชร์ หรือใช้แท็บ "วางข้อมูลจาก Google Sheet (Copy-Paste)" ได้อย่างง่ายดาย`,
    rows: [],
    headers: [],
    totalRows: 0,
  };
}

/**
 * Generates TSV text for copying to clipboard to paste into Google Sheet
 */
export function generateSheetTemplateTsv(seats: Record<string, Seat>): string {
  const headers = ['รหัสที่นั่ง (Seat ID)', 'แถว (Row)', 'ลำดับที่ (Number)', 'ตำแหน่ง / คำนำหน้า', 'ชื่อ-นามสกุล แขกผู้มีเกียรติ', 'หน่วยงาน / สังกัด', 'กลุ่ม / Set', 'กระเช้าดอกไม้ (*)', 'สถานะ', 'หมายเหตุ'];

  const rows = Object.values(seats).map(s => [
    s.id,
    s.row,
    s.number.toString(),
    s.position || '',
    s.guestName || '',
    s.organization || '',
    s.setGroup || '',
    s.hasFlowerBasket ? 'YES' : 'NO',
    s.status === 'checked_in' ? 'เช็คอินแล้ว' : s.status === 'confirmed' ? 'ยืนยันแล้ว' : s.status === 'empty' ? 'ว่าง' : s.status,
    s.notes || '',
  ]);

  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
}

/**
 * Downloads a pre-formatted CSV template for Google Sheets
 */
export function downloadGoogleSheetTemplateCsv(seats: Record<string, Seat>): void {
  const headers = ['Seat ID', 'Row', 'Number', 'Position / Title', 'Guest Name', 'Organization', 'Set Group', 'Flower Basket (*)', 'Status', 'Notes'];

  const rows = Object.values(seats).map(s => [
    `"${s.id}"`,
    `"${s.row}"`,
    s.number,
    `"${(s.position || '').replace(/"/g, '""')}"`,
    `"${(s.guestName || '').replace(/"/g, '""')}"`,
    `"${(s.organization || '').replace(/"/g, '""')}"`,
    `"${(s.setGroup || '').replace(/"/g, '""')}"`,
    s.hasFlowerBasket ? 'YES' : 'NO',
    `"${s.status}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `template_google_sheet_seating_plan.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
