import React, { useState, useMemo } from 'react';
import { Seat, SeatCategory, SeatStatus, UnassignedGuest } from '../types';
import { 
  Search, Filter, Flower2, Palette, Download, Plus, Edit2, 
  CheckCircle2, Clock, XCircle, Trash2, ArrowUpDown, UserCheck, FileSpreadsheet,
  Users, UserPlus, Armchair
} from 'lucide-react';

interface GuestListTableProps {
  seats: Record<string, Seat>;
  unassignedGuests?: UnassignedGuest[];
  onAssignGuestToSeat?: (guest: UnassignedGuest, seatId: string) => void;
  onEditSeat: (seat: Seat) => void;
  onUpdateSeatField: (seatId: string, field: keyof Seat, value: any) => void;
  onAddSeatToRow?: (rowName: string) => void;
  onRemoveSeat?: (seatId: string) => void;
  onExportCsv: () => void;
  onOpenGoogleSheets?: () => void;
}

export const GuestListTable: React.FC<GuestListTableProps> = ({
  seats,
  unassignedGuests = [],
  onAssignGuestToSeat,
  onEditSeat,
  onUpdateSeatField,
  onAddSeatToRow,
  onRemoveSeat,
  onExportCsv,
  onOpenGoogleSheets,
}) => {
  const [activeView, setActiveView] = useState<'assigned' | 'unassigned'>('assigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [rowFilter, setRowFilter] = useState<string>('all');
  const [selectedAddRow, setSelectedAddRow] = useState<string>('A');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [basketFilter, setBasketFilter] = useState<string>('all');
  const [artSetFilter, setArtSetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'id' | 'position' | 'guestName' | 'setGroup'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedGuestForAssign, setSelectedGuestForAssign] = useState<UnassignedGuest | null>(null);
  const [targetAssignSeatId, setTargetAssignSeatId] = useState<string>('');

  const seatList = useMemo(() => Object.values(seats), [seats]);
  const emptySeats = useMemo(() => seatList.filter(s => s.status === 'empty' || !s.guestName), [seatList]);

  const filteredUnassigned = useMemo(() => {
    if (!searchQuery.trim()) return unassignedGuests;
    const q = searchQuery.toLowerCase();
    return unassignedGuests.filter(u => 
      u.name.toLowerCase().includes(q) ||
      u.position?.toLowerCase().includes(q) ||
      u.organization?.toLowerCase().includes(q) ||
      u.notes?.toLowerCase().includes(q)
    );
  }, [unassignedGuests, searchQuery]);

  const filteredSeats = useMemo(() => {
    return seatList.filter(s => {
      // Row filter
      if (rowFilter !== 'all' && s.row !== rowFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;

      // Flower basket filter
      if (basketFilter === 'yes' && !s.hasFlowerBasket) return false;
      if (basketFilter === 'no' && s.hasFlowerBasket) return false;

      // Art Set filter
      if (artSetFilter === 'yes' && !s.hasArtSet) return false;
      if (artSetFilter === 'no' && s.hasArtSet) return false;

      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = s.id.toLowerCase().includes(q);
        const matchPos = s.position?.toLowerCase().includes(q);
        const matchName = s.guestName?.toLowerCase().includes(q);
        const matchOrg = s.organization?.toLowerCase().includes(q);
        const matchSet = s.setGroup?.toLowerCase().includes(q);
        const matchNotes = s.notes?.toLowerCase().includes(q);
        if (!matchId && !matchPos && !matchName && !matchOrg && !matchSet && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA = (a[sortField] || '') as string;
      let valB = (b[sortField] || '') as string;

      if (sortField === 'id') {
        valA = a.id;
        valB = b.id;
      }

      const cmp = valA.localeCompare(valB, 'th');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [seatList, searchQuery, rowFilter, categoryFilter, basketFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: 'id' | 'position' | 'guestName' | 'setGroup') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Top View Selector Sub-Tabs */}
      <div className="px-4 pt-2.5 pb-0 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('assigned')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeView === 'assigned'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>ผังที่นั่ง ({seatList.length} ที่นั่ง)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('unassigned')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeView === 'unassigned'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>รายชื่อรอจัดที่นั่ง ({unassignedGuests.length} ท่าน)</span>
            {unassignedGuests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                {unassignedGuests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสที่นั่ง, ชื่อแขก, ตำแหน่ง, สังกัด หรือ Set..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onAddSeatToRow && (
              <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1 gap-1 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">เพิ่มในแถว:</span>
                <select
                  value={selectedAddRow}
                  onChange={(e) => setSelectedAddRow(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(r => (
                    <option key={r} value={r}>แถว {r}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onAddSeatToRow(selectedAddRow)}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มที่นั่ง</span>
                </button>
              </div>
            )}

            {/* Google Sheets Sync button */}
            {onOpenGoogleSheets && (
              <button
                type="button"
                onClick={onOpenGoogleSheets}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="เชื่อมต่อ & ซิงก์ข้อมูลกับ Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>เชื่อมต่อ Google Sheets</span>
              </button>
            )}

            {/* Export button */}
            <button
              type="button"
              onClick={onExportCsv}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              ส่งออกไฟล์ CSV
            </button>
          </div>
        </div>

        {/* Filter Chips - Show on assigned view */}
        {activeView === 'assigned' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Row Filter */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500">แถว:</span>
              <select
                value={rowFilter}
                onChange={(e) => setRowFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกแถวที่นั่ง (A - K)</option>
                <option value="A">แถว A (โซนสีชมพู - VIP หลัก)</option>
                <option value="B">แถว B (โซนสีชมพู - ผู้บริหาร/ศิลปินแห่งชาติ)</option>
                <option value="C">แถว C (โซนสีชมพู - ผู้แทนหน่วยงาน/วางกระเช้า)</option>
                <option value="D">แถว D (โซนสีชมพู - ผู้บริหาร/ผู้ช่วยอธิการ/ผอ.)</option>
                <option value="E">แถว E (โซนสีชมพู - คณบดี 12 คณะ)</option>
                <option value="F">แถว F (โซนสีเหลือง - ผู้บริหาร/ผอ.สำนัก)</option>
                <option value="G">แถว G (โซนสีเหลือง - สมาคม/องค์กรเอกชน)</option>
                <option value="H">แถว H (โซนสีเหลือง - หน่วยงานภายนอก/พิพิธภัณฑ์)</option>
                <option value="I">แถว I (โซนสีเขียวขวา - กรรมการ/ผู้มอบรางวัล)</option>
                <option value="J">แถว J (โซนสีส้มอ่อนขวา - ผู้รับรางวัล 1-8)</option>
                <option value="K">แถว K (โซนสีส้มอ่อนขวา - ผู้รับรางวัล 9-17)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500">หมวด:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกหมวด</option>
                <option value="vip_president">VIP ประธาน / ทูต / อธิการ</option>
                <option value="vip_minister">ผู้แทนกระทรวง / กรมศิลป์</option>
                <option value="executive">ผู้บริหาร / รองอธิการ</option>
                <option value="dean">คณบดี</option>
                <option value="director">ผอ.สำนัก / สถาบัน</option>
                <option value="national_artist">ศิลปินแห่งชาติ</option>
                <option value="awardee">ผู้เข้ารับรางวัล</option>
                <option value="guest_follower">ผู้ติดตาม / ล่าม</option>
              </select>
            </div>

            {/* Flower Basket */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500">กระเช้าดอกไม้:</span>
              <select
                value={basketFilter}
                onChange={(e) => setBasketFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">ทั้งหมด</option>
                <option value="yes">เฉพาะที่มีกระเช้า (*)</option>
                <option value="no">ไม่มีกระเช้า</option>
              </select>
            </div>

            {/* Art Set */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500">Art Set:</span>
              <select
                value={artSetFilter}
                onChange={(e) => setArtSetFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">ทั้งหมด</option>
                <option value="yes">เฉพาะที่มี Art Set</option>
                <option value="no">ไม่มี Art Set</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500">สถานะ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="checked_in">ลงทะเบียนแล้ว</option>
                <option value="pending">รอตอบรับ</option>
                <option value="empty">ที่นั่งว่าง</option>
              </select>
            </div>

            <span className="text-slate-500 ml-auto">
              แสดง <strong>{filteredSeats.length}</strong> จาก {seatList.length} ที่นั่ง
            </span>
          </div>
        )}

        {/* Info on unassigned view */}
        {activeView === 'unassigned' && (
          <div className="flex items-center justify-between text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
            <div>
              พบรายชื่อผู้มีเกียรติที่ยังไม่ได้ระบุที่นั่ง <strong>{filteredUnassigned.length}</strong> ท่าน 
              (สามารถกดปุ่ม <span className="font-semibold text-amber-800">"จัดที่นั่ง"</span> เพื่อเลือกที่นั่งว่างในผังได้ทันที)
            </div>
            <div className="text-slate-500">
              ที่นั่งว่างปัจจุบัน: <strong>{emptySeats.length}</strong> ที่นั่ง
            </div>
          </div>
        )}
      </div>

      {/* Table Content - Assigned View */}
      {activeView === 'assigned' && (
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th 
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  รหัสที่นั่ง
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60"
                onClick={() => handleSort('position')}
              >
                <div className="flex items-center gap-1">
                  ตำแหน่ง / บทบาท
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60"
                onClick={() => handleSort('guestName')}
              >
                <div className="flex items-center gap-1">
                  ชื่อแขกผู้มีเกียรติ
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5">หน่วยงาน / สังกัด</th>
              <th 
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60"
                onClick={() => handleSort('setGroup')}
              >
                <div className="flex items-center gap-1">
                  กลุ่ม Set
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5 text-center">กระเช้าดอกไม้ (*)</th>
              <th className="py-3 px-3.5 text-center">Art Set</th>
              <th className="py-3 px-3.5 text-center">สถานะเข้าร่วม</th>
              <th className="py-3 px-3.5 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSeats.map((seat) => (
              <tr 
                key={seat.id} 
                className="hover:bg-blue-50/50 transition-colors group"
              >
                {/* Seat ID */}
                <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                  <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                    {seat.label || seat.id}
                  </span>
                </td>

                {/* Position / Title (Inline edit) */}
                <td className="py-2.5 px-3.5 font-medium">
                  <input
                    type="text"
                    value={seat.position || ''}
                    onChange={(e) => onUpdateSeatField(seat.id, 'position', e.target.value)}
                    placeholder="ระบุตำแหน่ง..."
                    className="w-full bg-transparent px-1.5 py-0.5 rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 border border-transparent focus:border-slate-300"
                  />
                </td>

                {/* Guest Name (Inline edit) */}
                <td className="py-2.5 px-3.5">
                  <input
                    type="text"
                    value={seat.guestName || ''}
                    onChange={(e) => onUpdateSeatField(seat.id, 'guestName', e.target.value)}
                    placeholder="ระบุชื่อแขก..."
                    className="w-full bg-transparent px-1.5 py-0.5 rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 border border-transparent focus:border-slate-300 font-medium text-slate-900"
                  />
                </td>

                {/* Organization */}
                <td className="py-2.5 px-3.5 text-slate-500">
                  <input
                    type="text"
                    value={seat.organization || ''}
                    onChange={(e) => onUpdateSeatField(seat.id, 'organization', e.target.value)}
                    placeholder="สังกัด..."
                    className="w-full bg-transparent px-1.5 py-0.5 rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 border border-transparent focus:border-slate-300"
                  />
                </td>

                {/* Set Group (Inline Editable) */}
                <td className="py-2.5 px-3.5">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={seat.setGroup || ''}
                      onChange={(e) => onUpdateSeatField(seat.id, 'setGroup', e.target.value)}
                      placeholder="เช่น Set 1*"
                      className="w-24 px-2 py-1 text-xs font-semibold bg-white/70 hover:bg-white focus:bg-white rounded-md border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 transition-colors"
                      title="คลิกเพื่อแก้ไขตัวเลข Set ได้ทันที"
                    />
                  </div>
                </td>

                {/* Flower Basket Checkbox */}
                <td className="py-2.5 px-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => onUpdateSeatField(seat.id, 'hasFlowerBasket', !seat.hasFlowerBasket)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      seat.hasFlowerBasket 
                        ? 'bg-rose-50 border-rose-300 text-rose-600 font-bold' 
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    title="สลับสถานะวางกระเช้าดอกไม้ (*)"
                  >
                    <Flower2 className="w-4 h-4 inline" />
                    {seat.hasFlowerBasket && <span className="ml-1 text-xs">*</span>}
                  </button>
                </td>

                {/* Art Set Checkbox */}
                <td className="py-2.5 px-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => onUpdateSeatField(seat.id, 'hasArtSet', !seat.hasArtSet)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      seat.hasArtSet 
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' 
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    title="สลับสถานะ Art Set"
                  >
                    <Palette className="w-4 h-4 inline" />
                  </button>
                </td>

                {/* Attendance Status */}
                <td className="py-2.5 px-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus: SeatStatus = 
                        seat.status === 'confirmed' ? 'checked_in' :
                        seat.status === 'checked_in' ? 'confirmed' : 'confirmed';
                      onUpdateSeatField(seat.id, 'status', nextStatus);
                      if (nextStatus === 'checked_in') {
                        onUpdateSeatField(seat.id, 'checkInTime', new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center justify-center gap-1 mx-auto transition-colors ${
                      seat.status === 'checked_in' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      seat.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      seat.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {seat.status === 'checked_in' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {seat.status === 'checked_in' ? `มาถึงแล้ว (${seat.checkInTime || ''})` :
                     seat.status === 'confirmed' ? 'ยืนยันแล้ว' :
                     seat.status === 'pending' ? 'รอตอบรับ' : 'ที่นั่งว่าง'}
                  </button>
                </td>

                {/* Actions: Edit & Delete */}
                <td className="py-2.5 px-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEditSeat(seat)}
                      className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                      title="แก้ไขข้อมูลอย่างละเอียด"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {onRemoveSeat && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`คุณต้องการลบที่นั่ง ${seat.id} ออกจากผังใช่หรือไม่?`)) {
                            onRemoveSeat(seat.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title={`ลบที่นั่ง ${seat.id} ออกจากผัง`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Table Content - Unassigned View */}
      {activeView === 'unassigned' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-amber-50/80 text-amber-900 font-semibold border-b border-amber-200">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-3.5">ชื่อ-นามสกุล / แขกผู้มีเกียรติ</th>
                <th className="py-3 px-3.5">ตำแหน่ง</th>
                <th className="py-3 px-3.5">สังกัด / หน่วยงาน</th>
                <th className="py-3 px-3.5 text-center">กระเช้า (*)</th>
                <th className="py-3 px-3.5 text-center">Art Set</th>
                <th className="py-3 px-3.5 text-center">สถานะ</th>
                <th className="py-3 px-3.5 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnassigned.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    ไม่พบรายชื่อผู้มีเกียรติที่รอจัดที่นั่ง
                  </td>
                </tr>
              ) : (
                filteredUnassigned.map((guest, idx) => (
                  <tr key={guest.id || idx} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{guest.name}</td>
                    <td className="py-3 px-3.5 text-slate-600">{guest.position || '-'}</td>
                    <td className="py-3 px-3.5 text-slate-600">{guest.organization || '-'}</td>
                    <td className="py-3 px-3.5 text-center">
                      {guest.hasFlowerBasket ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-md font-bold text-[10px]">
                          มีกระเช้า (*)
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {guest.hasArtSet ? (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[10px]">
                          Art Set
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        guest.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        guest.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {guest.status === 'confirmed' ? 'ยืนยันแล้ว' : guest.status === 'pending' ? 'รอตอบรับ' : 'ปกติ'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      {selectedGuestForAssign?.id === guest.id ? (
                        <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                          <select
                            value={targetAssignSeatId}
                            onChange={(e) => setTargetAssignSeatId(e.target.value)}
                            className="text-xs px-2 py-1 bg-white border border-blue-400 rounded-lg font-medium"
                          >
                            <option value="">-- เลือกที่นั่งว่าง ({emptySeats.length}) --</option>
                            {emptySeats.map(s => (
                              <option key={s.id} value={s.id}>ที่นั่ง {s.id} (แถว {s.row})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!targetAssignSeatId}
                            onClick={() => {
                              if (targetAssignSeatId && onAssignGuestToSeat) {
                                onAssignGuestToSeat(guest, targetAssignSeatId);
                                setSelectedGuestForAssign(null);
                                setTargetAssignSeatId('');
                              }
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          >
                            บันทึก
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGuestForAssign(null);
                              setTargetAssignSeatId('');
                            }}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGuestForAssign(guest);
                            if (emptySeats.length > 0) {
                              setTargetAssignSeatId(emptySeats[0].id);
                            }
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 ml-auto shadow-2xs transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>จัดที่นั่ง</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
