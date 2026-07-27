/**
 * App.js — คอมโพเนนต์หลักของแอปพลิเคชัน
 * ทำหน้าที่จัดวาง Layout ทั้งหมด: Header, Sidebar, Map, Dashboard
 * รวมถึงจัดการ State หลัก เช่น ธีม, แผนที่ฐาน, ข้อมูลจุด, และ Layer ที่เลือก
 */

// === นำเข้า React hooks ที่ใช้งาน ===
import React, { useRef, useState, useEffect } from 'react';

// === นำเข้า react-leaflet สำหรับแสดงแผนที่ ===
// MapContainer: คอนเทนเนอร์หลักของแผนที่
// TileLayer: ชั้นแผนที่ฐาน (basemap)
// WMSTileLayer: ชั้นแผนที่จาก WMS service
// useMap: hook สำหรับเข้าถึง instance ของ Leaflet map
import { MapContainer, TileLayer, WMSTileLayer, useMap } from 'react-leaflet';

// === นำเข้าคอมโพเนนต์วาดจุดข้อมูลบนแผนที่ ===
import { MapFeatureCircles } from './MapFeatureCircles';

// === นำเข้า Leaflet library สำหรับใช้งาน API โดยตรง ===
import L from 'leaflet';

// === นำเข้า CSS ของ Leaflet ===
import 'leaflet/dist/leaflet.css';

// === นำเข้าคอมโพเนนต์ย่อย ===
import DashboardTable from './DashboardTable';   // ตารางข้อมูลปศุสัตว์
import FeatureDetail from './FeatureDetail';     // หน้ารายละเอียดฟาร์ม
import Sidebar from './Sidebar';                 // แถบเมนูเลือกชั้นข้อมูล (ซ้าย)
import Login from './Login';                     // หน้าเข้าสู่ระบบผู้ดูแล
import layers from './layers';                   // รายการชั้นข้อมูลทั้งหมด
import orthoLayers from './orthoLayers';     // รายการชั้น Ortho / ความหนาแน่น

// === นำเข้า CSS เพิ่มเติม ===
import './MapOverrides.css';  // ปรับแต่ง style ของ Leaflet (popup, tooltip, zoom)
import './sarabun-font.css';  // ฟอนต์ภาษาไทย Sarabun

/**
 * BASEMAPS — รายการแผนที่ฐานที่ใช้งานได้ทั้งหมด
 * แต่ละรายการมี:
 *   id: ค่าเฉพาะสำหรับอ้างอิง
 *   label: ชื่อแสดงใน UI
 *   url: URL template ของ tile server
 */
