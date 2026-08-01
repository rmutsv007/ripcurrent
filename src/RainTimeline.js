/**
 * RainTimeline.js — แถบเวลา + ปุ่มเล่น/หยุด/ปรับความเร็ว สำหรับภาพเคลื่อนไหวเรดาร์ฝน
 * ปกติแสดงมุมล่างซ้าย (ไม่ทับ RainLegend), ย้ายมากลางล่างเมื่อขยายแผนที่เต็ม (ย่อ Dashboard)
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

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
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            step={1}
            value={currentIndex}
            onChange={e => onSeek(Number(e.target.value))}
            aria-label="เลื่อนดูภาพเรดาร์ฝนย้อนหลัง"
            style={{ width: '100%', accentColor: 'var(--c-accent)', cursor: 'pointer', display: 'block' }}
          />
          {halfHourTicks.length > 0 && (
            <div style={{ position: 'relative', height: 16, marginTop: 2 }}>
              {halfHourTicks.map(t => {
                const pct = frames.length > 1 ? (t.index / (frames.length - 1)) * 100 : 50;
                // ซ่อนตัวเลขชั่วโมงที่อยู่ใกล้ขอบเกินไป กันไม่ให้ไปทับป้ายเวลาเริ่ม/สิ้นสุดด้านล่าง
                const showLabel = t.time % HOUR === 0 && pct > 6 && pct < 94;
                return (
                  <div
                    key={t.index}
                    style={{
                      position: 'absolute', left: `${pct}%`,
                      transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}
                  >
                    <span style={{ width: 1, height: t.time % HOUR === 0 ? 6 : 4, background: 'var(--c-border)' }} />
                    {showLabel && (
                      <span style={{ fontSize: 9, color: 'var(--c-text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatTime(t.time)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text-secondary)' }}>
        <span>{formatTime(frames[0].time)}</span>
        <span>{formatTime(frames[frames.length - 1].time)}</span>
      </div>
    </div>
  );
};

export default RainTimeline;
