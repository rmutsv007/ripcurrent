/**
 * FarmImage.js — แสดงรูปฟาร์ม (สูงสุด 24 รูป) + อัปโหลด/ลบ (เมื่อ login แล้ว)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://map.surveywms.com/farm-api';
const MAX_IMAGES = 24;

const FarmImage = ({ farmName, authToken }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [fullscreenIdx, setFullscreenIdx] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  // Reset zoom/pan เมื่อเปลี่ยนรูปหรือปิด lightbox
  const openLightbox = (idx) => { setZoom(1); setPan({ x: 0, y: 0 }); setFullscreenIdx(idx); };
  const closeLightbox = () => { setZoom(1); setPan({ x: 0, y: 0 }); setFullscreenIdx(null); };

  // ดึงรูปฟาร์มจาก server
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/images`);
      const data = await res.json();
      const farmImages = data[farmName] || [];
      setImages(farmImages.map(img => ({ ...img, fullUrl: `${API_URL}${img.url}` })));
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [farmName]);

  useEffect(() => {
    if (farmName) fetchImages();
  }, [farmName, fetchImages]);

  // อัปโหลดรูป
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_URL}/api/images/${encodeURIComponent(farmName)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'อัปโหลดไม่สำเร็จ');
        return;
      }
      setMessage(`อัปโหลดสำเร็จ (${data.count}/${data.max})`);
      await fetchImages();
    } catch {
      setMessage('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ลบรูปทีละไฟล์
  const handleDeleteOne = async (filename) => {
    if (!window.confirm('ต้องการลบรูปภาพนี้หรือไม่?')) return;
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/images/${encodeURIComponent(farmName)}/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'ลบไม่สำเร็จ');
        return;
      }
      setMessage('ลบรูปภาพสำเร็จ');
      closeLightbox();
      await fetchImages();
    } catch {
      setMessage('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Lightbox navigation
  const goPrev = (e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); setFullscreenIdx(i => (i > 0 ? i - 1 : images.length - 1)); };
  const goNext = (e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); setFullscreenIdx(i => (i < images.length - 1 ? i + 1 : 0)); };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--c-text-secondary)', fontSize: 13 }}>
        กำลังโหลดรูปภาพ...
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 16, background: 'var(--c-bg-subtle)',
      borderRadius: 12, border: '1px solid var(--c-border)',
      overflow: 'hidden',
    }}>
      {/* หัวข้อ */}
      <div style={{
        padding: '10px 16px', fontWeight: 600, fontSize: 13,
        color: 'var(--c-text-secondary)', borderBottom: '1px solid var(--c-border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            <circle cx="4.5" cy="5.5" r="1.2" stroke="currentColor" strokeWidth="1" fill="none"/>
            <path d="M1 10l3-3 2 2 3-4 4 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          รูปภาพฟาร์ม
        </span>
        {images.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>
            {images.length}/{MAX_IMAGES}
          </span>
        )}
      </div>

      {/* รูปภาพ grid */}
      {images.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
          gap: 4, padding: 4,
        }}>
          {images.map((img, idx) => (
            <div key={img.filename} style={{ position: 'relative', background: 'var(--c-bg-primary)' }}>
              <img
                src={img.fullUrl}
                alt={`${farmName} ${idx + 1}`}
                onClick={() => openLightbox(idx)}
                style={{
                  width: '100%', height: images.length === 1 ? 240 : 140,
                  objectFit: 'contain', display: 'block', cursor: 'pointer',
                  background: 'var(--c-bg-primary)',
                }}
              />
              {/* ปุ่มลบทีละรูป */}
              {authToken && (
                <button
                  onClick={() => handleDeleteOne(img.filename)}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(220,38,38,0.85)', color: '#fff',
                    border: 'none', borderRadius: 4, padding: '2px 6px',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Sarabun-Medium, sans-serif',
                  }}
                >
                  &#10005;
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '24px 16px', textAlign: 'center',
          color: 'var(--c-text-secondary)', fontSize: 13,
        }}>
          {authToken ? 'ยังไม่มีรูปภาพ — อัปโหลดด้านล่าง' : 'ยังไม่มีรูปภาพ'}
        </div>
      )}

      {/* Lightbox เต็มจอ */}
      {fullscreenIdx !== null && images[fullscreenIdx] && (
        <div
          onClick={(e) => {
            // คลิกที่พื้นหลัง (ไม่ใช่ลูก) → ปิด lightbox
            if (e.target === e.currentTarget) closeLightbox();
          }}
          onWheel={(e) => {
            e.stopPropagation();
            setZoom(z => {
              const next = z + (e.deltaY < 0 ? 0.3 : -0.3);
              const clamped = Math.min(Math.max(next, 1), 5);
              if (clamped === 1) setPan({ x: 0, y: 0 });
              return clamped;
            });
          }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img
            src={images[fullscreenIdx].fullUrl}
            alt={farmName}
            draggable={false}
            onMouseDown={(e) => {
              e.preventDefault();
              didDrag.current = false;
              lastPos.current = { x: e.clientX, y: e.clientY };
              if (zoom > 1) setIsDragging(true);
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              didDrag.current = true;
              const dx = e.clientX - lastPos.current.x;
              const dy = e.clientY - lastPos.current.y;
              setPan(p => ({ x: p.x + dx, y: p.y + dy }));
              lastPos.current = { x: e.clientX, y: e.clientY };
            }}
            onMouseUp={() => {
              if (isDragging) { setIsDragging(false); return; }
              // คลิกบนรูป (ไม่ลาก) → ซูมเข้า
              if (!didDrag.current && zoom === 1) setZoom(2);
            }}
            onMouseLeave={() => { if (isDragging) setIsDragging(false); }}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain', borderRadius: 8,
              cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'zoom-in'),
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease',
              userSelect: 'none',
            }}
          />
          {/* ปุ่มปิด */}
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              border: 'none', borderRadius: 8, width: 40, height: 40,
              fontSize: 22, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, padding: 0,
            }}
          >
            &#10005;
          </button>
          {/* ปุ่ม Reset zoom */}
          {zoom > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
              style={{
                position: 'absolute', top: 20, left: 20,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: 'none', borderRadius: 8, padding: '6px 14px',
                fontSize: 13, cursor: 'pointer', fontFamily: 'Sarabun-Medium, sans-serif',
              }}
            >
              {Math.round(zoom * 100)}% — รีเซ็ต
            </button>
          )}
          {/* ตัวนับ */}
          <div style={{
            position: 'absolute', bottom: 20, color: '#fff',
            fontSize: 14, background: 'rgba(0,0,0,0.5)',
            padding: '4px 12px', borderRadius: 8,
          }}>
            {fullscreenIdx + 1} / {images.length}
          </div>
          {/* ปุ่มซ้าย-ขวา (แสดงเมื่อมีมากกว่า 1 รูป) */}
          {images.length > 1 && (
            <>
              <button onClick={goPrev} style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
                borderRadius: 8, width: 44, height: 44, fontSize: 24,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, padding: 0,
              }}>
                &#8249;
              </button>
              <button onClick={goNext} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
                borderRadius: 8, width: 44, height: 44, fontSize: 24,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, padding: 0,
              }}>
                &#8250;
              </button>
            </>
          )}
          {/* ปุ่มลบใน lightbox */}
          {authToken && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteOne(images[fullscreenIdx].filename); }}
              style={{
                position: 'absolute', top: 20, right: 70,
                background: 'rgba(220,38,38,0.85)', color: '#fff',
                border: 'none', borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Sarabun-Medium, sans-serif',
              }}
            >
              ลบรูปนี้
            </button>
          )}
        </div>
      )}

      {/* ปุ่มอัปโหลด (เฉพาะเมื่อ login + ยังไม่ครบ 24) */}
      {authToken && images.length < MAX_IMAGES && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--c-border-subtle)' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--c-accent-bg)', color: 'var(--c-accent-light)',
            padding: '8px 16px', borderRadius: 8, fontSize: 13,
            fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
            border: '1px solid var(--c-accent-border)',
            opacity: uploading ? 0.7 : 1,
            fontFamily: 'Sarabun-Medium, sans-serif',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v9M4 4l3-3 3 3M2 10v2h10v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>

          {message && (
            <span style={{
              marginLeft: 10, fontSize: 12, fontWeight: 500,
              color: message.includes('สำเร็จ') ? 'var(--c-green)' : '#dc2626',
            }}>
              {message}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FarmImage;
