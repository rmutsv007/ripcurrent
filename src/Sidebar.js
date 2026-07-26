/**
 * Sidebar.js — คอมโพเนนต์แถบเมนูด้านซ้าย
 * แสดงรายการชั้นข้อมูล (Layer) ที่ผู้ใช้สามารถเลือกเปิด/ปิดได้
 * รองรับการย่อ/ขยาย (collapse/expand)
 */

// === นำเข้า React และ hooks ===
import React, { useState } from 'react';

// === นำเข้าข้อมูลชั้นข้อมูลทั้งหมด ===
import layers from './layers';

// === นำเข้าข้อมูลชั้น Heatmap / ความหนาแน่น ===
import orthoLayers from './orthoLayers';

// === นำเข้า CSS สำหรับ Sidebar ===
import './Sidebar.css';

/**
 * CheckIcon — ไอคอนเครื่องหมายถูก (✓)
 * แสดงใน checkbox เมื่อ layer ถูกเลือก
 */
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * CollapseIcon — ไอคอนลูกศรชี้ซ้าย (ย่อ)
 * แสดงในปุ่ม toggle เมื่อ sidebar กำลังขยายอยู่
 */
const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * ExpandIcon — ไอคอนลูกศรชี้ขวา (ขยาย)
 * แสดงในปุ่ม toggle เมื่อ sidebar กำลังย่ออยู่
 */
const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * HeatIcon — ไอคอนสำหรับชั้น Heatmap (รูปคลื่นความร้อน)
 */
const HeatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2.5C10 2.5 5.5 6 5.5 11a4.5 4.5 0 0 0 9 0c0-2-1.2-3.6-1.2-3.6s-.3 1.4-1.3 1.9c.4-1.8-.3-4.3-2-6.7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
  </svg>
);

/**
 * Sidebar — คอมโพเนนต์แถบเมนูเลือกชั้นข้อมูล
 * @param {Function} onLayerChange - callback เมื่อเปลี่ยนชั้นข้อมูลที่เลือก (ส่ง array ของ IDs)
 * @param {boolean} collapsed - สถานะย่อ/ขยาย
 * @param {Function} onCollapseChange - callback เมื่อเปลี่ยนสถานะย่อ/ขยาย
 */
