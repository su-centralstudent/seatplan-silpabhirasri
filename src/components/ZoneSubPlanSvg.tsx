import React from 'react';
import { Seat, SeatingPlanMetadata } from '../types';

interface ZoneSubPlanProps {
  metadata: SeatingPlanMetadata;
  seats: Record<string, Seat>;
}

/**
 * PAGE 2: ผังที่นั่งย่อย โซนสีชมพู (แถว A, B, C, D, E)
 * รวม 60 ที่นั่ง (แถวละ 12 ที่นั่ง)
 */
export const ZonePinkSvg: React.FC<ZoneSubPlanProps> = ({ metadata, seats }) => {
  const rowA = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => seats[`A${n}`] || { id: `A${n}`, row: 'A', number: n, status: 'empty', category: 'executive' });
  const rowB = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => seats[`B${n}`] || { id: `B${n}`, row: 'B', number: n, status: 'empty', category: 'executive' });
  const rowC = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => seats[`C${n}`] || { id: `C${n}`, row: 'C', number: n, status: 'empty', category: 'executive' });
  const rowD = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => seats[`D${n}`] || { id: `D${n}`, row: 'D', number: n, status: 'empty', category: 'executive' });
  const rowE = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => seats[`E${n}`] || { id: `E${n}`, row: 'E', number: n, status: 'empty', category: 'dean' });

  const rows = [
    { label: 'แถว A', seats: rowA, y: 135 },
    { label: 'แถว B', seats: rowB, y: 260 },
    { label: 'แถว C', seats: rowC, y: 385 },
    { label: 'แถว D', seats: rowD, y: 510 },
    { label: 'แถว E', seats: rowE, y: 635 },
  ];

  const colWidth = 84;
  const colGap = 4;
  const startX = 75;

  return (
    <svg
      id="zone-subplan-svg-pink"
      viewBox="0 0 1150 780"
      width="1150"
      height="780"
      className="w-full h-auto bg-white select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background & Border */}
      <rect x="0" y="0" width="1150" height="780" fill="#ffffff" />
      <rect x="8" y="8" width="1134" height="764" rx="10" fill="none" stroke="#f472b6" strokeWidth="1.5" />

      {/* Header Banner */}
      <rect x="20" y="16" width="1110" height="76" rx="8" fill="#fdf2f8" stroke="#fbcfe8" strokeWidth="1.5" />
      
      {/* Event Meta */}
      <text x="36" y="38" fontSize="12" fontWeight="600" fill="#9d174d" fontFamily="sans-serif">
        {metadata.eventTitle || 'แผนผังที่นั่งสำหรับแขกผู้มีเกียรติงานวันศิลป์ พีระศรี ในพิธีการ'} ({metadata.year || 'ประจำปี พ.ศ. 2569'})
      </text>

      {/* Zone Title */}
      <text x="36" y="65" fontSize="19" fontWeight="bold" fill="#831843" fontFamily="sans-serif">
        ผังที่นั่งย่อย: โซนสีชมพู (แถว A, B, C, D, E) — แขก VIP / ผู้บริหาร / คณบดี
      </text>
      
      <rect x="910" y="26" width="205" height="28" rx="14" fill="#fce7f3" stroke="#f43f5e" strokeWidth="1.2" />
      <text x="1012" y="45" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#be123c" fontFamily="sans-serif">
        รวม 60 ที่นั่ง (12 ที่นั่ง/แถว)
      </text>

      {/* Stage Direction Bar */}
      <rect x="20" y="98" width="1110" height="24" rx="4" fill="#fce7f3" />
      <text x="575" y="114" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#9d174d" fontFamily="sans-serif">
        ▲ ทิศทางเวทีและอนุสาวรีย์ ศาสตราจารย์ศิลป์ พีระศรี (หันหน้าเข้าหาเวที) | ลำดับที่นั่ง: หมายเลข 12 (ซ้ายสุด) ➔ หมายเลข 1 (ขวาสุด)
      </text>

      {/* 5 Rows */}
      {rows.map((r) => (
        <g key={r.label} transform={`translate(0, ${r.y})`}>
          {/* Row Label Badge */}
          <rect x="18" y="0" width="48" height="112" rx="6" fill="#be185d" />
          <text 
            x="42" 
            y="62" 
            textAnchor="middle" 
            fontSize="14" 
            fontWeight="bold" 
            fill="#ffffff" 
            fontFamily="sans-serif"
          >
            {r.label.replace('แถว ', '')}
          </text>

          {/* 12 Seats in this Row */}
          {r.seats.map((seat, idx) => {
            const x = startX + idx * (colWidth + colGap);
            const isVip = seat.category === 'vip_president' || seat.category === 'vip_minister';
            const hasBasket = !!seat.hasFlowerBasket;

            return (
              <g key={seat.id} transform={`translate(${x}, 0)`}>
                {/* Seat Box */}
                <rect
                  x="0"
                  y="0"
                  width={colWidth}
                  height="112"
                  rx="6"
                  fill={isVip ? '#fce7f3' : '#fff1f2'}
                  stroke={hasBasket ? '#e11d48' : '#fbcfe8'}
                  strokeWidth={hasBasket ? '2' : '1.2'}
                />

                {/* Seat Number Pill */}
                <rect 
                  x="4" 
                  y="4" 
                  width="26" 
                  height="18" 
                  rx="4" 
                  fill={isVip ? '#be185d' : '#e11d48'} 
                />
                <text
                  x="17"
                  y="17"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#ffffff"
                  fontFamily="sans-serif"
                >
                  {seat.id}
                </text>

                {/* Set Group & Flower Basket Tag */}
                {hasBasket && (
                  <g transform={`translate(${colWidth - 20}, 4)`}>
                    <circle cx="8" cy="8" r="8" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1" />
                    <text x="8" y="12" textAnchor="middle" fontSize="10">🌸</text>
                  </g>
                )}

                {seat.setGroup && (
                  <text
                    x={hasBasket ? colWidth - 24 : colWidth - 6}
                    y="16"
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#e11d48"
                    fontFamily="sans-serif"
                  >
                    {seat.setGroup}
                  </text>
                )}

                {/* Position / Title */}
                <text
                  x="6"
                  y="40"
                  fontSize="9.5"
                  fontWeight="bold"
                  fill="#881337"
                  fontFamily="sans-serif"
                >
                  {seat.position ? (seat.position.length > 13 ? seat.position.slice(0, 12) + '…' : seat.position) : 'ที่นั่งสำรอง'}
                </text>

                {/* Guest Name */}
                <text
                  x="6"
                  y="62"
                  fontSize="9"
                  fontWeight="600"
                  fill="#1e293b"
                  fontFamily="sans-serif"
                >
                  {seat.guestName ? (seat.guestName.length > 13 ? seat.guestName.slice(0, 12) + '…' : seat.guestName) : '-'}
                </text>

                {/* Organization / Note */}
                <text
                  x="6"
                  y="82"
                  fontSize="8"
                  fill="#64748b"
                  fontFamily="sans-serif"
                >
                  {seat.organization ? (seat.organization.length > 14 ? seat.organization.slice(0, 13) + '…' : seat.organization) : ''}
                </text>

                {/* Status Indicator */}
                <rect 
                  x="4" 
                  y="96" 
                  width={colWidth - 8} 
                  height="12" 
                  rx="3" 
                  fill={seat.status === 'checked_in' ? '#dcfce7' : '#f1f5f9'} 
                />
                <text
                  x={colWidth / 2}
                  y="105"
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="bold"
                  fill={seat.status === 'checked_in' ? '#166534' : '#64748b'}
                  fontFamily="sans-serif"
                >
                  {seat.status === 'checked_in' ? '✓ ลงทะเบียนแล้ว' : 'ยืนยันที่นั่ง'}
                </text>
              </g>
            );
          })}
        </g>
      ))}

      {/* Footer / Legend */}
      <rect x="20" y="752" width="1110" height="20" rx="3" fill="#f8fafc" />
      <text x="36" y="766" fontSize="9.5" fill="#64748b" fontFamily="sans-serif">
        * สัญลักษณ์ดอกไม้ (🌸) หมายถึง มีการจัดเตรียมและวางกระเช้าดอกไม้ | สถานะอัปเดต ณ วันที่ {metadata.lastUpdated || '14/9/2025'}
      </text>
    </svg>
  );
};

