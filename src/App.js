/**
 * App.js — คอมโพเนนต์หลักของแอปพลิเคชัน
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMap, Marker, Tooltip } from 'react-leaflet';
import { MapFeatureCircles } from './MapFeatureCircles';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import BacteriaLegend from './BacteriaLegend';

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
import './ThemeToggle.css'; // นำเข้าสไตล์สำหรับปุ่ม Day/Night Toggle แบบคลิปเป๊ะๆ
import './ResponsiveLayout.css'; // สไตล์ Responsive รองรับมือถือและแท็บเล็ต

// นำเข้า Modal กราฟคลื่นทะเล
import WaveGraphModal from './WaveGraphModal';
// นำเข้า กราฟ Cross Section
import CrossSectionGraph from './CrossSectionGraph';

const CARTO_KEY = process.env.REACT_APP_CARTO_API_KEY || '';
const cartoDarkUrl = CARTO_KEY 
  ? `https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`
  : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

const cartoLightUrl = CARTO_KEY
  ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`
  : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

const BASEMAPS = [
  { id: 'osm',            label: 'OSM',   fullLabel: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { id: 'carto-dark',     label: 'Dark',  fullLabel: 'Dark',          url: cartoDarkUrl },
  { id: 'carto-light',    label: 'Light', fullLabel: 'Light',         url: cartoLightUrl },
  { id: 'esri-satellite', label: 'Sat',   fullLabel: 'Satellite',     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'esri-topo',      label: 'Topo',  fullLabel: 'Topo',          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
];

const LONGDO_WEATHER_KEY = process.env.REACT_APP_LONGDO_WEATHER_KEY || '';
const RAIN_LAYER_URL = `https://weather.longdo.com/rain/api/v1/layer/latest/{z}/{x}/{y}.png?key=${LONGDO_WEATHER_KEY}`;
const WIND_API_URL = process.env.REACT_APP_WIND_API_URL || 'http://localhost:5000/api/wind';

// ชั้นข้อมูลเส้นแนวรูปตัด (crossline) - ยาวเส้นละ 400 ม. เรียงกัน 0+000 ถึง 7+400 มี field "station"
const CROSSLINE_WFS_URL = 'https://map.surveywms.com/geoserver/ChalatatSongkhla/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ChalatatSongkhla:crossline&outputFormat=application/json&maxFeatures=200';
const CROSSLINE_STATION_FIELD = 'station';
const CROSSLINE_COLOR = '#38bdf8';
const CROSSLINE_COLOR_SELECTED = '#f97316';
const CROSSLINE_WEIGHT = 2.5;
const CROSSLINE_WEIGHT_SELECTED = 6;
const CROSSLINE_OPACITY = 0.45;
const CROSSLINE_OPACITY_SELECTED = 1;

const waveIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + '/assets/wave.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// ไอคอนสำหรับตำแหน่งปัจจุบันของผู้ใช้
const userLocationIcon = L.divIcon({
  className: 'user-location-icon',
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
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
    if (!map.getPane('crosslinePane')) map.createPane('crosslinePane');

    map.getPane('amphoePane').style.zIndex = 330;
    map.getPane('waterwayPane').style.zIndex = 339;
    map.getPane('OrthoPane').style.zIndex = 340;
    map.getPane('rainPane').style.zIndex = 345;
    map.getPane('livestockPane').style.zIndex = 350;
    map.getPane('windPane').style.zIndex = 355;
    map.getPane('windPane').style.pointerEvents = 'none';
    map.getPane('crosslinePane').style.zIndex = 360;
  }, [map]);
  return null;
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('map'); // 'map' | 'data'
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

  const [selectedStation, setSelectedStation] = useState('0+000');
  const [crosslineFeatures, setCrosslineFeatures] = useState([]);
  const crosslineLayerRef = useRef(null);
  const selectedStationRef = useRef(selectedStation);
  
  const [userLocation, setUserLocation] = useState(null);

  const [basemapId, setBasemapId] = useState(() => localStorage.getItem('basemap') || 'osm');
  const [basemapOpen, setBasemapOpen] = useState(false);
  const basemapManualRef = useRef(false);
  const [mapCenter] = useState([7.206227, 100.602645]);
  const [mapZoom] = useState(14);
  const [theme, setTheme] = useState('light');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  const [authUser, setAuthUser] = useState(() => localStorage.getItem('authUser') || null);
  const [showLogin, setShowLogin] = useState(false);
  
  const [visitorCount, setVisitorCount] = useState(0);

  const toggleBtnRef = useRef();
  const mapRef = useRef();
  const highlightMarkerRef = useRef(null);

  useEffect(() => {
    const firebaseUrl = 'https://hydrogi-default-rtdb.asia-southeast1.firebasedatabase.app/visitorCount.json';

    fetch(firebaseUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Firebase response status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const count = typeof data === 'number' && !isNaN(data) ? data : 1297;
        
        // ตรวจสอบ sessionStorage เพื่อไม่ให้นับซ้ำเมื่อผู้ใช้กด Refresh หน้าจอ
        const hasCounted = sessionStorage.getItem('counted_visit');
        if (!hasCounted) {
          const newCount = count + 1;
          setVisitorCount(newCount);
          sessionStorage.setItem('counted_visit', 'true');

          fetch(firebaseUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCount)
          }).catch(err => console.error('Update visitorCount error:', err));
        } else {
          setVisitorCount(count);
        }
      })
      .catch(err => {
        console.warn('Visitor counter using fallback:', err.message);
        setVisitorCount(1297); 
      });
  }, []);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latlng = [latitude, longitude];
        
        setUserLocation(latlng);
        
        if (mapRef.current) {
          mapRef.current.flyTo(latlng, 15, { animate: true, duration: 1.5 });
        }
      },
      (error) => {
        console.error(error);
        if (error.code === 1) {
          alert('กรุณาอนุญาตการเข้าถึงตำแหน่ง (Location) ในเบราว์เซอร์ของคุณ');
        } else if (error.code === 3) {
          alert('ใช้เวลาค้นหาตำแหน่งนานเกินไป (Timeout) ลองใหม่อีกครั้งครับ');
        } else {
          alert('ไม่สามารถค้นหาตำแหน่งปัจจุบันได้ในขณะนี้');
        }
      },
      { 
        enableHighAccuracy: false, 
        timeout: 10000,            
        maximumAge: 60000          
      } 
    );
  };

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

  // เปลี่ยนจากแอนิเมชันวงกลมดำคลุมจอ เป็นการสลับแบบ Fade ปกติ
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
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
  }, [dashboardCollapsed, sidebarCollapsed, mobileTab]);

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

  useEffect(() => {
    if (dashboardTab !== 'crossection' || crosslineFeatures.length > 0) return;
    let cancelled = false;
    fetch(CROSSLINE_WFS_URL)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setCrosslineFeatures(data?.features || []);
      })
      .catch(err => {
        console.error('Error fetching crossline layer:', err);
      });
    return () => { cancelled = true; };
  }, [dashboardTab, crosslineFeatures.length]);

  useEffect(() => {
    selectedStationRef.current = selectedStation;
  }, [selectedStation]);

  useEffect(() => {
    if (dashboardTab !== 'crossection' || !mapRef.current) return;
    const feature = crosslineFeatures.find(f => f.properties?.[CROSSLINE_STATION_FIELD] === selectedStation);
    if (!feature) return;
    const target = getFeatureViewTarget(feature);
    if (target?.bounds) mapRef.current.fitBounds(target.bounds, { padding: [80, 80], maxZoom: 19 });
  }, [selectedStation, crosslineFeatures, dashboardTab]);

  const handleCrosslineFeature = (feature, layer) => {
    const sta = feature.properties?.[CROSSLINE_STATION_FIELD];
    if (sta === selectedStation && layer.bringToFront) layer.bringToFront();
    layer.on('click', () => {
      if (!sta) return;
      setSelectedStation(sta);
      setDashboardTab('crossection');
      setDashboardCollapsed(false);
    });
    layer.on('mouseover', () => layer.setStyle({ weight: CROSSLINE_WEIGHT_SELECTED }));
    layer.on('mouseout', () => {
      const isSelected = sta === selectedStationRef.current;
      layer.setStyle({ weight: isSelected ? CROSSLINE_WEIGHT_SELECTED : CROSSLINE_WEIGHT });
    });
    if (sta) layer.bindTooltip(sta, { sticky: true, className: 'crossline-tooltip' });
  };

  const crosslineStyle = (feature) => {
    const isSelected = feature.properties?.[CROSSLINE_STATION_FIELD] === selectedStation;
    return {
      color: isSelected ? CROSSLINE_COLOR_SELECTED : CROSSLINE_COLOR,
      weight: isSelected ? CROSSLINE_WEIGHT_SELECTED : CROSSLINE_WEIGHT,
      opacity: isSelected ? CROSSLINE_OPACITY_SELECTED : CROSSLINE_OPACITY,
    };
  };

  const crosslineCollection = useMemo(
    () => ({ type: 'FeatureCollection', features: crosslineFeatures }),
    [crosslineFeatures]
  );

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

  const zoomToActiveExtent = () => {
    const map = mapRef.current;
    if (!map) return;

    try { map.invalidateSize(); } catch (e) { console.warn(e); }

    setTimeout(() => {
      // 1. ถ้ามีจุดข้อมูลเดี่ยวที่เลือกดูรายละเอียดอยู่ ให้ซูมไปที่จุดนั้น
      if (selectedFeature) {
        handleZoomToFeature(selectedFeature);
        return;
      }

      // 2. ถ้ากำลังอยู่ในแท็บ Cross Section และมีเส้นแนวตัด
      if (dashboardTab === 'crossection' && crosslineFeatures.length > 0) {
        try {
          const crossBounds = L.geoJSON({ type: 'FeatureCollection', features: crosslineFeatures }).getBounds();
          if (crossBounds.isValid()) {
            map.fitBounds(crossBounds, { padding: [30, 30], maxZoom: 18 });
            return;
          }
        } catch (e) {
          console.warn('Crossline bounds error:', e);
        }
      }

      // 3. ถ้ามีจุดข้อมูลคุณภาพน้ำหรือสถานีคลื่นที่เปิดอยู่ ให้คำนวณขอบเขตครอบคลุมทุกจุด
      if (filteredPoints && filteredPoints.length > 0) {
        try {
          const bounds = L.latLngBounds();
          filteredPoints.forEach(f => {
            const coords = f.geometry?.coordinates;
            if (coords && coords.length >= 2) {
              bounds.extend([coords[1], coords[0]]);
            }
          });
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
            return;
          }
        } catch (e) {
          console.warn('Points bounds error:', e);
        }
      }

      // 4. กรณีไม่มีจุดหรือเลเยอร์เปิดอยู่ ให้ซูมขอบเขตแนวชายหาดชลาทัศน์ สงขลา (Default Extent)
      const defaultBounds = L.latLngBounds([
        [7.170, 100.598],
        [7.230, 100.615]
      ]);
      map.fitBounds(defaultBounds, { padding: [20, 20] });
    }, 150);
  };

  const prevMobileTabRef = useRef(mobileTab);
  useEffect(() => {
    if (prevMobileTabRef.current !== 'map' && mobileTab === 'map') {
      zoomToActiveExtent();
    }
    prevMobileTabRef.current = mobileTab;
  }, [mobileTab]);

  useEffect(() => {
    if (!selectedFeature) return;
    const target = getFeatureViewTarget(selectedFeature);
    if (target && mapRef.current) showHighlight(target.center);
    setDashboardTab('table');
  }, [selectedFeature]);

  const wavePoints = filteredPoints.filter(f => f.properties?._source === 'thaiwater');
  const otherPoints = filteredPoints.filter(f => f.properties?._source !== 'thaiwater');
  
  const waterQualityCategory = layers.find(cat => cat.category === 'คุณภาพน้ำ');
  const waterQualityNames = waterQualityCategory ? waterQualityCategory.items.map(item => item.name) : [];

  const tablePoints = filteredPoints.filter(feature => {
    if (feature.properties?._source === 'thaiwater') return false;
    const featureLayerName = feature.id ? feature.id.split('.')[0] : '';
    return waterQualityNames.includes(featureLayerName);
  });
  
  const isBacteriaLayerActive = selectedOrthoIds.some(id => id.includes('RWaterQuality_')) || 
                                selectedLayerIds.some(id => id.includes('RWaterQuality_'));
  
  const selectedBasemap = BASEMAPS.find(b => b.id === basemapId) || BASEMAPS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--c-bg-app)' }}>
      
      {waveModalFeature && (
        <WaveGraphModal 
          feature={waveModalFeature} 
          onClose={() => setWaveModalFeature(null)} 
        />
      )}

      <header className="app-header">
        <div className="header-left">
          <img
            src={process.env.PUBLIC_URL + '/assets/logo.png'}
            alt="logo"
            className="header-logo"
          />
        </div>

        <div className="header-center">
          <h1 className="header-title">
            HydroGIS ชลาทัศน์ <span className="header-title-sub">: ศูนย์แผนที่สำรวจและคุณภาพน้ำ</span>
          </h1>
        </div>

        <div className="header-right">
          <div className="visitor-badge" title="จำนวนการเข้าชมระบบ">
            <span style={{ fontSize: '14px' }}>👁️</span>
            <span>{visitorCount.toLocaleString()}</span>
          </div>

          {/* ส่วนจัดการบัญชี (เข้าสู่ระบบ / ออกจากระบบ) */}
          {authToken ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--c-text)', fontFamily: 'Sarabun-Medium', fontWeight: 600 }}>
                👋 {authUser}
              </span>
              <button
                className="auth-btn logout"
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('authUser');
                  setAuthToken(null);
                  setAuthUser(null);
                }}
              >
                <span style={{ fontSize: '14px' }}>🚪</span>
                <span className="auth-text">ออกจากระบบ</span>
              </button>
            </div>
          ) : (
            <button
              className="auth-btn login"
              onClick={() => setShowLogin(true)}
            >
              <span className="login-icon" style={{ fontSize: '14px' }}></span>
              <span className="auth-text">เข้าสู่ระบบ</span>
            </button>
          )}

          {/* ปุ่ม Day/Night Toggle (ปรับลด 3D ให้เหมือน Figma) */}
          <div
            ref={toggleBtnRef}
            className={`theme-toggle-container ${theme}`}
            onClick={toggleTheme}
          >
            {/* ดวงดาว 4 แฉก (4 ดวงแบบในคลิป) */}
            <div className="toggle-star toggle-star-1"></div>
            <div className="toggle-star toggle-star-2"></div>
            <div className="toggle-star toggle-star-3"></div>
            <div className="toggle-star toggle-star-4"></div>

            {/* ก้อนเมฆ 2 ชั้น (ซ่อนตอนกลางคืน) */}
            <div className="toggle-cloud-layer">
              {/* เมฆชั้นหลัง (โปร่งแสง) */}
              <div className="toggle-cloud cloud-back c-b-1"></div>
              <div className="toggle-cloud cloud-back c-b-2"></div>
              <div className="toggle-cloud cloud-back c-b-3"></div>
              {/* เมฆชั้นหน้า (ทึบแสง) */}
              <div className="toggle-cloud cloud-front c-f-1"></div>
              <div className="toggle-cloud cloud-front c-f-2"></div>
              <div className="toggle-cloud cloud-front c-f-3"></div>
            </div>

            {/* ลูกกลิ้ง (พระอาทิตย์ / ดวงจันทร์) */}
            <div className="toggle-thumb">
              {/* หลุมบนดวงจันทร์ */}
              <div className="toggle-crater toggle-crater-1"></div>
              <div className="toggle-crater toggle-crater-2"></div>
              <div className="toggle-crater toggle-crater-3"></div>
            </div>
          </div>

        </div>
      </header>

      {showLogin && (
        <Login
          onLogin={({ token, username }) => { setAuthToken(token); setAuthUser(username); setShowLogin(false); }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* Backdrop สำหรับ Mobile Drawer */}
      <div 
        className={`mobile-drawer-backdrop ${mobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <main className="app-main">
        <aside 
          className={`sidebar-aside ${mobileSidebarOpen ? 'drawer-open' : ''}`}
          style={{ width: 220, minWidth: 220 }}
        >
          {/* แถบปิด Drawer สำหรับมือถือ */}
          <div className="drawer-close-btn">
            <span>📂 ชั้นข้อมูล</span>
            <button onClick={() => setMobileSidebarOpen(false)}>✕ ปิด</button>
          </div>
          <Sidebar
            onLayerChange={ids => { setSelectedLayerIds(ids); mapRef.current?.closePopup(); hideHighlight(); }}
            onOrthoChange={setSelectedOrthoIds}
            onRainChange={setRainEnabled}
            onWindChange={setWindEnabled}
            orthoOpacities={orthoOpacities}
            onOrthoOpacityChange={handleOrthoOpacityChange}
          />
        </aside>

        <section className={`map-section ${mobileTab !== 'map' ? 'mobile-hidden' : ''}`} style={{ flex: 2 }}>
          <div className="map-frame">
            <MapContainer center={mapCenter} zoom={mapZoom} maxZoom={24} closePopupOnClick={false} style={{ height: '100%', width: '100%' }}>
              <MapInstanceBridge mapRef={mapRef} />
              <LayerPaneSetup />
              
              <TileLayer url={selectedBasemap.url} maxZoom={24} maxNativeZoom={19} />

              <WMSTileLayer
                url="https://map.surveywms.com/geoserver/LiveStock/wms"
                layers="ChalatatSongkhla:eiei"
                format="image/png" transparent={true} version="1.1.1" pane="amphoePane"
              />

              {/* ส่วนควบคุมมุมขวาบน */}
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, fontFamily: 'Sarabun-Medium, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setBasemapOpen(v => !v)}
                  style={{ 
                    background: 'var(--c-bg-primary)', border: '1px solid var(--c-border)', 
                    borderRadius: 8, padding: 0, fontSize: 13, fontWeight: 700, 
                    color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    boxShadow: 'var(--c-shadow)', fontFamily: 'inherit',
                    width: 54, height: 38, boxSizing: 'border-box'
                  }}
                >
                  {selectedBasemap.label}
                </button>
                {basemapOpen && (
                  <div style={{ background: 'var(--c-bg-primary)', border: '1px solid var(--c-border)', borderRadius: 8, padding: 4, boxShadow: 'var(--c-shadow-lg)', minWidth: 140 }}>
                    {BASEMAPS.map(b => (
                      <div
                        key={b.id}
                        onClick={() => { basemapManualRef.current = true; setBasemapId(b.id); setBasemapOpen(false); }}
                        style={{ padding: '8px 12px', fontSize: 12, fontWeight: b.id === basemapId ? 700 : 500, color: b.id === basemapId ? 'var(--c-accent-light)' : 'var(--c-text)', background: b.id === basemapId ? 'var(--c-accent-bg)' : 'transparent', borderRadius: 6, cursor: 'pointer' }}
                      >
                        {b.fullLabel || b.label}
                      </div>
                    ))}
                  </div>
                )}

                {/* ปุ่มซูมขอบเขตข้อมูลทั้งหมด (Fit Extent) - ขนาดเดียวกับปุ่มด้านบนเป๊ะ */}
                <button
                  onClick={zoomToActiveExtent}
                  title="ซูมพอดีขอบเขตข้อมูลทั้งหมด (Fit Extent)"
                  style={{ 
                    background: 'var(--c-bg-primary)', border: '1px solid var(--c-border)', 
                    borderRadius: 8, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: 'var(--c-shadow)', color: 'var(--c-text)', 
                    width: 54, height: 38, boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </button>
              </div>
              
              {layers.flatMap(cat => cat.items || [cat]).filter(l => selectedLayerIds.includes(l.id) && l.id !== 'swan_station').map(layer => (
                <WMSTileLayer key={layer.id} url="https://map.surveywms.com/geoserver/ChalatatSongkhla/wms" layers={`ChalatatSongkhla:${layer.name}`} format="image/png" transparent={true} version="1.1.1" maxZoom={24} pane={layer.id === 'waterway' ? 'waterwayPane' : 'livestockPane'} />
              ))}

              {orthoLayers.flatMap(cat => cat.items || [cat]).filter(l => selectedOrthoIds.includes(l.id)).map(layer => (
                <WMSTileLayer key={layer.id} url="https://map.surveywms.com/geoserver/ChalatatSongkhla/wms" layers={`ChalatatSongkhla:${layer.name}`} format="image/png" transparent={true} version="1.1.1" maxZoom={24} opacity={orthoOpacities[layer.id] ?? 0.4} pane="OrthoPane" />
              ))}

              {dashboardTab === 'crossection' && crosslineFeatures.length > 0 && (
                <GeoJSON
                  key={selectedStation}
                  ref={crosslineLayerRef}
                  data={crosslineCollection}
                  style={crosslineStyle}
                  onEachFeature={handleCrosslineFeature}
                  pane="crosslinePane"
                />
              )}

              {rainEnabled && (
                <>
                  <TileLayer url={rainTileUrl} opacity={0.7} maxZoom={24} minZoom={0} maxNativeZoom={13} minNativeZoom={5} pane="rainPane" />
                  <RainLegend />
                  <RainTimeline frames={rainFrames} currentIndex={rainFrameIdx} onSeek={handleRainSeek} playing={rainPlaying} onTogglePlay={() => setRainPlaying(v => !v)} speed={rainSpeed} onSpeedChange={setRainSpeed} centered={dashboardCollapsed} />
                </>
              )}

              {windEnabled && windData && <WindLayer windData={windData} pane="windPane" />}

              <MapFeatureCircles 
                features={otherPoints} 
                onViewDetail={feature => { 
                  setSelectedFeature(feature); 
                  setDashboardCollapsed(false); 
                  mapRef.current?.closePopup(); 
                  handleZoomToFeature(feature);
                  setMobileTab('data');
                }} 
              />

              {isBacteriaLayerActive && <BacteriaLegend />}

              {userLocation && (
                <Marker position={userLocation} icon={userLocationIcon}>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div style={{ fontFamily: 'Sarabun-Medium, sans-serif', fontSize: '13px' }}>
                      <strong>ตำแหน่งปัจจุบันของคุณ</strong>
                    </div>
                  </Tooltip>
                </Marker>
              )}

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

        <section 
          className={`dashboard-section ${mobileTab === 'map' ? 'mobile-hidden' : ''}`}
          style={{ flex: dashboardCollapsed ? 'none' : '0 0 45%', width: dashboardCollapsed ? 24 : '100%' }}
        >
          <button
            className="desktop-collapse-btn"
            onClick={() => setDashboardCollapsed(v => !v)}
            style={{ width: 24, minWidth: 24, height: '100%', background: 'var(--c-bg-secondary)', border: 'none', borderLeft: '1px solid var(--c-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-secondary)', fontSize: 14, padding: 0, transition: 'all 0.25s ease', flexShrink: 0 }}
          >
            {dashboardCollapsed ? '‹' : '›'}
          </button>
          
          {(!dashboardCollapsed || mobileTab === 'data') && (
            <div className="dashboard-inner-container" style={{ flex: 1, width: '100%', padding: '16px 16px 16px 8px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'inline-flex', gap: 4, marginBottom: 12, background: 'var(--c-bg-secondary)', padding: 4, borderRadius: 12, alignSelf: 'flex-start', width: '100%' }}>
                {/* แถบเมนู Dashboard Tabs (อัปเกรดดีไซน์ใหม่) */}
                <div className="dashboard-tab-container">
                  <button
                    className={`dashboard-tab-btn ${dashboardTab === 'table' ? 'active' : ''}`}
                    onClick={() => setDashboardTab('table')}
                  >
                    <span className="tab-icon">📋</span> คุณภาพน้ำ
                  </button>
                  
                  <button
                    className={`dashboard-tab-btn ${dashboardTab === 'graph' ? 'active' : ''}`}
                    onClick={() => setDashboardTab('graph')}
                  >
                    <span className="tab-icon">📈</span> แนวโน้มผลตรวจ
                  </button>
                  
                  <button
                    className={`dashboard-tab-btn ${dashboardTab === 'crossection' ? 'active' : ''}`}
                    onClick={() => setDashboardTab('crossection')}
                  >
                    <span className="tab-icon">⛰️</span> Cross Section
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {dashboardTab === 'table' ? (
                  selectedFeature ? (
                    <FeatureDetail feature={selectedFeature} onBack={() => { setSelectedFeature(null); hideHighlight(); }} onZoomToFeature={handleZoomToFeature} authToken={authToken} />
                  ) : (
                    <DashboardTable 
                      points={tablePoints} 
                      onSelectFeature={feature => { 
                        setSelectedFeature(feature); 
                        handleZoomToFeature(feature); 
                        setMobileTab('map'); // เด้งกลับไปที่แผนที่บนมือถือเพื่อให้เห็นหมุด
                      }} 
                    />
                  )
                ) : dashboardTab === 'graph' ? (
                  <WaterQualityDashboard points={tablePoints} />
                ) : (
                  <CrossSectionGraph 
                    selectedStation={selectedStation} 
                    onSelectStation={setSelectedStation} 
                    isLoggedIn={!!authToken} 
                  />
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* แถบเมนูด้านล่างสุดสำหรับจอมือถือ (Bottom Navigation) */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-item ${mobileTab === 'map' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('map');
            zoomToActiveExtent();
          }}
        >
          <span className="nav-icon">🗺️</span>
          <span>แผนที่</span>
        </button>
        <button 
          className={`mobile-nav-item ${mobileTab === 'data' && dashboardTab === 'table' ? 'active' : ''}`}
          onClick={() => { setDashboardTab('table'); setMobileTab('data'); }}
        >
          <span className="nav-icon">📋</span>
          <span>คุณภาพน้ำ</span>
        </button>
        <button 
          className={`mobile-nav-item ${mobileTab === 'data' && dashboardTab === 'graph' ? 'active' : ''}`}
          onClick={() => { setDashboardTab('graph'); setMobileTab('data'); }}
        >
          <span className="nav-icon">📈</span>
          <span>แนวโน้ม</span>
        </button>
        <button 
          className={`mobile-nav-item ${mobileTab === 'data' && dashboardTab === 'crossection' ? 'active' : ''}`}
          onClick={() => { setDashboardTab('crossection'); setMobileTab('data'); }}
        >
          <span className="nav-icon">⛰️</span>
          <span>Cross Section</span>
        </button>
        <button 
          className="mobile-nav-item"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <span className="nav-icon">🗂️</span>
          <span>ชั้นข้อมูล</span>
        </button>
      </nav>
    </div>
  );
}

export default App;