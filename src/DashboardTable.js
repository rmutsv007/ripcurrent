/**
 * DashboardTable.js — คอมโพเนนต์ตารางข้อมูลปศุสัตว์
 * แสดงรายการฟาร์มในรูปแบบตาราง พร้อมฟังก์ชันค้นหาและแบ่งหน้า (pagination)
 * คลิกแถวเพื่อเลือกดูรายละเอียดของแต่ละฟาร์ม
 */

import React from 'react';
import layers from './layers'; // รายการชั้นข้อมูลสำหรับแสดงไอคอนประเภท

/**
 * DashboardTable — ตารางข้อมูลหลัก
 * @param {Array} points - อาร์เรย์ของ GeoJSON features (จุดข้อมูลฟาร์ม)
 * @param {Function} onSelectFeature - callback เมื่อคลิกเลือกแถว (ส่ง feature)
 */
const DashboardTable = ({ points, onSelectFeature }) => {
  // === State ===
  const [rowsPerPage, setRowsPerPage] = React.useState(10);   // จำนวนแถวต่อหน้า
  const [page, setPage] = React.useState(0);                   // หน้าปัจจุบัน (เริ่มจาก 0)
  const [searchValue, setSearchValue] = React.useState("");     // คำค้นหา

  // === กรองข้อมูลตามคำค้นหา (ชื่อฟาร์ม) ===
  const filteredPoints = !searchValue
    ? points // ถ้าไม่มีคำค้นหา ใช้ทั้งหมด
    : points.filter(f =>
        f.properties?.Farm_name?.toLowerCase().includes(searchValue.toLowerCase())
      );

  // === คำนวณ pagination ===
  const totalRows = filteredPoints.length;                           // จำนวนแถวทั้งหมด
  const startIdx = page * rowsPerPage;                               // index เริ่มต้นของหน้านี้
  const endIdx = Math.min(startIdx + rowsPerPage, totalRows);       // index สิ้นสุดของหน้านี้
  const pageRows = filteredPoints.slice(startIdx, endIdx);           // ข้อมูลเฉพาะหน้านี้

  /**
   * handleRowsPerPageChange — เปลี่ยนจำนวนแถวต่อหน้า
   * รีเซ็ตกลับไปหน้าแรกเมื่อเปลี่ยน
   */
  const handleRowsPerPageChange = e => {
    setRowsPerPage(Number(e.target.value));
    setPage(0); // กลับหน้าแรก
  };

  /** handlePrevPage — ไปหน้าก่อนหน้า */
  const handlePrevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  /** handleNextPage — ไปหน้าถัดไป */
  const handleNextPage = () => {
    if (endIdx < totalRows) setPage(page + 1);
  };

  return (
    // === คอนเทนเนอร์หลักของตาราง ===
    <div className="dashboard-table-container" style={{ 
      background: 'var(--c-bg-primary)',         // พื้นหลังหลัก
      border: '1px solid var(--c-border)',        // ขอบ
      borderRadius: 16,                           // มุมโค้ง
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'Sarabun-Medium, sans-serif',   // ฟอนต์ภาษาไทย
      overflow: 'hidden',
      boxShadow: 'var(--c-shadow-lg)',            // เงาขนาดใหญ่
    }}>
      {/* === CSS แบบ inline สำหรับ scrollbar, hover, font ===  */}
      <style>{`
        /* โหลดฟอนต์ Sarabun */
        @font-face {
          font-family: 'Sarabun-Medium';
          src: url('/fonts/Sarabun-Medium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
        }
        /* บังคับใช้ฟอนต์ Sarabun ทั้งตาราง */
        .dashboard-table-container, .dashboard-table-container table, .dashboard-table-container th, .dashboard-table-container td {
          font-family: 'Sarabun-Medium', sans-serif !important;
        }
        /* ปรับแต่ง scrollbar */
        .table-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .table-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .table-scroll::-webkit-scrollbar-thumb {
          background: var(--c-scrollbar);
          border-radius: 4px;
        }
        .table-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--c-scrollbar-hover);
        }
        /* เอฟเฟกต์ hover ของแถว */
        .dashboard-table-row {
          cursor: pointer;
          transition: background 0.18s ease;
        }
        .dashboard-table-row:hover {
          background: var(--c-bg-hover) !important;
        }
        /* สีพื้นหลัง dropdown option */
        .dashboard-table-container select option {
          background: var(--c-bg-secondary);
          color: var(--c-text);
        }
      `}</style>

      {/* === ส่วนหัวตาราง: ชื่อ + จำนวนรายการ + ช่องค้นหา === */}
      <div style={{
        height: 60,
        minHeight: 60,
        fontWeight: 700,
        fontSize: 16,
        color: 'var(--c-text)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--c-border)',
        background: 'linear-gradient(135deg, var(--c-bg-secondary) 0%, var(--c-bg-primary) 100%)',
      }}>
        {/* ด้านซ้าย: ไอคอน + ชื่อ + badge จำนวน */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* ไอคอนตาราง SVG */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="3" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
            <line x1="1" y1="7" x2="19" y2="7" stroke="#3b82f6" strokeWidth="1.2"/>
            <line x1="7" y1="7" x2="7" y2="19" stroke="#3b82f6" strokeWidth="1.2"/>
          </svg>
          <span style={{ letterSpacing: 0.3 }}>ข้อมูลปศุสัตว์จังหวัดสงขลา</span>
          {/* Badge แสดงจำนวนรายการ */}
          <span style={{
            background: 'var(--c-accent-bg)',
            color: 'var(--c-accent-light)',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 6,
            marginLeft: 4,
          }}>{totalRows} รายการ</span>
        </div>
        {/* ด้านขวา: ช่องค้นหา */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {/* ไอคอนแว่นขยาย (ค้นหา) */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="#64748b" strokeWidth="1.5" fill="none"/>
            <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {/* Input ค้นหาชื่อฟาร์ม */}
          <input
            type="text"
            placeholder="ค้นหาชื่อฟาร์ม..."
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value);  // อัปเดตคำค้นหา
              setPage(0);                       // รีเซ็ตกลับหน้าแรก
            }}
            style={{
              fontSize: 13,
              padding: '7px 12px 7px 32px',    // เว้นที่สำหรับไอคอนแว่นขยาย
              borderRadius: 8,
              border: '1px solid var(--c-border-input)',
              background: 'var(--c-bg-input)',
              color: 'var(--c-text)',
              outline: 'none',
              fontFamily: 'Sarabun-Medium',
              minWidth: 180,
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onFocus={e => {                     // เมื่อ focus: เปลี่ยนขอบเป็นสี accent
              e.target.style.borderColor = 'var(--c-accent-border)';
              e.target.style.background = 'var(--c-bg-input-focus)';
            }}
            onBlur={e => {                      // เมื่อ blur: กลับสีเดิม
              e.target.style.borderColor = 'var(--c-border-input)';
              e.target.style.background = 'var(--c-bg-input)';
            }}
          />
        </div>
      </div>

      {/* === พื้นที่เนื้อหาตาราง (body) === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* พื้นที่เลื่อนได้ของตาราง */}
        <div className="table-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ border: 'none', width: '100%', borderCollapse: 'collapse', background: 'transparent', tableLayout: 'fixed' }}>
            {/* === หัวตาราง (sticky) === */}
            <thead>
              <tr style={{ height: 44, fontSize: 12, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: 250, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>ชื่อ</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 80, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>ประเภท</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 100, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>ตำบล</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 100, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>อำเภอ</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 80, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>จังหวัด</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 90, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>จำนวน</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 160, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>สังกัด</th>
              </tr>
            </thead>
            {/* === เนื้อหาตาราง === */}
            <tbody>
              {/* กรณีไม่มีข้อมูล — แสดงข้อความว่าง */}
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)', fontSize: 14 }}>
                    {searchValue ? 'ไม่พบข้อมูลที่ค้นหา' : 'เลือกชั้นข้อมูลเพื่อแสดงรายการ'}
                  </td>
                </tr>
              ) : pageRows.map((f, idx) => (
                // === แถวข้อมูลแต่ละฟาร์ม — คลิกเพื่อดูรายละเอียด ===
                <tr
                  key={startIdx + idx}
                  className="dashboard-table-row"
                  onClick={() => onSelectFeature?.(f)}  // เรียก callback เมื่อคลิกแถว
                  style={{ background: 'transparent', height: 52, borderBottom: '1px solid var(--c-border-subtle)' }}
                >
                  {/* คอลัมน์: ชื่อฟาร์ม */}
                  <td style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--c-text)', fontSize: 13, fontWeight: 500 }}>{f.properties?.Farm_name || '-'}</td>
                  {/* คอลัมน์: ประเภทสัตว์ (แสดงไอคอนจาก GeoServer) */}
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {(() => {
                      const typeName = (f.properties?.Type || '').trim();         // ดึงชื่อประเภทสัตว์
                      const layer = layers.find(l => (l.name || '').trim() === typeName); // ค้นหา layer ที่ตรงกัน
                      if (layer) {
                        // ถ้าพบ layer — แสดงไอคอนจาก GetLegendGraphic
                        return (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={`https://map.surveywms.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=LiveStock:${encodeURIComponent(layer.name)}&LEGEND_OPTIONS=${encodeURIComponent('dpi:2400;antialiasing:on;fontAntiAliasing:on;forceRule:True;symbolWidth:30;symbolHeight:30')}&TRANSPARENT=true`}
                              alt={typeName}
                              style={{ width: 24, height: 24, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                            />
                          </span>
                        );
                      }
                      // ถ้าไม่พบ layer — แสดงชื่อข้อความ
                      return <span style={{ color: 'var(--c-text-secondary)', fontSize: 13 }}>{typeName || '-'}</span>;
                    })()}
                  </td>
                  {/* คอลัมน์: ตำบล */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.Tambon || f.properties?.Tambon_T || '-'}</td>
                  {/* คอลัมน์: อำเภอ */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.Amphoe || f.properties?.District_T || '-'}</td>
                  {/* คอลัมน์: จังหวัด */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.Province || f.properties?.Province_T || '-'}</td>
                  {/* คอลัมน์: จำนวนสัตว์ (แสดงเป็น badge) */}
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{
                      background: 'var(--c-accent-badge-bg)',
                      color: 'var(--c-accent-text)',
                      padding: '2px 10px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                    }}>{f.properties?.Animal_qua || '-'}</span>
                  </td>
                  {/* คอลัมน์: สังกัด */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.Affiliatio || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* === แถบ Pagination (ด้านล่าง) === */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--c-bg-secondary)',
          borderTop: '1px solid var(--c-border)',
          borderRadius: '0 0 16px 16px',
          padding: '10px 20px',
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          minHeight: 48,
        }}>
          {/* ด้านซ้าย: เลือกจำนวนแถวต่อหน้า */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>แสดง</span>
            <select value={rowsPerPage} onChange={handleRowsPerPageChange} style={{
              fontSize: 13,
              borderRadius: 6,
              padding: '4px 8px',
              border: '1px solid var(--c-border-input)',
              background: 'var(--c-bg-input)',
              color: 'var(--c-text)',
              outline: 'none',
              cursor: 'pointer',
            }}>
              <option value={10}>10</option>   {/* 10 รายการต่อหน้า */}
              <option value={25}>25</option>   {/* 25 รายการต่อหน้า */}
              <option value={50}>50</option>   {/* 50 รายการต่อหน้า */}
              <option value={100}>100</option> {/* 100 รายการต่อหน้า */}
            </select>
            <span>รายการ</span>
          </div>
          {/* ด้านขวา: ข้อมูลหน้า + ปุ่มเปลี่ยนหน้า */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* แสดงช่วงรายการ เช่น "1–10 จาก 50" */}
            <span style={{ fontSize: 12 }}>{totalRows > 0 ? startIdx + 1 : 0}–{endIdx} จาก {totalRows}</span>
            {/* ปุ่มหน้าก่อนหน้า */}
            <button onClick={handlePrevPage} disabled={page === 0} style={{
              background: page === 0 ? 'transparent' : 'var(--c-accent-badge-bg)',
              border: `1px solid ${page === 0 ? 'var(--c-border-subtle)' : 'var(--c-accent-border)'}`,
              color: page === 0 ? 'var(--c-text-muted)' : 'var(--c-accent-light)',
              borderRadius: 6,
              width: 32,
              height: 32,
              fontSize: 16,
              cursor: page === 0 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}>‹</button>
            {/* ปุ่มหน้าถัดไป */}
            <button onClick={handleNextPage} disabled={endIdx >= totalRows} style={{
              background: endIdx >= totalRows ? 'transparent' : 'var(--c-accent-badge-bg)',
              border: `1px solid ${endIdx >= totalRows ? 'var(--c-border-subtle)' : 'var(--c-accent-border)'}`,
              color: endIdx >= totalRows ? 'var(--c-text-muted)' : 'var(--c-accent-light)',
              borderRadius: 6,
              width: 32,
              height: 32,
              fontSize: 16,
              cursor: endIdx >= totalRows ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTable; // ส่งออก DashboardTable component