const Sidebar = ({ onLayerChange, onOrthoChange, collapsed, onCollapseChange }) => {
  // ref สำหรับพื้นที่เลื่อนได้ (scroll area)
  const sidebarContentRef = React.useRef();

  /**
   * smoothScroll — เลื่อน scroll อย่างนุ่มนวล
   * @param {HTMLElement} target - element ที่จะเลื่อน
   * @param {number} delta - ระยะทางที่จะเลื่อน (px)
   * ใช้ easeOutCubic timing function เพื่อความลื่นไหล
   */
  const smoothScroll = (target, delta) => {
    const duration = 50;                                    // ระยะเวลา animation (ms)
    const start = target.scrollTop;                         // ตำแหน่ง scroll เริ่มต้น
    const maxScroll = target.scrollHeight - target.clientHeight; // ตำแหน่ง scroll สูงสุด
    let end = start + delta;                                // ตำแหน่ง scroll เป้าหมาย
    if (end < 0) end = 0;                                   // จำกัดไม่ให้ต่ำกว่า 0
    if (end > maxScroll) end = maxScroll;                    // จำกัดไม่ให้เกิน max
    // ถ้าอยู่ขอบแล้วและเลื่อนไปทิศเดียวกัน ให้หยุด
    if ((start === 0 && delta < 0) || (start === maxScroll && delta > 0)) return;
    const startTime = performance.now();                    // เวลาเริ่มต้น animation

    // ฟังก์ชัน animation loop
    function animateScroll(now) {
      const elapsed = now - startTime;                      // เวลาที่ผ่านไป
      const progress = Math.min(elapsed / duration, 1);     // ความคืบหน้า (0-1)
      const ease = 1 - Math.pow(1 - progress, 3);          // easeOutCubic curve
      target.scrollTop = start + (end - start) * ease;      // อัปเดตตำแหน่ง scroll
      if (progress < 1) requestAnimationFrame(animateScroll); // ทำต่อถ้ายังไม่จบ
    }
    requestAnimationFrame(animateScroll);                   // เริ่ม animation
  };

  /**
   * handleSidebarWheel — จัดการเหตุการณ์ scroll wheel ใน sidebar
   * ส่งต่อไปยัง smoothScroll เพื่อเลื่อนอย่างนุ่มนวล
   */
  const handleSidebarWheel = e => {
    if (sidebarContentRef.current) {
      smoothScroll(sidebarContentRef.current, e.deltaY);
    }
  };

  /**
   * toggleSidebar — สลับสถานะย่อ/ขยาย sidebar
   */
  const toggleSidebar = () => {
    if (onCollapseChange) onCollapseChange(!collapsed);
  };

  // แปลง layers เป็น flat array (รองรับทั้งแบบมี category และไม่มี)
  const flatLayers = Array.isArray(layers)
    ? (Array.isArray(layers[0]?.items)
        ? layers.flatMap(cat => cat.items)   // ถ้ามี items (categorized)
        : layers)                             // ถ้าเป็น flat array
    : [];

  // State: เก็บ ID ของ layer ที่ถูกเลือก (เริ่มต้นเลือกตัวแรก)
  const [selectedLayerIds, setSelectedLayerIds] = useState(flatLayers.length > 0 ? [flatLayers[0].id] : []);

  // === Effect: แจ้ง parent component เมื่อ layer ที่เลือกเปลี่ยน ===
  React.useEffect(() => {
    if (onLayerChange) onLayerChange(selectedLayerIds);
  }, [selectedLayerIds, onLayerChange]);

  /**
   * handleLayerToggle — เปิด/ปิดชั้นข้อมูล
   * @param {Object} layer - layer ที่ถูกคลิก
   * ถ้าเลือกอยู่แล้ว → ยกเลิก, ถ้ายังไม่เลือก → เพิ่ม
   */
  const handleLayerToggle = layer => {
    let newIds;
    if (selectedLayerIds.includes(layer.id)) {
      newIds = selectedLayerIds.filter(id => id !== layer.id);  // ยกเลิกการเลือก
    } else {
      newIds = [...selectedLayerIds, layer.id];                  // เพิ่มเข้าไป
    }
    setSelectedLayerIds(newIds);
  };

  // === State: เก็บ ID ของชั้น Heatmap ที่ถูกเลือก (เริ่มต้นไม่เลือก) ===
  const [selectedHeatmapIds, setSelectedHeatmapIds] = useState([]);

  // แจ้ง parent เมื่อชั้น Heatmap ที่เลือกเปลี่ยน
  React.useEffect(() => {
    if (onOrthoChange) onOrthoChange(selectedHeatmapIds);
  }, [selectedHeatmapIds, onOrthoChange]);

  /**
   * handleHeatmapToggle — เปิด/ปิดชั้น Heatmap
   */
  const handleHeatmapToggle = layer => {
    setSelectedHeatmapIds(prev =>
      prev.includes(layer.id)
        ? prev.filter(id => id !== layer.id)   // ยกเลิกการเลือก
        : [...prev, layer.id]                  // เพิ่มเข้าไป
    );
  };

  return (
    // คอนเทนเนอร์ sidebar — เพิ่ม class 'collapsed' เมื่อย่อ
    <div className={`sidebar-container${collapsed ? ' collapsed' : ''}`}>
      {/* ปุ่ม Toggle ย่อ/ขยาย Sidebar */}
      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {/* แสดงไอคอนตามสถานะ: ขยาย→ลูกศรขวา, ย่อ→ลูกศรซ้าย+ข้อความ */}
        {collapsed ? <ExpandIcon /> : <><CollapseIcon /> {!collapsed && <span>ย่อเมนู</span>}</>}
      </button>

      {/* ส่วนหัว Sidebar — แสดงเฉพาะเมื่อขยาย */}
      {!collapsed && (
        <div className="sidebar-header">
          <p className="sidebar-header-title">ชั้นข้อมูล Vector</p>
        </div>
      )}

      {/* รายการชั้นข้อมูล (เลื่อนได้) */}
      <div
        className="sidebar-content"
        ref={sidebarContentRef}
        onWheel={handleSidebarWheel}
      >
        {/* วนลูปแสดงแต่ละ layer */}
        {flatLayers.map(layer => {
          const isActive = selectedLayerIds.includes(layer.id); // ตรวจสอบว่าถูกเลือกหรือไม่
          const displayName = layer.label || layer.name;
          return (
            <div
              key={layer.id}
              className={`layer-item${isActive ? ' active' : ''}`}  // เพิ่ม class 'active' ถ้าเลือก
              onClick={() => handleLayerToggle(layer)}               // คลิกเพื่อเปิด/ปิด
              title={displayName}                                    // tooltip แสดงชื่อ layer
            >
              {/* ไอคอน layer — ดึงจาก GeoServer GetLegendGraphic */}
              <div className="layer-icon-wrapper">
                <img
                  src={`https://map.surveywms.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=LiveStock:${encodeURIComponent(layer.name)}&LEGEND_OPTIONS=${encodeURIComponent('dpi:2400;antialiasing:on;fontAntiAliasing:on;forceRule:True;symbolWidth:40;symbolHeight:40')}&TRANSPARENT=true`}
                  alt={displayName}
                />
              </div>
              {/* ชื่อ layer และ checkbox — แสดงเฉพาะเมื่อ sidebar ขยาย */}
              {!collapsed && (
                <>
                  <span className="layer-name">{displayName}</span>
                  <div className="layer-check">
                    <CheckIcon />  {/* ไอคอนเครื่องหมายถูก (แสดงเมื่อ active ผ่าน CSS) */}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* ==================== ชั้น Heatmap / ความหนาแน่น ==================== */}
        {!collapsed && (
          <div className="sidebar-subheader">
            <p className="sidebar-header-title">ชั้นข้อมูล Raster</p>
          </div>
        )}
        {orthoLayers.map(layer => {
          const isActive = selectedHeatmapIds.includes(layer.id);
          return (
            <div
              key={layer.id}
              className={`layer-item${isActive ? ' active' : ''}`}
              onClick={() => handleHeatmapToggle(layer)}
              title={layer.label}
            >
              {/* ไอคอน heatmap */}
              <div className="layer-icon-wrapper">
                <HeatIcon />
              </div>
              {/* ชื่อ + checkbox — แสดงเฉพาะเมื่อ sidebar ขยาย */}
              {!collapsed && (
                <>
                  <span className="layer-name">{layer.label}</span>
                  <div className="layer-check">
                    <CheckIcon />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ส่วนท้าย Sidebar — แสดงเฉพาะเมื่อขยาย */}
      {!collapsed && (
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar; // ส่งออก Sidebar component