/**
 * Legend.js — คอมโพเนนต์แสดงคำอธิบายสัญลักษณ์ (Legend)
 * แสดงรายการชั้นข้อมูลทั้งหมดพร้อมไอคอนจาก GeoServer
 * ใช้ภายใน LegendFloating.js
 */

import React from 'react';
import './Legend.css';     // CSS สำหรับ Legend
import layers from './layers'; // รายการชั้นข้อมูลทั้งหมด

// ตัวเลือกสำหรับ GetLegendGraphic request (ความละเอียดสูง)
const LEGEND_OPTIONS = 'dpi:2400;antialiasing:on;fontAntiAliasing:on;forceRule:True;symbolWidth:40;symbolHeight:40';

/**
 * getLegendUrl — สร้าง URL สำหรับดึงไอคอน legend จาก GeoServer
 * @param {string} layerName - ชื่อ layer ใน GeoServer
 * @returns {string} URL ของภาพไอคอน legend
 */
const getLegendUrl = (layerName) =>
  `https://map.surveywms.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=ChalatatSongkhla:${encodeURIComponent(layerName)}&LEGEND_OPTIONS=${encodeURIComponent(LEGEND_OPTIONS)}&TRANSPARENT=true`;

/**
 * Legend — คอมโพเนนต์แสดงรายการสัญลักษณ์ทั้งหมด
 * วนลูปแสดง layer ทั้งหมดพร้อมไอคอนและชื่อ
 */
const Legend = () => {
  return (
    <>
      {/* คอนเทนเนอร์ — จัดเรียงแนวตั้ง */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* วนลูปแสดงแต่ละ layer */}
        {layers.map(layer => (
          (() => {
            const displayName = layer.label || layer.name;
            return (
          <div key={layer.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--c-bg-subtle)',
            borderRadius: 8,
            padding: '8px 10px',
            border: '1px solid var(--c-border)',
            transition: 'background 0.2s',
          }}>
            {/* กรอบไอคอน */}
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: 'var(--c-bg-icon)',
              border: '1px solid var(--c-bg-icon-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {/* รูปไอคอนจาก GeoServer */}
              <img
                src={getLegendUrl(layer.name)}
                alt={displayName}
                style={{ width: 20, height: 20, objectFit: 'contain' }}
              />
            </div>
            {/* ชื่อ layer */}
            <span style={{ fontSize: 13, color: 'var(--c-text)', fontWeight: 500 }}>{displayName}</span>
          </div>
            );
          })()
        ))}
      </div>
    </>
  );
};

export default Legend; // ส่งออก Legend component