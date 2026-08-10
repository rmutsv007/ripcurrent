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
  },
    {
    category: 'ข้อมูลแบคทีเรีย',
    items: [
      { id: 'RWaterQuality_13032026', name: 'RWaterQuality_13032026', label: '13 มี.ค. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_28032026', name: 'RWaterQuality_28032026', label: '28 มี.ค. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_12042026', name: 'RWaterQuality_12042026', label: '12 เม.ย. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_27042026', name: 'RWaterQuality_27042026', label: '27 เม.ย. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_11052026', name: 'RWaterQuality_11052026', label: '11 พ.ค. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_26052026', name: 'RWaterQuality_26052026', label: '26 พ.ค. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_11062026', name: 'RWaterQuality_11062026', label: '11 มิ.ย. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_27062026', name: 'RWaterQuality_27062026', label: '27 มิ.ย. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_12072026', name: 'RWaterQuality_12072026', label: '12 ก.ค. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
      { id: 'RWaterQuality_23072026', name: 'RWaterQuality_23072026', label: '23 ก.ค. 2026', icon: '/assets/bacteria.png', iconSize: 35 },
    ]
  }
];

export default orthoLayers;