/**
 * PAGE 3: ผังที่นั่งย่อย โซนสีเหลือง (แถว F, G, H)
 * รวม 18 ที่นั่ง (แถวละ 6 ที่นั่ง)
 */
export const ZoneYellowSvg: React.FC<ZoneSubPlanProps> = ({ metadata, seats }) => {
  const rowF = [6, 5, 4, 3, 2, 1].map(n => seats[`F${n}`] || { id: `F${n}`, row: 'F', number: n, status: 'confirmed', category: 'general' });
  const rowG = [6, 5, 4, 3, 2, 1].map(n => seats[`G${n}`] || { id: `G${n}`, row: 'G', number: n, status: 'confirmed', category: 'general' });
  const rowH = [6, 5, 4, 3, 2, 1].map(n => seats[`H${n}`] || { id: `H${n}`, row: 'H', number: n, status: 'confirmed', category: 'general' });

  const rows = [
    { label: 'แถว F', seats: rowF, y: 155, desc: 'ที่ปรึกษามหาวิทยาลัย / ผอ.สำนัก / คณบดี' },
    { label: 'แถว G', seats: rowG, y: 345, desc: 'ผู้แทนสมาคม / สถาบันการเงิน / องค์กรภาคเอกชน' },
    { label: 'แถว H', seats: rowH, y: 535, desc: 'ผู้แทนหน่วยงานภายนอก / พิพิธภัณฑ์ / สมาคมศิลปะ' },
  ];

  const colWidth = 166;
  const colGap = 8;
  const startX = 85;

  return (
    <svg
      id="zone-subplan-svg-yellow"
      viewBox="0 0 1150 780"
      width="1150"
      height="780"
      className="w-full h-auto bg-white select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background & Border */}
      <rect x="0" y="0" width="1150" height="780" fill="#ffffff" />
      <rect x="8" y="8" width="1134" height="764" rx="10" fill="none" stroke="#facc15" strokeWidth="1.5" />

      {/* Header Banner */}
      <rect x="20" y="20" width="1110" height="85" rx="8" fill="#fefce8" stroke="#fef08a" strokeWidth="1.5" />
      
      {/* Event Meta */}
      <text x="40" y="44" fontSize="13" fontWeight="600" fill="#854d0e" fontFamily="sans-serif">
        {metadata.eventTitle || 'แผนผังที่นั่งสำหรับแขกผู้มีเกียรติงานวันศิลป์ พีระศรี ในพิธีการ'} ({metadata.year || 'ประจำปี พ.ศ. 2569'})
      </text>

      {/* Zone Title */}
      <text x="40" y="72" fontSize="20" fontWeight="bold" fill="#713f12" fontFamily="sans-serif">
        ผังที่นั่งย่อย: โซนสีเหลือง (แถว F, G, H) — ผู้บริหารหน่วยงาน / แขกผู้มีเกียรติ / ผู้แทนองค์กร
      </text>
      
      <rect x="910" y="32" width="200" height="28" rx="14" fill="#fef08a" stroke="#eab308" strokeWidth="1.2" />
      <text x="1010" y="51" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#854d0e" fontFamily="sans-serif">
        รวม 18 ที่นั่ง (6 ที่นั่ง/แถว)
      </text>

      {/* Stage Direction Bar */}
      <rect x="20" y="115" width="1110" height="26" rx="4" fill="#fef9c3" />
      <text x="575" y="132" textAnchor="middle" fontSize="11.5" fontWeight="bold" fill="#854d0e" fontFamily="sans-serif">
        ▲ ทิศทางเวทีและอนุสาวรีย์ ศาสตราจารย์ศิลป์ พีระศรี | ลำดับที่นั่ง: หมายเลข 6 (ซ้ายสุด) ➔ หมายเลข 1 (ขวาสุด)
      </text>

      {/* Rows */}
      {rows.map((r) => (
        <g key={r.label} transform={`translate(0, ${r.y})`}>
          {/* Row Label Badge */}
          <rect x="18" y="0" width="54" height="155" rx="6" fill="#ca8a04" />
          <text 
            x="45" 
            y="75" 
            textAnchor="middle" 
            fontSize="16" 
            fontWeight="bold" 
            fill="#ffffff" 
            fontFamily="sans-serif"
          >
            {r.label.replace('แถว ', '')}
          </text>
          <text 
            x="45" 
            y="95" 
            textAnchor="middle" 
            fontSize="10" 
            fill="#fef08a" 
            fontFamily="sans-serif"
          >
            (6 ที่นั่ง)
          </text>

          {/* 6 Seats in this Row */}
          {r.seats.map((seat, idx) => {
            const x = startX + idx * (colWidth + colGap);
            const hasBasket = !!seat.hasFlowerBasket;

            return (
              <g key={seat.id} transform={`translate(${x}, 0)`}>
                {/* Seat Box */}
                <rect
                  x="0"
                  y="0"
                  width={colWidth}
                  height="155"
                  rx="8"
                  fill="#fefce8"
                  stroke={hasBasket ? '#e11d48' : '#fef08a'}
                  strokeWidth={hasBasket ? '2' : '1.5'}
                />

                {/* Seat Number Pill */}
                <rect 
                  x="8" 
                  y="8" 
                  width="40" 
                  height="24" 
                  rx="6" 
                  fill="#ca8a04" 
                />
                <text
                  x="28"
                  y="25"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="bold"
                  fill="#ffffff"
                  fontFamily="sans-serif"
                >
                  {seat.id}
                </text>

                {/* Set Group */}
                {seat.setGroup && (
                  <text
                    x={colWidth - 10}
                    y="24"
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#a16207"
                    fontFamily="sans-serif"
                  >
                    {seat.setGroup}
                  </text>
                )}

                {/* Position / Title */}
                <text
                  x="10"
                  y="54"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#713f12"
                  fontFamily="sans-serif"
                >
                  {seat.position ? (seat.position.length > 20 ? seat.position.slice(0, 19) + '…' : seat.position) : 'ที่นั่งสำรอง'}
                </text>

                {/* Guest Name */}
                <text
                  x="10"
                  y="82"
                  fontSize="10.5"
                  fontWeight="600"
                  fill="#1e293b"
                  fontFamily="sans-serif"
                >
                  {seat.guestName ? (seat.guestName.length > 20 ? seat.guestName.slice(0, 19) + '…' : seat.guestName) : '-'}
                </text>

                {/* Organization */}
                <text
                  x="10"
                  y="108"
                  fontSize="9.5"
                  fill="#64748b"
                  fontFamily="sans-serif"
                >
                  {seat.organization ? (seat.organization.length > 22 ? seat.organization.slice(0, 21) + '…' : seat.organization) : ''}
                </text>

                {/* Status Indicator */}
                <rect 
                  x="8" 
                  y="126" 
                  width={colWidth - 16} 
                  height="20" 
                  rx="4" 
                  fill={seat.status === 'checked_in' ? '#dcfce7' : '#fef9c3'} 
                />
                <text
                  x={colWidth / 2}
                  y="140"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="bold"
                  fill={seat.status === 'checked_in' ? '#166534' : '#854d0e'}
                  fontFamily="sans-serif"
                >
                  {seat.status === 'checked_in' ? '✓ ลงทะเบียนแล้ว' : 'ที่นั่งยืนยัน'}
                </text>
              </g>
            );
          })}
        </g>
      ))}

      {/* Footer Note */}
      <rect x="20" y="738" width="1110" height="26" rx="4" fill="#f8fafc" />
      <text x="40" y="755" fontSize="10" fill="#64748b" fontFamily="sans-serif">
        * แถว F, G, H ตั้งอยู่ฝั่งขวาของแถว A-E | จัดที่นั่ง ณ ลานศาสตราจารย์ศิลป์ พีระศรี
      </text>
    </svg>
  );
};

