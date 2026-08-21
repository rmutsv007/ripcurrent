import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// คอมโพเนนต์วาดเส้นคลื่นน้ำเดี่ยวพริ้วไหว
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
      <style>
        {`
          @keyframes moveWave { 0% { transform: translateX(0); } 100% { transform: translateX(-${step}px); } }
          .animate-single-wave { animation: moveWave 3s linear infinite; }
        `}
      </style>
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

const X_AXIS_MIN = 0;
const X_AXIS_MAX = 400;
const X_AXIS_STEP = 25;          
const X_AXIS_TICK_STEP = 50;     
const Y_AXIS_MAX = 4;            
const Y_AXIS_MIN = -6;           
const AUTO_PLAY_INTERVAL_MS = 1200; 

// เพิ่ม prop `isLoggedIn` เข้ามารับค่าสถานะการเข้าสู่ระบบ
const CrossSectionGraph = ({ selectedStation: selectedStationProp, onSelectStation, isLoggedIn } = {}) => {
  const [allData, setAllData] = useState([]);
  const [internalSelectedStation, setInternalSelectedStation] = useState('0+000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // === State สำหรับจัดการระบบลากเปลี่ยนค่า ===
  const [adjustedData, setAdjustedData] = useState({}); // เก็บค่าที่ถูกแก้ไข { station: { distance: newElev } }
  const [dragInfo, setDragInfo] = useState(null);       // ข้อมูลขณะกำลังลากเมาส์

  const selectedStation = selectedStationProp ?? internalSelectedStation;
  const setSelectedStation = onSelectStation ?? setInternalSelectedStation;

  useEffect(() => {
    const fetchCSV = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(process.env.PUBLIC_URL + '/assets/crossection.csv');
        if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูล CSV ได้');
        const csvText = await response.text();
        
        const rows = csvText.split('\n').filter(row => row.trim() !== '');

        const parsedData = rows.slice(1).map(row => {
          const values = row.split(',');
          const distance = parseFloat(values[1]) || 0;
          const elStr = values[2]?.trim();
          const elevation = (elStr === '' || elStr === undefined) ? null : parseFloat(elStr);

          return {
            station: values[0]?.trim(),
            distance: distance,
            elevation: elevation
          };
        });

        setAllData(parsedData);
      } catch (err) {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลไฟล์รูปตัด');
      } finally {
        setLoading(false);
      }
    };

    fetchCSV();
  }, []);

  const stations = useMemo(() => {
    return [...new Set(allData.map(d => d.station).filter(Boolean))];
  }, [allData]);

  const selectedIndex = Math.max(0, stations.indexOf(selectedStation));

  const goToIndex = (idx) => {
    const clamped = Math.min(Math.max(idx, 0), stations.length - 1);
    if (stations[clamped]) setSelectedStation(stations[clamped]);
  };

  const handlePrevStation = () => { setIsPlaying(false); goToIndex(selectedIndex - 1); };
  const handleNextStation = () => { setIsPlaying(false); goToIndex(selectedIndex + 1); };
  const handleSliderChange = (idx) => { setIsPlaying(false); goToIndex(idx); };
  const handleDropdownChange = (station) => {
    setIsPlaying(false);
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

  const toggleAutoPlay = () => setIsPlaying(v => !v);

  const allowedDistances = useMemo(() => {
    const arr = [];
    for (let d = X_AXIS_MIN; d <= X_AXIS_MAX; d += X_AXIS_STEP) arr.push(d);
    return arr;
  }, []);

  const customTicks = useMemo(() => {
    const arr = [];
    for (let d = X_AXIS_MIN; d <= X_AXIS_MAX; d += X_AXIS_TICK_STEP) arr.push(d);
    return arr;
  }, []);

  const yAxisTicks = useMemo(() => {
    const arr = [];
    for (let v = Y_AXIS_MIN; v <= Y_AXIS_MAX; v += 2) arr.push(v);
    return arr;
  }, []);

  // สร้าง chartData โดยคำนึงถึงค่าที่ปรับใหม่ (adjustedData) ด้วย
  const chartData = useMemo(() => {
    const filtered = allData.filter(d => d.station === selectedStation);
    const sortedData = filtered.sort((a, b) => a.distance - b.distance);

    const mappedData = sortedData.map(d => {
      const overrideElev = adjustedData[d.station]?.[d.distance];
      const finalElev = overrideElev !== undefined ? overrideElev : d.elevation;
      const hasElevation = finalElev !== null && !isNaN(finalElev);

      return {
        ...d,
        originalElevation: d.elevation, // เก็บค่าดั้งเดิมไว้โชว์เทียบ
        elevation: hasElevation ? finalElev : null,
        waterLevel: -1.0
      };
    });

    return mappedData.filter(d => allowedDistances.includes(Math.round(d.distance)));
  }, [allData, selectedStation, allowedDistances, adjustedData]);

  // === ฟังก์ชันดาวน์โหลดไฟล์ CSV สำหรับค่าที่แก้ไขแล้ว ===
  const downloadCSV = () => {
    let csvContent = "Station,Distance,Elevation\n";
    allData.forEach(d => {
      const adjustedElev = adjustedData[d.station]?.[d.distance];
      const finalElev = adjustedElev !== undefined ? adjustedElev : d.elevation;
      const elevStr = (finalElev !== null && finalElev !== undefined) ? finalElev.toFixed(2) : '';
      csvContent += `${d.station},${d.distance},${elevStr}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adjusted_crossection_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // === ระบบลากเปลี่ยนความสูง (Drag & Drop) ===
  const handleMouseDown = (state, event) => {
    if (!isLoggedIn || !state || state.activeLabel === undefined) return;
    
    const dist = Number(state.activeLabel);
    if (dist % 25 !== 0) return; // บังคับให้แก้ได้เฉพาะทุกระยะ 25 ม.

    const activePoint = chartData.find(d => d.distance === dist);
    if (!activePoint || activePoint.originalElevation === null) return;

    setDragInfo({
      distance: dist,
      originalElev: activePoint.originalElevation,
      currentElev: activePoint.elevation,
      startY: event.clientY // รับค่าจุด Y ที่เมาส์เริ่มคลิก
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!dragInfo) return;
      
      const deltaY = e.clientY - dragInfo.startY;
      // ความเร็ว/ความไวของการเลื่อน (35 pixel จะประมาณเท่ากับ 1 เมตร ปรับเพิ่ม/ลดได้)
      let newElev = dragInfo.currentElev - (deltaY / 100); 
      
      // ล็อกเพดานไม่ให้ลากทะลุกราฟ
      newElev = Math.max(Y_AXIS_MIN, Math.min(Y_AXIS_MAX, newElev));

      setAdjustedData(prev => ({
        ...prev,
        [selectedStation]: {
          ...(prev[selectedStation] || {}),
          [dragInfo.distance]: newElev
        }
      }));

      setDragInfo(prev => ({
        ...prev,
        currentElev: newElev,
        startY: e.clientY
      }));
    };

    const handleGlobalMouseUp = () => setDragInfo(null);

    if (dragInfo) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragInfo, selectedStation]);

  const CustomTooltip = ({ active, payload, label }) => {
    // ซ่อน Tooltip เก่าขณะกำลังลาก เพื่อไม่ให้บัง Label ใหม่
    if (active && payload && payload.length && !dragInfo) {
      const sandPoint = payload.find(p => p.dataKey === 'elevation');
      if (!sandPoint) return null;

      return (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(229, 231, 235, 0.5)', padding: '12px 16px', 
          borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' 
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>ระยะทาง: {label} ม.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #dcb788 0%, #c49a6c 100%)' }}></div>
            <p style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
              {sandPoint.value.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>เมตร</span>
            </p>
          </div>
          {isLoggedIn && (
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>
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
      background: '#ffffff', borderRadius: '24px', padding: '24px 32px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', fontFamily: 'Sarabun-Medium, sans-serif',
      position: 'relative',
      // เปลี่ยน Cursor เมาส์เมื่อเข้าสู่ระบบ
      cursor: isLoggedIn ? (dragInfo ? 'grabbing' : 'pointer') : 'default' 
    }}>
      
      {/* Label เรียลไทม์ ขณะลากปรับค่า */}
      {dragInfo && (
        <div style={{
          position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)', color: 'white', padding: '10px 24px',
          borderRadius: '30px', zIndex: 100, display: 'flex', gap: '16px', alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', fontWeight: 600, fontSize: '14px',
          animation: 'smartModalPop 0.2s ease-out forwards'
        }}>
          <span>📍 ระยะ: <span style={{ color: '#38bdf8' }}>{dragInfo.distance} ม.</span></span>
          <span style={{ color: '#475569' }}>|</span>
          <span>📉 ค่าเดิม: <span style={{ color: '#94a3b8' }}>{dragInfo.originalElev.toFixed(2)} ม.</span></span>
          <span style={{ color: '#475569' }}>|</span>
          <span>📈 ค่าใหม่: <span style={{ color: '#fbbf24', fontSize: '16px' }}>{dragInfo.currentElev.toFixed(2)} ม.</span></span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: '#fcf6f0', padding: '8px', borderRadius: '12px', color: '#c49a6c', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 18l-6-6-6 6" />
                <path d="M3 18l6-6 6 6" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
              รูปตัดขวาง (Cross Section) เดือนสิงหาคม 2026
            </h2>
          </div>
          <p style={{ margin: '0 0 0 46px', fontSize: '14px', color: '#64748b' }}>
            สถานี: {selectedStation || 'กำลังโหลด...'}
          </p>
        </div>

        {/* ปุ่มดาวน์โหลดโผล่มาเฉพาะตอน Log in */}
        {isLoggedIn && (
          <button onClick={downloadCSV} style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: 'white', border: 'none', padding: '10px 18px',
            borderRadius: '20px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', transition: 'all 0.2s', fontFamily: 'inherit', fontSize: '14px'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '16px' }}>📥</span> ดาวน์โหลดไฟล์ .csv
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '16px 20px', background: '#f8fafc', borderRadius: '16px' }}>
        <div style={{ fontSize: '14px', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>เลือกสถานี:</div>
        <button onClick={handlePrevStation} disabled={selectedIndex <= 0} style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', border: 'none', background: selectedIndex <= 0 ? '#e2e8f0' : '#ffffff', color: selectedIndex <= 0 ? '#94a3b8' : '#334155', boxShadow: selectedIndex <= 0 ? 'none' : '0 1px 3px rgba(0,0,0,0.08)', cursor: selectedIndex <= 0 ? 'default' : 'pointer', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <input type="range" min={0} max={Math.max(stations.length - 1, 0)} step={1} value={selectedIndex} onChange={(e) => handleSliderChange(Number(e.target.value))} style={{ flex: 1, accentColor: '#c49a6c', cursor: 'pointer' }} />
        <button onClick={handleNextStation} disabled={selectedIndex >= stations.length - 1} style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', border: 'none', background: selectedIndex >= stations.length - 1 ? '#e2e8f0' : '#ffffff', color: selectedIndex >= stations.length - 1 ? '#94a3b8' : '#334155', boxShadow: selectedIndex >= stations.length - 1 ? 'none' : '0 1px 3px rgba(0,0,0,0.08)', cursor: selectedIndex >= stations.length - 1 ? 'default' : 'pointer', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        <button onClick={toggleAutoPlay} style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', border: 'none', background: isPlaying ? '#c49a6c' : '#ffffff', color: isPlaying ? '#ffffff' : '#334155', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isPlaying ? '⏸' : '▶'}</button>
        
        <select value={selectedStation} onChange={(e) => handleDropdownChange(e.target.value)} style={{ padding: '8px 14px', border: 'none', background: '#ffffff', borderRadius: '20px', color: '#334155', fontWeight: 700, outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, minWidth: '90px' }}>
          {stations.map(station => (
            <option key={station} value={station}>{station}</option>
          ))}
        </select>
      </div>

      <h4 style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
        ระดับความสูงของรูปตัด
      </h4>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 10, borderRadius: '12px' }}><div style={{ color: '#c49a6c', fontWeight: 600, fontSize: '15px' }}>กำลังโหลดข้อมูลรูปตัด...</div></div>}
        {error && !loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, textAlign: 'center', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2' }}><p style={{ fontWeight: 600 }}>{error}</p></div>}
        {!loading && !error && chartData.length === 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', zIndex: 10, background: '#f8fafc', borderRadius: '16px' }}>ไม่พบข้อมูลสำหรับสถานีนี้</div>}

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              // เมื่อคลิกเมาส์บน AreaChart จะส่ง event ไปให้ handleMouseDown
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

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
              
              <XAxis dataKey="distance" type="number" domain={[X_AXIS_MIN, X_AXIS_MAX]} ticks={customTicks} axisLine={true} tickLine={true} tickFormatter={(val) => (val % 100 === 0 ? val : '')} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} label={{ value: 'ระยะทาง (ม.)', position: 'bottom', offset: 0, fontSize: 14, fill: '#475569', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} domain={[Y_AXIS_MIN, Y_AXIS_MAX]} ticks={yAxisTicks} label={{ value: 'ความสูง (ม.)', angle: -90, position: 'insideLeft', fontSize: 14, fill: '#475569', fontWeight: 600 }} />
              
              <Tooltip content={<CustomTooltip />} cursor={dragInfo ? false : { stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              <Legend verticalAlign="bottom" height={36} content={() => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', fontSize: '13px', color: '#475569', fontWeight: 'bold', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#dcb788', marginRight: '6px' }}></span>ระดับพื้น</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}><svg width="20" height="12" style={{ marginRight: '6px' }}><path d="M0 6 Q 5 2, 10 6 T 20 6" fill="none" stroke="#0284c7" strokeWidth="2" /></svg>น้ำทะเล</div>
                </div>
              )} />

              <Area type="natural" dataKey="waterLevel" stroke="none" fillOpacity={1} fill="url(#colorWater)" baseValue="dataMin" activeDot={false} isAnimationActive={false} />
              <Area type="natural" dataKey="waterLevel" stroke="#0284c7" strokeWidth={2} fill="none" baseValue="dataMin" activeDot={false} isAnimationActive={false} shape={<SingleWavyWater />} />
              
              {/* ปิด Animation เมื่อมีการ Log in เพื่อให้การลาก (Drag) ลื่นไหลและไม่เด้ง */}
              <Area type="natural" dataKey="elevation" stroke="none" fill="#ffffff" fillOpacity={1} baseValue="dataMin" connectNulls={false} activeDot={false} isAnimationActive={!isLoggedIn} animationDuration={1500} animationEasing="ease-out" />
              <Area type="natural" dataKey="elevation" stroke="#c49a6c" strokeWidth={4} fillOpacity={1} fill="url(#colorElevation)" baseValue="dataMin" connectNulls={false} activeDot={{ r: 6, fill: '#ffffff', stroke: '#c49a6c', strokeWidth: 4, style: { outline: 'none' } }} isAnimationActive={!isLoggedIn} animationDuration={1500} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CrossSectionGraph;