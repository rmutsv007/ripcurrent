/**
 * Topbar.js — คอมโพเนนต์แถบเมนูด้านบน (Top Navigation Bar)
 * แสดงโลโก้, ชื่อระบบ, และช่องค้นหาชื่อฟาร์ม
 * หมายเหตุ: อาจไม่ได้ใช้งานหลักในปัจจุบัน (เป็น legacy component)
 */

import React from 'react';
import './Topbar.css'; // สไตล์สำหรับ Topbar

/**
 * Topbar — คอมโพเนนต์แถบด้านบน
 * @param {string} searchValue - ข้อความค้นหาปัจจุบัน
 * @param {Function} onSearchChange - callback เมื่อพิมพ์ข้อความค้นหา
 * @param {Function} onSearchSubmit - callback เมื่อกด submit ค้นหา
 */
const Topbar = ({ searchValue, onSearchChange, onSearchSubmit }) => {
  return (
    /* คอนเทนเนอร์หลัก — จัดเรียงแนวนอน, กระจายพื้นที่ */
    <div className="topbar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>

      {/* ส่วนซ้าย: โลโก้ + ชื่อระบบ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {/* โลโก้แอปพลิเคชัน */}
        <img src="/logo192.png" alt="logo" style={{ width: 40, height: 40, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '2px solid rgba(255,255,255,0.2)' }} />
        {/* ชื่อระบบ */}
        <span className="topbar-title">ระบบแผนที่ฟาร์มปศุสัตว์</span>
      </div>

      {/* ส่วนขวา: แบบฟอร์มค้นหา */}
      <form
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',       // พื้นหลังขาว
          borderRadius: 28,         // มุมมน pill shape
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // เงาอ่อน
          padding: '6px 20px',
          flex: '1',                // ยืดเต็มพื้นที่ที่เหลือ
          maxWidth: 500,            // ความกว้างสูงสุด
          minWidth: 300,            // ความกว้างต่ำสุด
        }}
        onSubmit={e => { e.preventDefault(); onSearchSubmit && onSearchSubmit(); }}
        /* กัน default submit — เรียก callback แทน */
      >
        {/* ไอคอนแว่นขยาย */}
        <span style={{ fontSize: 18, marginRight: 10, color: '#9ca3af' }}>🔍</span>

        {/* ช่องใส่คำค้นหา */}
        <input
          type="text"
          placeholder="ค้นหาชื่อฟาร์ม..."
          value={searchValue}
          onChange={e => onSearchChange && onSearchChange(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: 15,
            background: 'transparent',
            width: '100%',
            padding: '10px 8px',
            color: '#1f2937',       // สีตัวอักษรเข้ม
          }}
        />

        {/* ปุ่มค้นหา — gradient สีน้ำเงิน, มี hover effect */}
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: 22,       // มุมมน
            color: '#fff',          // ตัวอักษรขาว
            fontWeight: 600,
            fontSize: 14,
            padding: '8px 20px',
            marginLeft: 12,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.25s ease', // animation นุ่มนวล
          }}
          /* เอฟเฟกต์ hover: ยกขึ้น + เงาเข้มขึ้น */
          onMouseOver={(e) => {
            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          /* เอฟเฟกต์ออก: กลับสู่ปกติ */
          onMouseOut={(e) => {
            e.target.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.3)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ค้นหา
        </button>
      </form>
    </div>
  );
};

export default Topbar; // ส่งออก Topbar component
