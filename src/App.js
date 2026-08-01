/**
 * App.js — คอมโพเนนต์หลักของแอปพลิเคชัน
 * ทำหน้าที่จัดวาง Layout ทั้งหมด: Header, Sidebar, Map, Dashboard
 * รวมถึงจัดการ State หลัก เช่น ธีม, แผนที่ฐาน, ข้อมูลจุด, และ Layer ที่เลือก
 */

// === นำเข้า React hooks ที่ใช้งาน ===
import React, { useRef, useState, useEffect } from 'react';

// === นำเข้า react-leaflet สำหรับแสดงแผนที่ ===
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
import orthoLayers from './orthoLayers';         // รายการชั้น Ortho / ความหนาแน่น
import RainLegend from './RainLegend';           // คำอธิบายความเข้มฝนของ Layer เรดาร์ฝน
import RainTimeline from './RainTimeline';       // แถบเวลา + ควบคุมความเร็วของเรดาร์ฝน

// === นำเข้า CSS เพิ่มเติม ===
import './MapOverrides.css';  // ปรับแต่ง style ของ Leaflet (popup, tooltip, zoom)
import './sarabun-font.css';  // ฟอนต์ภาษาไทย Sarabun

import WaterQualityDashboard from './WaterQualityDashboard'; // กราฟแสดงคุณภาพน้ำ

/**
 * BASEMAPS — รายการแผนที่ฐานที่ใช้งานได้ทั้งหมด
 */
const BASEMAPS = [
  { id: 'osm',        label: 'OpenStreetMap',  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { id: 'carto-dark',  label: 'Dark',           url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png' },
  { id: 'carto-light', label: 'Light',          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { id: 'carto-voyager', label: 'Voyager',      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  { id: 'esri-satellite', label: 'Satellite',   url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'esri-topo',  label: 'Topo',            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
];

// กุญแจ Longdo Weather API (ขอรับฟรีได้ที่ https://api.longdo.com/console/) ต้องตั้งค่าใน .env เป็น REACT_APP_LONGDO_WEATHER_KEY
const LONGDO_WEATHER_KEY = process.env.REACT_APP_LONGDO_WEATHER_KEY || '';
const RAIN_LAYER_URL = `https://weather.longdo.com/rain/api/v1/layer/latest/{z}/{x}/{y}.png?key=${LONGDO_WEATHER_KEY}`;

/**
 * getFeatureViewTarget — คำนวณตำแหน่งและขอบเขตของ feature บนแผนที่
 */
function getFeatureViewTarget(feature) {
  if (!feature) return null;

  try {
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      return { center: bounds.getCenter(), bounds };
    }
  } catch {}

  let coords = feature?.geometry?.coordinates;
  while (Array.isArray(coords) && Array.isArray(coords[0])) {
    coords = coords[0];
  }
  if (!coords || coords.length < 2) return null;

  return { center: L.latLng(coords[1], coords[0]), bounds: null };
}

function MapInstanceBridge({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);
  return null;
}

function LayerPaneSetup() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('amphoePane')) map.createPane('amphoePane');
    if (!map.getPane('OrthoPane')) map.createPane('OrthoPane');
    if (!map.getPane('waterwayPane')) map.createPane('waterwayPane');
    if (!map.getPane('rainPane')) map.createPane('rainPane');
    if (!map.getPane('livestockPane')) map.createPane('livestockPane');

    map.getPane('amphoePane').style.zIndex = 330;
    map.getPane('waterwayPane').style.zIndex = 339;
    map.getPane('OrthoPane').style.zIndex = 340;
    map.getPane('rainPane').style.zIndex = 345;
    map.getPane('livestockPane').style.zIndex = 350;
  }, [map]);
  return null;
}

