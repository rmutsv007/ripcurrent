/**
 * DashboardTable.js — คอมโพเนนต์ตารางข้อมูลคุณภาพน้ำ
 * แสดงรายการข้อมูลในรูปแบบตาราง พร้อมฟังก์ชันค้นหาและแบ่งหน้า (pagination)
 */

import React from 'react';

// --- ฟังก์ชันช่วยเหลือสำหรับแปลงรูปแบบ วันที่ ---
const formatThaiDate = (rawDate) => {
  if (!rawDate) return '-';
  const strDate = String(rawDate);
  const match = strDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const shortYear = year % 100;
    return `${day} ${thaiMonths[month]} ${shortYear}`;
  }
  return strDate;
};

// --- ฟังก์ชันช่วยเหลือสำหรับแปลงรูปแบบ เวลา ---
const formatTime = (rawTime) => {
  if (!rawTime) return '-';
  const strTime = String(rawTime);
  // ดึงมาแค่ ชั่วโมง:นาที (ตัดวินาที และตัว Z ทิ้ง)
  const match = strTime.match(/(\d{2}:\d{2})/);
  if (match) {
    return `${match[1]} น.`;
  }
  return strTime.replace(/Z/g, ''); 
};

/**
 * DashboardTable — ตารางข้อมูลหลัก
 * @param {Array} points - อาร์เรย์ของ GeoJSON features (จุดข้อมูล)
 * @param {Function} onSelectFeature - callback เมื่อคลิกเลือกแถว (ส่ง feature)
 */