const BASEMAPS = [
  { id: 'osm',        label: 'OpenStreetMap',  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },           // แผนที่ OpenStreetMap มาตรฐาน
  { id: 'carto-dark',  label: 'Dark',           url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png' },  // แผนที่มืด (ไม่มีชื่อ)
  { id: 'carto-light', label: 'Light',          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },      // แผนที่สว่าง
  { id: 'carto-voyager', label: 'Voyager',      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' }, // แผนที่สไตล์ Voyager
  { id: 'esri-satellite', label: 'Satellite',   url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },  // ภาพถ่ายดาวเทียม
  { id: 'esri-topo',  label: 'Topo',            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' }, // แผนที่ภูมิประเทศ
];

/**
 * getFeatureViewTarget — คำนวณตำแหน่งและขอบเขตของ feature บนแผนที่
 * @param {Object} feature - GeoJSON feature object
 * @returns {Object|null} - { center: LatLng, bounds: LatLngBounds|null } หรือ null ถ้าไม่มีพิกัด
 * ใช้สำหรับ zoom ไปยังตำแหน่งของฟาร์มเมื่อคลิกดูรายละเอียด
 */
function getFeatureViewTarget(feature) {
  // ถ้าไม่มี feature ให้คืนค่า null
  if (!feature) {
    return null;
  }

  try {
    // พยายามสร้าง GeoJSON layer เพื่อคำนวณ bounds
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();

    // ถ้าได้ bounds ที่ถูกต้อง ให้คืนค่า center และ bounds
    if (bounds.isValid()) {
      return {
        center: bounds.getCenter(),  // จุดกึ่งกลางของ bounds
        bounds,                      // ขอบเขตทั้งหมดของ feature
      };
    }
  } catch {
    // ถ้าเกิดข้อผิดพลาด ให้ใช้พิกัดดิบแทน (fallback)
  }

  // ดึงพิกัดจาก geometry โดยตรง
  let coords = feature?.geometry?.coordinates;

  // ถ้าเป็น nested array (เช่น Polygon) ให้ดึงลงไปจนถึงจุดพิกัดจริง
  while (Array.isArray(coords) && Array.isArray(coords[0])) {
    coords = coords[0];
  }

  // ถ้าไม่มีพิกัดหรือพิกัดไม่ครบ ให้คืนค่า null
  if (!coords || coords.length < 2) {
    return null;
  }

  // คืนค่า center จากพิกัด [lng, lat] (GeoJSON format)
  return {
    center: L.latLng(coords[1], coords[0]),  // แปลง [lng, lat] → LatLng(lat, lng)
    bounds: null,                             // ไม่มี bounds สำหรับจุดเดียว
  };
}

/**
 * MapInstanceBridge — คอมโพเนนต์สะพานเชื่อม Leaflet map instance กับ React ref
 * ใช้ useMap() เพื่อดึง instance ของ Leaflet map แล้วเก็บไว้ใน mapRef
 * เพื่อให้คอมโพเนนต์อื่นสามารถเข้าถึง map instance ได้ (เช่น invalidateSize, closePopup)
 * @param {Object} props
 * @param {React.MutableRefObject} props.mapRef - ref สำหรับเก็บ map instance
 */
/**
 * OrthoOpacityControl — แถบเลื่อนปรับความทึบ (opacity) ของชั้น Ortho
 * วางลอยมุมล่างซ้ายของแผนที่ — แสดงเฉพาะเมื่อมีชั้น Ortho เปิดอยู่
 * @param {number} props.value - ค่า opacity ปัจจุบัน (0–1)
 * @param {Function} props.onChange - callback เมื่อเลื่อนแถบ
 */
function OrthoOpacityControl({ value, onChange }) {
  const ref = useRef(null);

  // กันไม่ให้การลาก/คลิก/scroll บนแถบไปโดนถึงแผนที่ (ไม่ให้แผนที่เลื่อน/ซูม)
  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  const percent = Math.round(value * 100);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', left: 10, bottom: 24, zIndex: 1000,
        background: 'var(--c-bg-primary)',
        border: '1px solid var(--c-border)',
        borderRadius: 8,
        padding: '10px 12px',
        boxShadow: 'var(--c-shadow-lg)',
        fontFamily: 'Sarabun, sans-serif',
        width: 190,
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--c-text)',
      }}>
        <span>ความทึบ Raster</span>
        <span style={{ color: 'var(--c-accent-light)' }}>{percent}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={e => onChange(Number(e.target.value) / 100)}
        aria-label="ปรับความทึบ Ortho"
        style={{ width: '100%', accentColor: 'var(--c-accent)', cursor: 'pointer' }}
      />
    </div>
  );
}

function MapInstanceBridge({ mapRef }) {
  const map = useMap(); // ดึง Leaflet map instance จาก react-leaflet context

  useEffect(() => {
    mapRef.current = map; // เก็บ map instance ไว้ใน ref

    // Cleanup: ลบ reference เมื่อ component unmount
    return () => {
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);

  return null; // ไม่ render อะไร เป็นแค่ bridge component
}

/**
 * LayerPaneSetup — สร้าง Leaflet panes สำหรับควบคุมลำดับการซ้อนของชั้นข้อมูล
 * Ortho จะอยู่ใต้ชั้นปศุสัตว์เสมอ ไม่ว่าผู้ใช้จะเปิด/ปิดลำดับไหนก่อน
 * waterway จะอยู่ต่ำกว่า Ortho 1 ระดับเสมอ
 */
function LayerPaneSetup() {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane('amphoePane')) {
      map.createPane('amphoePane');
    }
    if (!map.getPane('OrthoPane')) {
      map.createPane('OrthoPane');
    }
    if (!map.getPane('waterwayPane')) {
      map.createPane('waterwayPane');
    }
    if (!map.getPane('livestockPane')) {
      map.createPane('livestockPane');
    }

    map.getPane('amphoePane').style.zIndex = 330;
    map.getPane('waterwayPane').style.zIndex = 339;
    map.getPane('OrthoPane').style.zIndex = 340;
    map.getPane('livestockPane').style.zIndex = 350;
  }, [map]);

  return null;
}

/**
 * App — คอมโพเนนต์หลักของแอปพลิเคชัน
 * จัดการ state ทั้งหมด และจัด layout: Header → Main (Sidebar + Map + Dashboard)
 */
