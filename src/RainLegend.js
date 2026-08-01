/**
 * RainLegend.js — คำอธิบายสัญลักษณ์ความเข้มฝนของ Layer เรดาร์ฝน (Longdo Weather)
 * แสดงเป็นแถบไล่สีลอยที่มุมล่างขวาของแผนที่ เฉพาะตอนเปิด Layer ฝนเท่านั้น
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const RainLegend = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', right: 10, bottom: 24, zIndex: 1000,
        background: 'var(--c-bg-primary)',
        border: '1px solid var(--c-border)',
        borderRadius: 8,
        padding: '10px 12px',
        boxShadow: 'var(--c-shadow-lg)',
        fontFamily: 'Sarabun, sans-serif',
        width: 190,
      }}
    >
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--c-text)' }}>
        เรดาร์ฝน (mm/hr)
      </div>
      <div style={{
        width: '100%', height: 10, borderRadius: 4,
        background: 'linear-gradient(90deg, #a3d8ff 0%, #4f9eea 25%, #f5d90a 50%, #ff8c00 75%, #d62828 100%)',
      }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 4,
        fontSize: 11, color: 'var(--c-text-secondary)',
      }}>
        <span>0</span>
        <span>10</span>
        <span>25</span>
        <span>50+</span>
      </div>
    </div>
  );
};

export default RainLegend;
