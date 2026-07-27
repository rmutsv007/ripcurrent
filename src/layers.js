/**
 * layers.js — รายการชั้นข้อมูล (Layer) สำหรับระบบปศุสัตว์
 * แต่ละ layer มี:
 *   id: ค่าเฉพาะสำหรับอ้างอิงใน React (ใช้เป็น key)
 *   name: ชื่อชั้นข้อมูล ตรงกับชื่อ layer ใน GeoServer (LiveStock:ชื่อ)
 * ใช้ใน: Sidebar (เลือกชั้นข้อมูล), DashboardTable (แสดงไอคอน), Legend (คำอธิบายสัญลักษณ์)
 */

const layers = [

  { id: 'ขอบเขตชายหาด', name: 'ขอบเขตชายหาด', label: 'ขอบเขตชายหาด', kind: 'line' }, // ขอบเขตชายหาด (polygon layer)
  { id: 'Contour', name: 'Contour', label: 'เส้นชั้นความสูง', kind: 'line' }, // Contour (line layer)
  { id: 'WaterQuality', name: 'WaterQuality', label: 'คุณภาพน้ำ', kind: 'point' }, // ตารางบันทึกการเก็บตัวอย่างเพื่อการตรวจสอบคุณภาพน้ำ (point layer)
];

export default layers; // ส่งออกรายการ layers
