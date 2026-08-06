/**
 * RainTimeline.js — แถบเวลา + ปุ่มเล่น/หยุด/ปรับความเร็ว สำหรับภาพเคลื่อนไหวเรดาร์ฝน
 * ปกติแสดงมุมล่างซ้าย (ไม่ทับ RainLegend), ย้ายมากลางล่างเมื่อขยายแผนที่เต็ม (ย่อ Dashboard)
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import './RainTimeline.css';

const SPEED_OPTIONS = [0.5, 1, 2];
const HALF_HOUR = 1800;
const HOUR = 3600;

const formatTime = (unixSeconds) =>
  new Date(unixSeconds * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

const RainTimeline = ({ frames, currentIndex, onSeek, playing, onTogglePlay, speed, onSpeedChange, centered }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  if (!frames.length) return null;
  const current = frames[currentIndex];
  // เฉพาะเฟรมที่ตรงหลักครึ่งชั่วโมงพอดี ใช้ทำขีดแบ่งย่อยใต้แถบเลื่อน
  const halfHourTicks = frames
    .map((f, i) => ({ time: f.time, index: i }))
    .filter(f => f.time % HALF_HOUR === 0);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', bottom: 24, zIndex: 1000,
        ...(centered ? { left: '50%', transform: 'translateX(-50%)' } : { left: 10 }),
        background: 'var(--c-bg-primary)', border: '1px solid var(--c-border)', borderRadius: 10,
        padding: '10px 16px', boxShadow: 'var(--c-shadow-lg)', fontFamily: 'Sarabun, sans-serif',
        width: 320, display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)' }}>
          เรดาร์ฝนย้อนหลัง — {current ? formatTime(current.time) : ''} น.
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {SPEED_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                border: '1px solid var(--c-border)', cursor: 'pointer',
                background: speed === s ? 'var(--c-accent-bg)' : 'var(--c-bg-icon)',
                color: speed === s ? 'var(--c-accent-light)' : 'var(--c-text-secondary)',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onTogglePlay}
          aria-label={playing ? 'หยุดชั่วคราว' : 'เล่นภาพเคลื่อนไหว'}
          style={{
            width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--c-border)',
            background: 'var(--c-bg-icon)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, color: 'var(--c-accent-light)', padding: 0,
          }}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="1" width="3" height="10" />
              <rect x="7" y="1" width="3" height="10" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <polygon points="2,1 11,6 2,11" />
            </svg>
          )}
        </button>
        <div style={{ position: 'relative', flex: 1 }}>
          {/* tick marks อยู่ใต้ slider เป็น layer ซ้อนกัน */}
          <div className="rain-track-wrap">
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              step={1}
              value={currentIndex}
              onChange={e => onSeek(Number(e.target.value))}
              aria-label="เลื่อนดูภาพเรดาร์ฝนย้อนหลัง"
              className="rain-slider"
              style={{ '--val': `${frames.length > 1 ? (currentIndex / (frames.length - 1)) * 100 : 0}%` }}
            />
            {halfHourTicks.length > 0 && (
              <div className="rain-ticks">
                {/* ป้ายเวลาเริ่ม/สิ้นสุด — ใช้โครงสร้างเดียวกับ tick เพื่อให้อยู่ระดับเดียวกัน */}
                <div className="rain-tick" style={{ left: 'calc(8px)', transform: 'translateX(-50%)' }}>
                  <span className="rain-tick-line hour" />
                  <span className="rain-tick-label">{formatTime(frames[0].time)}</span>
                </div>
                <div className="rain-tick" style={{ left: 'calc(100% - 8px)', transform: 'translateX(-50%)' }}>
                  <span className="rain-tick-line hour" />
                  <span className="rain-tick-label">{formatTime(frames[frames.length - 1].time)}</span>
                </div>
                {halfHourTicks.map(t => {
                  const pct = frames.length > 1 ? (t.index / (frames.length - 1)) * 100 : 50;
                  const isHour = t.time % HOUR === 0;
                  const showLabel = isHour && pct > 6 && pct < 94;
                  return (
                    // thumb วิ่งใน range [8px, 100%-8px] ต้องชดเชย inset 8px (= half thumb width)
                    <div key={t.index} className="rain-tick" style={{ left: `calc(8px + (100% - 16px) * ${pct} / 100)` }}>
                      <span className={`rain-tick-line${isHour ? ' hour' : ''}`} />
                      {showLabel && (
                        <span className="rain-tick-label">{formatTime(t.time)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RainTimeline;
