/**
 * OrthoLayers.js — รายการชั้นข้อมูล Ortho / ความหนาแน่น (raster) 
 * ปรับปรุงใหม่ให้รองรับการจัดหมวดหมู่ (Category)
 */

const orthoLayers = [
  {
    category: 'ภาพถ่ายจากโดรน',
    items: [
      { id: 'Ortho_fixed', name: 'Ortho_fixed', label: 'หาดชลาทัศน์และหาดสมิหลา' },
      { id: 'Ortho_samrong', name: 'Ortho_samrong', label: 'คลองสำโรง' },
      { id: 'OOOO', name: 'OOOO', label: 'เกาะหนู' },
    ]
  },
  {
    category: 'ข้อมูลระดับความลึก',
    items: [
      { id: 'DWCSV_CLIP_fixed', name: 'DWCSV_CLIP_fixed', label: 'หาดชลาทัศน์และหาดสมิหลา' },
      { id: 'DEM_kohnu', name: 'DEM_kohnu', label: 'เกาะหนู' },
    ]
  }
];

export default orthoLayers;