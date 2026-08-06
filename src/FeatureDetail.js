/**
 * FeatureDetail.js — คอมโพเนนต์แสดงรายละเอียดฟาร์ม
 * แสดงข้อมูลของฟาร์มที่เลือก เช่น ชื่อ, เจ้าของ, ที่อยู่, จำนวนสัตว์
 * มีปุ่มซูมไปตำแหน่งบนแผนที่
 */

import React from 'react';
import layers from './layers'; // รายการชั้นข้อมูลสำหรับแสดงไอคอนประเภท
import FarmImage from './FarmImage'; // คอมโพเนนต์แสดง/อัปโหลดรูปฟาร์ม
import { getFeatureCenter } from './MapFeatureCircles';

/**
 * FeatureDetail — หน้าแสดงรายละเอียดฟาร์ม
 * @param {Object} feature - GeoJSON feature ที่ถูกเลือก
 * @param {Function} onBack - callback กลับไปหน้าตาราง
 * @param {Function} onZoomToFeature - callback ซูมแผนที่ไปยังตำแหน่งฟาร์ม
 */
const FeatureDetail = ({ feature, onBack, onZoomToFeature, authToken }) => {
  // ถ้าไม่มี feature ให้ไม่ render อะไร
  if (!feature) return null;
  const p = feature.properties || {}; // ดึง properties ของ feature

  // ค้นหาประเภทสัตว์จาก layers เพื่อแสดงไอคอน
  const typeName = (p.Type || '').trim();
  const layer = layers.find(l => (l.name || '').trim() === typeName);

  // ดึงพิกัดแบบปลอดภัยจาก geometry
  const center = getFeatureCenter(feature);
  const lat = center?.lat; // ละติจูด
  const lng = center?.lng; // ลองจิจูด

  // รายการฟิลด์ข้อมูลที่จะแสดง
  const fields = [
    { label: 'วันที่เก็บตัวอย่าง', value: p.date },           // วันที่เก็บตัวอย่าง
    { label: 'เวลา', value: p.time },                       // เวลา
    { label: 'บริเวณพื้นที่เก็บตัวอย่าง', value: p.location },              // บริเวณพื้นที่เก็บตัวอย่าง
    { label: 'สีของน้ำ', value: p.สีของน้ำ },     // สีของน้ำ
    { label: 'กลิ่น', value: p.กลิ่น },           // กลิ่น
    { label: 'ตะกอน', value: p.ตะกอน },       // ตะกอน
    { label: 'ค่าความเป็นกรด-ด่าง (pH)', value: p['ค่าความเป็นกรด-ด่าง'] }, // ค่าความเป็นกรด-ด่าง (pH)
    { label: 'คราบน้ำมัน', value: p.คราบน้ำมัน }, // คราบน้ำมัน
    { label: 'E.Coli (โคโลนีสีฟ้า) CUF/g', value: p['E.Coli'] ?? p['E.coli'] ?? p['ecoli'] }, // E.Coli (โคโลนีสีฟ้า) CUF/g
    { label: 'Coliform (โคโลนีสีม่วง) CUF/g', value: p['Coliform'] ?? p['coliform'] }, // Coliform (โคโลนีสีม่วง) CUF/g
    { label: 'สภาพอากาศ', value: p.หมายเหตุ }, // สภาพอากาศ
  ];

  return (
    // === คอนเทนเนอร์หลัก — การ์ดรายละเอียด ===
    <div style={{
      background: 'var(--c-bg-primary)',
      border: '1px solid var(--c-border)',
      borderRadius: 16,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Sarabun-Medium, sans-serif',
      overflow: 'hidden',
      boxShadow: 'var(--c-shadow-lg)',
    }}>
      {/* === ส่วนหัว: ปุ่มกลับ + ชื่อหน้า === */}
      <div style={{
        height: 60,
        minHeight: 60,
        fontWeight: 700,
        fontSize: 16,
        color: 'var(--c-text)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid var(--c-border)',
        background: 'linear-gradient(135deg, var(--c-bg-secondary) 0%, var(--c-bg-primary) 100%)',
      }}>
        {/* ปุ่มกลับ — กลับไปหน้าตาราง */}
        <button
          onClick={onBack}
          style={{
            background: 'var(--c-accent-bg)',
            color: 'var(--c-accent-light)',
            border: '1px solid var(--c-accent-border)',
            borderRadius: 8,
            padding: '6px 14px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'Sarabun-Medium, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--c-accent-bg-hover)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--c-accent-bg)'; }}
        >
          {/* ไอคอนลูกศรซ้าย */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          กลับ
        </button>
        <span style={{ letterSpacing: 0.3 }}>ข้อมูลรายละเอียด</span>
      </div>

      {/* === เนื้อหา (เลื่อนได้) === */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* === ส่วนหัวชื่อฟาร์ม + ไอคอนประเภท === */}
        <div style={{
          textAlign: 'center',
          marginBottom: 20,
          padding: '20px 16px',
          background: 'linear-gradient(135deg, var(--c-accent-bg) 0%, var(--c-bg-subtle) 100%)',
          borderRadius: 12,
          border: '1px solid var(--c-accent-border)',
        }}>
          {/* ไอคอนประเภทสัตว์ — แสดงเฉพาะเมื่อพบ layer ที่ตรงกัน */}
          {layer && (
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'var(--c-bg-icon)',
              border: '1px solid var(--c-bg-icon-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px', // จัดกลาง
            }}>
              {/* ใช้ layer.icon ถ้ามี มิฉะนั้น fallback ไป GeoServer GetLegendGraphic */}
              <img
                src={layer.icon || `https://map.surveywms.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=ChalatatSongkhla:${encodeURIComponent(layer.name)}&LEGEND_OPTIONS=${encodeURIComponent('dpi:2400;antialiasing:on;fontAntiAliasing:on;forceRule:True;symbolWidth:30;symbolHeight:30')}&TRANSPARENT=true`}
                alt={typeName}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
          {/* ชื่อฟาร์ม */}
          <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--c-text)', letterSpacing: 0.3 }}>
            {p.location || '-'}
          </div>
        </div>

        {/* === ตารางฟิลด์ข้อมูล === */}
        <div style={{
          background: 'var(--c-bg-subtle)',
          borderRadius: 12,
          padding: '4px 0',
          border: '1px solid var(--c-border)',
        }}>
          {/* วนลูปแสดงแต่ละฟิลด์ */}
          {fields.map((f, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < fields.length - 1 ? '1px solid var(--c-border-subtle)' : 'none', // เส้นคั่น (ยกเว้นแถวสุดท้าย)
              fontSize: 14,
            }}>
              {/* ชื่อฟิลด์ (ซ้าย) */}
              <span style={{ fontWeight: 600, color: 'var(--c-text-secondary)', fontSize: 13, minWidth: 100 }}>{f.label}</span>
              {/* ค่าข้อมูล (ขวา) */}
              <span style={{ color: 'var(--c-text)', textAlign: 'right', maxWidth: '60%', fontWeight: 500 }}>{f.value || '-'}</span>
            </div>
          ))}
        </div>

        {/* === ปุ่มดำเนินการ — แสดงเฉพาะเมื่อมีพิกัด === */}
        {Number.isFinite(lat) && Number.isFinite(lng) && (
          <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 10 }}>
            {/* ปุ่มซูมไปตำแหน่งบนแผนที่ */}
            <button
              onClick={() => onZoomToFeature?.(feature)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--c-green-bg)',
                color: 'var(--c-green)',
                padding: '10px 20px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                border: '1px solid var(--c-green-border)',
                cursor: 'pointer',
                fontFamily: 'Sarabun-Medium, sans-serif',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--c-green-bg-hover)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'var(--c-green-bg)'; }}
            >
              {/* ไอคอนเป้าหมาย (crosshair) */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="8" cy="8" r="2" fill="currentColor"/>
              </svg>
              ซูมไปตำแหน่ง
            </button>
          </div>
        )}

        {/* === รูปภาพฟาร์ม === */}
        {p.location && (
          <FarmImage farmName={p.location} authToken={authToken} />
        )}
      </div>
    </div>
  );
};

export default FeatureDetail; // ส่งออก FeatureDetail component
