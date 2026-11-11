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
        const apiUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction&timezone=Asia%2FBangkok&start_date=${startDate}&end_date=${endDate}`;
        
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
              height: data.hourly.wave_height[index] || 0,
              direction: data.hourly.wave_direction?.[index]
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
          background: 'var(--c-popup-start)', 
          WebkitBackdropFilter: 'var(--blur-panel)', backdropFilter: 'var(--blur-panel)',
          border: '1px solid var(--c-border)', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          boxShadow: 'var(--c-shadow-lg)' 
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 500 }}>
            {`${dateStr} ${label.split(' ').pop()} น.`}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--c-accent)' }}></div>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--c-text)', fontWeight: 600 }}>
              {dataPoint.height.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-text-secondary)' }}>เมตร</span>
            </p>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--c-text-secondary)' }}>
            ทิศทางคลื่น: {Number.isFinite(dataPoint.direction) ? `${Math.round(dataPoint.direction)}°` : '-'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.35)', 
      WebkitBackdropFilter: 'blur(8px)',
      backdropFilter: 'blur(8px)', 
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-ui)'
    }}>
      <div style={{
        background: 'var(--c-popup-start)', width: '92%', maxWidth: '850px',
        WebkitBackdropFilter: 'var(--blur-panel)', backdropFilter: 'var(--blur-panel)',
        border: '1px solid var(--c-border)', color: 'var(--c-text)',
        borderRadius: '18px', 
        padding: '24px 32px',
        boxShadow: 'var(--c-shadow-lg)', 
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ background: 'var(--c-accent-bg)', padding: '8px', borderRadius: '10px', color: 'var(--c-accent-text)', display: 'flex' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M2 13 Q 7 7, 12 13 T 22 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M2 18 Q 7 12, 12 18 T 22 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--c-text)' }}>
                ความสูงและทิศทางของคลื่นทะเล
              </h2>
            </div>
            <p style={{ margin: '0 0 0 46px', fontSize: '14px', color: 'var(--c-text-secondary)' }}>{stationName}</p>
          </div>

          <button onClick={onClose} style={{
            background: 'var(--c-bg-input)', border: 'none', color: 'var(--c-text-secondary)',
            width: '36px', height: '36px', borderRadius: '50%',
            fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--c-bg-input-focus)'; e.currentTarget.style.color = 'var(--c-text)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--c-bg-input)'; e.currentTarget.style.color = 'var(--c-text-secondary)'; }}
          >
            ✕
          </button>
        </div>

        {/* ตัวเลือกวันที่ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '16px', background: 'var(--c-bg-subtle)', borderRadius: '12px' }}>
          <div style={{ fontSize: '14px', color: 'var(--c-text-secondary)', fontWeight: 600 }}>ช่วงเวลา:</div>
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
              style={{ padding: '8px 14px', border: 'none', background: 'var(--c-bg-input)', borderRadius: '8px', color: 'var(--c-text)', fontWeight: 500, outline: 'none', boxShadow: 'none', fontFamily: 'inherit' }} 
            />
            <span style={{ color: 'var(--c-text-muted)' }}>—</span>
            <input 
              type="date" 
              value={endDate} 
              min={minDateStr}
              max={maxDateStr}
              onChange={e => {
                setEndDate(e.target.value);
                if (startDate > e.target.value) setStartDate(e.target.value);
              }} 
              style={{ padding: '8px 14px', border: 'none', background: 'var(--c-bg-input)', borderRadius: '8px', color: 'var(--c-text)', fontWeight: 500, outline: 'none', boxShadow: 'none', fontFamily: 'inherit' }} 
            />
          </div>
        </div>

        <h4 style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '18px', color: 'var(--c-text)', fontWeight: 600 }}>ความสูงคลื่น</h4>

        {/* พื้นที่กราฟ */}
        <div style={{ width: '100%', height: '340px', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-popup-start)', zIndex: 10, borderRadius: '12px' }}>
              <div style={{ color: 'var(--c-accent-text)', fontWeight: 600, fontSize: '15px' }}>กำลังโหลดข้อมูลพยากรณ์...</div>
            </div>
          )}
          
          {error && !loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3b30', zIndex: 10, textAlign: 'center', background: 'rgba(255, 59, 48, 0.10)', borderRadius: '12px', border: '1px solid rgba(255, 59, 48, 0.25)' }}>
              <p style={{ fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {!loading && !error && graphData.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-secondary)', zIndex: 10, background: 'var(--c-bg-subtle)', borderRadius: '12px' }}>
              ไม่มีข้อมูลพยากรณ์ในช่วงเวลาที่เลือก
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              
              <defs>
                <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007aff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#007aff" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--c-border)" />
              
              {/* แกน X */}
              <XAxis 
                dataKey="time" 
                axisLine={true} 
                tickLine={true} 
                tick={{ fontSize: 12, fill: 'var(--c-text-secondary)', fontWeight: 500 }} 
                dy={10}
                ticks={graphData.map(d => d.time).filter(t => t.includes('00:00') || t.includes('04:00') || t.includes('08:00') || t.includes('12:00') || t.includes('16:00') || t.includes('20:00'))}
                label={{ value: 'เวลา', position: 'bottom', offset: 0, fontSize: 14, fill: 'var(--c-text-secondary)', fontWeight: 600 }}
              />
              
              {/* แกน Y */}
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'var(--c-text-secondary)', fontWeight: 500 }} 
                domain={[0, 'auto']}
                label={{ value: 'ความสูง (ม.)', angle: -90, position: 'insideLeft', fontSize: 14, fill: 'var(--c-text-secondary)', fontWeight: 600 }}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--c-border-input)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              {/* สัญลักษณ์ Legend ด้านล่างกราฟ */}
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--c-text-secondary)', fontWeight: 600 }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#007aff', marginRight: '8px' }}></span>
                    ความสูงคลื่น
                  </div>
                )} 
              />
              
              <Area 
                type="monotone" 
                dataKey="height" 
                stroke="#007aff" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorHeight)" 
                activeDot={{ r: 6, fill: 'var(--c-bg-primary)', stroke: '#007aff', strokeWidth: 2 }} 
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