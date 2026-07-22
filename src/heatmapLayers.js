/**
 * heatmapLayers.js — รายการชั้นข้อมูล Heatmap / ความหนาแน่น (raster) จาก GeoServer
 * แต่ละ layer มี:
 *   id: ค่าเฉพาะสำหรับอ้างอิงใน React (ใช้เป็น key)
 *   name: ชื่อ layer ใน GeoServer (จะถูกเรียกเป็น LiveStock:<name> ผ่าน WMS)
 *   label: ชื่อที่แสดงใน Sidebar
 * ต่างจาก layers.js ตรงที่ heatmap เป็นภาพ raster ล้วน (ไม่มีจุด/ตารางข้อมูล)
 * และปรับความทึบ (opacity) ได้ผ่านแถบเลื่อนบนแผนที่
 */

const heatmapLayers = [
  { id: 'heatmap_broiler', name: 'heatmap_broiler', label: 'ฟาร์มไก่' },
  { id: 'heatmap_dairy', name: 'heatmap_dairy', label: 'ฟาร์มโคนม' },
  { id: 'heatmap_pig', name: 'heatmap_pig', label: 'ฟาร์มหมู' },
  { id: 'heatmap_poultry', name: 'heatmap_poultry', label: 'ฟาร์มสัตว์ปีก' },
];

export default heatmapLayers; // ส่งออกรายการ heatmap layers
