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
      // เพิ่ม API คลื่นทะเลมาไว้ตรงนี้ (จะแสดงผลอยู่ใต้เส้นชั้นความสูง)
      { id: 'swan_station', name: 'swan_station', label: 'ความสูงและทิศทางของคลื่นทะเล', kind: 'point', icon: '/assets/wave.png', iconSize: 45 },
      { id: 'point_Lifeguard', name: 'point_Lifeguard', label: 'เจ้าหน้าที่ดูแลความปลอดภัยทางน้ำ', kind: 'point', icon: '/assets/lifebuoy.png', iconSize: 35 },
      { id: 'ทางลาด_csv8', name: 'ทางลาด_csv8', label: 'ทางลาด', kind: 'point', icon: '/assets/ramp.png', iconSize: 35 },
    ]
  },
  {
    category: 'คุณภาพน้ำ',
    items: [
      // อย่าลืมสร้าง Layer เหล่านี้ใน GeoServer ด้วยนะครับ
    { id: 'WaterQuality_13032026', name: 'WaterQuality_13032026', label: '13 มี.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_28032026', name: 'WaterQuality_28032026', label: '28 มี.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_12042026', name: 'WaterQuality_12042026', label: '12 เม.ย. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_27042026', name: 'WaterQuality_27042026', label: '27 เม.ย. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_11052026', name: 'WaterQuality_11052026', label: '11 พ.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_26052026', name: 'WaterQuality_26052026', label: '26 พ.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    //{ id: '01WaterQuality_26052026', name: '01WaterQuality_26052026', label: '26 พ.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_11062026', name: 'WaterQuality_11062026', label: '11 มิ.ย. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    //{ id: '02WaterQuality_11062026', name: '02WaterQuality_11062026', label: '11 มิ.ย. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_27062026', name: 'WaterQuality_27062026', label: '27 มิ.ย. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    //{ id: '03WaterQuality_27062026', name: '03WaterQuality_27062026', label: '27 มิ.ย. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_12072026', name: 'WaterQuality_12072026', label: '12 ก.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    //{ id: '04WaterQuality_12072026', name: '04WaterQuality_12072026', label: '12 ก.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    { id: 'WaterQuality_23072026', name: 'WaterQuality_23072026', label: '23 ก.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    //{ id: '05WaterQuality_23072026', name: '05WaterQuality_23072026', label: '23 ก.ค. 2026', kind: 'point', icon: '/assets/quality.png', iconSize: 30 },
    ]
  }
];

export default layers; // ส่งออกรายการ layers
