/**
 * index.js — จุดเริ่มต้นของแอปพลิเคชัน (Entry Point)
 * ไฟล์นี้ทำหน้าที่:
 * 1. สร้าง React root element
 * 2. Render คอมโพเนนต์ App ลงใน DOM
 * 3. เปิดใช้งาน StrictMode สำหรับตรวจจับปัญหาระหว่างพัฒนา
 */

import React from 'react';                      // React library
import ReactDOM from 'react-dom/client';        // React DOM สำหรับ render ลงหน้าเว็บ
import './index.css';                            // CSS หลัก (theme variables, global styles)
import App from './App';                         // คอมโพเนนต์หลักของแอป
import reportWebVitals from './reportWebVitals'; // เครื่องมือวัดประสิทธิภาพ

// สร้าง React root จาก element #root ใน index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render แอปพลิเคชัน
root.render(
  <React.StrictMode>  {/* StrictMode: ตรวจจับปัญหาใน development mode */}
    <App />            {/* คอมโพเนนต์หลัก */}
  </React.StrictMode>
);

// วัดประสิทธิภาพ (Web Vitals)
// สามารถส่งผลลัพธ์ไปยัง console หรือ analytics endpoint
// เช่น: reportWebVitals(console.log)
reportWebVitals();