/**
 * PAGE 4: ผังที่นั่งย่อย โซนสีเขียวด้านขวา (แถว I)
 * รวม 8 ที่นั่ง (แนวตั้งด้านขวา)
 */
export const ZoneRightGreenSvg: React.FC<ZoneSubPlanProps> = ({ metadata, seats }) => {
  const rowI = [1, 2, 3, 4, 5, 6, 7, 8].map(n => seats[`I${n}`] || { id: `I${n}`, row: 'I', number: n, status: 'confirmed', category: 'executive' });

  const colWidth = 126;
  const colGap = 8;
  const startX = 45;

  return (
    <svg
      id="zone-subplan-svg-right-green"
      viewBox="0 0 1150 780"
      width="1150"
      height="780"
      className="w-full h-auto bg-white select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background & Border */}
      <rect x="0" y="0" width="1150" height="780" fill="#ffffff" />
      <rect x="8" y="8" width="1134" height="764" rx="10" fill="none" stroke="#a3e635" strokeWidth="1.5" />

      {/* Header Banner */}
      <rect x="20" y="24" width="1110" height="85" rx="8" fill="#f7fee7" stroke="#d9f99d" strokeWidth="1.5" />
      
      {/* Event Meta */}
      <text x="40" y="48" fontSize="13" fontWeight="600" fill="#4d7c0f" fontFamily="sans-serif">
        {metadata.eventTitle || 'แผนผังที่นั่งสำหรับแขกผู้มีเกียรติงานวันศิลป์ พีระศรี ในพิธีการ'} ({metadata.year || 'ประจำปี พ.ศ. 2569'})
      </text>

      {/* Zone Title */}
      <text x="40" y="78" fontSize="20" fontWeight="bold" fill="#365314" fontFamily="sans-serif">
        ผังที่นั่งย่อย: โซนสีเขียวด้านขวา (แถว I) — คณะกรรมการพิจารณารางวัล / ผู้ทรงคุณวุฒิผู้มอบรางวัล
      </text>
      
      <rect x="910" y="36" width="200" height="28" rx="14" fill="#d9f99d" stroke="#65a30d" strokeWidth="1.2" />
      <text x="1010" y="55" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#3f6212" fontFamily="sans-serif">
        รวม 8 ที่นั่ง (I1 - I8)
      </text>

      {/* Stage Context Indicator */}
      <rect x="20" y="125" width="1110" height="36" rx="6" fill="#ecfccb" />
      <text x="575" y="148" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#3f6212" fontFamily="sans-serif">
        ◄ อยู่ติดกำแพงด้านขวาของลานพิธีการ (แนวตั้ง) | เรียงลำดับจาก I1 (ด้านบน) ลงมาถึง I8 (ด้านล่าง)
      </text>

      {/* 8 Seats Grid Layout */}
      <g transform="translate(0, 190)">
        {rowI.map((seat, idx) => {
          const x = startX + idx * (colWidth + colGap);

          return (
            <g key={seat.id} transform={`translate(${x}, 0)`}>
              {/* Seat Box */}
              <rect
                x="0"
                y="0"
                width={colWidth}
                height="450"
                rx="8"
                fill="#f7fee7"
                stroke="#bef264"
                strokeWidth="2"
              />

              {/* Seat Top Badge */}
              <rect x="10" y="14" width={colWidth - 20} height="36" rx="6" fill="#4d7c0f" />
              <text
                x={colWidth / 2}
                y="38"
                textAnchor="middle"
                fontSize="18"
                fontWeight="bold"
                fill="#ffffff"
                fontFamily="sans-serif"
              >
                {seat.id}
              </text>

              {/* Vertical Order Label */}
              <rect x="20" y="60" width={colWidth - 40} height="20" rx="10" fill="#d9f99d" />
              <text
                x={colWidth / 2}
                y="74"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#365314"
                fontFamily="sans-serif"
              >
                ลำดับที่ {seat.number}
              </text>

              {/* Seat Position */}
              <text
                x="14"
                y="120"
                fontSize="12"
                fontWeight="bold"
                fill="#365314"
                fontFamily="sans-serif"
              >
                ตำแหน่ง:
              </text>
              <text
                x="14"
                y="142"
                fontSize="11"
                fontWeight="bold"
                fill="#1f2937"
                fontFamily="sans-serif"
              >
                {seat.position ? (seat.position.length > 15 ? seat.position.slice(0, 14) + '…' : seat.position) : 'ที่นั่งเกียรติยศ'}
              </text>

              {/* Guest Name */}
              <text
                x="14"
                y="190"
                fontSize="12"
                fontWeight="bold"
                fill="#365314"
                fontFamily="sans-serif"
              >
                รายนาม:
              </text>
              <text
                x="14"
                y="212"
                fontSize="11"
                fontWeight="600"
                fill="#0f172a"
                fontFamily="sans-serif"
              >
                {seat.guestName ? (seat.guestName.length > 15 ? seat.guestName.slice(0, 14) + '…' : seat.guestName) : '-'}
              </text>

              {/* Organization */}
              <text
                x="14"
                y="260"
                fontSize="11"
                fontWeight="bold"
                fill="#4b5563"
                fontFamily="sans-serif"
              >
                สังกัด:
              </text>
              <text
                x="14"
                y="282"
                fontSize="10"
                fill="#64748b"
                fontFamily="sans-serif"
              >
                {seat.organization ? (seat.organization.length > 16 ? seat.organization.slice(0, 15) + '…' : seat.organization) : ''}
              </text>

              {/* Status Badge */}
              <rect
                x="10"
                y="390"
                width={colWidth - 20}
                height="32"
                rx="6"
                fill={seat.status === 'checked_in' ? '#dcfce7' : '#ecfccb'}
                stroke={seat.status === 'checked_in' ? '#22c55e' : '#a3e635'}
                strokeWidth="1"
              />
              <text
                x={colWidth / 2}
                y="411"
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill={seat.status === 'checked_in' ? '#15803d' : '#4d7c0f'}
                fontFamily="sans-serif"
              >
                {seat.status === 'checked_in' ? '✓ ลงทะเบียนแล้ว' : 'ยืนยันที่นั่ง'}
              </text>
            </g>
          );
        })}
      </g>

      {/* Footer */}
      <rect x="20" y="736" width="1110" height="26" rx="4" fill="#f8fafc" />
      <text x="40" y="753" fontSize="10.5" fill="#64748b" fontFamily="sans-serif">
        * แถว I ตั้งอยู่แนวตั้งทางขวาของลานพิธีการ ถัดไปทางขวาคือแถว J และ K (ผู้เข้ารับรางวัล)
      </text>
    </svg>
  );
};

