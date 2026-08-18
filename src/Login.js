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
          from { background: rgba(15, 23, 42, 0); backdrop-filter: blur(0px); }
          to { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(6px); }
        }
        @keyframes smartModalPop {
          from { opacity: 0; transform: scale(0.9) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'smartBackdropFade 0.4s ease-out forwards'
      }}>
        <form onSubmit={handleSubmit} style={{
          background: 'var(--c-bg-primary, #ffffff)', 
          borderRadius: 24, 
          padding: '32px', width: '100%', maxWidth: 360,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
          border: '1px solid var(--c-border, #e2e8f0)',
          fontFamily: 'Sarabun-Medium, sans-serif',
          position: 'relative',
          animation: 'smartModalPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.15) forwards'
        }}>
          {/* ปุ่มกากบาท */}
          <button type="button" onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--c-bg-subtle, #f1f5f9)', border: 'none', width: 32, height: 32,
            borderRadius: '50%', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--c-text-secondary, #64748b)', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { e.target.style.background = '#fee2e2'; e.target.style.color = '#ef4444'; e.target.style.transform = 'rotate(90deg)'; }}
          onMouseOut={(e) => { e.target.style.background = 'var(--c-bg-subtle, #f1f5f9)'; e.target.style.color = 'var(--c-text-secondary, #64748b)'; e.target.style.transform = 'rotate(0deg)'; }}
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
                fontSize: 44, 
                marginBottom: 12,
                display: 'inline-block',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                transform: isLockHovered ? 'scale(1.2) rotate(-10deg)' : 'scale(1) rotate(0deg)'
              }}
              title="ปลดล็อกระบบ"
            >
              {isLockHovered ? '🔓' : '🔐'}
            </div>

            <h2 style={{ margin: 0, fontSize: 22, color: 'var(--c-text, #1e293b)', fontWeight: 700 }}>
              เข้าสู่ระบบผู้ดูแล
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--c-text-secondary, #64748b)' }}>
              กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', color: '#dc2626', padding: '12px',
              borderRadius: 12, fontSize: 13, marginBottom: 20, border: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'smartModalPop 0.3s ease-out forwards'
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary, #64748b)', display: 'block', marginBottom: 6 }}>
              👤 ชื่อผู้ใช้
            </span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="กรอกชื่อผู้ใช้..."
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1px solid var(--c-border, #cbd5e1)', fontSize: 15,
                background: 'var(--c-bg-subtle, #f8fafc)', color: 'var(--c-text, #0f172a)',
                fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none', transition: 'border 0.3s, box-shadow 0.3s'
              }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--c-border, #cbd5e1)'; e.target.style.boxShadow = 'none'; }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary, #64748b)', display: 'block', marginBottom: 6 }}>
              🔑 รหัสผ่าน
            </span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1px solid var(--c-border, #cbd5e1)', fontSize: 15,
                background: 'var(--c-bg-subtle, #f8fafc)', color: 'var(--c-text, #0f172a)',
                fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none', transition: 'border 0.3s, box-shadow 0.3s'
              }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--c-border, #cbd5e1)'; e.target.style.boxShadow = 'none'; }}
            />
          </label>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px 0', borderRadius: 20, 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: '#fff', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
          onMouseOver={e => { if(!loading) { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)'; } }}
          onMouseOut={e => { if(!loading) { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'; } }}
          onMouseDown={e => { if(!loading) { e.target.style.transform = 'translateY(1px) scale(0.98)'; } }}
          onMouseUp={e => { if(!loading) { e.target.style.transform = 'translateY(-3px)'; } }}
          >
            {loading ? 'กำลังตรวจสอบ...' : <>เข้าสู่ระบบ <span style={{ fontSize: 18 }}>➜</span></>}
          </button>
        </form>
      </div>
    </>
  );
};

export default Login;