/**
 * LegendFloating.js — คอมโพเนนต์ Legend แบบลอย (floating)
 * แสดงปุ่ม "คำอธิบายสัญลักษณ์" ที่มุมล่างซ้ายของหน้าจอ
 * เมื่อคลิกจะขยายแสดงรายการสัญลักษณ์ทั้งหมด
 * สไตล์: วัสดุกึ่งโปร่งใส + blur แบบ macOS (ใช้ token จาก index.css)
 */

import React from 'react';
import Legend from './Legend'; // คอมโพเนนต์แสดงรายการสัญลักษณ์

// ไอคอนกล่องตาราง legend — สีตาม currentColor (ตั้งสีที่ตัวห่อ)
const LegendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--c-accent)', flexShrink: 0 }}>
    <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="4" y="4" width="3" height="3" rx="1" fill="currentColor" />
    <line x1="9" y1="5.5" x2="13" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <rect x="4" y="9" width="3" height="3" rx="1" fill="currentColor" />
    <line x1="9" y1="10.5" x2="13" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// สไตล์วัสดุกระจกที่ใช้ร่วมกันทั้งปุ่มและพาแนล
const glass = {
  background: 'var(--c-popup-start)',
  WebkitBackdropFilter: 'var(--blur-panel)',
  backdropFilter: 'var(--blur-panel)',
  border: '1px solid var(--c-border)',
  boxShadow: 'var(--c-shadow-lg)',
};

/**
 * LegendFloating — คอมโพเนนต์ Legend ลอยตัว
 * @param {boolean} open - สถานะเปิด/ปิด
 * @param {Function} setOpen - callback เปลี่ยนสถานะเปิด/ปิด
 */
const LegendFloating = ({ open, setOpen }) => {
  return (
    // ตำแหน่ง: fixed มุมล่างซ้าย
    <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 2500, maxWidth: 320 }}>
      {!open ? (
        /* เมื่อปิด: ปุ่มเปิด Legend */
        <button
          onClick={() => setOpen(true)}
          style={{
            ...glass,
            borderRadius: 10,
            padding: '7px 14px',
            fontSize: 13,
            color: 'var(--c-text)',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 100,
            transition: 'background 0.18s',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <LegendIcon />
          คำอธิบายสัญลักษณ์
        </button>
      ) : (
        /* เมื่อเปิด: พาแนล legend แบบเต็ม */
        <div style={{
          ...glass,
          borderRadius: 14,
          padding: '14px',
          minWidth: 220,
          maxWidth: 320,
          minHeight: 80,
          position: 'relative',
          fontFamily: 'var(--font-ui)',
        }}>
          {/* หัวข้อ legend + ปุ่มปิด */}
          <div style={{
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 10,
            color: 'var(--c-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 10,
            borderBottom: '1px solid var(--c-border)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LegendIcon />
              คำอธิบายสัญลักษณ์
            </span>
            {/* ปุ่มปิด (×) แบบวงกลมเทา */}
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'var(--c-bg-input)',
                border: 'none',
                borderRadius: '50%',
                width: 22,
                height: 22,
                fontSize: 15,
                color: 'var(--c-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                lineHeight: 1,
                transition: 'background 0.18s',
              }}
              aria-label="ปิด"
            >×</button>
          </div>
          {/* พื้นที่เลื่อนได้: แสดง Legend component */}
          <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
            <Legend />
          </div>
        </div>
      )}
    </div>
  );
};

export default LegendFloating; // ส่งออก LegendFloating component
