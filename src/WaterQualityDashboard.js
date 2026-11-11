/**
 * WaterQualityDashboard.js
 * คอมโพเนนต์แสดงผลข้อมูลคุณภาพน้ำ (เฉพาะกราฟ) 
 * ดึงข้อมูลทุกชั้นข้อมูลในหมวด "คุณภาพน้ำ" อัตโนมัติ โดยไม่ต้องคลิกเลือก Layer
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import layers from './layers'; // นำเข้าโครงสร้างชั้นข้อมูลทั้งหมดในระบบ

// --- เกณฑ์เฝ้าระวัง ---
const ECOLI_THRESHOLD = 250;
const COLI_THRESHOLD = 1000;

// --- สีพื้นฐานสำหรับจุดตรวจ (วนลูปใช้ถ้าจุดเกิน) ---
const CHART_COLORS = ['#16a34a', '#84cc16', '#eab308', '#dc2626', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899'];

// --- ลำดับจุดตรวจที่ต้องการ (ซ้ายไปขวา, บนลงล่าง) ส่วนที่ไม่อยู่ในลิสต์จะต่อท้ายตามลำดับเดิม ---
const LOCATION_ORDER = [
  'ชายหาดสมิหลา',
  'ชายหาดชลาทัศน์ ช่วงสามแยกประท่า',
  'ชายหาดชลาทัศน์ ช่วงลานวัฒนธรรมเทศบาลสงขลา',
  'ชายหาดชลาทัศน์ ช่วงตรงข้ามค่ายกรมหลวงสงขลานครินทร์',
  'ชายหาดเก้าเส้ง ช่วงบริเวณวัดเขาเก้าแสน',
];

// --- Custom tooltip แบบการ์ดโค้งมน ---
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--c-popup-start)', color: 'var(--c-text)',
      borderRadius: 12, padding: '12px 16px', fontSize: 12,
      boxShadow: 'var(--c-shadow-lg)', minWidth: 170,
      border: '1px solid var(--c-border)', WebkitBackdropFilter: 'var(--blur-panel)', backdropFilter: 'var(--blur-panel)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--c-text-heading)', paddingBottom: 6, borderBottom: '1px solid var(--c-border)' }}>{label}</div>
      {payload
        .slice()
        .sort((a, b) => b.value - a.value)
        .map(p => {
          // ดึงค่าดั้งเดิมที่เก็บซ่อนไว้มาแสดงผล เพื่อให้แสดง 0 ได้ แม้กราฟจะพล็อตที่ 1
          const rawKey = p.dataKey + '_raw';
          const realValue = p.payload[rawKey] !== undefined ? p.payload[rawKey] : p.value;

          return (
            <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 700 }}>{realValue.toLocaleString()} CFU/100 ml</span>
            </div>
          );
        })}
    </div>
  );
}

const WaterQualityDashboard = () => {
  // สร้าง State เก็บข้อมูลที่ดึงมาเอง
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ตั้งค่ามาตราส่วนแกน Y (Log Scale) เริ่มต้นที่ 1 (เพราะ Log 0 หาค่าไม่ได้)
  const logTicks = [1, 10, 100, 1000, 10000, 100000];

  // =========================================================================
  // ฟังก์ชันดึงข้อมูลจาก GeoServer อัตโนมัติเมื่อเปิดหน้ากราฟ
  // =========================================================================
  useEffect(() => {
    // 1. ดึงรายชื่อเลเยอร์ทั้งหมด และพ่วงชื่อหมวดหมู่มาด้วย
    const flatLayers = layers.flatMap(cat =>
      cat.items ? cat.items.map(item => ({ ...item, groupName: cat.label || cat.category || '' })) : [cat]
    );

    // 2. กรองหาเฉพาะชั้นข้อมูลที่มีคำว่า "คุณภาพน้ำ" หรือ "water" ในชื่อ/หมวดหมู่
    const wqLayers = flatLayers.filter(l =>
      (l.groupName && l.groupName.includes('คุณภาพน้ำ')) ||
      (l.category && l.category.includes('คุณภาพน้ำ')) ||
      (l.label && l.label.includes('คุณภาพน้ำ')) ||
      (l.name && l.name.toLowerCase().includes('water'))
    );

    // ถ้าไม่มีชั้นข้อมูลเลย ให้หยุดทำงาน
    if (wqLayers.length === 0) {
      setIsLoading(false);
      return;
    }

    let allFeatures = [];
    let fetchCount = 0;

    // 3. วนลูปยิง API ดึงข้อมูลทุกชั้นข้อมูลในหมวดคุณภาพน้ำ
    wqLayers.forEach(layer => {
      const wfsUrl = `https://map.surveywms.com/geoserver/ChalatatSongkhla/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ChalatatSongkhla:${encodeURIComponent(layer.name)}&outputFormat=application/json&maxFeatures=100`;

      fetch(wfsUrl)
        .then(res => res.json())
        .then(data => {
          if (data.features) allFeatures = [...allFeatures, ...data.features];
        })
        .catch(err => console.error("Fetch Water Quality error:", err))
        .finally(() => {
          fetchCount++;
          // เมื่อดึงข้อมูลครบทุกชั้นแล้ว ให้อัปเดตกราฟ
          if (fetchCount === wqLayers.length) {
            setPoints(allFeatures);
            setIsLoading(false);
          }
        });
    });
  }, []);

  // =========================================================================
  // ประมวลผลข้อมูล GeoJSON Features ให้กลายเป็นรูปแบบของกราฟ Recharts
  // =========================================================================
  const { chartData, locationsConfig } = useMemo(() => {
    if (!points || points.length === 0) return { chartData: [], locationsConfig: [] };

    const locSet = new Set();
    const grouped = {};

    points.forEach(p => {
      const props = p.properties;
      if (!props) return;

      // 1. ตรวจสอบชื่อ Field ในหลายๆ รูปแบบเผื่อตัวพิมพ์เล็ก/ใหญ่
      const ecoliRaw = props['E.Coli'] ?? props['E.coli'] ?? props['ecoli'] ?? props['e_coli'] ?? props['E_Coli'] ?? props['E_coli'];
      const coliRaw = props['Coliform'] ?? props['coliform'] ?? props['ColiForm'];

      // ถ้าไม่มีข้อมูลทั้งหมด ให้ข้าม
      if (ecoliRaw === undefined && coliRaw === undefined && props.date === undefined) return;

      // 2. จัดการรูปแบบวันที่
      const rawDate = props.date ? String(props.date) : '0000-00-00';
      let displayDate = 'ไม่ระบุวันที่';
      
      if (props.date) {
        const dateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          const year = parseInt(dateMatch[1], 10);
          const month = parseInt(dateMatch[2], 10);
          const day = parseInt(dateMatch[3], 10);
          const thaiMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
          const shortYear = year % 100;
          displayDate = `${day} ${thaiMonths[month]} ${shortYear}`;
        } else {
          displayDate = rawDate;
        }
      }

      const loc = props.location || 'ไม่ระบุสถานที่';
      locSet.add(loc);

      // 3. จัดกลุ่มข้อมูลในวันเดียวกัน
      if (!grouped[rawDate]) {
        grouped[rawDate] = { 
          rawDate: rawDate, 
          date: displayDate
        };
      }

      // ดึงข้อมูล E.coli และแปลงค่า 0 ให้เป็น 1 สำหรับพล็อตบนกราฟ Log Scale
      if (ecoliRaw !== undefined && ecoliRaw !== null) {
        const ecoliNum = parseFloat(String(ecoliRaw).replace(/[^0-9.]/g, ''));
        if (!isNaN(ecoliNum)) {
          grouped[rawDate][`${loc}_ecoli_raw`] = ecoliNum; // เก็บค่าจริงไว้โชว์ใน Tooltip
          grouped[rawDate][`${loc}_ecoli`] = ecoliNum <= 0 ? 1 : ecoliNum; // ถ้าเป็น 0 หรือติดลบ ให้กราฟวาดที่ 1
        }
      }
      
      // ดึงข้อมูล Coliform และแปลงค่า 0 ให้เป็น 1 สำหรับพล็อตบนกราฟ Log Scale
      if (coliRaw !== undefined && coliRaw !== null) {
        const coliNum = parseFloat(String(coliRaw).replace(/[^0-9.]/g, ''));
        if (!isNaN(coliNum)) {
          grouped[rawDate][`${loc}_coli_raw`] = coliNum; // เก็บค่าจริงไว้โชว์ใน Tooltip
          grouped[rawDate][`${loc}_coli`] = coliNum <= 0 ? 1 : coliNum; // ถ้าเป็น 0 หรือติดลบ ให้กราฟวาดที่ 1
        }
      }
    });

    const locArray = Array.from(locSet).sort((a, b) => {
      const idxA = LOCATION_ORDER.indexOf(a);
      const idxB = LOCATION_ORDER.indexOf(b);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    const config = locArray.map((loc, idx) => ({
      key: loc,
      label: loc,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));

    // 4. บังคับเรียงลำดับข้อมูลจาก อดีต -> ปัจจุบัน (เรียงตาม rawDate)
    const dataArray = Object.values(grouped).sort((a, b) => {
      if (a.rawDate < b.rawDate) return -1;
      if (a.rawDate > b.rawDate) return 1;
      return 0;
    });

    return { chartData: dataArray, locationsConfig: config };
  }, [points]);


  // =========================================================================
  // การแสดงผล UI (ระหว่างโหลด / ไม่มีข้อมูล / แสดงกราฟ)
  // =========================================================================
  
  if (isLoading) {
    return (
      <div style={{
        padding: '24px', background: 'var(--c-bg-primary)',
        borderRadius: 14, border: '1px solid var(--c-border)', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--c-text-secondary)' }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <h3 style={{ margin: 0, color: 'var(--c-text)', fontWeight: 600 }}>กำลังดึงข้อมูลคุณภาพน้ำ...</h3>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div style={{
        padding: '24px', background: 'var(--c-bg-primary)',
        borderRadius: 14, border: '1px solid var(--c-border)', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--c-text-secondary)' }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
          <h3 style={{ margin: 0, color: 'var(--c-text)', fontWeight: 600 }}>ไม่มีข้อมูล</h3>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>ไม่พบชั้นข้อมูลคุณภาพน้ำในระบบ</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: 'var(--c-bg-primary)',
      borderRadius: 14,
      border: '1px solid var(--c-border)',
      boxShadow: 'var(--c-shadow-card)',
      fontFamily: 'var(--font-ui)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      <style>{`
        .wq-chart-card {
          transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
        }
        .wq-chart-card:hover {
          box-shadow: var(--c-shadow-lg);
          border-color: var(--c-border-input);
        }
        .recharts-legend-item-text { font-weight: 600 !important; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'var(--c-accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <div>
          <h3 style={{
            margin: 0, color: 'var(--c-text)', fontSize: 17, fontWeight: 600,
            fontFamily: 'inherit',
          }}>
            แนวโน้มผลการตรวจเชื้อ E.coli และ Coliform
          </h3>
          <p style={{ margin: '2px 0 0', color: 'var(--c-text-secondary)', fontSize: 12.5 }}>
            หน่วย: CFU/100 ml · ข้อมูลจาก {locationsConfig.length} จุดตรวจสอบ
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {/* กราฟที่ 1: E.coli */}
        <div className="wq-chart-card" style={{
          flex: '1 1 45%', minWidth: 400, background: 'var(--c-bg-secondary)',
          border: '1px solid var(--c-border)', borderRadius: 14, padding: '18px 18px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#3c83f6', boxShadow: '0 0 0 4px rgba(60,131,246,0.15)' }} />
            <h4 style={{ margin: 0, color: 'var(--c-text)', fontSize: 14.5, fontWeight: 600 }}>E.coli (CFU/100 ml)</h4>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--c-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11.5, fill: 'var(--c-text-secondary)' }} axisLine={{ stroke: 'var(--c-border)' }} tickLine={false} />
              <YAxis
                scale="log" domain={[1, 100000]} ticks={logTicks}
                tick={{ fontSize: 11.5, fill: 'var(--c-text-secondary)' }}
                tickFormatter={(tick) => tick === 1 ? '0' : tick.toLocaleString()} // สั่งว่าถ้าค่าคือ 1 ให้แสดงเป็น 0
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11.5, paddingTop: 10 }} />

              <ReferenceLine
                y={ECOLI_THRESHOLD} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5}
                label={{ position: 'insideTopRight', value: `เกณฑ์เฝ้าระวัง: ${ECOLI_THRESHOLD.toLocaleString()} (CFU/100 ml)`, fill: '#ef4444', fontSize: 11 }}
              />

              {locationsConfig.map(loc => (
                <Line
                  key={loc.key}
                  type="linear"
                  dataKey={`${loc.key}_ecoli`}
                  name={loc.label}
                  stroke={loc.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  dot={{ r: 3.5, fill: loc.color, strokeWidth: 2, stroke: 'var(--c-bg-secondary)' }}
                  activeDot={{ r: 6, stroke: 'var(--c-bg-secondary)', strokeWidth: 2, style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' } }}
                  connectNulls={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* กราฟที่ 2: Coliform */}
        <div className="wq-chart-card" style={{
          flex: '1 1 45%', minWidth: 400, background: 'var(--c-bg-secondary)',
          border: '1px solid var(--c-border)', borderRadius: 14, padding: '18px 18px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#7e22ce', boxShadow: '0 0 0 4px rgba(126,34,206,0.15)' }} />
            <h4 style={{ margin: 0, color: 'var(--c-text)', fontSize: 14.5, fontWeight: 600 }}>Coliform (CFU/100 ml)</h4>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--c-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11.5, fill: 'var(--c-text-secondary)' }} axisLine={{ stroke: 'var(--c-border)' }} tickLine={false} />
              <YAxis
                scale="log" domain={[1, 100000]} ticks={logTicks}
                tick={{ fontSize: 11.5, fill: 'var(--c-text-secondary)' }}
                tickFormatter={(tick) => tick === 1 ? '0' : tick.toLocaleString()} // สั่งว่าถ้าค่าคือ 1 ให้แสดงเป็น 0
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11.5, paddingTop: 10 }} />

              <ReferenceLine
                y={COLI_THRESHOLD} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5}
                label={{ position: 'insideTopRight', value: `เกณฑ์เฝ้าระวัง: ${COLI_THRESHOLD.toLocaleString()} (CFU/100 ml)`, fill: '#ef4444', fontSize: 11 }}
              />

              {locationsConfig.map(loc => (
                <Line
                  key={loc.key}
                  type="linear"
                  dataKey={`${loc.key}_coli`}
                  name={loc.label}
                  stroke={loc.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  dot={{ r: 3.5, fill: loc.color, strokeWidth: 2, stroke: 'var(--c-bg-secondary)' }}
                  activeDot={{ r: 6, stroke: 'var(--c-bg-secondary)', strokeWidth: 2, style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' } }}
                  connectNulls={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WaterQualityDashboard;