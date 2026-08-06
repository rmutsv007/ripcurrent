/**
 * MapFeatureCircles.js — คอมโพเนนต์วาดจุดข้อมูลฟาร์มบนแผนที่
 * วาด Circle สำหรับแต่ละฟาร์ม แสดง Tooltip ชื่อฟาร์ม
 * เมื่อคลิกจะเปิด Popup แสดงข้อมูลย่อ + ปุ่มดูข้อมูล
 */

// === นำเข้า react-leaflet components ===
import { Circle, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';  // Leaflet library (สำหรับสร้าง popup ด้วย DOM)
import React from 'react';

/**
 * getFeatureCenter — หาพิกัดศูนย์กลางของ feature แบบปลอดภัย
 * รองรับทั้ง Point, LineString, Polygon และกรณี geometry ว่าง
 * @param {Object} feature - GeoJSON feature
 * @returns {L.LatLng|null}
 */
export function getFeatureCenter(feature) {
  if (!feature) return null;

  try {
    const geoJsonLayer = L.geoJSON(feature);
    const bounds = geoJsonLayer.getBounds();
    if (bounds?.isValid()) {
      const center = bounds.getCenter();
      if (Number.isFinite(center?.lat) && Number.isFinite(center?.lng)) {
        return center;
      }
    }
  } catch {
    // fallback ด้านล่าง
  }

  let coords = feature?.geometry?.coordinates;
  while (Array.isArray(coords) && Array.isArray(coords[0])) {
    coords = coords[0];
  }

  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return L.latLng(lat, lng);
}

/**
 * buildPopupContent — สร้าง DOM element สำหรับ popup ของแต่ละจุดข้อมูล
 * ใช้ DOM API โดยตรง (ไม่ใช่ JSX) เพราะ Leaflet popup ต้องการ DOM node
 * @param {Object} feature - GeoJSON feature
 * @param {number} lat - ละติจูด
 * @param {number} lng - ลองจิจูด
 * @param {Function} onViewDetail - callback เมื่อกดปุ่ม "ดูข้อมูล"
 * @returns {HTMLElement} DOM element สำหรับ popup content
 */
function buildPopupContent(feature, lat, lng, onViewDetail) {
  // สร้าง wrapper div สำหรับเนื้อหา popup
  const wrapper = document.createElement('div');
  wrapper.style.minWidth = '220px';
  wrapper.style.textAlign = 'left';
  wrapper.style.fontFamily = 'Sarabun-Medium, sans-serif';
  wrapper.style.color = 'var(--c-text)';

  // === ชื่อฟาร์ม (หัวข้อ) ===
  const title = document.createElement('div');
  title.textContent = feature?.properties?.location || '-';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '16px';
  title.style.textAlign = 'center';
  title.style.marginBottom = '8px';
  title.style.color = 'var(--c-text-heading)';
  title.style.paddingBottom = '8px';
  title.style.borderBottom = '1px solid var(--c-border)'; // เส้นคั่น
  wrapper.appendChild(title);

  // === ที่อยู่ ===
  const addressDiv = document.createElement('div');
  addressDiv.style.marginBottom = '4px';
  addressDiv.style.fontSize = '13px';
  addressDiv.style.color = 'var(--c-text-secondary)';
  // ป้ายกำกับ "ที่อยู่ :"
  const addressLabel = document.createElement('span');
  addressLabel.textContent = 'บริเวณพื้นที่เก็บตัวอย่าง :';
  addressLabel.style.fontWeight = '600';
  addressLabel.style.color = 'var(--c-text)';
  addressDiv.appendChild(addressLabel);
  // ข้อความที่อยู่
  addressDiv.appendChild(document.createTextNode(' ' + (feature?.properties?.location || '-')));
  wrapper.appendChild(addressDiv);

  // === ปุ่มดำเนินการ (ดูข้อมูล + นำทาง) ===
  const actions = document.createElement('div');
  actions.style.marginTop = '12px';
  actions.style.textAlign = 'center';
  actions.style.display = 'flex';
  actions.style.gap = '8px';
  actions.style.justifyContent = 'center';

  // --- ปุ่ม "ดูข้อมูล" ---
  const viewBtn = document.createElement('button');
  viewBtn.textContent = 'ดูข้อมูล';
  viewBtn.style.display = 'inline-flex';
  viewBtn.style.alignItems = 'center';
  viewBtn.style.background = 'var(--c-green-bg)';
  viewBtn.style.color = 'var(--c-green)';
  viewBtn.style.padding = '6px 14px';
  viewBtn.style.borderRadius = '8px';
  viewBtn.style.border = '1px solid var(--c-green-border)';
  viewBtn.style.fontWeight = '600';
  viewBtn.style.fontSize = '13px';
  viewBtn.style.cursor = 'pointer';
  viewBtn.style.fontFamily = 'Sarabun-Medium, sans-serif';
  viewBtn.style.transition = 'all 0.2s';
  // เอฟเฟกต์ hover
  viewBtn.addEventListener('mouseenter', () => { viewBtn.style.background = 'var(--c-green-bg-hover)'; });
  viewBtn.addEventListener('mouseleave', () => { viewBtn.style.background = 'var(--c-green-bg)'; });
  // เมื่อคลิก — เรียก callback onViewDetail
  viewBtn.addEventListener('click', () => {
    if (onViewDetail) onViewDetail(feature);
  });
  actions.appendChild(viewBtn);

  wrapper.appendChild(actions);

  return wrapper; // คืน DOM element ทั้งหมด
}

/**
 * getFeatureKey — สร้าง key เฉพาะสำหรับแต่ละ feature (ใช้เป็น React key)
 * @param {Object} feature - GeoJSON feature
 * @param {number} fallbackKey - key สำรอง (index)
 * @returns {string} unique key
 */
export function getFeatureKey(feature, fallbackKey) {
  // ใช้ feature.id ถ้ามี
  if (feature?.id != null) {
    return String(feature.id);
  }

  // สร้าง key จากพิกัดและชื่อฟาร์ม
  const coords = feature?.geometry?.coordinates;
  const keyFromCoords = Array.isArray(coords)
    ? JSON.stringify(coords)
    : '';

  return `${feature?.properties?.location || 'feature'}:${keyFromCoords || fallbackKey}`;
}

/**
 * MapFeatureCircle — คอมโพเนนต์วาด Circle สำหรับ feature เดียว
 * ขนาด Circle จะปรับตามระดับ zoom ของแผนที่
 * @param {Object} feature - GeoJSON feature
 * @param {string} featureKey - key เฉพาะ
 * @param {Function} onViewDetail - callback เมื่อกดดูข้อมูล
 */
export function MapFeatureCircle({ feature, featureKey, onViewDetail }) {
  const map = useMap();                    // เข้าถึง Leaflet map instance
  const popupRef = React.useRef(null);     // ref เก็บ popup ที่เปิดอยู่
  const [zoom, setZoom] = React.useState(map.getZoom()); // ระดับ zoom ปัจจุบัน

  const center = getFeatureCenter(feature);

  // ฟัง event zoomend เพื่ออัปเดตขนาด Circle
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  // Cleanup: ลบ popup เมื่อ component unmount
  React.useEffect(() => {
    return () => {
      if (popupRef.current) {
        map.removeLayer(popupRef.current);
        popupRef.current = null;
      }
    };
  }, [map]);

  // ถ้าไม่มีพิกัด ไม่ render
  if (!center) {
    return null;
  }
  const { lat, lng } = center;

  // คำนวณรัศมี Circle ตามระดับ zoom
  const baseRadius = 200;                         // รัศมีฐาน (เมตร)
  const radius = baseRadius * Math.pow(2, 13 - zoom); // ยิ่ง zoom ออก → วงกลมยิ่งใหญ่

  /**
   * handleClick — จัดการเมื่อคลิก Circle
   * ลบ popup เก่า แล้วสร้าง popup ใหม่
   */
    const handleClick = event => {
      event.originalEvent?.stopPropagation?.(); // ป้องกัน event bubble

      // ลบ popup เก่า (ถ้ามี)
      if (popupRef.current) {
        map.removeLayer(popupRef.current);
        popupRef.current = null;
      }

      // สร้าง popup ใหม่ด้วย Leaflet API
      const popup = L.popup({
        autoClose: true,       // ปิดอัตโนมัติเมื่อเปิด popup อื่น
        closeOnClick: false,   // ไม่ปิดเมื่อคลิกแผนที่
        autoPan: true,         // เลื่อนแผนที่ให้ popup อยู่ในมุมมอง
        offset: [0, -8],       // เลื่อน popup ขึ้น 8px
      })
        .setLatLng(center)                                         // ตั้งตำแหน่ง popup
        .setContent(buildPopupContent(feature, lat, lng, onViewDetail)); // ตั้งเนื้อหา popup

      popupRef.current = popup; // เก็บ reference
      popup.openOn(map);        // เปิด popup บนแผนที่
    };

  return (
    // วาด Circle บนแผนที่
    <>
    <Circle
      center={center}
      radius={radius}
      bubblingMouseEvents={false}  // ไม่ส่ง event ต่อไปยัง map
      pathOptions={{ color: '#f8717100', fillColor: 'rgba(252, 165, 165, 0)', fillOpacity: 0.6 }} // โปร่งใส (ใช้สำหรับ hit area)
      eventHandlers={{
        click: handleClick, // เรียก handleClick เมื่อคลิก
      }}
    >
      {/* Tooltip — แสดงชื่อฟาร์มเมื่อ hover */}
      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false} sticky>
        {feature.properties?.location || '-'}
      </Tooltip>
    </Circle>
    </>
  );
}

/**
 * MapFeatureCircles — คอมโพเนนต์วาด Circle หลายจุด
 * วนลูป features แล้วสร้าง MapFeatureCircle สำหรับแต่ละจุด
 * @param {Array} features - อาร์เรย์ของ GeoJSON features
 * @param {Function} onViewDetail - callback เมื่อกดดูข้อมูล
 */
export function MapFeatureCircles({ features, onViewDetail }) {
  return (
    <>
      {features.map((feature, idx) => {
        const featureKey = getFeatureKey(feature, idx); // สร้าง unique key

        return (
          <MapFeatureCircle
            key={featureKey}
            feature={feature}
            featureKey={featureKey}
            onViewDetail={onViewDetail}
          />
        );
      })}
    </>
  );
}
