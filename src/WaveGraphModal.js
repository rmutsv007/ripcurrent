/**
 * WaveGraphModal.js — หน้าต่างแสดงกราฟคลื่นทะเล (Modern UI + ข้อมูลครบถ้วน)
 */
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WaveGraphModal = ({ feature, onClose }) => {
  const lng = feature?.geometry?.coordinates[0] || 99.595;
  const lat = feature?.geometry?.coordinates[1] || 6.704;
  const stationName = feature?.properties?.location || 'สถานีคลื่นทะเล';

  const todayObj = new Date();
  const today = todayObj.toISOString().split('T')[0];

  const minDateObj = new Date();
  minDateObj.setDate(todayObj.getDate() - 14);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const maxDateObj = new Date();
  maxDateObj.setDate(todayObj.getDate() + 14);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWaveData = async () => {
      if (!lat || !lng) return;
      setLoading(true);
      setError('');

      try {
        const apiUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height&timezone=Asia%2FBangkok&start_date=${startDate}&end_date=${endDate}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลพยากรณ์คลื่นได้');
        
        const data = await response.json();
        
        if (data && data.hourly && data.hourly.time && data.hourly.wave_height) {
          const formattedData = data.hourly.time.map((timeStr, index) => {
            const dateObj = new Date(timeStr);
            const timeLabel = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const dateLabel = startDate !== endDate 
              ? `${dateObj.getDate()}/${dateObj.getMonth() + 1} ` 
              : '';

            return {
              time: `${dateLabel}${timeLabel}`,
              fullDate: dateObj,
              height: data.hourly.wave_height[index] || 0
            };
          });
          
          setGraphData(formattedData);
        } else {
          setGraphData([]);
        }
      } catch (err) {
        console.error(err);
        setError('ไม่มีข้อมูลพยากรณ์ในช่วงวันที่เลือก หรือเกิดข้อผิดพลาดในการดึงข้อมูล');
        setGraphData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWaveData();
  }, [lat, lng, startDate, endDate]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const dateStr = dataPoint.fullDate 
        ? dataPoint.fullDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
        
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
            {`${dateStr} ${label.split(' ').pop()} น.`}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}></div>
            <p style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
              {payload[0].value.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>เมตร</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.4)', 
      backdropFilter: 'blur(4px)', 
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Sarabun-Medium, sans-serif'
    }}>
      <div style={{
        background: '#ffffff', width: '92%', maxWidth: '850px',
        borderRadius: '24px', 
        padding: '24px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '12px', color: '#3b82f6', display: 'flex' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M2 13 Q 7 7, 12 13 T 22 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M2 18 Q 7 12, 12 18 T 22 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                ความสูงและทิศทางของคลื่นทะเล
              </h2>
            </div>
            <p style={{ margin: '0 0 0 46px', fontSize: '14px', color: '#64748b' }}>{stationName}</p>
          </div>

          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', color: '#64748b',
            width: '36px', height: '36px', borderRadius: '50%',
            fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
          >
            ✕
          </button>
        </div>

        {/* ตัวเลือกวันที่ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
          <div style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>ช่วงเวลา:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="date" 
              value={startDate} 
              min={minDateStr}
              max={maxDateStr}
              onChange={e => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }} 
              style={{ padding: '8px 16px', border: 'none', background: '#ffffff', borderRadius: '20px', color: '#334155', fontWeight: 600, outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} 
            />
            <span style={{ color: '#94a3b8' }}>—</span>
            <input 
              type="date" 
              value={endDate} 
              min={minDateStr}
              max={maxDateStr}
              onChange={e => {
                setEndDate(e.target.value);
                if (startDate > e.target.value) setStartDate(e.target.value);
              }} 
              style={{ padding: '8px 16px', border: 'none', background: '#ffffff', borderRadius: '20px', color: '#334155', fontWeight: 600, outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} 
            />
          </div>
        </div>

        <h4 style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>ความสูงคลื่น</h4>

        {/* พื้นที่กราฟ */}
        <div style={{ width: '100%', height: '340px', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 10, borderRadius: '12px' }}>
              <div style={{ color: '#3b82f6', fontWeight: 600, fontSize: '15px' }}>กำลังโหลดข้อมูลพยากรณ์...</div>
            </div>
          )}
          
          {error && !loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, textAlign: 'center', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2' }}>
              <p style={{ fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {!loading && !error && graphData.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', zIndex: 10, background: '#f8fafc', borderRadius: '16px' }}>
              ไม่มีข้อมูลพยากรณ์ในช่วงเวลาที่เลือก
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              
              <defs>
                <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
              
              {/* แกน X */}
              <XAxis 
                dataKey="time" 
                axisLine={true} 
                tickLine={true} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                dy={10}
                ticks={graphData.map(d => d.time).filter(t => t.includes('00:00') || t.includes('04:00') || t.includes('08:00') || t.includes('12:00') || t.includes('16:00') || t.includes('20:00'))}
                label={{ value: 'เวลา', position: 'bottom', offset: 0, fontSize: 14, fill: '#475569', fontWeight: 600 }}
              />
              
              {/* แกน Y */}
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                domain={[0, 'auto']}
                label={{ value: 'ความสูง (ม.)', angle: -90, position: 'insideLeft', fontSize: 14, fill: '#475569', fontWeight: 600 }}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              {/* สัญลักษณ์ Legend ด้านล่างกราฟ */}
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', marginRight: '8px' }}></span>
                    ความสูงคลื่น
                  </div>
                )} 
              />
              
              <Area 
                type="monotone" 
                dataKey="height" 
                stroke="#2563eb" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorHeight)" 
                activeDot={{ r: 6, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }} 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WaveGraphModal;