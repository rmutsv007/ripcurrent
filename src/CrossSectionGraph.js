import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';

// ==========================================================================
// คอมโพเนนต์วาดเส้นคลื่นน้ำเดี่ยวพริ้วไหว
// หมายเหตุ: ย้าย <style>/@keyframes ออกไปนิยามครั้งเดียวระดับโมดูล (ดูด้านล่าง)
// เพื่อไม่ให้ inject DOM node ซ้ำทุกครั้งที่ re-render
// ==========================================================================
const SingleWavyWater = (props) => {
  const { points } = props;
  if (!points || points.length === 0) return null;

  const startX = points[0].x;
  const endX = points[points.length - 1].x;
  const y = points[0].y;
  const width = endX - startX;

  const step = 80;
  const clipId = 'wavyWaterClip';

  const drawStartX = startX - step;
  const drawEndX = endX + step;
  const drawWidth = drawEndX - drawStartX;
  const fullCycles = Math.ceil(drawWidth / step);
  const amplitude = 2.5;

  let path = `M ${drawStartX} ${y} `;
  let cx = drawStartX;
  for (let i = 0; i < fullCycles; i++) {
    path += `Q ${cx + step * 0.25} ${y - amplitude}, ${cx + step * 0.5} ${y} T ${cx + step} ${y} `;
    cx += step;
  }

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={startX} y={y - 20} width={Math.max(width, 0)} height={40} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g className="animate-single-wave">
          <path d={path} fill="none" stroke="#0284c7" strokeWidth="4" opacity="0.9" />
        </g>
      </g>
    </g>
  );
};

// keyframes ระดับโมดูล — ถูก inject ครั้งเดียวเท่านั้น ไม่ใช่ทุกครั้งที่กราฟ re-render
let wavyStyleInjected = false;
const injectWavyStyleOnce = () => {
  if (wavyStyleInjected || typeof document === 'undefined') return;
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-wavy-water-style', 'true');
  styleEl.textContent = `
    @keyframes moveWave { 0% { transform: translateX(0); } 100% { transform: translateX(-80px); } }
    .animate-single-wave { animation: moveWave 3s linear infinite; }
  `;
  document.head.appendChild(styleEl);
  wavyStyleInjected = true;
};

const X_AXIS_MIN = 0;
const X_AXIS_MAX = 400;
const X_AXIS_STEP = 25;
const Y_AXIS_MAX = 4;
const Y_AXIS_MIN = -6;
const AUTO_PLAY_INTERVAL_MS = 1200;
const LOCAL_STORAGE_KEY = 'crossSection_adjustedData_v1';

// ==========================================================================
// CSV parsing แบบรองรับ quoted fields (RFC4180 แบบง่าย) + CRLF
// ==========================================================================
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
};

const parseCSV = (csvText) => {
  // ตัด \r ทิ้งก่อน แล้วค่อย split ด้วย \n เพื่อรองรับทั้ง LF และ CRLF
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = normalized.split('\n').filter(row => row.trim() !== '');
  return rows.map(parseCSVLine);
};

// อ่าน/เขียน adjustedData ผ่าน localStorage เพื่อกันข้อมูลหายเมื่อ reload
// (ถ้าโปรเจกต์มี backend endpoint สำหรับบันทึกจริง ให้เปลี่ยนสองฟังก์ชันนี้ไปเรียก API แทน)
const loadPersistedAdjustments = () => {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('ไม่สามารถอ่านข้อมูลที่ปรับแก้ไว้ก่อนหน้าได้', err);
    return {};
  }
};

const persistAdjustments = (data) => {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('ไม่สามารถบันทึกข้อมูลที่ปรับแก้ได้', err);
  }
};

