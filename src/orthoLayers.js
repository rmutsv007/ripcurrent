/**
 * OrthoLayers.js — รายการชั้นข้อมูล Ortho / ความหนาแน่น (raster) 
 * ปรับปรุงใหม่ให้รองรับการจัดหมวดหมู่ (Category)
 */

const orthoLayers = [
  {
    category: 'ภาพถ่ายจากโดรน',
    items: [
      { id: 'ortho2', name: 'ortho2', label: 'หาดชลาทัศน์และหาดสมิหลา', icon: '/assets/map.png', iconSize: 35 },
      { id: 'Ortho_samrong', name: 'Ortho_samrong', label: 'คลองสำโรง', icon: '/assets/map.png', iconSize: 35 },
      { id: 'OOOO', name: 'OOOO', label: 'เกาะหนู', icon: '/assets/map.png', iconSize: 35 },
    ]
  },
  {
    category: 'ข้อมูลระดับความลึก',
    items: [
      { id: 'DWCSV_CLIP_fixed', name: 'DWCSV_CLIP_fixed', label: 'หาดชลาทัศน์และหาดสมิหลา', icon: '/assets/terrain.png', iconSize: 35 },
      { id: 'DEM2', name: 'DEM2', label: 'ระดับพื้นชายหาด', icon: '/assets/terrain.png', iconSize: 35 },
      { id: 'DEM_kohnu', name: 'DEM_kohnu', label: 'ระดับพื้นเกาะหนู', icon: '/assets/terrain.png', iconSize: 35 },
    ]
  }
];

export default orthoLayers;