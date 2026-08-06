/**
 * layers.js — รายการชั้นข้อมูล (Layer) สำหรับระบบปศุสัตว์
 * แต่ละ layer มี:
 *   id: ค่าเฉพาะสำหรับอ้างอิงใน React (ใช้เป็น key)
 *   name: ชื่อชั้นข้อมูล ตรงกับชื่อ layer ใน GeoServer (LiveStock:ชื่อ)
 * ใช้ใน: Sidebar (เลือกชั้นข้อมูล), DashboardTable (แสดงไอคอน), Legend (คำอธิบายสัญลักษณ์)
 */

const layers = [
  {
    category: 'ข้อมูลพื้นฐาน',
    items: [
      { id: 'ขอบเขตชายหาด', name: 'ขอบเขตชายหาด', label: 'ขอบเขตชายหาด', kind: 'line', icon: '/assets/beach.png', iconSize: 44 },
      { id: 'Contour', name: 'Contour', label: 'เส้นชั้นความสูง', kind: 'line', icon: '/assets/contour.png', iconSize: 40 },
    ]
  },
  {
    category: 'คุณภาพน้ำ',
    items: [
      // อย่าลืมสร้าง Layer เหล่านี้ใน GeoServer ด้วยนะครับ
      { id: '01WaterQuality_26052026', name: '01WaterQuality_26052026', label: 'วันที่ 26 พ.ค. 2026', kind: 'point' },
      { id: '02WaterQuality_11062026', name: '02WaterQuality_11062026', label: 'วันที่ 11 มิ.ย. 2026', kind: 'point' },
      { id: '03WaterQuality_27062026', name: '03WaterQuality_27062026', label: 'วันที่ 27 มิ.ย. 2026', kind: 'point' },
      { id: '04WaterQuality_12072026', name: '04WaterQuality_12072026', label: 'วันที่ 12 ก.ค. 2026', kind: 'point' },
      { id: '05WaterQuality_23072026', name: '05WaterQuality_23072026', label: 'วันที่ 23 ก.ค. 2026', kind: 'point' },
    ]
  }
];

export default layers; // ส่งออกรายการ layers
