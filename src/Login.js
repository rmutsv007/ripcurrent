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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'var(--c-bg-primary)', borderRadius: 16,
        padding: '32px 28px', width: 340, maxWidth: '90vw',
        boxShadow: 'var(--c-shadow-lg)', border: '1px solid var(--c-border)',
        fontFamily: 'Sarabun-Medium, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: 'var(--c-text)', fontWeight: 700 }}>
            เข้าสู่ระบบผู้ดูแล
          </h2>
          <button type="button" onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20,
            color: 'var(--c-text-secondary)', cursor: 'pointer', lineHeight: 1,
          }}>&times;</button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626', padding: '8px 12px',
            borderRadius: 8, fontSize: 13, marginBottom: 12, border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 4 }}>
            ชื่อผู้ใช้
          </span>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--c-border)', fontSize: 14,
              background: 'var(--c-bg-subtle)', color: 'var(--c-text)',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 4 }}>
            รหัสผ่าน
          </span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--c-border)', fontSize: 14,
              background: 'var(--c-bg-subtle)', color: 'var(--c-text)',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </label>

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '10px 0', borderRadius: 10,
          background: 'var(--c-accent-light)', color: '#fff', border: 'none',
          fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
};

export default Login;