const CrossSectionGraph = ({ selectedStation: selectedStationProp, onSelectStation, isLoggedIn } = {}) => {
  const [allData, setAllData] = useState([]);
  const [internalSelectedStation, setInternalSelectedStation] = useState('0+000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const [adjustedData, setAdjustedData] = useState(() => loadPersistedAdjustments());
  const [dragInfo, setDragInfo] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saved

  const chartContainerRef = useRef(null);
  const saveStatusTimerRef = useRef(null);

  // State ควบคุมช่วงของ Brush เริ่มต้นที่ Index 0 ถึง 4 (ซึ่งตรงกับระยะ 0 ถึง 100 เมตร)
  const [brushIndex, setBrushIndex] = useState({ startIndex: 0, endIndex: 4 });

  const selectedStation = selectedStationProp ?? internalSelectedStation;
  const setSelectedStation = onSelectStation ?? setInternalSelectedStation;

  useEffect(() => {
    injectWavyStyleOnce();
  }, []);

  const fetchCSV = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(process.env.PUBLIC_URL + '/assets/crossection.csv');
      if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูล CSV ได้');
      const csvText = await response.text();

      const rows = parseCSV(csvText);
      // แถวแรกคือ header ข้าม แล้วกรองแถวที่มีคอลัมน์ไม่ครบทิ้ง
      const parsedData = rows.slice(1)
        .filter(values => values.length >= 3)
        .map(values => {
          const station = values[0]?.trim();
          const distance = parseFloat(values[1]);
          const elStr = values[2]?.trim();
          const elevation = (elStr === '' || elStr === undefined) ? null : parseFloat(elStr);

          return {
            station,
            distance: isNaN(distance) ? 0 : distance,
            elevation: (elevation !== null && isNaN(elevation)) ? null : elevation
          };
        })
        .filter(d => d.station); // ทิ้งแถวที่ไม่มีชื่อสถานี (ข้อมูลเสีย)

      setAllData(parsedData);
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลไฟล์รูปตัด');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCSV();
  }, [fetchCSV]);

  const stations = useMemo(() => {
    return [...new Set(allData.map(d => d.station).filter(Boolean))];
  }, [allData]);

  const selectedIndex = Math.max(0, stations.indexOf(selectedStation));

  const goToIndex = (idx) => {
    const clamped = Math.min(Math.max(idx, 0), stations.length - 1);
    if (stations[clamped]) setSelectedStation(stations[clamped]);
  };

  const stopAutoPlayAndDrag = () => {
    setIsPlaying(false);
    setDragInfo(null);
  };

  const handlePrevStation = () => { stopAutoPlayAndDrag(); goToIndex(selectedIndex - 1); };
  const handleNextStation = () => { stopAutoPlayAndDrag(); goToIndex(selectedIndex + 1); };
  const handleSliderChange = (idx) => { stopAutoPlayAndDrag(); goToIndex(idx); };
  const handleDropdownChange = (station) => {
    stopAutoPlayAndDrag();
    const idx = stations.indexOf(station);
    if (idx >= 0) goToIndex(idx);
  };

  useEffect(() => {
    if (!isPlaying || stations.length === 0) return;
    const timer = setInterval(() => {
      setSelectedStation(prevStation => {
        const currentIdx = stations.indexOf(prevStation);
        const nextIdx = (currentIdx + 1) % stations.length;
        return stations[nextIdx];
      });
    }, AUTO_PLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, stations, setSelectedStation]);

  // หยุด auto-play อัตโนมัติถ้ามีการเริ่มลากปรับความสูงระหว่างที่กำลังเล่นอยู่
  const toggleAutoPlay = () => {
    setDragInfo(null);
    setIsPlaying(v => !v);
  };

  // กรองเฉพาะระยะที่เป็นทวีคูณของ 25 (0, 25, 50, 75...) ทำให้ Brush เลื่อนได้ทีละ 25 อัตโนมัติ
  const allowedDistances = useMemo(() => {
    const arr = [];
    for (let d = X_AXIS_MIN; d <= X_AXIS_MAX; d += X_AXIS_STEP) arr.push(d);
    return arr;
  }, []);

  const yAxisTicks = useMemo(() => {
    const arr = [];
    for (let v = Y_AXIS_MIN; v <= Y_AXIS_MAX; v += 2) arr.push(v);
    return arr;
  }, []);

  const chartData = useMemo(() => {
    const filtered = allData.filter(d => d.station === selectedStation);
    const sortedData = filtered.sort((a, b) => a.distance - b.distance);

    const mappedData = sortedData.map(d => {
      const overrideElev = adjustedData[d.station]?.[d.distance];
      const finalElev = overrideElev !== undefined ? overrideElev : d.elevation;
      const hasElevation = finalElev !== null && finalElev !== undefined && !isNaN(finalElev);

      return {
        ...d,
        originalElevation: d.elevation,
        elevation: hasElevation ? finalElev : null,
        waterLevel: -1.0
      };
    });

    return mappedData.filter(d => allowedDistances.includes(Math.round(d.distance)));
  }, [allData, selectedStation, allowedDistances, adjustedData]);

  const downloadCSV = () => {
    let csvContent = "Station,Distance,Elevation\n";
    allData.forEach(d => {
      const adjustedElev = adjustedData[d.station]?.[d.distance];
      const finalElev = adjustedElev !== undefined ? adjustedElev : d.elevation;
      const elevStr = (finalElev !== null && finalElev !== undefined && !isNaN(finalElev)) ? finalElev.toFixed(2) : '';
      // ใส่ quote ครอบชื่อสถานีกันกรณีมี comma ปนอยู่ในชื่อ
      csvContent += `"${(d.station ?? '').replace(/"/g, '""')}",${d.distance},${elevStr}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adjusted_crossection_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---- ลากปรับระดับความสูง: คำนวณ pixel-per-unit จากความสูงจริงของกราฟบนจอ ----
  // ป้องกันปัญหาลากไม่ตรง scale เมื่อขนาดหน้าจอ/กราฟเปลี่ยน
  const getPixelsPerUnit = () => {
    const el = chartContainerRef.current;
    const chartPixelHeight = el ? el.clientHeight : 300;
    // เผื่อระยะขอบบน/ล่างของ AreaChart (margin top 10 + bottom 20 + แกน X ~70px)
    const plotAreaHeight = Math.max(chartPixelHeight - 100, 50);
    const valueRange = Y_AXIS_MAX - Y_AXIS_MIN;
    return plotAreaHeight / valueRange; // pixels ต่อ 1 หน่วยเมตร
  };

  const handleMouseDown = (state, event) => {
    if (!isLoggedIn || !state || state.activeLabel === undefined) return;
    // ไม่ให้เริ่มลากถ้ากำลัง auto-play อยู่ (กันสถานีเปลี่ยนกลางอากาศระหว่างลาก)
    if (isPlaying) return;

    const dist = Number(state.activeLabel);
    if (dist % 25 !== 0) return;

    const activePoint = chartData.find(d => d.distance === dist);
    if (!activePoint || activePoint.originalElevation === null || activePoint.originalElevation === undefined || isNaN(activePoint.originalElevation)) return;

    setDragInfo({
      distance: dist,
      originalElev: activePoint.originalElevation,
      currentElev: activePoint.elevation,
      startY: event.clientY
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!dragInfo) return;

      const pixelsPerUnit = getPixelsPerUnit();
      const deltaY = e.clientY - dragInfo.startY;
      // ลากขึ้น (deltaY ติดลบ) = ค่าความสูงเพิ่มขึ้น จึงใช้เครื่องหมายลบ
      let newElev = dragInfo.currentElev - (deltaY / pixelsPerUnit);
      newElev = Math.max(Y_AXIS_MIN, Math.min(Y_AXIS_MAX, newElev));

      setAdjustedData(prev => {
        const next = {
          ...prev,
          [selectedStation]: {
            ...(prev[selectedStation] || {}),
            [dragInfo.distance]: newElev
          }
        };
        persistAdjustments(next);
        return next;
      });

      setDragInfo(prev => (prev ? {
        ...prev,
        currentElev: newElev,
        startY: e.clientY
      } : prev));
    };

    const handleGlobalMouseUp = () => {
      setDragInfo(null);
      setSaveStatus('saved');
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
    };

    if (dragInfo) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragInfo, selectedStation]);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length && !dragInfo) {
      const sandPoint = payload.find(p => p.dataKey === 'elevation');
      if (!sandPoint || sandPoint.value === null || sandPoint.value === undefined) return null;

      return (
        <div style={{
          background: 'var(--c-popup-start)', WebkitBackdropFilter: 'var(--blur-panel)', backdropFilter: 'var(--blur-panel)',
          border: '1px solid var(--c-border)', padding: '12px 16px',
          borderRadius: '12px', boxShadow: 'var(--c-shadow-lg)'
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 500 }}>ระยะทาง: {label} ม.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #dcb788 0%, #c49a6c 100%)' }}></div>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--c-text)', fontWeight: 600 }}>
              {sandPoint.value.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-text-secondary)' }}>เมตร</span>
            </p>
          </div>
          {isLoggedIn && (
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--c-accent-text)', fontWeight: 600 }}>
              *คลิกค้างเพื่อลากปรับระดับความสูง
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--c-bg-primary)', borderRadius: '14px', padding: '24px 32px',
      border: '1px solid var(--c-border)',
      boxShadow: 'var(--c-shadow-card)', fontFamily: 'var(--font-ui)',
      position: 'relative',
      cursor: isLoggedIn ? (dragInfo ? 'grabbing' : 'pointer') : 'default'
    }}>

      {dragInfo && (
        <div style={{
          position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--c-popup-start)', WebkitBackdropFilter: 'var(--blur-panel)', backdropFilter: 'var(--blur-panel)', color: 'var(--c-text)', border: '1px solid var(--c-border)', padding: '10px 24px',
          borderRadius: '30px', zIndex: 100, display: 'flex', gap: '16px', alignItems: 'center',
          boxShadow: 'var(--c-shadow-lg)', fontWeight: 600, fontSize: '14px',
          animation: 'smartModalPop 0.2s ease-out forwards'
        }}>
          <span>ระยะ: <span style={{ color: 'var(--c-accent-text)' }}>{dragInfo.distance} ม.</span></span>
          <span style={{ color: 'var(--c-text-muted)' }}>|</span>
          <span>ค่าเดิม: <span style={{ color: 'var(--c-text-secondary)' }}>{dragInfo.originalElev.toFixed(2)} ม.</span></span>
          <span style={{ color: 'var(--c-text-muted)' }}>|</span>
          <span>ค่าใหม่: <span style={{ color: 'var(--c-accent-text)', fontSize: '16px' }}>{dragInfo.currentElev.toFixed(2)} ม.</span></span>
        </div>
      )}

      {saveStatus === 'saved' && !dragInfo && (
        <div style={{
          position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--c-green)', color: '#fff', padding: '8px 20px',
          borderRadius: '30px', zIndex: 100, fontWeight: 600, fontSize: '13px',
          boxShadow: 'var(--c-shadow-lg)'
        }}>
          ✓ บันทึกการปรับแก้แล้ว
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(196, 154, 108, 0.16)', padding: '8px', borderRadius: '10px', color: '#c49a6c', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 18l-6-6-6 6" />
                <path d="M3 18l6-6 6 6" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--c-text)' }}>
              รูปตัดขวาง (Cross Section) เดือนสิงหาคม 2026
            </h2>
          </div>
          <p style={{ margin: '0 0 0 46px', fontSize: '14px', color: 'var(--c-text-secondary)' }}>
            สถานี: {selectedStation || 'กำลังโหลด...'}
          </p>
        </div>

        {isLoggedIn && (
          <button onClick={downloadCSV} style={{
            background: 'var(--c-accent)',
            color: 'white', border: 'none', padding: '10px 18px',
            borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'none', transition: 'filter 0.18s', fontFamily: 'inherit', fontSize: '14px'
          }}
          onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.08)'}
          onMouseOut={e => e.currentTarget.style.filter = 'none'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ดาวน์โหลดไฟล์ .csv
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '16px 20px', background: 'var(--c-bg-subtle)', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: 'var(--c-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>เลือกสถานี:</div>
        <button onClick={handlePrevStation} disabled={selectedIndex <= 0} style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', border: 'none', background: selectedIndex <= 0 ? 'transparent' : 'var(--c-bg-input)', color: selectedIndex <= 0 ? 'var(--c-text-muted)' : 'var(--c-text)', boxShadow: 'none', cursor: selectedIndex <= 0 ? 'default' : 'pointer', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <input type="range" min={0} max={Math.max(stations.length - 1, 0)} step={1} value={selectedIndex} onChange={(e) => handleSliderChange(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--c-accent)', cursor: 'pointer' }} />
        <button onClick={handleNextStation} disabled={selectedIndex >= stations.length - 1} style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', border: 'none', background: selectedIndex >= stations.length - 1 ? 'transparent' : 'var(--c-bg-input)', color: selectedIndex >= stations.length - 1 ? 'var(--c-text-muted)' : 'var(--c-text)', boxShadow: 'none', cursor: selectedIndex >= stations.length - 1 ? 'default' : 'pointer', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        <button onClick={toggleAutoPlay} style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', border: 'none', background: isPlaying ? '#c49a6c' : 'var(--c-bg-input)', color: isPlaying ? '#ffffff' : 'var(--c-text)', boxShadow: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isPlaying ? (<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" /></svg>) : (<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,1 11,6 2,11" /></svg>)}</button>

        <select value={selectedStation} onChange={(e) => handleDropdownChange(e.target.value)} style={{ padding: '8px 14px', border: 'none', background: 'var(--c-bg-input)', borderRadius: '8px', color: 'var(--c-text)', fontWeight: 500, outline: 'none', boxShadow: 'none', fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, minWidth: '90px' }}>
          {stations.map((station, idx) => (
            <option key={`${station}-${idx}`} value={station}>{station}</option>
          ))}
        </select>
      </div>

      <h4 style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '18px', color: 'var(--c-text)', fontWeight: 600 }}>
        ระดับความสูงของรูปตัด
      </h4>

      <div ref={chartContainerRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-popup-start)', zIndex: 10, borderRadius: '12px' }}><div style={{ color: '#c49a6c', fontWeight: 600, fontSize: '15px' }}>กำลังโหลดข้อมูลรูปตัด...</div></div>}
        {error && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', color: '#ff3b30', zIndex: 10, textAlign: 'center', background: 'rgba(255, 59, 48, 0.10)', borderRadius: '12px', border: '1px solid rgba(255, 59, 48, 0.25)' }}>
            <p style={{ fontWeight: 600, margin: 0 }}>{error}</p>
            <button onClick={fetchCSV} style={{ background: '#ff3b30', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}
        {!loading && !error && chartData.length === 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-secondary)', zIndex: 10, background: 'var(--c-bg-subtle)', borderRadius: '12px' }}>ไม่พบข้อมูลสำหรับสถานีนี้</div>}

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              onMouseDown={handleMouseDown}
              style={{ outline: 'none' }}
            >
              <defs>
                <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dcb788" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#dcb788" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--c-border)" />

              <XAxis
                dataKey="distance"
                axisLine={true}
                tickLine={true}
                tick={{ fontSize: 12, fill: 'var(--c-text-secondary)', fontWeight: 500 }}
                height={70}
                dy={10}
                label={{
                  value: 'ระยะทาง (ม.)',
                  position: 'insideBottom',
                  offset: 15,
                  fontSize: 14,
                  fill: 'var(--c-text-secondary)',
                  fontWeight: 600
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--c-text-secondary)', fontWeight: 500 }}
                domain={[Y_AXIS_MIN, Y_AXIS_MAX]}
                ticks={yAxisTicks}
                label={{ value: 'ความสูง (ม.)', angle: -90, position: 'insideLeft', fontSize: 14, fill: 'var(--c-text-secondary)', fontWeight: 600 }}
              />

              <Tooltip content={<CustomTooltip />} cursor={dragInfo ? false : { stroke: 'var(--c-border-input)', strokeWidth: 1, strokeDasharray: '4 4' }} />

              <Legend verticalAlign="bottom" height={40} content={() => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px', fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 600, gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#dcb788', marginRight: '6px' }}></span>ระดับพื้น</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}><svg width="20" height="12" style={{ marginRight: '6px' }}><path d="M0 6 Q 5 2, 10 6 T 20 6" fill="none" stroke="#0284c7" strokeWidth="2" /></svg>น้ำทะเล</div>
                </div>
              )} />

              <Area type="natural" dataKey="waterLevel" stroke="none" fillOpacity={1} fill="url(#colorWater)" baseValue="dataMin" activeDot={false} isAnimationActive={false} />
              <Area type="natural" dataKey="waterLevel" stroke="#0284c7" strokeWidth={2} fill="none" baseValue="dataMin" activeDot={false} isAnimationActive={false} shape={<SingleWavyWater />} />

              <Area type="natural" dataKey="elevation" stroke="none" fill="var(--c-bg-primary)" fillOpacity={1} baseValue="dataMin" connectNulls={false} activeDot={false} isAnimationActive={!isLoggedIn} animationDuration={1500} animationEasing="ease-out" />
              <Area type="natural" dataKey="elevation" stroke="#c49a6c" strokeWidth={4} fillOpacity={1} fill="url(#colorElevation)" baseValue="dataMin" connectNulls={false} activeDot={{ r: 6, fill: 'var(--c-bg-primary)', stroke: '#c49a6c', strokeWidth: 4, style: { outline: 'none' } }} isAnimationActive={!isLoggedIn} animationDuration={1500} animationEasing="ease-out" />

              <Brush
                key={selectedStation}
                dataKey="distance"
                height={28}
                stroke="#c49a6c"
                fill="var(--c-bg-secondary)"
                travellerWidth={14}
                tickFormatter={(val) => `${val} ม.`}
                startIndex={brushIndex.startIndex}
                endIndex={brushIndex.endIndex}
                onChange={(newIndex) => setBrushIndex(newIndex)}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CrossSectionGraph;