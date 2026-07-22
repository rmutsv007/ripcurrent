/**
 * layers.js — รายการชั้นข้อมูล (Layer) สำหรับระบบปศุสัตว์
 * แต่ละ layer มี:
 *   id: ค่าเฉพาะสำหรับอ้างอิงใน React (ใช้เป็น key)
 *   name: ชื่อชั้นข้อมูล ตรงกับชื่อ layer ใน GeoServer (LiveStock:ชื่อ)
 * ใช้ใน: Sidebar (เลือกชั้นข้อมูล), DashboardTable (แสดงไอคอน), Legend (คำอธิบายสัญลักษณ์)
 */

const layers = [
  { id: 'chicken', name: 'ไก่' },           // ไก่เนื้อ
  { id: 'egg_chicken', name: 'ไก่ไข่' },    // ไก่ไข่
  { id: 'chicken_breed', name: 'ไก่พันธุ์' }, // ไก่พันธุ์
  { id: 'breeder', name: 'เป็ดพันธุ์' },     // เป็ดพันธุ์
  { id: 'cow', name: 'โคเนื้อ' },           // โคเนื้อ
  { id: 'duck', name: 'โคนม' },             // โคนม
  { id: 'sook', name: 'สุกร' },             // สุกร (หมู)
  { id: 'kae_nuea', name: 'แกะเนื้อ' },     // แกะเนื้อ
  { id: 'pae_nuea', name: 'แพะเนื้อ' },     // แพะเนื้อ
  { id: 'factory', name: 'ผึ้งชันโรง' },     // ผึ้งชันโรง
  { id: 'egg_station', name: 'สถานที่ฟักไข่' }, // สถานที่ฟักไข่
  { id: 'pangchang', name: 'ปางช้าง' },      // ปางช้าง
  { id: 'waterway', name: 'WaterWay', label: 'เส้นลำน้ำ', kind: 'line' }, // ทางน้ำ (line layer)
];

export default layers; // ส่งออกรายการ layers
