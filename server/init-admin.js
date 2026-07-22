/**
 * init-admin.js — สร้างผู้ใช้ admin คนแรก
 * รัน: cd server && node init-admin.js
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const DATA_DIR = path.dirname(USERS_FILE);

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin1234';

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  }

  // ตรวจว่ามี admin อยู่แล้วหรือไม่
  if (users.find(u => u.username === ADMIN_USER)) {
    console.log(`ผู้ใช้ "${ADMIN_USER}" มีอยู่แล้ว`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASS, 10);
  users.push({ username: ADMIN_USER, passwordHash });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  console.log(`สร้างผู้ใช้ "${ADMIN_USER}" สำเร็จ (รหัสผ่าน: ${ADMIN_PASS})`);
  console.log('⚠️  กรุณาเปลี่ยนรหัสผ่านในการใช้งานจริง');
}

main().catch(console.error);