/**
 * PAGE 5: ผังที่นั่งย่อย โซนสีส้มอ่อน/พีชด้านขวา (แถว J & K)
 * ผู้เข้ารับรางวัล ลำดับ 1 ถึง 17 (รวม 17 ที่นั่ง)
 */
export const ZoneRightPeachSvg: React.FC<ZoneSubPlanProps> = ({ metadata, seats }) => {
  const rowJ = [1, 2, 3, 4, 5, 6, 7, 8].map(n => seats[`J${n}`] || { id: `J${n}`, row: 'J', number: n, status: 'confirmed', category: 'awardee' });
  const rowK = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => seats[`K${n}`] || { id: `K${n}`, row: 'K', number: n, status: 'confirmed', category: 'awardee' });

  return (
    <svg
      id="zone-subplan-svg-right-peach"
      viewBox="0 0 1150 780"
      width="1150"
      height="780"
      className="w-full h-auto bg-white select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background & Border */}
      <rect x="0" y="0" width="1150" height="780" fill="#ffffff" />
      <rect x="8" y="8" width="1134" height="764" rx="10" fill="none" stroke="#fb923c" strokeWidth="1.5" />

      {/* Header Banner */}
      <rect x="20" y="20" width="1110" height="85" rx="8" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
      
      {/* Event Meta */}
      <text x="40" y="44" fontSize="13" fontWeight="600" fill="#c2410c" fontFamily="sans-serif">
        {metadata.eventTitle || 'แผนผังที่นั่งสำหรับแขกผู้มีเกียรติงานวันศิลป์ พีระศรี ในพิธีการ'} ({metadata.year || 'ประจำปี พ.ศ. 2569'})
      </text>

      {/* Zone Title */}
      <text x="40" y="72" fontSize="20" fontWeight="bold" fill="#7c2d12" fontFamily="sans-serif">
        ผังที่นั่งย่อย: โซนสีส้มอ่อน/พีชด้านขวา (แถว J & K) — ผู้เข้ารับรางวัล ลำดับ 1 ถึง 17
      </text>
      
      <rect x="910" y="32" width="200" height="28" rx="14" fill="#ffedd5" stroke="#ea580c" strokeWidth="1.2" />
      <text x="1010" y="51" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#c2410c" fontFamily="sans-serif">
        รวม 17 ที่นั่ง (J1-J8, K1-K9)
      </text>

      {/* Flow Indicator */}
      <rect x="20" y="115" width="1110" height="26" rx="4" fill="#ffedd5" />
      <text x="575" y="132" textAnchor="middle" fontSize="11.5" fontWeight="bold" fill="#c2410c" fontFamily="sans-serif">
        ▲ ทิศทางเดินเข้าสู่ลานพิธีการ: เดินผ่านประตูขวา เข้าสู่จุดรับรางวัลหน้าอนุสาวรีย์ ศาสตราจารย์ศิลป์ พีระศรี
      </text>

      {/* Section 1: Row J (8 seats) */}
      <g transform="translate(0, 155)">
        <rect x="20" y="0" width="1110" height="26" rx="4" fill="#fed7aa" />
        <text x="35" y="18" fontSize="13" fontWeight="bold" fill="#7c2d12" fontFamily="sans-serif">
          แถว J: ผู้เข้ารับรางวัล ลำดับ 1 ถึง 8 (8 ที่นั่ง)
        </text>

        {rowJ.map((seat, idx) => {
          const colW = 132;
          const x = 20 + idx * (colW + 7);

          return (
            <g key={seat.id} transform={`translate(${x}, 34)`}>
              <rect
                x="0"
                y="0"
                width={colW}
                height="210"
                rx="6"
                fill="#fff7ed"
                stroke="#fdba74"
                strokeWidth="1.5"
              />
              {/* Badge */}
              <rect x="6" y="6" width="46" height="24" rx="4" fill="#ea580c" />
              <text x="29" y="23" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ffffff" fontFamily="sans-serif">
                {seat.id}
              </text>
              <rect x="58" y="6" width="68" height="24" rx="4" fill="#fed7aa" />
              <text x="92" y="22" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#9a3412" fontFamily="sans-serif">
                รางวัล {seat.label || seat.number}
              </text>

              {/* Guest Name */}
              <text x="10" y="60" fontSize="10" fill="#9a3412" fontWeight="bold" fontFamily="sans-serif">
                ชื่อผู้เข้ารับรางวัล:
              </text>
              <text x="10" y="80" fontSize="12" fill="#1e293b" fontWeight="bold" fontFamily="sans-serif">
                {seat.guestName || '-'}
              </text>

              {/* Position */}
              <text x="10" y="110" fontSize="9.5" fill="#64748b" fontFamily="sans-serif">
                {seat.position}
              </text>

              {/* Status */}
              <rect 
                x="8" 
                y="172" 
                width={colW - 16} 
                height="26" 
                rx="4" 
                fill={seat.status === 'checked_in' ? '#dcfce7' : '#ffedd5'} 
              />
              <text
                x={colW / 2}
                y="189"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={seat.status === 'checked_in' ? '#166534' : '#c2410c'}
                fontFamily="sans-serif"
              >
                {seat.status === 'checked_in' ? '✓ รายงานตัวแล้ว' : 'รอรายงานตัว'}
              </text>
            </g>
          );
        })}
      </g>

      {/* Section 2: Row K (9 seats) */}
      <g transform="translate(0, 440)">
        <rect x="20" y="0" width="1110" height="26" rx="4" fill="#fed7aa" />
        <text x="35" y="18" fontSize="13" fontWeight="bold" fill="#7c2d12" fontFamily="sans-serif">
          แถว K: ผู้เข้ารับรางวัล ลำดับ 9 ถึง 17 (9 ที่นั่ง)
        </text>

        {rowK.map((seat, idx) => {
          const colW = 117;
          const x = 20 + idx * (colW + 6.5);

          return (
            <g key={seat.id} transform={`translate(${x}, 34)`}>
              <rect
                x="0"
                y="0"
                width={colW}
                height="210"
                rx="6"
                fill="#fff7ed"
                stroke="#fdba74"
                strokeWidth="1.5"
              />
              {/* Badge */}
              <rect x="6" y="6" width="46" height="24" rx="4" fill="#c2410c" />
              <text x="29" y="23" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ffffff" fontFamily="sans-serif">
                {seat.id}
              </text>
              <rect x="56" y="6" width="55" height="24" rx="4" fill="#fed7aa" />
              <text x="83" y="22" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#9a3412" fontFamily="sans-serif">
                ลำดับ {seat.label || seat.number}
              </text>

              {/* Guest Name */}
              <text x="8" y="60" fontSize="9.5" fill="#9a3412" fontWeight="bold" fontFamily="sans-serif">
                ชื่อผู้เข้ารับรางวัล:
              </text>
              <text x="8" y="80" fontSize="11" fill="#1e293b" fontWeight="bold" fontFamily="sans-serif">
                {seat.guestName || '-'}
              </text>

              {/* Position */}
              <text x="8" y="110" fontSize="9" fill="#64748b" fontFamily="sans-serif">
                {seat.position}
              </text>

              {/* Status */}
              <rect 
                x="6" 
                y="172" 
                width={colW - 12} 
                height="26" 
                rx="4" 
                fill={seat.status === 'checked_in' ? '#dcfce7' : '#ffedd5'} 
              />
              <text
                x={colW / 2}
                y="189"
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="bold"
                fill={seat.status === 'checked_in' ? '#166534' : '#c2410c'}
                fontFamily="sans-serif"
              >
                {seat.status === 'checked_in' ? '✓ รายงานตัวแล้ว' : 'รอรายงานตัว'}
              </text>
            </g>
          );
        })}
      </g>

      {/* Footer */}
      <rect x="20" y="736" width="1110" height="26" rx="4" fill="#f8fafc" />
      <text x="40" y="753" fontSize="10" fill="#64748b" fontFamily="sans-serif">
        * ลำดับการเข้ารับรางวัลเรียงจาก 1 ถึง 17 ตามลำดับในพิธีการวันศิลป์ พีระศรี
      </text>
    </svg>
  );
};

// Aliases for compatibility
export const ZoneGreenSvg = ZonePinkSvg;
export const ZoneBlueSvg = ZoneYellowSvg;
export const ZoneRightBlueSvg = ZoneRightGreenSvg;
export const ZoneRightYellowSvg = ZoneRightPeachSvg;
