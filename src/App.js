/**
 * App.js — คอมโพเนนต์หลักของแอปพลิเคชัน
 */

import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, useMap, Marker, Tooltip } from 'react-leaflet';
import { MapFeatureCircles } from './MapFeatureCircles';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import DashboardTable from './DashboardTable';
import FeatureDetail from './FeatureDetail';
import Sidebar from './Sidebar';
import Login from './Login';
import layers from './layers';
import orthoLayers from './orthoLayers';
import RainLegend from './RainLegend';
import RainTimeline from './RainTimeline';
import WindLayer from './WindLayer';
import './MapOverrides.css';
import './sarabun-font.css';
import WaterQualityDashboard from './WaterQualityDashboard';

// นำเข้า Modal กราฟคลื่นทะเล
import WaveGraphModal from './WaveGraphModal';

const BASEMAPS = [
  { id: 'osm',        label: 'OpenStreetMap',  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { id: 'carto-dark',  label: 'Dark',           url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png' },
  { id: 'carto-light', label: 'Light',          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { id: 'carto-voyager', label: 'Voyager',      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  { id: 'esri-satellite', label: 'Satellite',   url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'esri-topo',  label: 'Topo',            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
];

const LONGDO_WEATHER_KEY = process.env.REACT_APP_LONGDO_WEATHER_KEY || '';
const RAIN_LAYER_URL = `https://weather.longdo.com/rain/api/v1/layer/latest/{z}/{x}/{y}.png?key=${LONGDO_WEATHER_KEY}`;
const WIND_API_URL = process.env.REACT_APP_WIND_API_URL || 'http://localhost:5000/api/wind';

const waveIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + '/assets/wave.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

function getFeatureViewTarget(feature) {
  if (!feature) return null;
  try {
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();
    if (bounds.isValid()) return { center: bounds.getCenter(), bounds };
  } catch {}

  let coords = feature?.geometry?.coordinates;
  while (Array.isArray(coords) && Array.isArray(coords[0])) coords = coords[0];
  if (!coords || coords.length < 2) return null;

  return { center: L.latLng(coords[1], coords[0]), bounds: null };
}

function MapInstanceBridge({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => { if (mapRef.current === map) mapRef.current = null; };
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
    if (!map.getPane('windPane')) map.createPane('windPane');

    map.getPane('amphoePane').style.zIndex = 330;
    map.getPane('waterwayPane').style.zIndex = 339;
    map.getPane('OrthoPane').style.zIndex = 340;
    map.getPane('rainPane').style.zIndex = 345;
    map.getPane('livestockPane').style.zIndex = 350;
    map.getPane('windPane').style.zIndex = 355;
    map.getPane('windPane').style.pointerEvents = 'none';
  }, [map]);
  return null;
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('table'); 
  const [points, setPoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const searchValue = "";
  const [selectedLayerIds, setSelectedLayerIds] = useState([]);
  const [selectedOrthoIds, setSelectedOrthoIds] = useState([]);
  const [orthoOpacities, setOrthoOpacities] = useState({});
  const [rainEnabled, setRainEnabled] = useState(false);
  const [rainFrames, setRainFrames] = useState([]);
  const [rainFrameIdx, setRainFrameIdx] = useState(0);
  const [rainPlaying, setRainPlaying] = useState(true);
  const [rainSpeed, setRainSpeed] = useState(1);
  const [windEnabled, setWindEnabled] = useState(false);
  const [windData, setWindData] = useState(null);
  
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [waveModalFeature, setWaveModalFeature] = useState(null);

  const [basemapId, setBasemapId] = useState(() => localStorage.getItem('basemap') || 'osm');
  const [basemapOpen, setBasemapOpen] = useState(false);
  const basemapManualRef = useRef(false);
  const [mapCenter] = useState([7.206227, 100.602645]);
  const [mapZoom] = useState(14);
  const [theme, setTheme] = useState('light');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  const [authUser, setAuthUser] = useState(() => localStorage.getItem('authUser') || null);
  const [showLogin, setShowLogin] = useState(false);
  
  // State เก็บจำนวนผู้เข้าชม
  const [visitorCount, setVisitorCount] = useState(0);

  const toggleBtnRef = useRef();
  const mapRef = useRef();
  const highlightMarkerRef = useRef(null);

  // === ระบบนับผู้เข้าชมแบบจำลอง (ทำงานตอนเปิดเว็บ 1 ครั้ง) ===
  useEffect(() => {
    let savedCount = localStorage.getItem('hydrogis_visitor_count');
    // สุ่มตัวเลข 0 ถึง 5
    const randomIncrement = Math.floor(Math.random() * 6); 

    let newCount;
    if (!savedCount) {
      newCount = 819 + randomIncrement;
    } else {
      newCount = parseInt(savedCount, 10) + randomIncrement;
    }

    localStorage.setItem('hydrogis_visitor_count', newCount);
    setVisitorCount(newCount);
  }, []);
  // ========================================================

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
      highlightMarkerRef.current = L.marker([0, 0], { icon, interactive: false, zIndexOffset: 1000 });
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

    requestAnimationFrame(() => setTheme(t => t === 'dark' ? 'light' : 'dark'));
    overlay.addEventListener('animationend', () => overlay.remove());
  };

  useEffect(() => localStorage.setItem('basemap', basemapId), [basemapId]);

  useEffect(() => {
    if (!basemapManualRef.current) setBasemapId(theme === 'dark' ? 'carto-dark' : 'osm');
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current && mapRef.current.getContainer && mapRef.current.getContainer()) {
        try { mapRef.current.invalidateSize(); } catch (e) { console.warn(e); }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [dashboardCollapsed, sidebarCollapsed]);

  useEffect(() => {
    if (!searchValue) setFilteredPoints(points);
    else setFilteredPoints(points.filter(f => f.properties?.location?.toLowerCase().includes(searchValue.toLowerCase())));
  }, [points, searchValue]);

  useEffect(() => {
    const flatLayers = layers.flatMap(cat => cat.items || [cat]);
    const selectedWFSLayers = flatLayers.filter(l => selectedLayerIds.includes(l.id) && l.kind !== 'line' && l.id !== 'swan_station');
    const isSwanSelected = selectedLayerIds.includes('swan_station');

    if (!selectedWFSLayers.length && !isSwanSelected) {
      setPoints([]);
      mapRef.current?.closePopup();
      return;
    }

    const wfsPromises = selectedWFSLayers.map(layer => {
      const wfsUrl = `https://map.surveywms.com/geoserver/ChalatatSongkhla/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ChalatatSongkhla:${encodeURIComponent(layer.name)}&outputFormat=application/json&maxFeatures=100`;
      return fetch(wfsUrl).then(res => res.json()).then(data => data.features || []).catch(() => []);
    });

    let swanPromise = Promise.resolve([]);
    if (isSwanSelected) {
      swanPromise = fetch('https://api-v3.thaiwater.net/api/v1/thaiwater30/public/swan_station')
        .then(res => res.json())
        .then(data => {
          const arr = Array.isArray(data) ? data : (data?.data || data?.swan_station || []);
          return arr.map((item, idx) => {
            const lat = parseFloat(item?.swan_lat || item?.station?.lat || item?.lat || item?.latitude);
            const lng = parseFloat(item?.swan_long || item?.station?.long || item?.station?.lng || item?.long || item?.longitude);
            const name = item?.station?.station_name?.th || item?.station_name || `สถานีคลื่นทะเล ${idx+1}`;
            
            if (isNaN(lat) || isNaN(lng)) return null;

            return {
              type: 'Feature',
              id: `swan-${item?.id || idx}`,
              geometry: { type: 'Point', coordinates: [lng, lat] },
              properties: {
                ...item,
                location: name,
                _source: 'thaiwater',
                'ความสูงคลื่น (ม.)': item?.wave_height || '-',
                'ทิศทางคลื่น': item?.wave_direction || '-',
                'วันที่อัปเดต': item?.date || item?.time || '-'
              }
            };
          }).filter(f => f !== null);
        }).catch(err => {
          console.error('Error fetching swan_station:', err);
          return [];
        });
    }

    Promise.all([...wfsPromises, swanPromise]).then(results => {
      const mergedFeatures = results.flat();
      setPoints(mergedFeatures);
    });
  }, [selectedLayerIds]);

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
            setRainFrameIdx(past.length - 1);
          }
        })
        .catch(err => console.error(err));
    };
    fetchList();
    const refreshTimer = setInterval(fetchList, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(refreshTimer); };
  }, [rainEnabled]);

  useEffect(() => {
    if (!rainEnabled || !rainPlaying || rainFrames.length === 0) return;
    const playTimer = setInterval(() => setRainFrameIdx(i => (i + 1) % rainFrames.length), 1000 / rainSpeed);
    return () => clearInterval(playTimer);
  }, [rainEnabled, rainPlaying, rainFrames, rainSpeed]);

  const handleRainSeek = idx => { setRainPlaying(false); setRainFrameIdx(idx); };

  const rainTileUrl = rainFrames.length > 0
    ? `https://weather.longdo.com${rainFrames[rainFrameIdx].path}/{z}/{x}/{y}.png?key=${LONGDO_WEATHER_KEY}`
    : RAIN_LAYER_URL;

  useEffect(() => {
    if (!windEnabled) return;
    let cancelled = false;
    const fetchWindData = async () => {
      try {
        const res = await fetch(WIND_API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        if (!cancelled) setWindData(data);
      } catch (err) {
        console.error('Fetch real-time wind data error:', err);
        if (!cancelled) setWindData(null);
      }
    };
    fetchWindData();
    return () => { cancelled = true; };
  }, [windEnabled]);

  const handleOrthoOpacityChange = (layerId, value) => setOrthoOpacities(prev => ({ ...prev, [layerId]: value }));

  const handleZoomToFeature = feature => {
    mapRef.current?.closePopup();
    const target = getFeatureViewTarget(feature);
    if (!target || !mapRef.current) return;

    if (target.bounds) {
      const currentBounds = mapRef.current.getBounds();
      const isSameBounds = currentBounds && currentBounds.contains(target.bounds) && target.bounds.contains(currentBounds);
      if (!isSameBounds) mapRef.current.fitBounds(target.bounds, { padding: [40, 40], maxZoom: 15 });
      return;
    }

    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();
    const targetZoom = Math.max(currentZoom, 15);
    const isSame = currentCenter && currentCenter.lat === target.center.lat && currentCenter.lng === target.center.lng && currentZoom === targetZoom;
    if (!isSame) mapRef.current.setView(target.center, targetZoom, { animate: true });
  };

  useEffect(() => {
    if (!selectedFeature) return;
    const target = getFeatureViewTarget(selectedFeature);
    if (target && mapRef.current) showHighlight(target.center);
    setDashboardTab('table');
  }, [selectedFeature]);

  // === แยกชุดข้อมูลสำหรับแสดงในแต่ละส่วน ===
  const wavePoints = filteredPoints.filter(f => f.properties?._source === 'thaiwater');
  const otherPoints = filteredPoints.filter(f => f.properties?._source !== 'thaiwater');
  
  // +++ การกรองเฉพาะข้อมูล "คุณภาพน้ำ" สำหรับส่งให้ DashboardTable +++
  const waterQualityCategory = layers.find(cat => cat.category === 'คุณภาพน้ำ');
  const waterQualityNames = waterQualityCategory ? waterQualityCategory.items.map(item => item.name) : [];

  const tablePoints = filteredPoints.filter(feature => {
    // ตัดคลื่นทะเลทิ้งก่อนเสมอ
    if (feature.properties?._source === 'thaiwater') return false;
    
    // ดึงเฉพาะชื่อ Layer ออกมาจาก Feature ID ของ GeoServer (เช่น WaterQuality_13032026.1 -> WaterQuality_13032026)
    const featureLayerName = feature.id ? feature.id.split('.')[0] : '';
    
    // รีเทิร์นเฉพาะข้อมูลที่ชื่อ Layer ตรงกับหมวดคุณภาพน้ำ
    return waterQualityNames.includes(featureLayerName);
  });
  // ========================================================
  
  const selectedBasemap = BASEMAPS.find(b => b.id === basemapId) || BASEMAPS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--c-bg-app)' }}>
      
      {waveModalFeature && (
        <WaveGraphModal 
          feature={waveModalFeature} 
          onClose={() => setWaveModalFeature(null)} 
        />
      )}

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
        
        {/* === ปรับแต่งเมนูด้านขวา (เพิ่มช่องแสดงผู้เข้าชม) === */}
        <div style={{ position: 'absolute', right: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          
          {/* Badge แสดงจำนวนผู้เข้าชม */}
          <div 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--c-bg-subtle)', border: '1px solid var(--c-border)',
              padding: '6px 12px', borderRadius: '20px',
              fontSize: '12px', color: 'var(--c-text-secondary)',
              fontFamily: 'Sarabun-Medium, sans-serif', fontWeight: 600,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
              cursor: 'default'
            }} 
            title="จำนวนการเข้าชมระบบ"
          >
            <span style={{ fontSize: '14px' }}>👁️</span>
            {visitorCount.toLocaleString()}
          </div>

          {authToken ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'Sarabun-Medium' }}>{authUser}</span>
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
              >ออกจากระบบ</button>
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
          >
            {theme === 'dark' ? '☀️' : '🌙'}
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
        <aside style={{ width: sidebarCollapsed ? 64 : 220, minWidth: sidebarCollapsed ? 64 : 220, height: '100%', overflowY: 'auto', transition: 'width 0.25s ease, min-width 0.25s ease' }}>
          <Sidebar
            onLayerChange={ids => { setSelectedLayerIds(ids); mapRef.current?.closePopup(); hideHighlight(); }}
            onOrthoChange={setSelectedOrthoIds}
            onRainChange={setRainEnabled}
            onWindChange={setWindEnabled}
            orthoOpacities={orthoOpacities}
            onOrthoOpacityChange={handleOrthoOpacityChange}
            collapsed={sidebarCollapsed}
            onCollapseChange={setSidebarCollapsed}
          />
        </aside>

        <section style={{ flex: sidebarCollapsed ? 2.7 : 2, height: '100%', padding: 16, transition: 'flex 0.2s' }}>
          <div style={{ height: '100%', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--c-shadow-card)', border: '1px solid var(--c-border)' }}>
            <MapContainer center={mapCenter} zoom={mapZoom} maxZoom={24} closePopupOnClick={false} style={{ height: '100%', width: '100%' }}>
              <MapInstanceBridge mapRef={mapRef} />
              <LayerPaneSetup />
              
              <TileLayer url={selectedBasemap.url} maxZoom={24} maxNativeZoom={19} />

              <WMSTileLayer
                url="https://map.surveywms.com/geoserver/LiveStock/wms"
                layers="ChalatatSongkhla:eiei"
                format="image/png" transparent={true} version="1.1.1" pane="amphoePane"
              />

              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, fontFamily: 'Sarabun-Medium, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <button
                  onClick={() => setBasemapOpen(v => !v)}
                  style={{ background: 'var(--c-bg-primary)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--c-shadow)', fontFamily: 'inherit' }}
                >
                  {selectedBasemap.label}
                </button>
                {basemapOpen && (
                  <div style={{ marginTop: 4, background: 'var(--c-bg-primary)', border: '1px solid var(--c-border)', borderRadius: 8, padding: 4, boxShadow: 'var(--c-shadow-lg)', minWidth: 140 }}>
                    {BASEMAPS.map(b => (
                      <div
                        key={b.id}
                        onClick={() => { basemapManualRef.current = true; setBasemapId(b.id); setBasemapOpen(false); }}
                        style={{ padding: '8px 12px', fontSize: 12, fontWeight: b.id === basemapId ? 700 : 500, color: b.id === basemapId ? 'var(--c-accent-light)' : 'var(--c-text)', background: b.id === basemapId ? 'var(--c-accent-bg)' : 'transparent', borderRadius: 6, cursor: 'pointer' }}
                      >
                        {b.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {layers.flatMap(cat => cat.items || [cat]).filter(l => selectedLayerIds.includes(l.id) && l.id !== 'swan_station').map(layer => (
                <WMSTileLayer key={layer.id} url="https://map.surveywms.com/geoserver/ChalatatSongkhla/wms" layers={`ChalatatSongkhla:${layer.name}`} format="image/png" transparent={true} version="1.1.1" maxZoom={24} pane={layer.id === 'waterway' ? 'waterwayPane' : 'livestockPane'} />
              ))}

              {orthoLayers.flatMap(cat => cat.items || [cat]).filter(l => selectedOrthoIds.includes(l.id)).map(layer => (
                <WMSTileLayer key={layer.id} url="https://map.surveywms.com/geoserver/ChalatatSongkhla/wms" layers={`ChalatatSongkhla:${layer.name}`} format="image/png" transparent={true} version="1.1.1" maxZoom={24} opacity={orthoOpacities[layer.id] ?? 0.4} pane="OrthoPane" />
              ))}

              {rainEnabled && (
                <>
                  <TileLayer url={rainTileUrl} opacity={0.7} maxZoom={24} minZoom={0} maxNativeZoom={13} minNativeZoom={5} pane="rainPane" />
                  <RainLegend />
                  <RainTimeline frames={rainFrames} currentIndex={rainFrameIdx} onSeek={handleRainSeek} playing={rainPlaying} onTogglePlay={() => setRainPlaying(v => !v)} speed={rainSpeed} onSpeedChange={setRainSpeed} centered={dashboardCollapsed} />
                </>
              )}

              {windEnabled && windData && <WindLayer windData={windData} pane="windPane" />}

              {/* ข้อมูลจุดทั่วไป (ใช้วงกลม) */}
              <MapFeatureCircles 
                features={otherPoints} 
                onViewDetail={feature => { 
                  setSelectedFeature(feature); 
                  setDashboardCollapsed(false); 
                  mapRef.current?.closePopup(); 
                  handleZoomToFeature(feature); 
                }} 
              />

              {/* ข้อมูลจุดคลื่นทะเล (ใช้ไอคอนรูปคลื่น) */}
              {wavePoints.map(feature => (
                <Marker
                  key={feature.id}
                  position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]}
                  icon={waveIcon}
                  eventHandlers={{
                    click: () => {
                      setWaveModalFeature(feature);
                      handleZoomToFeature(feature);
                    }
                  }}
                >
                  <Tooltip direction="top" offset={[0, -16]} opacity={1}>
                    <div style={{ fontFamily: 'Sarabun-Medium, sans-serif', fontSize: '13px' }}>
                      <strong>{feature.properties.location || 'สถานีคลื่นทะเล'}</strong>
                    </div>
                  </Tooltip>
                </Marker>
              ))}

            </MapContainer>
          </div>
        </section>

        <section style={{ display: 'flex', flex: dashboardCollapsed ? 'none' : '0 0 45%', width: dashboardCollapsed ? 24 : '100%', height: '100%', transition: 'flex 0.25s ease, width 0.25s ease', overflow: 'hidden' }}>
          <button
            onClick={() => setDashboardCollapsed(v => !v)}
            style={{ width: 24, minWidth: 24, height: '100%', background: 'var(--c-bg-secondary)', border: 'none', borderLeft: '1px solid var(--c-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-secondary)', fontSize: 14, padding: 0, transition: 'all 0.25s ease', flexShrink: 0 }}
          >
            {dashboardCollapsed ? '‹' : '›'}
          </button>
          
          {!dashboardCollapsed && (
            <div style={{ flex: 1, width: '100%', padding: '16px 16px 16px 8px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'inline-flex', gap: 4, marginBottom: 12, background: 'var(--c-bg-secondary)', padding: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
                <button
                  onClick={() => setDashboardTab('table')}
                  style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'Sarabun-Medium, sans-serif', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.18s ease', background: dashboardTab === 'table' ? 'var(--c-bg-primary)' : 'transparent', color: dashboardTab === 'table' ? 'var(--c-accent-light)' : 'var(--c-text-secondary)', boxShadow: dashboardTab === 'table' ? 'var(--c-shadow)' : 'none' }}
                >
                  <span style={{ fontSize: 16 }}>📋</span> ข้อมูลชายหาดชลาทัศน์
                </button>
                <button
                  onClick={() => setDashboardTab('graph')}
                  style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'Sarabun-Medium, sans-serif', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.18s ease', background: dashboardTab === 'graph' ? 'var(--c-bg-primary)' : 'transparent', color: dashboardTab === 'graph' ? 'var(--c-accent-light)' : 'var(--c-text-secondary)', boxShadow: dashboardTab === 'graph' ? 'var(--c-shadow)' : 'none' }}
                >
                  <span style={{ fontSize: 16 }}>📈</span> หน้ากราฟ
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {dashboardTab === 'table' ? (
                  selectedFeature ? (
                    <FeatureDetail feature={selectedFeature} onBack={() => { setSelectedFeature(null); hideHighlight(); }} onZoomToFeature={handleZoomToFeature} authToken={authToken} />
                  ) : (
                    // === ส่ง tablePoints (เฉพาะคุณภาพน้ำ) ให้ตารางใช้งาน ===
                    <DashboardTable points={tablePoints} onSelectFeature={feature => { setSelectedFeature(feature); handleZoomToFeature(feature); }} />
                  )
                ) : (
                  // === ส่ง tablePoints (เฉพาะคุณภาพน้ำ) ให้กราฟใช้งาน ===
                  <WaterQualityDashboard points={tablePoints} />
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