function App() {
  // === State Management ===
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);       // สถานะย่อ/ขยาย Sidebar
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);   // สถานะย่อ/ขยาย Dashboard
  const [points, setPoints] = useState([]);                              // ข้อมูลจุดทั้งหมดจาก WFS
  const [filteredPoints, setFilteredPoints] = useState([]);              // ข้อมูลจุดที่ผ่านการกรอง
  const searchValue = "";                                                 // ค่าค้นหา (ปัจจุบันตั้งค่าคงที่)
  const [selectedLayerIds, setSelectedLayerIds] = useState([]);          // ID ของ Layer ที่เลือกแสดง
  const [selectedOrthoIds, setSelectedOrthoIds] = useState([]);      // ID ของชั้น Ortho ที่เลือก
  const [OrthoOpacity, setOrthoOpacity] = useState(0.4);             // ความทึบ Ortho (เริ่มต้น 40%)
  const [selectedFeature, setSelectedFeature] = useState(null);          // Feature ที่ถูกเลือกดูรายละเอียด
  const [basemapId, setBasemapId] = useState(() => localStorage.getItem('basemap') || 'osm'); // ID แผนที่ฐานปัจจุบัน
  const [basemapOpen, setBasemapOpen] = useState(false);                 // สถานะเปิด/ปิด dropdown เลือกแผนที่ฐาน
  const basemapManualRef = useRef(false);                                // flag: ผู้ใช้เลือกแผนที่ฐานเองหรือไม่
  const [mapCenter] = useState([7.206227, 100.602645]);                           // พิกัดกึ่งกลางแผนที่ (จ.สงขลา)
  const [mapZoom] = useState(14);                                         // ระดับ zoom เริ่มต้นของแผนที่
  const [theme, setTheme] = useState('light');                           // ธีม: 'light' หรือ 'dark'
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);  // JWT token
  const [authUser, setAuthUser] = useState(() => localStorage.getItem('authUser') || null);     // ชื่อผู้ใช้
  const [showLogin, setShowLogin] = useState(false);                     // แสดง modal login
  
  const toggleBtnRef = useRef();  // ref ของปุ่มสลับธีม (ใช้คำนวณตำแหน่ง animation)
  const mapRef = useRef();        // ref ของ Leaflet map instance
  const highlightMarkerRef = useRef(null); // ref ของ highlight marker (จัดการ imperative ไม่ผ่าน React)

  /**
   * showHighlight — แสดงวงกลม highlight ที่ตำแหน่งที่กำหนด
   * จัดการ Leaflet marker โดยตรง ไม่ผ่าน React lifecycle
   */
  const showHighlight = (latLng) => {
    const map = mapRef.current;
    if (!map) return;

    // สร้าง marker ครั้งแรก
    if (!highlightMarkerRef.current) {
      const icon = L.divIcon({
        className: '',
        html: `<div class="highlight-pulse-ring"><div class="highlight-pulse-inner"></div><div class="highlight-label">กำลังดู</div></div>`,
        iconSize: [80, 80],
        iconAnchor: [40, 40],
      });
      highlightMarkerRef.current = L.marker([0, 0], {
        icon,
        interactive: false,
        zIndexOffset: 1000,
      });
      highlightMarkerRef.current.addTo(map);
    }

    // ย้ายตำแหน่งและแสดง
    highlightMarkerRef.current.setLatLng(latLng);
    highlightMarkerRef.current.setOpacity(1);
    const el = highlightMarkerRef.current.getElement();
    if (el) el.style.display = '';
  };

  /**
   * hideHighlight — ซ่อนวงกลม highlight
   */
  const hideHighlight = () => {
    if (highlightMarkerRef.current) {
      highlightMarkerRef.current.setOpacity(0);
      const el = highlightMarkerRef.current.getElement();
      if (el) el.style.display = 'none';
    }
  };

  // === Effect: ปรับแต่ง body ให้เต็มหน้าจอ ===
  useEffect(() => {
    document.body.style.margin = '0';      // ลบ margin
    document.body.style.padding = '0';     // ลบ padding
    document.body.style.overflow = 'hidden'; // ซ่อน scrollbar ของ body
  }, []);

  // === Effect: ตั้งค่าธีมบน HTML element และบันทึกลง localStorage ===
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme); // ตั้ง attribute data-theme บน <html>
    localStorage.setItem('theme', theme);                        // บันทึกธีมเพื่อใช้ในครั้งถัดไป
  }, [theme]);

  /**
   * toggleTheme — สลับธีม (มืด ↔ สว่าง) พร้อม Circular Reveal Animation
   * 1. คำนวณตำแหน่งปุ่มสลับ (จุดเริ่มต้นของ animation)
   * 2. สร้าง overlay สีพื้นหลังของธีมใหม่
   * 3. แสดง animation วงกลมขยายจากจุดปุ่ม
   * 4. สลับธีมจริง
   * 5. ลบ overlay เมื่อ animation จบ
   */
  const toggleTheme = () => {
    const btn = toggleBtnRef.current;             // อ้างอิงปุ่มสลับธีม
    const rect = btn.getBoundingClientRect();      // ตำแหน่งปุ่มบนหน้าจอ
    const x = rect.left + rect.width / 2;         // จุดกึ่งกลาง X ของปุ่ม
    const y = rect.top + rect.height / 2;         // จุดกึ่งกลาง Y ของปุ่ม

    // สร้าง overlay element สำหรับ Circular Reveal Animation
    const overlay = document.createElement('div');
    overlay.className = 'theme-reveal-overlay';
    overlay.style.setProperty('--reveal-x', `${x}px`);  // ตั้งจุดเริ่มต้น X
    overlay.style.setProperty('--reveal-y', `${y}px`);  // ตั้งจุดเริ่มต้น Y

    // ดึงสีพื้นหลังของธีมถัดไป เพื่อใช้เป็นสี overlay
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);          // เปลี่ยนเป็นธีมถัดไปชั่วคราว
    overlay.style.background = getComputedStyle(document.documentElement).getPropertyValue('--c-bg-app'); // ดึงสีพื้นหลัง
    document.documentElement.setAttribute('data-theme', nextTheme === 'light' ? 'dark' : 'light');       // เปลี่ยนกลับเป็นธีมเดิม

    // เพิ่ม overlay เข้าไปใน body
    document.body.appendChild(overlay);

    // สลับธีมจริงใน frame ถัดไป (เพื่อให้ overlay แสดงก่อน)
    requestAnimationFrame(() => {
      setTheme(t => t === 'dark' ? 'light' : 'dark');
    });

    // ลบ overlay เมื่อ animation เล่นจบ
    overlay.addEventListener('animationend', () => overlay.remove());
  };

  // === Effect: บันทึกแผนที่ฐานที่เลือกลง localStorage ===
  useEffect(() => {
    localStorage.setItem('basemap', basemapId);
  }, [basemapId]);

  // === Effect: สลับแผนที่ฐานอัตโนมัติเมื่อเปลี่ยนธีม ===
  // จะทำงานเฉพาะเมื่อผู้ใช้ไม่ได้เลือกแผนที่ฐานด้วยตัวเอง (basemapManualRef === false)
  useEffect(() => {
    if (!basemapManualRef.current) {
      setBasemapId(theme === 'dark' ? 'carto-dark' : 'osm'); // มืด→CartoDB Dark, สว่าง→OSM
    }
  }, [theme]);

  // === Effect: แจ้ง Leaflet ให้คำนวณขนาดแผนที่ใหม่ ===
  // เรียกเมื่อ dashboard หรือ sidebar เปลี่ยนสถานะย่อ/ขยาย
  // รอ 300ms เพื่อให้ CSS transition เล่นจบก่อน
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize(); // บอก Leaflet ว่า container เปลี่ยนขนาด
    }, 300);
    return () => clearTimeout(timer);    // Cleanup timer เมื่อ dependencies เปลี่ยน
  }, [dashboardCollapsed, sidebarCollapsed]);

  // ดึงข้อมูลแผนที่ฐานที่เลือกอยู่ (ใช้ตัวแรกเป็น fallback)
  const selectedBasemap = BASEMAPS.find(b => b.id === basemapId) || BASEMAPS[0];

  // === Effect: กรองข้อมูลจุดตามคำค้นหา ===
  useEffect(() => {
    if (!searchValue) {
      setFilteredPoints(points); // ถ้าไม่มีคำค้นหา ให้แสดงทั้งหมด
    } else {
      // กรองตามชื่อฟาร์ม (ไม่สนตัวพิมพ์เล็ก-ใหญ่)
      setFilteredPoints(
        points.filter(f =>
          f.properties?.location?.toLowerCase().includes(searchValue.toLowerCase())
        )
      );
    }
  }, [points, searchValue]);

  // === Effect: ดึงข้อมูลจาก WFS เมื่อเลือก Layer ===
  useEffect(() => {
    // แปลง layers เป็น flat array (รองรับทั้งแบบมี category และไม่มี)
    const flatLayers = layers.flatMap(cat => cat.items || [cat]);
    // กรองเฉพาะ layer ที่ถูกเลือก
    const selectedLayers = flatLayers.filter(l => selectedLayerIds.includes(l.id) && l.kind !== 'line');

    // ถ้าไม่มี layer ที่เลือก ให้ล้างข้อมูลจุด
    if (!selectedLayers.length) {
      setPoints([]);
      mapRef.current?.closePopup(); // ปิด popup ที่เปิดอยู่
      return;
    }

    let allFeatures = [];  // เก็บ feature ทั้งหมดจากทุก layer
    let fetchCount = 0;    // นับจำนวน fetch ที่เสร็จแล้ว

    // ดึงข้อมูลจาก WFS แต่ละ layer
    selectedLayers.forEach(layer => {
      // สร้าง URL สำหรับ WFS GetFeature request
      const wfsUrl = `https://map.surveywms.com/geoserver/ChalatatSongkhla/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ChalatatSongkhla:${encodeURIComponent(layer.name)}&outputFormat=application/json&maxFeatures=100`;
      
      fetch(wfsUrl)
        .then(res => res.json())                                    // แปลง response เป็น JSON
        .then(data => {
          if (data.features) allFeatures = [...allFeatures, ...data.features]; // รวม features
        })
        .catch(err => console.error("Fetch error:", err))           // จัดการข้อผิดพลาด
        .finally(() => {
          fetchCount++;
          // เมื่อ fetch ครบทุก layer ให้อัปเดต state
          if (fetchCount === selectedLayers.length) setPoints(allFeatures);
        });
    });
  }, [selectedLayerIds]);

  /**
   * handleZoomToFeature — ซูมแผนที่ไปยังตำแหน่งของ feature ที่เลือก
   * @param {Object} feature - GeoJSON feature ที่ต้องการซูมไป
   */
  const handleZoomToFeature = feature => {
    mapRef.current?.closePopup(); // ปิด popup ที่เปิดอยู่

    const target = getFeatureViewTarget(feature); // คำนวณตำแหน่งเป้าหมาย
    if (!target || !mapRef.current) {
      return; // ถ้าไม่มีตำแหน่งหรือไม่มี map instance ให้หยุด
    }

    // ถ้ามี bounds (polygon/line) ให้ fitBounds
    if (target.bounds) {
      const currentBounds = mapRef.current.getBounds();
      const isSameBounds = currentBounds && currentBounds.contains(target.bounds) && target.bounds.contains(currentBounds);
      if (!isSameBounds) {
        mapRef.current.fitBounds(target.bounds, {
          padding: [40, 40],  // เว้นขอบ 40px
          maxZoom: 15,        // zoom สูงสุด
        });
      }
      return;
    }

    // ถ้าเป็นจุดเดียว ให้ setView ไปยังตำแหน่งนั้น
    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();
    const targetZoom = Math.max(currentZoom, 15);
    const isSame = currentCenter && currentCenter.lat === target.center.lat && currentCenter.lng === target.center.lng && currentZoom === targetZoom;
    if (!isSame) {
      mapRef.current.setView(target.center, targetZoom, {
        animate: true, // เปิด animation
      });
    }
  };
  // Effect: แสดง highlight ทุกครั้งที่ selectedFeature เปลี่ยน
  useEffect(() => {
    if (!selectedFeature) return;
    const target = getFeatureViewTarget(selectedFeature);
    if (target && mapRef.current) {
      showHighlight(target.center);
    }
  }, [selectedFeature]);

  // === ส่วน Render ===
  return (
    // คอนเทนเนอร์หลัก: flex column เต็มหน้าจอ
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--c-bg-app)' }}>
      
      {/* ==================== HEADER (แถบบนสุด) ==================== */}
      {/* สูง 56px, แสดงโลโก้ + ชื่อระบบ + ปุ่มสลับธีม */}
      <header style={{
        height: '56px',
        minHeight: '56px',
        background: 'linear-gradient(135deg, var(--c-header-start) 0%, var(--c-header-end) 100%)', // พื้นหลังไล่สี
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 24px',
        borderBottom: '1px solid var(--c-border)',
        boxShadow: 'var(--c-shadow)',
        zIndex: 1000, // อยู่เหนือ map controls
      }}>
        {/* โลโก้ — อยู่ซ้ายสุด */}
        <img
          src={process.env.PUBLIC_URL + '/assets/logo.png'}
          alt="logo"
          style={{ position: 'absolute', left: 16, height: 40, width: 160, objectFit: 'contain', filter: 'var(--c-logo-filter)' }}
        />
        {/* ชื่อระบบ — อยู่กลาง */}
        <h1 style={{
          fontSize: '17px',
          margin: 0,
          color: 'var(--c-text)',
          fontFamily: 'Sarabun-Medium',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontWeight: 600,
          letterSpacing: 0.3,
        }}>
          จุดเสี่ยงการเกิดกระแสน้ำย้อนกลับชายหาดชลาทัศน์
        </h1>
        {/* ปุ่มสลับธีม (มืด/สว่าง) — อยู่ขวาสุด */}
        <div style={{ position: 'absolute', right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* ปุ่มเข้าสู่ระบบ / แสดงชื่อผู้ใช้ */}
          {authToken ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'Sarabun-Medium' }}>
                {authUser}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('authUser');
                  setAuthToken(null);
                  setAuthUser(null);
                }}
                style={{
                  background: 'var(--c-bg-icon)', border: '1px solid var(--c-border)',
                  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  color: 'var(--c-text-secondary)', cursor: 'pointer', fontFamily: 'Sarabun-Medium',
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              style={{
                background: 'var(--c-bg-icon)', border: '1px solid var(--c-border)',
                borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                color: 'var(--c-accent-light)', cursor: 'pointer', fontFamily: 'Sarabun-Medium',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M2 12c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              เข้าสู่ระบบ
            </button>
          )}
          <button
          ref={toggleBtnRef}
          onClick={toggleTheme}
          style={{
            background: 'var(--c-bg-icon)',
            border: '1px solid var(--c-border)',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--c-accent-light)',
            transition: 'all 0.2s',
          }}
          aria-label={theme === 'dark' ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}
        >
          {/* ไอคอนดวงอาทิตย์ (ธีมมืด) หรือ พระจันทร์ (ธีมสว่าง) */}
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M3.3 14.7l1.4-1.4M13.3 4.7l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15 10.5A6.5 6.5 0 017.5 3a6.5 6.5 0 107.5 7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        </div>
      </header>

      {/* Login Modal */}
      {showLogin && (
        <Login
          onLogin={({ token, username }) => {
            setAuthToken(token);
            setAuthUser(username);
            setShowLogin(false);
          }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* ==================== MAIN CONTENT (เนื้อหาหลัก) ==================== */}
      {/* Flex row: Sidebar (ซ้าย) | Map (กลาง) | Dashboard (ขวา) */}
      <main style={{ flex: 1, display: 'flex', gap: 0, minHeight: 0 }}>
        
        {/* ==================== SIDEBAR (แถบเมนูซ้าย) ==================== */}
        {/* แสดงรายการชั้นข้อมูล (Layer) ที่เลือกได้ */}
        <aside style={{
          width: sidebarCollapsed ? 64 : 220,           // ความกว้าง: ย่อ 64px, ขยาย 220px
          minWidth: sidebarCollapsed ? 64 : 220,
          height: '100%',
          overflowY: 'auto',
          transition: 'width 0.25s ease, min-width 0.25s ease', // animation เมื่อย่อ/ขยาย
        }}>
          <Sidebar
            onLayerChange={ids => {
              setSelectedLayerIds(ids);          // อัปเดต layer ที่เลือก
              mapRef.current?.closePopup();      // ปิด popup เมื่อเปลี่ยน layer
              hideHighlight();                    // ซ่อน highlight เมื่อเปลี่ยน layer
            }}
            onOrthoChange={setSelectedOrthoIds}
            collapsed={sidebarCollapsed}
            onCollapseChange={setSidebarCollapsed}
          />
        </aside>

        {/* ==================== MAP (แผนที่ตรงกลาง) ==================== */}
        <section style={{
          flex: sidebarCollapsed ? 2.7 : 2,     // สัดส่วน flex (ขยายเมื่อ sidebar ย่อ)
          height: '100%',
          padding: 16,
          transition: 'flex 0.2s',
        }}>
          {/* กรอบแผนที่ — มีมุมโค้งและเงา */}
          <div style={{
            height: '100%',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: 'var(--c-shadow-card)',
            border: '1px solid var(--c-border)',
          }}>
            {/* MapContainer — คอนเทนเนอร์หลักของ Leaflet map */}
            <MapContainer
              center={mapCenter}              // จุดเริ่มต้นแผนที่
              zoom={mapZoom}                  // ระดับ zoom เริ่มต้น
              maxZoom={24}
              closePopupOnClick={false}       // ไม่ปิด popup เมื่อคลิกแผนที่
              style={{ height: '100%', width: '100%' }}
            >
              {/* เชื่อม map instance กับ mapRef */}
              <MapInstanceBridge mapRef={mapRef} />
              <LayerPaneSetup />
              
              {/* ชั้นแผนที่ฐาน (basemap) */}
              <TileLayer 
                url={selectedBasemap.url} 
                maxZoom={24}                    // <--- เพิ่ม: ยอมให้ซูมได้ถึง 24
                maxNativeZoom={19}              // <--- เพิ่ม: แต่ใช้รูปจริงแค่ระดับ 19 แล้วขยายเอา
              />

              {/* แสดงขอบเขตอำเภอบนหน้าหลักตลอดเวลา โดยไม่ต้องให้ผู้ใช้เปิดจาก Sidebar */}
              <WMSTileLayer
                url="https://map.surveywms.com/geoserver/LiveStock/wms"
                layers="ChalatatSongkhla:eiei"
                format="image/png"
                transparent={true}
                version="1.1.1"
                pane="amphoePane"
              />

              {/* ==================== Basemap Picker (เลือกแผนที่ฐาน) ==================== */}
              <div style={{
                position: 'absolute', top: 10, right: 10, zIndex: 1000,
                fontFamily: 'Sarabun-Medium, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end', // จัดชิดขวา
              }}>
                {/* ปุ่มเปิด/ปิด dropdown เลือกแผนที่ฐาน */}
                <button
                  onClick={() => setBasemapOpen(v => !v)}
                  style={{
                    background: 'var(--c-bg-primary)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--c-text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: 'var(--c-shadow)',
                    fontFamily: 'inherit',
                  }}
                >
                  {/* ไอคอนกริด 4 ช่อง */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  </svg>
                  {selectedBasemap.label} {/* แสดงชื่อแผนที่ฐานปัจจุบัน */}
                </button>
                {/* Dropdown รายการแผนที่ฐาน (แสดงเมื่อเปิด) */}
                {basemapOpen && (
                  <div style={{
                    marginTop: 4,
                    background: 'var(--c-bg-primary)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 8,
                    padding: 4,
                    boxShadow: 'var(--c-shadow-lg)',
                    minWidth: 140,
                  }}>
                    {/* วนลูปแสดงแต่ละตัวเลือก basemap */}
                    {BASEMAPS.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          basemapManualRef.current = true; // ตั้ง flag ว่าผู้ใช้เลือกเอง
                          setBasemapId(b.id);              // เปลี่ยน basemap
                          setBasemapOpen(false);           // ปิด dropdown
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: b.id === basemapId ? 700 : 500,                     // ตัวหนาถ้าเป็นตัวที่เลือก
                          color: b.id === basemapId ? 'var(--c-accent-light)' : 'var(--c-text)',
                          background: b.id === basemapId ? 'var(--c-accent-bg)' : 'transparent', // highlight ตัวที่เลือก
                          borderRadius: 6,
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={e => { if (b.id !== basemapId) e.currentTarget.style.background = 'var(--c-bg-hover)'; }}
                        onMouseOut={e => { if (b.id !== basemapId) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {b.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* ==================== WMS Layers (ชั้นข้อมูลจาก GeoServer) ==================== */}
              {/* แสดงชั้นข้อมูลที่ผู้ใช้เลือกจาก Sidebar */}
              {layers.flatMap(cat => cat.items || [cat])
                .filter(l => selectedLayerIds.includes(l.id))
                .map(layer => (
                  <WMSTileLayer
                    key={layer.id}
                    url="https://map.surveywms.com/geoserver/ChalatatSongkhla/wms"  // URL ของ GeoServer WMS
                    layers={`ChalatatSongkhla:${layer.name}`}                        // ชื่อ layer ใน GeoServer
                    format="image/png"                                        // รูปแบบภาพ
                    transparent={true}                                        // พื้นหลังโปร่งใส
                    version="1.1.1"                                           // เวอร์ชัน WMS
                    maxZoom={24}
                    pane={layer.id === 'waterway' ? 'waterwayPane' : 'livestockPane'}
                  />
                ))}

              {/* ==================== Ortho Layers (ราสเตอร์ความหนาแน่น) ==================== */}
              {/* ชั้น Ortho ที่เลือก — ปรับความทึบร่วมกันผ่านแถบเลื่อน */}
              {orthoLayers
                .filter(l => selectedOrthoIds.includes(l.id))
                .map(layer => (
                  <WMSTileLayer
                    key={layer.id}
                    url="https://map.surveywms.com/geoserver/ChalatatSongkhla/wms"
                    layers={`ChalatatSongkhla:${layer.name}`}
                    format="image/png"
                    transparent={true}
                    version="1.1.1"
                    maxZoom={24}
                    opacity={OrthoOpacity}                                   // ความทึบจากแถบเลื่อน
                    pane="OrthoPane"
                  />
                ))}

              {/* แถบเลื่อนปรับความทึบ — แสดงเฉพาะเมื่อมีชั้น Ortho เปิดอยู่ */}
              {selectedOrthoIds.length > 0 && (
                <OrthoOpacityControl value={OrthoOpacity} onChange={setOrthoOpacity} />
              )}

              {/* ==================== Data Points (จุดข้อมูลบนแผนที่) ==================== */}
              {/* วาด Circle สำหรับแต่ละฟาร์ม และเปิด popup เมื่อคลิก */}
              <MapFeatureCircles
                features={filteredPoints}
                onViewDetail={feature => {
                  setSelectedFeature(feature);       // เลือก feature สำหรับดูรายละเอียด
                  setDashboardCollapsed(false);       // เปิด dashboard ถ้าถูกย่ออยู่
                  mapRef.current?.closePopup();       // ปิด popup บนแผนที่
                  handleZoomToFeature(feature);       // ซูมไปตำแหน่งฟาร์ม + แสดง highlight
                }}
              />
            </MapContainer>
          </div>
        </section>

        {/* ==================== DASHBOARD (แดชบอร์ดขวา) ==================== */}
        {/* แสดงตารางข้อมูล หรือ หน้ารายละเอียดฟาร์ม */}
        <section style={{
          display: 'flex',
          flex: dashboardCollapsed ? 'none' : '0 0 45%',       // กว้าง 45% เมื่อขยาย, ซ่อนเมื่อย่อ
          width: dashboardCollapsed ? 24 : '100%',              // กว้าง 24px เมื่อย่อ (แค่ปุ่ม toggle)
          height: '100%',
          transition: 'flex 0.25s ease, width 0.25s ease',      // animation เมื่อย่อ/ขยาย
          overflow: 'hidden',
        }}>
          {/* ปุ่ม Toggle ย่อ/ขยาย Dashboard */}
          <button
            onClick={() => setDashboardCollapsed(v => !v)}
            style={{
              width: 24,
              minWidth: 24,
              height: '100%',
              background: 'var(--c-bg-secondary)',
              border: 'none',
              borderLeft: '1px solid var(--c-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--c-text-secondary)',
              fontSize: 14,
              padding: 0,
              transition: 'all 0.25s ease',
              flexShrink: 0,
            }}
            aria-label={dashboardCollapsed ? 'ขยายแดชบอร์ด' : 'ย่อแดชบอร์ด'}
          >
            {dashboardCollapsed ? '‹' : '›'} {/* ลูกศรบอกทิศทาง */}
          </button>
          {/* เนื้อหา Dashboard (แสดงเมื่อขยาย) */}
          {!dashboardCollapsed && (
            <div style={{ flex: 1, width: '100%', padding: '16px 16px 16px 8px', height: '100%' }}>
              {/* ถ้ามี feature ที่เลือก → แสดงรายละเอียด, ถ้าไม่มี → แสดงตาราง */}
              {selectedFeature ? (
                <FeatureDetail
                  feature={selectedFeature}                 // ข้อมูล feature ที่เลือก
                  onBack={() => { setSelectedFeature(null); hideHighlight(); }}   // กลับไปหน้าตาราง + ซ่อน highlight
                  onZoomToFeature={handleZoomToFeature}     // ซูมไปตำแหน่งฟาร์ม
                  authToken={authToken}                     // token สำหรับอัปโหลดรูป
                />
              ) : (
                <DashboardTable
                  points={filteredPoints}                   // ข้อมูลจุดที่ผ่านการกรอง
                  onSelectFeature={feature => {
                    setSelectedFeature(feature);            // เลือก feature
                    handleZoomToFeature(feature);           // ซูมไปตำแหน่ง
                  }}
                />
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default App; // ส่งออก App component เป็น default export