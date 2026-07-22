/**
 * LegendFloating.js — คอมโพเนนต์ Legend แบบลอย (floating)
 * แสดงปุ่ม "คำอธิบายสัญลักษณ์" ที่มุมล่างซ้ายของหน้าจอ
 * เมื่อคลิกจะขยายแสดงรายการสัญลักษณ์ทั้งหมด
 */

import React from 'react';
import Legend from './Legend'; // คอมโพเนนต์แสดงรายการสัญลักษณ์

/**
 * LegendFloating — คอมโพเนนต์ Legend ลอยตัว
 * @param {boolean} open - สถานะเปิด/ปิด
 * @param {Function} setOpen - callback เปลี่ยนสถานะเปิด/ปิด
 */
const LegendFloating = ({ open, setOpen }) => {
  return (
    // ตำแหน่ง: fixed มุมล่างซ้าย
    <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 2500, maxWidth: 320 }}>
      {/* เมื่อปิด: แสดงปุ่มเปิด */}
      {!open ? (
        /* ปุ่มเปิด Legend — มีไอคอน SVG + ข้อความ */
        <button
          onClick={() => setOpen(true)}
          style={{
            border: '1px solid var(--c-accent-border)',
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--c-bg-secondary) 0%, var(--c-bg-primary) 100%)',
            boxShadow: 'var(--c-shadow-card)',    // เงาการ์ด
            padding: '8px 18px',
            fontSize: 13,
            color: 'var(--c-text)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 100,
            transition: 'all 0.2s',
            fontFamily: 'Sarabun-Medium, sans-serif', // ฟอนต์ภาษาไทย
          }}
        >
          {/* ไอคอน SVG: กล่องตาราง legend */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="3" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
            <rect x="4" y="4" width="3" height="3" rx="1" fill="#60a5fa"/>
            <line x1="9" y1="5.5" x2="13" y2="5.5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round"/>
            <rect x="4" y="9" width="3" height="3" rx="1" fill="#60a5fa"/>
            <line x1="9" y1="10.5" x2="13" y2="10.5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          คำอธิบายสัญลักษณ์
        </button>
      ) : (
        /* เมื่อเปิด: แสดงพาแนล legend แบบเต็ม */
        <div style={{
          background: 'linear-gradient(135deg, var(--c-bg-secondary) 0%, var(--c-bg-primary) 100%)',
          borderRadius: 12,
          border: '1px solid var(--c-accent-border)',
          boxShadow: 'var(--c-shadow-card)',
          padding: '16px',
          minWidth: 220,
          maxWidth: 320,
          minHeight: 80,
          position: 'relative',
        }}>
          {/* หัวข้อ legend + ปุ่มปิด */}
          <div style={{
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 12,
            color: 'var(--c-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 10,
            borderBottom: '1px solid var(--c-border)', // เส้นแบ่ง
          }}>
            {/* ไอคอน + ข้อความหัวข้อ */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="14" height="14" rx="3" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
                <rect x="4" y="4" width="3" height="3" rx="1" fill="#60a5fa"/>
                <line x1="9" y1="5.5" x2="13" y2="5.5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round"/>
                <rect x="4" y="9" width="3" height="3" rx="1" fill="#60a5fa"/>
                <line x1="9" y1="10.5" x2="13" y2="10.5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              คำอธิบายสัญลักษณ์
            </span>
            {/* ปุ่มปิด (×) */}
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'var(--c-bg-icon)',
                border: '1px solid var(--c-border-input)',
                borderRadius: 6,
                width: 24,
                height: 24,
                fontSize: 14,
                color: 'var(--c-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                lineHeight: 1,
                transition: 'all 0.2s',
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
