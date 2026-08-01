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
 * RainIcon — ไอคอนสำหรับชั้นเรดาร์ฝน (Longdo Weather)
 */
const RainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M6 8.5a3.5 3.5 0 0 1 6.8-1.2A3 3 0 0 1 14.5 13H6a3 3 0 0 1-1.2-5.75" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
    <line x1="7" y1="15" x2="6" y2="17.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="10" y1="15" x2="9" y2="17.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="13" y1="15" x2="12" y2="17.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

/**
 * Sidebar — คอมโพเนนต์แถบเมนูเลือกชั้นข้อมูล
 * @param {Function} onLayerChange - callback เมื่อเปลี่ยนชั้นข้อมูลที่เลือก (ส่ง array ของ IDs)
 * @param {boolean} collapsed - สถานะย่อ/ขยาย
 * @param {Function} onCollapseChange - callback เมื่อเปลี่ยนสถานะย่อ/ขยาย
 */
const Sidebar = ({ onLayerChange, onOrthoChange, onRainChange, collapsed, onCollapseChange, orthoOpacities, onOrthoOpacityChange }) => {
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
   * @param {string} categoryName - ชื่อหมวดหมู่ของ layer นั้น (ถ้ามี)
   */
  const handleLayerToggle = (layer, categoryName) => {
    setSelectedLayerIds(prevIds => {
      // 1. ถ้าชั้นข้อมูลที่คลิกอยู่ในหมวด "คุณภาพน้ำ" (ให้เลือกได้แค่อันเดียว)
      if (categoryName === 'คุณภาพน้ำ') {
        // หา ID ทั้งหมดที่อยู่ในหมวดคุณภาพน้ำ
        const waterQualityCategory = layers.find(cat => cat.category === 'คุณภาพน้ำ');
        const waterQualityIds = waterQualityCategory ? waterQualityCategory.items.map(item => item.id) : [];

        // ถ้าคลิกอันที่เปิดอยู่แล้ว -> ให้ปิด
        if (prevIds.includes(layer.id)) {
          return prevIds.filter(id => id !== layer.id);
        } 
        // ถ้าคลิกอันใหม่ -> ลบอันเก่าในหมวดนี้ออกให้หมด แล้วใส่ตัวใหม่เข้าไปแทน
        else {
          const filteredIds = prevIds.filter(id => !waterQualityIds.includes(id));
          return [...filteredIds, layer.id];
        }
      }

      // 2. ถ้าเป็นหมวดอื่นๆ (เปิด/ปิดซ้อนกันได้แบบเดิม)
      if (prevIds.includes(layer.id)) {
        return prevIds.filter(id => id !== layer.id);
      } else {
        return [...prevIds, layer.id];
      }
    });
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

  // === State: เปิด/ปิดชั้นเรดาร์ฝน (Longdo Weather) ===
  const [rainEnabled, setRainEnabled] = useState(false);

  // แจ้ง parent เมื่อสถานะชั้นเรดาร์ฝนเปลี่ยน
  React.useEffect(() => {
    if (onRainChange) onRainChange(rainEnabled);
  }, [rainEnabled, onRainChange]);

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

      {/* รายการชั้นข้อมูล (เลื่อนได้) */}
      <div
        className="sidebar-content"
        ref={sidebarContentRef}
        onWheel={handleSidebarWheel}
      >
        {/* วนลูปแสดงแต่ละ layer แบบรองรับหัวข้อใหญ่ */}
        {Array.isArray(layers) && layers[0]?.items ? (
          // แบบมีหมวดหมู่
          layers.map((cat, index) => (
            <React.Fragment key={index}>
              {/* ชื่อหัวข้อใหญ่ */}
              {!collapsed && (
                <div className="sidebar-subheader" style={{ marginTop: '12px', paddingBottom: '4px' }}>
                  <p className="sidebar-header-title" style={{ fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 600 }}>
                    {cat.category}
                  </p>
                </div>
              )}
              {/* ข้อมูลย่อยในหมวดหมู่ */}
              {cat.items.map(layer => {
                const isActive = selectedLayerIds.includes(layer.id);
                const displayName = layer.label || layer.name;
                return (
                  <div
                    key={layer.id}
                    className={`layer-item${isActive ? ' active' : ''}`}
                    onClick={() => handleLayerToggle(layer, cat.category)}
                    title={displayName}
                    // เพิ่ม margin ให้เยื้องเข้าไปด้านในเพื่อให้ดูเป็นหัวข้อย่อย
                    style={{ marginLeft: collapsed ? 0 : '16px', paddingLeft: '8px' }} 
                  >
                    <div className="layer-icon-wrapper">
                      <img
                        src={`https://map.surveywms.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=ChalatatSongkhla:${encodeURIComponent(layer.name)}&LEGEND_OPTIONS=${encodeURIComponent('dpi:2400;antialiasing:on;fontAntiAliasing:on;forceRule:True;symbolWidth:40;symbolHeight:40')}&TRANSPARENT=true`}
                        alt={displayName}
                      />
                    </div>
                    {!collapsed && (
                      <>
                        <span className="layer-name">{displayName}</span>
                        <div className="layer-check">
                          <CheckIcon />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))
        ) : (
          // แบบไม่มีหมวดหมู่ (โครงสร้างเดิม)
          flatLayers.map(layer => {
            const isActive = selectedLayerIds.includes(layer.id);
            const displayName = layer.label || layer.name;
            return (
              <div
                key={layer.id}
                className={`layer-item${isActive ? ' active' : ''}`}
                onClick={() => handleLayerToggle(layer)}
                title={displayName}
              >
                <div className="layer-icon-wrapper">
                  <img
                    src={`https://map.surveywms.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=ChalatatSongkhla:${encodeURIComponent(layer.name)}&LEGEND_OPTIONS=${encodeURIComponent('dpi:2400;antialiasing:on;fontAntiAliasing:on;forceRule:True;symbolWidth:40;symbolHeight:40')}&TRANSPARENT=true`}
                    alt={displayName}
                  />
                </div>
                {!collapsed && (
                  <>
                    <span className="layer-name">{displayName}</span>
                    <div className="layer-check">
                      <CheckIcon />
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}

        {/* ==================== ชั้น Heatmap / ความหนาแน่น ==================== */}        
        {/* วนลูปแสดงผล OrthoLayers แบบรองรับหมวดหมู่ */}
        {Array.isArray(orthoLayers) && orthoLayers[0]?.items ? (
          orthoLayers.map((cat, index) => (
            <React.Fragment key={`ortho-cat-${index}`}>
              {!collapsed && (
                <div className="sidebar-subheader" style={{ marginTop: '12px', paddingBottom: '4px' }}>
                  <p className="sidebar-header-title" style={{ fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 600 }}>
                    {cat.category}
                  </p>
                </div>
              )}
              {cat.items.map(layer => {
                const isActive = selectedHeatmapIds.includes(layer.id);
                return (
                  <React.Fragment key={layer.id}>
                    <div
                      className={`layer-item${isActive ? ' active' : ''}`}
                      onClick={() => handleHeatmapToggle(layer)}
                      title={layer.label}
                      style={{ marginLeft: collapsed ? 0 : '16px', paddingLeft: '8px' }}
                    >
                      <div className="layer-icon-wrapper">
                        <HeatIcon />
                      </div>
                      {!collapsed && (
                        <>
                          <span className="layer-name">{layer.label}</span>
                          <div className="layer-check">
                            <CheckIcon />
                          </div>
                        </>
                      )}
                    </div>
                    {!collapsed && isActive && (
                      <div style={{ margin: '4px 16px 8px 32px', padding: '8px 10px', background: 'var(--c-bg-secondary)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
                          <span>ความทึบ Raster</span>
                          <span style={{ color: 'var(--c-accent-light)' }}>{Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}
                          onChange={e => onOrthoOpacityChange(layer.id, Number(e.target.value) / 100)}
                          aria-label="ปรับความทึบ Ortho"
                          style={{ width: '100%', accentColor: 'var(--c-accent)', cursor: 'pointer' }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))
        ) : (
          /* กรณีกลับไปใช้แบบไม่มีหมวดหมู่ */
          orthoLayers.map(layer => {
            const isActive = selectedHeatmapIds.includes(layer.id);
            return (
              <React.Fragment key={layer.id}>
                <div
                  className={`layer-item${isActive ? ' active' : ''}`}
                  onClick={() => handleHeatmapToggle(layer)}
                  title={layer.label}
                >
                  <div className="layer-icon-wrapper">
                    <HeatIcon />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="layer-name">{layer.label}</span>
                      <div className="layer-check">
                        <CheckIcon />
                      </div>
                    </>
                  )}
                </div>
                {!collapsed && isActive && (
                  <div style={{ margin: '4px 16px 8px 24px', padding: '8px 10px', background: 'var(--c-bg-secondary)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
                      <span>ความทึบ Raster</span>
                      <span style={{ color: 'var(--c-accent-light)' }}>{Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}
                      onChange={e => onOrthoOpacityChange(layer.id, Number(e.target.value) / 100)}
                      aria-label="ปรับความทึบ Ortho"
                      style={{ width: '100%', accentColor: 'var(--c-accent)', cursor: 'pointer' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}

        {/* ==================== ชั้นสภาพอากาศ (เรดาร์ฝน Longdo Weather) ==================== */}
        {!collapsed && (
          <div className="sidebar-subheader" style={{ marginTop: '12px', paddingBottom: '4px' }}>
            <p className="sidebar-header-title" style={{ fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 600 }}>
              สภาพอากาศ
            </p>
          </div>
        )}
        <div
          className={`layer-item${rainEnabled ? ' active' : ''}`}
          onClick={() => setRainEnabled(v => !v)}
          title="เรดาร์ฝน (Longdo Weather)"
        >
          <div className="layer-icon-wrapper">
            <RainIcon />
          </div>
          {!collapsed && (
            <>
              <span className="layer-name">เรดาร์ฝน (Longdo Weather)</span>
              <div className="layer-check">
                <CheckIcon />
              </div>
            </>
          )}
        </div>
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