function App() {
  // === State Management ===
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  
  // State ควบคุม Tab ใน Dashboard ('table' หรือ 'graph')
  const [dashboardTab, setDashboardTab] = useState('table'); 

  const [points, setPoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const searchValue = "";
  const [selectedLayerIds, setSelectedLayerIds] = useState([]);
  const [selectedOrthoIds, setSelectedOrthoIds] = useState([]);
  const [orthoOpacities, setOrthoOpacities] = useState({}); // ความทึบแยกตาม layer.id คงค่าเดิมไว้แม้ปิดแล้วเปิดใหม่
  const [rainEnabled, setRainEnabled] = useState(false);
  const [rainFrames, setRainFrames] = useState([]); // ภาพเรดาร์ย้อนหลัง [{ time, path }] เรียงจากเก่าไปใหม่
  const [rainFrameIdx, setRainFrameIdx] = useState(0);
  const [rainPlaying, setRainPlaying] = useState(true);
  const [rainSpeed, setRainSpeed] = useState(1); // ตัวคูณความเร็ว 0.5x / 1x / 2x
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [basemapId, setBasemapId] = useState(() => localStorage.getItem('basemap') || 'osm');
  const [basemapOpen, setBasemapOpen] = useState(false);
  const basemapManualRef = useRef(false);
  const [mapCenter] = useState([7.206227, 100.602645]);
  const [mapZoom] = useState(14);
  const [theme, setTheme] = useState('light');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  const [authUser, setAuthUser] = useState(() => localStorage.getItem('authUser') || null);
  const [showLogin, setShowLogin] = useState(false);
  
  const toggleBtnRef = useRef();
  const mapRef = useRef();
  const highlightMarkerRef = useRef(null);

  const showHighlight = (latLng) => {
    const map = mapRef.current;
    if (!map) return;
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
    highlightMarkerRef.current.setLatLng(latLng);
    highlightMarkerRef.current.setOpacity(1);
    const el = highlightMarkerRef.current.getElement();
    if (el) el.style.display = '';
  };

  const hideHighlight = () => {
    if (highlightMarkerRef.current) {
      highlightMarkerRef.current.setOpacity(0);
      const el = highlightMarkerRef.current.getElement();
      if (el) el.style.display = 'none';
    }
  };

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const btn = toggleBtnRef.current;
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const overlay = document.createElement('div');
    overlay.className = 'theme-reveal-overlay';
    overlay.style.setProperty('--reveal-x', `${x}px`);
    overlay.style.setProperty('--reveal-y', `${y}px`);

    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    overlay.style.background = getComputedStyle(document.documentElement).getPropertyValue('--c-bg-app');
    document.documentElement.setAttribute('data-theme', nextTheme === 'light' ? 'dark' : 'light');

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      setTheme(t => t === 'dark' ? 'light' : 'dark');
    });

    overlay.addEventListener('animationend', () => overlay.remove());
  };

  useEffect(() => {
    localStorage.setItem('basemap', basemapId);
  }, [basemapId]);

  useEffect(() => {
    if (!basemapManualRef.current) {
      setBasemapId(theme === 'dark' ? 'carto-dark' : 'osm');
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [dashboardCollapsed, sidebarCollapsed]);

  const selectedBasemap = BASEMAPS.find(b => b.id === basemapId) || BASEMAPS[0];

  useEffect(() => {
    if (!searchValue) {
      setFilteredPoints(points);
    } else {
      setFilteredPoints(
        points.filter(f =>
          f.properties?.location?.toLowerCase().includes(searchValue.toLowerCase())
        )
      );
    }
  }, [points, searchValue]);

  useEffect(() => {
    const flatLayers = layers.flatMap(cat => cat.items || [cat]);
    const selectedLayers = flatLayers.filter(l => selectedLayerIds.includes(l.id) && l.kind !== 'line');

    if (!selectedLayers.length) {
      setPoints([]);
      mapRef.current?.closePopup();
      return;
    }

    let allFeatures = [];
    let fetchCount = 0;

    selectedLayers.forEach(layer => {
      const wfsUrl = `https://map.surveywms.com/geoserver/ChalatatSongkhla/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ChalatatSongkhla:${encodeURIComponent(layer.name)}&outputFormat=application/json&maxFeatures=100`;
      
      fetch(wfsUrl)
        .then(res => res.json())
        .then(data => {
          if (data.features) allFeatures = [...allFeatures, ...data.features];
        })
        .catch(err => console.error("Fetch error:", err))
        .finally(() => {
          fetchCount++;
          if (fetchCount === selectedLayers.length) setPoints(allFeatures);
        });
    });
  }, [selectedLayerIds]);

  // ดึงรายการภาพเรดาร์ฝนย้อนหลังมาทำเป็นภาพเคลื่อนไหว
  useEffect(() => {
    if (!rainEnabled || !LONGDO_WEATHER_KEY) return;
    let cancelled = false;

    const fetchList = () => {
      fetch(`https://weather.longdo.com/rain/api/v1/layer/list?key=${LONGDO_WEATHER_KEY}`)
        .then(res => res.json())
        .then(data => {
          if (cancelled) return;
          const past = data?.radar?.past || [];
          if (past.length > 0) {
            setRainFrames(past);
            setRainFrameIdx(past.length - 1); // เริ่มที่เฟรมล่าสุด
          }
        })
        .catch(err => console.error('Fetch rain layer list error:', err));
    };

    fetchList();
    const refreshTimer = setInterval(fetchList, 5 * 60 * 1000); // รีเฟรชรายการเฟรมทุก 5 นาที
    return () => { cancelled = true; clearInterval(refreshTimer); };
  }, [rainEnabled]);

  // สลับเฟรมเรดาร์ฝนวนลูปให้เห็นทิศทางการเคลื่อนที่ของกลุ่มฝน
  useEffect(() => {
    if (!rainEnabled || !rainPlaying || rainFrames.length === 0) return;
    const baseInterval = 1000; // ms ต่อเฟรมที่ความเร็วปกติ (1x)
    const playTimer = setInterval(() => {
      setRainFrameIdx(i => (i + 1) % rainFrames.length);
    }, baseInterval / rainSpeed);
    return () => clearInterval(playTimer);
  }, [rainEnabled, rainPlaying, rainFrames, rainSpeed]);

  // เลื่อนดูเฟรมด้วยตนเองจะหยุดเล่นอัตโนมัติไว้ก่อน
  const handleRainSeek = idx => {
    setRainPlaying(false);
    setRainFrameIdx(idx);
  };

  const rainTileUrl = rainFrames.length > 0
    ? `https://weather.longdo.com${rainFrames[rainFrameIdx].path}/{z}/{x}/{y}.png?key=${LONGDO_WEATHER_KEY}`
    : RAIN_LAYER_URL; // ระหว่างโหลดรายการเฟรม ให้ใช้ภาพล้าสุดไปก่อน

  const handleOrthoOpacityChange = (layerId, value) => {
    setOrthoOpacities(prev => ({ ...prev, [layerId]: value }));
  };

  const handleZoomToFeature = feature => {
    mapRef.current?.closePopup();

    const target = getFeatureViewTarget(feature);
    if (!target || !mapRef.current) return;

    if (target.bounds) {
      const currentBounds = mapRef.current.getBounds();
      const isSameBounds = currentBounds && currentBounds.contains(target.bounds) && target.bounds.contains(currentBounds);
      if (!isSameBounds) {
        mapRef.current.fitBounds(target.bounds, { padding: [40, 40], maxZoom: 15 });
      }
      return;
    }

    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();
    const targetZoom = Math.max(currentZoom, 15);
    const isSame = currentCenter && currentCenter.lat === target.center.lat && currentCenter.lng === target.center.lng && currentZoom === targetZoom;
    if (!isSame) {
      mapRef.current.setView(target.center, targetZoom, { animate: true });
    }
  };

  useEffect(() => {
    if (!selectedFeature) return;
    const target = getFeatureViewTarget(selectedFeature);
    if (target && mapRef.current) {
      showHighlight(target.center);
    }
    // สลับมาหน้าตารางอัตโนมัติเมื่อเลือกจุด เพื่อให้แสดงรายละเอียดฟาร์ม
    setDashboardTab('table');
  }, [selectedFeature]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--c-bg-app)' }}>
      <header style={{
        height: '56px', minHeight: '56px',
        background: 'linear-gradient(135deg, var(--c-header-start) 0%, var(--c-header-end) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        padding: '0 24px', borderBottom: '1px solid var(--c-border)', boxShadow: 'var(--c-shadow)', zIndex: 1000,
      }}>
        <img
          src={process.env.PUBLIC_URL + '/assets/logo.png'}
          alt="logo"
          style={{ position: 'absolute', left: 16, height: 40, width: 160, objectFit: 'contain', filter: 'var(--c-logo-filter)' }}
        />
        <h1 style={{
          fontSize: '17px', margin: 0, color: 'var(--c-text)', fontFamily: 'Sarabun-Medium',
          textAlign: 'center', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, letterSpacing: 0.3,
        }}>
          HydroGIS ชลาทัศน์ : ศูนย์แผนที่สำรวจและคุณภาพน้ำ
        </h1>
        <div style={{ position: 'absolute', right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
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
              background: 'var(--c-bg-icon)', border: '1px solid var(--c-border)', borderRadius: 8,
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--c-accent-light)', transition: 'all 0.2s',
            }}
            aria-label={theme === 'dark' ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}
          >
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

      {showLogin && (
        <Login
          onLogin={({ token, username }) => { setAuthToken(token); setAuthUser(username); setShowLogin(false); }}
          onClose={() => setShowLogin(false)}
        />
      )}

      <main style={{ flex: 1, display: 'flex', gap: 0, minHeight: 0 }}>
        
        <aside style={{
          width: sidebarCollapsed ? 64 : 220, minWidth: sidebarCollapsed ? 64 : 220,
          height: '100%', overflowY: 'auto', transition: 'width 0.25s ease, min-width 0.25s ease',
        }}>
          <Sidebar
            onLayerChange={ids => {
              setSelectedLayerIds(ids); mapRef.current?.closePopup(); hideHighlight();
            }}
            onOrthoChange={setSelectedOrthoIds}
            onRainChange={setRainEnabled}
            orthoOpacities={orthoOpacities}
            onOrthoOpacityChange={handleOrthoOpacityChange}
            collapsed={sidebarCollapsed}
            onCollapseChange={setSidebarCollapsed}
          />
        </aside>

        <section style={{
          flex: sidebarCollapsed ? 2.7 : 2, height: '100%', padding: 16, transition: 'flex 0.2s',
        }}>
          <div style={{
            height: '100%', borderRadius: 12, overflow: 'hidden',
            boxShadow: 'var(--c-shadow-card)', border: '1px solid var(--c-border)',
          }}>
            <MapContainer
              center={mapCenter} zoom={mapZoom} maxZoom={24} closePopupOnClick={false}
              style={{ height: '100%', width: '100%' }}
            >
              <MapInstanceBridge mapRef={mapRef} />
              <LayerPaneSetup />
              
              <TileLayer url={selectedBasemap.url} maxZoom={24} maxNativeZoom={19} />

              <WMSTileLayer
                url="https://map.surveywms.com/geoserver/LiveStock/wms"
                layers="ChalatatSongkhla:eiei"
                format="image/png" transparent={true} version="1.1.1" pane="amphoePane"
              />

              <div style={{
                position: 'absolute', top: 10, right: 10, zIndex: 1000,
                fontFamily: 'Sarabun-Medium, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
              }}>
                <button
                  onClick={() => setBasemapOpen(v => !v)}
                  style={{
                    background: 'var(--c-bg-primary)', border: '1px solid var(--c-border)', borderRadius: 8,
                    padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--c-text)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--c-shadow)', fontFamily: 'inherit',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  </svg>
                  {selectedBasemap.label}
                </button>
                {basemapOpen && (
                  <div style={{
                    marginTop: 4, background: 'var(--c-bg-primary)', border: '1px solid var(--c-border)',
                    borderRadius: 8, padding: 4, boxShadow: 'var(--c-shadow-lg)', minWidth: 140,
                  }}>
                    {BASEMAPS.map(b => (
                      <div
                        key={b.id}
                        onClick={() => { basemapManualRef.current = true; setBasemapId(b.id); setBasemapOpen(false); }}
                        style={{
                          padding: '8px 12px', fontSize: 12, fontWeight: b.id === basemapId ? 700 : 500,
                          color: b.id === basemapId ? 'var(--c-accent-light)' : 'var(--c-text)',
                          background: b.id === basemapId ? 'var(--c-accent-bg)' : 'transparent',
                          borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s',
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
              
              {layers.flatMap(cat => cat.items || [cat])
                .filter(l => selectedLayerIds.includes(l.id))
                .map(layer => (
                  <WMSTileLayer
                    key={layer.id}
                    url="https://map.surveywms.com/geoserver/ChalatatSongkhla/wms"
                    layers={`ChalatatSongkhla:${layer.name}`}
                    format="image/png" transparent={true} version="1.1.1" maxZoom={24}
                    pane={layer.id === 'waterway' ? 'waterwayPane' : 'livestockPane'}
                  />
                ))}

              {/* แตกหมวดหมู่ OrthoLayers ออกมาก่อนนำไปสร้างบนแผนที่ */}
              {orthoLayers.flatMap(cat => cat.items || [cat])
                .filter(l => selectedOrthoIds.includes(l.id))
                .map(layer => (
                  <WMSTileLayer
                    key={layer.id}
                    url="https://map.surveywms.com/geoserver/ChalatatSongkhla/wms"
                    layers={`ChalatatSongkhla:${layer.name}`}
                    format="image/png" transparent={true} version="1.1.1" maxZoom={24} opacity={orthoOpacities[layer.id] ?? 0.4} pane="OrthoPane"
                  />
                ))}

              {rainEnabled && (
                <>
                  <TileLayer
                    url={rainTileUrl}
                    opacity={0.7}
                    maxZoom={24}
                    minZoom={0}
                    maxNativeZoom={13}
                    minNativeZoom={5}
                    pane="rainPane"
                  />
                  <RainLegend />
                  <RainTimeline
                    frames={rainFrames}
                    currentIndex={rainFrameIdx}
                    onSeek={handleRainSeek}
                    playing={rainPlaying}
                    onTogglePlay={() => setRainPlaying(v => !v)}
                    speed={rainSpeed}
                    onSpeedChange={setRainSpeed}
                    centered={dashboardCollapsed}
                  />
                </>
              )}

              <MapFeatureCircles
                features={filteredPoints}
                onViewDetail={feature => {
                  setSelectedFeature(feature);
                  setDashboardCollapsed(false);
                  mapRef.current?.closePopup();
                  handleZoomToFeature(feature);
                }}
              />
            </MapContainer>
          </div>
        </section>

        <section style={{
          display: 'flex', flex: dashboardCollapsed ? 'none' : '0 0 45%', width: dashboardCollapsed ? 24 : '100%',
          height: '100%', transition: 'flex 0.25s ease, width 0.25s ease', overflow: 'hidden',
        }}>
          <button
            onClick={() => setDashboardCollapsed(v => !v)}
            style={{
              width: 24, minWidth: 24, height: '100%', background: 'var(--c-bg-secondary)', border: 'none',
              borderLeft: '1px solid var(--c-border)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--c-text-secondary)', fontSize: 14, padding: 0,
              transition: 'all 0.25s ease', flexShrink: 0,
            }}
            aria-label={dashboardCollapsed ? 'ขยายแดชบอร์ด' : 'ย่อแดชบอร์ด'}
          >
            {dashboardCollapsed ? '‹' : '›'}
          </button>
          
          {!dashboardCollapsed && (
            <div style={{ flex: 1, width: '100%', padding: '16px 16px 16px 8px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {/* แถบปุ่มสลับ Tab สำหรับ Dashboard */}
              <div style={{
                display: 'inline-flex', gap: 4, marginBottom: 12,
                background: 'var(--c-bg-secondary)', padding: 4, borderRadius: 12,
                alignSelf: 'flex-start',
              }}>
                <button
                  onClick={() => setDashboardTab('table')}
                  style={{
                    padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: 13, fontFamily: 'Sarabun-Medium, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.18s ease',
                    background: dashboardTab === 'table' ? 'var(--c-bg-primary)' : 'transparent',
                    color: dashboardTab === 'table' ? 'var(--c-accent-light)' : 'var(--c-text-secondary)',
                    boxShadow: dashboardTab === 'table' ? 'var(--c-shadow)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 16 }}>📋</span>
                  ข้อมูลชายหาดชลาทัศน์
                </button>
                <button
                  onClick={() => setDashboardTab('graph')}
                  style={{
                    padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: 13, fontFamily: 'Sarabun-Medium, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.18s ease',
                    background: dashboardTab === 'graph' ? 'var(--c-bg-primary)' : 'transparent',
                    color: dashboardTab === 'graph' ? 'var(--c-accent-light)' : 'var(--c-text-secondary)',
                    boxShadow: dashboardTab === 'graph' ? 'var(--c-shadow)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 16 }}>📈</span>
                  หน้ากราฟ
                </button>
              </div>

              {/* เนื้อหาด้านล่างตาม Tab ที่เลือก */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {dashboardTab === 'table' ? (
                  selectedFeature ? (
                    <FeatureDetail
                      feature={selectedFeature}
                      onBack={() => { setSelectedFeature(null); hideHighlight(); }}
                      onZoomToFeature={handleZoomToFeature}
                      authToken={authToken}
                    />
                  ) : (
                    <DashboardTable
                      points={filteredPoints}
                      onSelectFeature={feature => {
                        setSelectedFeature(feature);
                        handleZoomToFeature(feature);
                      }}
                    />
                  )
                ) : (
                  <WaterQualityDashboard points={filteredPoints} />
                )}
              </div>

            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;