const DashboardTable = ({ points, onSelectFeature }) => {
  // === State ===
  const [rowsPerPage, setRowsPerPage] = React.useState(10);   // จำนวนแถวต่อหน้า
  const [page, setPage] = React.useState(0);                   // หน้าปัจจุบัน (เริ่มจาก 0)
  const [searchValue, setSearchValue] = React.useState("");     // คำค้นหา

  // === กรองข้อมูลตามคำค้นหา (ชื่อสถานที่) ===
  const filteredPoints = !searchValue
    ? points 
    : points.filter(f =>
        f.properties?.location?.toLowerCase().includes(searchValue.toLowerCase())
      );

  // === คำนวณ pagination ===
  const totalRows = filteredPoints.length;                           
  const startIdx = page * rowsPerPage;                               
  const endIdx = Math.min(startIdx + rowsPerPage, totalRows);       
  const pageRows = filteredPoints.slice(startIdx, endIdx);           

  const handleRowsPerPageChange = e => {
    setRowsPerPage(Number(e.target.value));
    setPage(0); 
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (endIdx < totalRows) setPage(page + 1);
  };

  return (
    <div className="dashboard-table-container" style={{ 
      background: 'var(--c-bg-primary)',         
      border: '1px solid var(--c-border)',        
      borderRadius: 16,                           
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'Sarabun-Medium, sans-serif',   
      overflow: 'hidden',
      boxShadow: 'var(--c-shadow-lg)',            
    }}>
      <style>{`
        @font-face {
          font-family: 'Sarabun-Medium';
          src: url('/fonts/Sarabun-Medium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
        }
        .dashboard-table-container, .dashboard-table-container table, .dashboard-table-container th, .dashboard-table-container td {
          font-family: 'Sarabun-Medium', sans-serif !important;
        }
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
        .dashboard-table-row {
          cursor: pointer;
          transition: background 0.18s ease;
        }
        .dashboard-table-row:hover {
          background: var(--c-bg-hover) !important;
        }
        .dashboard-table-container select option {
          background: var(--c-bg-secondary);
          color: var(--c-text);
        }
      `}</style>

      {/* === ส่วนหัวตาราง === */}
      <div style={{
        height: 60, minHeight: 60, fontWeight: 700, fontSize: 16, color: 'var(--c-text)',
        padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between',
        borderBottom: '1px solid var(--c-border)', background: 'linear-gradient(135deg, var(--c-bg-secondary) 0%, var(--c-bg-primary) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="3" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
            <line x1="1" y1="7" x2="19" y2="7" stroke="#3b82f6" strokeWidth="1.2"/>
            <line x1="7" y1="7" x2="7" y2="19" stroke="#3b82f6" strokeWidth="1.2"/>
          </svg>
          <span style={{ letterSpacing: 0.3 }}>ข้อมูลชายหาดชลาทัศน์</span>
          <span style={{
            background: 'var(--c-accent-bg)', color: 'var(--c-accent-light)', fontSize: 11,
            fontWeight: 600, padding: '2px 8px', borderRadius: 6, marginLeft: 4,
          }}>{totalRows} รายการ</span>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="#64748b" strokeWidth="1.5" fill="none"/>
            <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="ค้นหาชื่อสถานที่..."
            value={searchValue}
            onChange={e => { setSearchValue(e.target.value); setPage(0); }}
            style={{
              fontSize: 13, padding: '7px 12px 7px 32px', borderRadius: 8, border: '1px solid var(--c-border-input)',
              background: 'var(--c-bg-input)', color: 'var(--c-text)', outline: 'none', fontFamily: 'Sarabun-Medium',
              minWidth: 180, transition: 'border-color 0.2s, background 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--c-accent-border)'; e.target.style.background = 'var(--c-bg-input-focus)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--c-border-input)'; e.target.style.background = 'var(--c-bg-input)'; }}
          />
        </div>
      </div>

      {/* === พื้นที่เนื้อหาตาราง === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="table-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ border: 'none', width: '100%', borderCollapse: 'collapse', background: 'transparent', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ height: 44, fontSize: 12, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: 120, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>วันที่เก็บตัวอย่าง</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 80, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>เวลา</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 150, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>บริเวณพื้นที่เก็บตัวอย่าง</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 100, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>สีของน้ำ</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 80, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>กลิ่น</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 150, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>ตะกอน</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 160, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>ค่าความเป็นกรด-ด่าง (pH)</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 160, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>คราบน้ำมัน</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 160, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>E.Coli (โคโลนีสีฟ้า) CUF/g</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 160, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>Coliform (โคโลนีสีม่วง) CUF/g</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 160, position: 'sticky', top: 0, zIndex: 2, background: 'var(--c-bg-secondary)', borderBottom: '1px solid var(--c-border)', fontWeight: 600 }}>สภาพอากาศ</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)', fontSize: 14 }}>
                    {searchValue ? 'ไม่พบข้อมูลที่ค้นหา' : 'เลือกชั้นข้อมูลเพื่อแสดงรายการ'}
                  </td>
                </tr>
              ) : pageRows.map((f, idx) => (
                <tr
                  key={startIdx + idx}
                  className="dashboard-table-row"
                  onClick={() => onSelectFeature?.(f)}
                  style={{ background: 'transparent', height: 52, borderBottom: '1px solid var(--c-border-subtle)' }}
                >
                  {/* คอลัมน์: วันที่เก็บตัวอย่าง (แปลงฟอร์แมตแล้ว) */}
                  <td style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--c-text)', fontSize: 13, fontWeight: 500 }}>
                    {formatThaiDate(f.properties?.date)}
                  </td>
                  {/* คอลัมน์: เวลา (แปลงฟอร์แมตแล้ว ไม่ดึงรูปภาพปศุสัตว์) */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>
                    {formatTime(f.properties?.time)}
                  </td>
                  {/* คอลัมน์อื่นๆ */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.location || '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.สีของน้ำ || '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.กลิ่น || '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{
                      background: 'var(--c-accent-badge-bg)', color: 'var(--c-accent-text)',
                      padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                    }}>{f.properties?.ตะกอน || '-'}</span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.['ค่าความเป็นกรด-ด่าง'] || '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.['คราบน้ำมัน'] || '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.['E.Coli'] ?? f.properties?.['E.coli'] ?? f.properties?.['ecoli'] ?? '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.['Coliform'] ?? f.properties?.['coliform'] ?? '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>{f.properties?.['หมายเหตุ'] || '-'}</td>
                </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* === แถบ Pagination === */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--c-bg-secondary)', borderTop: '1px solid var(--c-border)',
          borderRadius: '0 0 16px 16px', padding: '10px 20px', fontSize: 13, color: 'var(--c-text-secondary)', minHeight: 48,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>แสดง</span>
            <select value={rowsPerPage} onChange={handleRowsPerPageChange} style={{
              fontSize: 13, borderRadius: 6, padding: '4px 8px', border: '1px solid var(--c-border-input)',
              background: 'var(--c-bg-input)', color: 'var(--c-text)', outline: 'none', cursor: 'pointer',
            }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>รายการ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12 }}>{totalRows > 0 ? startIdx + 1 : 0}–{endIdx} จาก {totalRows}</span>
            <button onClick={handlePrevPage} disabled={page === 0} style={{
              background: page === 0 ? 'transparent' : 'var(--c-accent-badge-bg)',
              border: `1px solid ${page === 0 ? 'var(--c-border-subtle)' : 'var(--c-accent-border)'}`,
              color: page === 0 ? 'var(--c-text-muted)' : 'var(--c-accent-light)',
              borderRadius: 6, width: 32, height: 32, fontSize: 16, cursor: page === 0 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}>‹</button>
            <button onClick={handleNextPage} disabled={endIdx >= totalRows} style={{
              background: endIdx >= totalRows ? 'transparent' : 'var(--c-accent-badge-bg)',
              border: `1px solid ${endIdx >= totalRows ? 'var(--c-border-subtle)' : 'var(--c-accent-border)'}`,
              color: endIdx >= totalRows ? 'var(--c-text-muted)' : 'var(--c-accent-light)',
              borderRadius: 6, width: 32, height: 32, fontSize: 16, cursor: endIdx >= totalRows ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTable;