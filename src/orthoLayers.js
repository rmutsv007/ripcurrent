/**
 * OrthoLayers.js — รายการชั้นข้อมูล Ortho / ความหนาแน่น (raster) จาก GeoServer
 * แต่ละ layer มี:
 *   id: ค่าเฉพาะสำหรับอ้างอิงใน React (ใช้เป็น key)
 *   name: ชื่อ layer ใน GeoServer (จะถูกเรียกเป็น LiveStock:<name> ผ่าน WMS)
 *   label: ชื่อที่แสดงใน Sidebar
 * ต่างจาก layers.js ตรงที่ Ortho เป็นภาพ raster ล้วน (ไม่มีจุด/ตารางข้อมูล)
 * และปรับความทึบ (opacity) ได้ผ่านแถบเลื่อนบนแผนที่
 */

const orthoLayers = [
  { id: 'Ortho_fixed', name: 'Ortho_fixed', label: 'ภาพโดรนหาดชลาทัศน์และหาดสมิหลา' },
  { id: 'Ortho_samrong', name: 'Ortho_samrong', label: 'ภาพโดรนคลองสำโรง' },
  { id: 'OOOO', name: 'OOOO', label: 'ภาพโดรนเกาะหนู' },
  //{ id: 'DEM', name: 'DEM', label: 'DEM.tif' },
  //{ id: 'DWCSV_CLIP', name: 'DWCSV_CLIP', label: 'ระดับความลึก' },
  { id: 'DWCSV_CLIP_fixed', name: 'DWCSV_CLIP_fixed', label: 'ระดับความลึกชายหาด' },
  
];

export default orthoLayers; // ส่งออกรายการ Ortho layers
