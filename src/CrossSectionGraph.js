import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// === คอมโพเนนต์พิเศษสำหรับวาดเส้นคลื่นน้ำเดี่ยวพริ้วไหว (เฉพาะเส้น ไม่มี fill ในตัวเอง) ===
// ตัว fill สีฟ้าให้ Area ปกติ (ข้อ 1 ด้านล่าง) เป็นคนวาดและถูก mask โดยบล็อกสีขาวตามปกติของ recharts
// ส่วนนี้มีหน้าที่แค่วาด "เส้นคลื่นพริ้วไหว" ทับด้านบนเฉย ๆ ให้เริ่มที่ 0 จบที่ 500 เสมอ
const SingleWavyWater = (props) => {
  const { points } = props;
  if (!points || points.length === 0) return null;

  const startX = points[0].x;
  const endX = points[points.length - 1].x;
  const y = points[0].y;
  const width = endX - startX;

  const step = 80; // ความยาวคลื่น 1 รอบ (px)
  const clipId = 'wavyWaterClip';

  // วาดคลื่นให้ "ล้น" ออกไปอีกฝั่งละ 1 รอบคลื่น (step) นอกกรอบ [startX, endX]
  // เพื่อให้ตอนเลื่อน translateX(-25px) มีคลื่นสำรองไหลเข้ามาแทนที่เสมอ ไม่มีช่องว่างขาดตอน
  // แล้วค่อย clip เส้นให้โผล่เฉพาะในกรอบ [startX, endX] เป๊ะ ๆ ไม่ให้ทะลุออกนอกแกน X
  const drawStartX = startX - step;
  const drawEndX = endX + step;
  const drawWidth = drawEndX - drawStartX;
  const fullCycles = Math.ceil(drawWidth / step);
  const amplitude = 2.5; // ปรับตรงนี้ที่เดียว ยิ่งมาก คลื่นยิ่งสูง/ชัด

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

const CrossSectionGraph = () => {
  const [allData, setAllData] = useState([]);
  const [selectedStation, setSelectedStation] = useState('0+000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          const originalDist = parseFloat(values[1]) || 0;
          const invertedDist = 500 - originalDist;
          
          const elStr = values[2]?.trim();
          const elevation = (elStr === '' || elStr === undefined) ? null : parseFloat(elStr);

          return {
            station: values[0]?.trim(),
            distance: invertedDist,
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
    const uniqueStations = [...new Set(allData.map(d => d.station).filter(Boolean))];
    return uniqueStations;
  }, [allData]);

  const chartData = useMemo(() => {
    const filtered = allData.filter(d => d.station === selectedStation);
    const sortedData = filtered.sort((a, b) => a.distance - b.distance);

    // ไม่เติมค่าย้อนหลัง (forward-fill) อีกต่อไป - จุดไหนไม่มีข้อมูล elevation จริง ๆ ให้ตัดทิ้งไปเลย ไม่ต้องแสดง
    const validData = sortedData
      .filter(d => d.elevation !== null && !isNaN(d.elevation))
      .map(d => ({
        ...d,
        waterLevel: -1.8
      }));

    const allowedDistances = [0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500]
    return validData.filter(d => allowedDistances.includes(Math.round(d.distance)));
  }, [allData, selectedStation]);

  const customTicks = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const sandPoint = payload.find(p => p.dataKey === 'elevation');
      if (!sandPoint) return null;

      return (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(229, 231, 235, 0.5)', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' 
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
            ระยะทาง: {label} ม.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #dcb788 0%, #c49a6c 100%)' }}></div>
            <p style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
              {sandPoint.value.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>เมตร</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      background: '#ffffff', 
      borderRadius: '24px', 
      padding: '24px 32px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', 
      fontFamily: 'Sarabun-Medium, sans-serif',
      position: 'relative'
    }}>
      
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
              รูปตัดขวาง (Cross Section)
            </h2>
          </div>
          <p style={{ margin: '0 0 0 46px', fontSize: '14px', color: '#64748b' }}>
            สถานี: {selectedStation || 'กำลังโหลด...'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
        <div style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>เลือกสถานี:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select 
            value={selectedStation} 
            onChange={(e) => setSelectedStation(e.target.value)}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              background: '#ffffff', 
              borderRadius: '20px', 
              color: '#334155', 
              fontWeight: 600, 
              outline: 'none', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              fontFamily: 'inherit',
              cursor: 'pointer'
            }}
          >
            {stations.map(station => (
              <option key={station} value={station}>{station}</option>
            ))}
          </select>
        </div>
      </div>

      <h4 style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
        ระดับความสูงของรูปตัด
      </h4>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 10, borderRadius: '12px' }}>
            <div style={{ color: '#c49a6c', fontWeight: 600, fontSize: '15px' }}>กำลังโหลดข้อมูลรูปตัด...</div>
          </div>
        )}
        
        {error && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, textAlign: 'center', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2' }}>
            <p style={{ fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {!loading && !error && chartData.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', zIndex: 10, background: '#f8fafc', borderRadius: '16px' }}>
            ไม่พบข้อมูลสำหรับสถานีนี้
          </div>
        )}

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
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
              
              <XAxis 
                dataKey="distance" 
                type="number"
                domain={[0, 500]}
                ticks={customTicks}
                axisLine={true} 
                tickLine={true}
                tickFormatter={(val) => (val % 100 === 0 ? val : '')}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                dy={10}
                label={{ value: 'ระยะทาง (ม.)', position: 'bottom', offset: 0, fontSize: 14, fill: '#475569', fontWeight: 600 }}
              />
              
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                domain={[(dataMin) => Math.min(dataMin, -2.5), 'auto']}
                label={{ value: 'ความสูง (ม.)', angle: -90, position: 'insideLeft', fontSize: 14, fill: '#475569', fontWeight: 600 }}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', fontSize: '13px', color: '#475569', fontWeight: 'bold', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#dcb788', marginRight: '6px' }}></span>
                      ระดับพื้น
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <svg width="20" height="12" style={{ marginRight: '6px' }}>
                        <path d="M0 6 Q 5 2, 10 6 T 20 6" fill="none" stroke="#0284c7" strokeWidth="2" />
                      </svg>
                      น้ำทะเล
                    </div>
                  </div>
                )} 
              />

              {/* 1ก. พื้นที่สีฟ้าของน้ำทะเล (-1.8) - ใช้ Area ปกติของ recharts เพื่อให้การ mask ด้วยบล็อกสีขาว (ข้อ 2) ทำงานถูกต้องแน่นอน */}
              <Area 
                type="natural" 
                dataKey="waterLevel" 
                stroke="none" 
                fillOpacity={1} 
                fill="url(#colorWater)" 
                baseValue="dataMin"
                activeDot={false}
                isAnimationActive={false}
              />

              {/* 1ข. เส้นคลื่นน้ำพริ้วไหว วาดทับด้านบน (ไม่มี fill ในตัวเอง) เริ่มที่ 0 จบที่ 500 เสมอ */}
              <Area 
                type="natural" 
                dataKey="waterLevel" 
                stroke="#0284c7" 
                strokeWidth={2} 
                fill="none"
                baseValue="dataMin"
                activeDot={false}
                isAnimationActive={false}
                shape={<SingleWavyWater />}
              />

              {/* 2. พื้นทรายสีขาวทึบ (บล็อกน้ำ) - ต้อง animate พร้อมกับเส้นทรายจริง (ข้อ 3) เป๊ะ ๆ
                   ไม่งั้นบล็อกสีขาว (ซึ่ง snap ไปตำแหน่งใหม่ทันที) จะโผล่ก่อนเส้นทรายที่ค่อย ๆ ไล่มา
                   ทำให้เห็นเป็นช่องว่างสีขาววาบขึ้นมาก่อนตอนเปลี่ยนสถานี */}
              <Area 
                type="natural" 
                dataKey="elevation" 
                stroke="none" 
                fill="#ffffff" 
                fillOpacity={1} 
                baseValue="dataMin"
                activeDot={false} 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />

              {/* 3. พื้นทรายจริง */}
              <Area 
                type="natural" 
                dataKey="elevation" 
                stroke="#c49a6c" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorElevation)" 
                baseValue="dataMin"
                activeDot={{ r: 6, fill: '#ffffff', stroke: '#c49a6c', strokeWidth: 4 }} 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CrossSectionGraph;