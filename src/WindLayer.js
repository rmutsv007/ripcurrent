/**
 * WindLayer.js — ชั้นแสดงลมเคลื่อนไหวแบบ particle (สไตล์ Windy.com)
 * ใช้ปลั๊กอิน leaflet-velocity ซึ่งเป็น Leaflet plugin แบบ classic (ไม่ใช่ React component)
 * จึงต้องเรียกผ่าน useEffect แล้วเพิ่ม/ลบ layer เข้า map instance เอง
 *
 * รูปแบบข้อมูล windData ต้องเป็น array 2 ชิ้น (u-component, v-component) แบบ GFS/leaflet-velocity:
 * [{ header: { parameterNumber: 2 (u) หรือ 3 (v), ... }, data: [...] }, { ... }]
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import 'leaflet-velocity';

function WindLayer({ windData, pane = 'windPane' }) {
  const map = useMap();

  useEffect(() => {
    if (!windData || !map) return;
    
    // ตรวจสอบว่า Container ของแผนที่ยังมีอยู่ใน DOM หรือไม่ก่อนทำงาน
    if (!map.getContainer()) return;

    const velocityLayer = L.velocityLayer({
      displayValues: true,
      displayOptions: {
        velocityType: 'ลม (Wind)',
        position: 'bottomleft',
        emptyString: 'ไม่มีข้อมูลลม',
        angleConvention: 'bearingCW',
        speedUnit: 'kt',
      },
      data: windData,
      maxVelocity: 15,
      velocityScale: 0.01, // ปรับความยาว/ความเร็วเส้น particle
      paneName: pane,
    });

    try {
      velocityLayer.addTo(map);
    } catch (e) {
      console.warn("Error adding WindLayer:", e);
    }

    return () => {
      // ตรวจสอบความปลอดภัยก่อนสั่ง removeLayer เพื่อป้องกัน Error
      try {
        if (map && map.getContainer() && map.hasLayer(velocityLayer)) {
          map.removeLayer(velocityLayer);
        }
      } catch (e) {
        console.warn("WindLayer cleanup error:", e);
      }
    };
  }, [map, windData, pane]);

  return null;
}

export default WindLayer;