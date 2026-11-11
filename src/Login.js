/**
 * Login.js — หน้าเข้าสู่ระบบสำหรับผู้ดูแล (จัดการรูปภาพฟาร์ม)
 */
import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://map.surveywms.com/farm-api';

const Login = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State สำหรับลูกเล่นไอคอนกุญแจปลดล็อก
  const [isLockHovered, setIsLockHovered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', data.username);
      onLogin({ token: data.token, username: data.username });
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes smartBackdropFade {
          from { background: rgba(0, 0, 0, 0); backdrop-filter: blur(0px); }
          to { background: rgba(0, 0, 0, 0.35); backdrop-filter: blur(8px); }
        }
        @keyframes smartModalPop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'smartBackdropFade 0.25s ease-out forwards'
      }}>
        <form onSubmit={handleSubmit} style={{
          background: 'var(--c-popup-start)',
          WebkitBackdropFilter: 'var(--blur-panel)',
          backdropFilter: 'var(--blur-panel)',
          borderRadius: 18, 
          padding: '32px', width: '100%', maxWidth: 360,
          boxShadow: 'var(--c-shadow-lg)', 
          border: '1px solid var(--c-border)',
          fontFamily: 'var(--font-ui)',
          position: 'relative',
          animation: 'smartModalPop 0.28s cubic-bezier(0.25, 0.1, 0.25, 1) forwards'
        }}>
          {/* ปุ่มกากบาท */}
          <button type="button" onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--c-bg-input)', border: 'none', width: 28, height: 28,
            borderRadius: '50%', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--c-text-secondary, #64748b)', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--c-bg-input-focus)'; e.currentTarget.style.color = 'var(--c-text)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--c-bg-input)'; e.currentTarget.style.color = 'var(--c-text-secondary)'; }}
          >
            &times;
          </button>

          {/* ส่วนหัวหน้าต่าง */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            
            {/* กุญแจปลดล็อก (อัปเดตใหม่) */}
            <div 
              onMouseEnter={() => setIsLockHovered(true)}
              onMouseLeave={() => setIsLockHovered(false)}
              style={{ 
                color: 'var(--c-accent)',
                lineHeight: 0,
                marginBottom: 12,
                display: 'inline-block',
                cursor: 'pointer',
                transition: 'transform 0.2s var(--ease-out)',
                transform: isLockHovered ? 'scale(1.06)' : 'scale(1)'
              }}
              title="ปลดล็อกระบบ"
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d={isLockHovered ? 'M7 11V7a5 5 0 0 1 9.9-1' : 'M7 11V7a5 5 0 0 1 10 0v4'} />
              </svg>
            </div>

            <h2 style={{ margin: 0, fontSize: 22, color: 'var(--c-text)', fontWeight: 600 }}>
              เข้าสู่ระบบผู้ดูแล
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--c-text-secondary, #64748b)' }}>
              กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255, 59, 48, 0.10)', color: '#ff3b30', padding: '12px',
              borderRadius: 12, fontSize: 13, marginBottom: 20, border: '1px solid rgba(255, 59, 48, 0.25)',
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'smartModalPop 0.3s ease-out forwards'
            }}>
              {error}
            </div>
          )}

          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary, #64748b)', display: 'block', marginBottom: 6 }}>
              ชื่อผู้ใช้
            </span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="กรอกชื่อผู้ใช้..."
              required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1px solid var(--c-border-input)', fontSize: 15,
                background: 'var(--c-bg-input)', color: 'var(--c-text)',
                fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none', transition: 'border 0.3s, box-shadow 0.3s'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--c-accent)'; e.target.style.boxShadow = '0 0 0 3px var(--c-accent-border)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--c-border-input)'; e.target.style.boxShadow = 'none'; }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary, #64748b)', display: 'block', marginBottom: 6 }}>
              รหัสผ่าน
            </span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1px solid var(--c-border-input)', fontSize: 15,
                background: 'var(--c-bg-input)', color: 'var(--c-text)',
                fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none', transition: 'border 0.3s, box-shadow 0.3s'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--c-accent)'; e.target.style.boxShadow = '0 0 0 3px var(--c-accent-border)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--c-border-input)'; e.target.style.boxShadow = 'none'; }}
            />
          </label>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 0', borderRadius: 10, 
            background: 'var(--c-accent)', 
            color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
            boxShadow: 'none',
            transition: 'filter 0.18s, transform 0.18s', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
          onMouseOver={e => { if(!loading) e.currentTarget.style.filter = 'brightness(1.08)'; }}
          onMouseOut={e => { if(!loading) { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; } }}
          onMouseDown={e => { if(!loading) e.currentTarget.style.transform = 'scale(0.99)'; }}
          onMouseUp={e => { if(!loading) e.currentTarget.style.transform = 'none'; }}
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </>
  );
};

export default Login;