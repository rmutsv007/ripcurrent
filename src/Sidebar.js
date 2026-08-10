/**
 * Sidebar.js — คอมโพเนนต์แถบเมนูด้านซ้าย
 */

import React, { useState } from 'react';
import layers from './layers';
import orthoLayers from './orthoLayers';
import './Sidebar.css';

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HeatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2.5C10 2.5 5.5 6 5.5 11a4.5 4.5 0 0 0 9 0c0-2-1.2-3.6-1.2-3.6s-.3 1.4-1.3 1.9c.4-1.8-.3-4.3-2-6.7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
  </svg>
);

const WindIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M2.5 6.5h9a2 2 0 1 0-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M2.5 10.5h11.5a2.2 2.2 0 1 1-2.2 2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M2.5 14.5h7a1.7 1.7 0 1 0-1.7-1.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <circle cx="6.5" cy="3.9" r="0.75" fill="currentColor" />
    <path d="M6.5 5.8V9.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const Sidebar = ({ onLayerChange, onOrthoChange, onRainChange, onWindChange, collapsed, onCollapseChange, orthoOpacities, onOrthoOpacityChange }) => {
  const sidebarContentRef = React.useRef();

  const smoothScroll = (target, delta) => {
    const duration = 50;
    const start = target.scrollTop;
    const maxScroll = target.scrollHeight - target.clientHeight;
    let end = start + delta;
    if (end < 0) end = 0;
    if (end > maxScroll) end = maxScroll;
    if ((start === 0 && delta < 0) || (start === maxScroll && delta > 0)) return;
    const startTime = performance.now();

    function animateScroll(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      target.scrollTop = start + (end - start) * ease;
      if (progress < 1) requestAnimationFrame(animateScroll);
    }
    requestAnimationFrame(animateScroll);
  };

  const handleSidebarWheel = e => {
    if (sidebarContentRef.current) {
      smoothScroll(sidebarContentRef.current, e.deltaY);
    }
  };

  const toggleSidebar = () => {
    if (onCollapseChange) onCollapseChange(!collapsed);
  };

  const flatLayers = Array.isArray(layers)
    ? (Array.isArray(layers[0]?.items)
        ? layers.flatMap(cat => cat.items)
        : layers)
    : [];

  const [selectedLayerIds, setSelectedLayerIds] = useState(flatLayers.length > 0 ? [flatLayers[0].id] : []);
  const [showWaterInfoPopup, setShowWaterInfoPopup] = useState(false);
  const waterInfoShownRef = React.useRef(false);

  const openWaterInfoPopup = () => {
    setShowWaterInfoPopup(true);
    waterInfoShownRef.current = true;
  };

  React.useEffect(() => {
    if (!waterInfoShownRef.current) {
      openWaterInfoPopup();
    }
  }, []);

  React.useEffect(() => {
    if (onLayerChange) onLayerChange(selectedLayerIds);
  }, [selectedLayerIds, onLayerChange]);

  const handleLayerToggle = (layer, categoryName) => {
    setSelectedLayerIds(prevIds => {
      if (categoryName === 'คุณภาพน้ำ') {
        if (!waterInfoShownRef.current) {
          openWaterInfoPopup();
        }

        const waterQualityCategory = layers.find(cat => cat.category === 'คุณภาพน้ำ');
        const waterQualityIds = waterQualityCategory ? waterQualityCategory.items.map(item => item.id) : [];

        if (prevIds.includes(layer.id)) {
          return prevIds.filter(id => id !== layer.id);
        } else {
          const filteredIds = prevIds.filter(id => !waterQualityIds.includes(id));
          return [...filteredIds, layer.id];
        }
      }

      if (prevIds.includes(layer.id)) {
        return prevIds.filter(id => id !== layer.id);
      } else {
        return [...prevIds, layer.id];
      }
    });
  };

  const [selectedHeatmapIds, setSelectedHeatmapIds] = useState([]);

  React.useEffect(() => {
    if (onOrthoChange) onOrthoChange(selectedHeatmapIds);
  }, [selectedHeatmapIds, onOrthoChange]);

  const handleHeatmapToggle = layer => {
    setSelectedHeatmapIds(prev =>
      prev.includes(layer.id)
        ? prev.filter(id => id !== layer.id)
        : [...prev, layer.id]
    );
  };

  const [rainEnabled, setRainEnabled] = useState(false);

  React.useEffect(() => {
    if (onRainChange) onRainChange(rainEnabled);
  }, [rainEnabled, onRainChange]);

  const [windEnabled, setWindEnabled] = useState(false);

  React.useEffect(() => {
    if (onWindChange) onWindChange(windEnabled);
  }, [windEnabled, onWindChange]);

  return (
    <div className={`sidebar-container${collapsed ? ' collapsed' : ''}`}>
      {showWaterInfoPopup && (
        <div
          onClick={() => setShowWaterInfoPopup(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', maxWidth: '90vw', maxHeight: '90vh',
              background: 'var(--c-bg-primary)', borderRadius: 12, padding: 8,
              boxShadow: 'var(--c-shadow-lg)',
            }}
          >
            <button
              type="button"
              onClick={() => setShowWaterInfoPopup(false)}
              aria-label="ปิดหน้าต่างข้อมูล"
              style={{
                position: 'absolute', top: -12, right: -12, width: 28, height: 28,
                borderRadius: '50%', border: 'none', background: 'var(--c-bg-primary)',
                boxShadow: 'var(--c-shadow)', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--c-text)', lineHeight: 1,
              }}
            >
              ×
            </button>
            <img
              src="/assets/popup.png"
              alt="ข้อมูลคุณภาพน้ำ"
              style={{ display: 'block', maxWidth: '85vw', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ExpandIcon /> : <><CollapseIcon /> {!collapsed && <span>ย่อเมนู</span>}</>}
      </button>

      <div
        className="sidebar-content"
        ref={sidebarContentRef}
        onWheel={handleSidebarWheel}
      >
        {Array.isArray(layers) && layers[0]?.items ? (
          layers.map((cat, index) => (
            <React.Fragment key={index}>
              {!collapsed && (
                <div className="sidebar-subheader" style={{ marginTop: '12px', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p className="sidebar-header-title" style={{ fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 600, margin: 0 }}>
                    {cat.category}
                  </p>
                  {cat.category === 'คุณภาพน้ำ' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openWaterInfoPopup(); }}
                      title="ข้อมูลเพิ่มเติมเกี่ยวกับคุณภาพน้ำ"
                      aria-label="ข้อมูลเพิ่มเติมเกี่ยวกับคุณภาพน้ำ"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 16, height: 16, borderRadius: '50%',
                        border: '1px solid var(--c-text-secondary)', background: 'transparent',
                        color: 'var(--c-text-secondary)', cursor: 'pointer', padding: 0, flexShrink: 0,
                      }}
                    >
                      <InfoIcon />
                    </button>
                  )}
                </div>
              )}

              {cat.items.map(layer => {
                const isActive = selectedLayerIds.includes(layer.id);
                const displayName = layer.label || layer.name;
                return (
                  <div
                    key={layer.id}
                    className={`layer-item${isActive ? ' active' : ''}`}
                    onClick={() => handleLayerToggle(layer, cat.category)}
                    title={displayName}
                    style={{ marginLeft: collapsed ? 0 : '16px', paddingLeft: '8px' }} 
                  >
                    <div className="layer-icon-wrapper">
                      <img
                        src={layer.icon || `https://map.surveywms.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=ChalatatSongkhla:${encodeURIComponent(layer.name)}&LEGEND_OPTIONS=${encodeURIComponent('dpi:2400;antialiasing:on;fontAntiAliasing:on;forceRule:True;symbolWidth:40;symbolHeight:40')}&TRANSPARENT=true`}
                        alt={displayName}
                        style={{ width: layer.iconSize ?? 22, height: layer.iconSize ?? 22, objectFit: 'contain' }}
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
                    src={layer.icon || `https://map.surveywms.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=ChalatatSongkhla:${encodeURIComponent(layer.name)}&LEGEND_OPTIONS=${encodeURIComponent('dpi:2400;antialiasing:on;fontAntiAliasing:on;forceRule:True;symbolWidth:40;symbolHeight:40')}&TRANSPARENT=true`}
                    alt={displayName}
                    style={{ width: layer.iconSize ?? 22, height: layer.iconSize ?? 22, objectFit: 'contain' }}
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
                        {layer.icon
                          ? <img src={layer.icon} alt={layer.label} style={{ width: layer.iconSize ?? 22, height: layer.iconSize ?? 22, objectFit: 'contain' }} />
                          : <HeatIcon />}
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
                      <div className="opacity-slider-wrap">
                        <div className="opacity-slider-header">
                          <span>ความทึบ</span>
                          <span>{Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}
                          onChange={e => onOrthoOpacityChange(layer.id, Number(e.target.value) / 100)}
                          aria-label="ปรับความทึบ Ortho"
                          className="opacity-slider"
                          style={{ '--val': `${Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}%` }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))
        ) : (
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
                    {layer.icon
                      ? <img src={layer.icon} alt={layer.label} style={{ width: layer.iconSize ?? 22, height: layer.iconSize ?? 22, objectFit: 'contain' }} />
                      : <HeatIcon />}
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
                  <div className="opacity-slider-wrap no-cat">
                    <div className="opacity-slider-header">
                      <span>ความทึบ</span>
                      <span>{Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}
                      onChange={e => onOrthoOpacityChange(layer.id, Number(e.target.value) / 100)}
                      aria-label="ปรับความทึบ Ortho"
                      className="opacity-slider"
                      style={{ '--val': `${Math.round((orthoOpacities[layer.id] ?? 0.4) * 100)}%` }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}

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
            <img src="/assets/heavy-rain.png" alt="เรดาร์ฝน" style={{ width: 22, height: 22, objectFit: 'contain' }} />
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

        <div
          className={`layer-item${windEnabled ? ' active' : ''}`}
          onClick={() => setWindEnabled(v => !v)}
          title="ลมและทิศทางลม"
        >
          <div className="layer-icon-wrapper">
            <WindIcon />
          </div>
          {!collapsed && (
            <>
              <span className="layer-name">ลมและทิศทางลม</span>
              <div className="layer-check">
                <CheckIcon />
              </div>
            </>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;