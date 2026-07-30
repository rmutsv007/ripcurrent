/**
 * server.js — Backend Express สำหรับจัดการรูปภาพฟาร์ม
 * - POST /api/auth/login — เข้าสู่ระบบ (JWT)
 * - GET  /api/images — รายชื่อรูปฟาร์มทั้งหมด
 * - POST /api/images/:farmName — อัปโหลดรูปฟาร์ม (ต้อง login)
 * - DELETE /api/images/:farmName — ลบรูปฟาร์ม (ต้อง login)
 * - Static: /uploads/farm-images/* — เข้าถึงรูปโดยตรง
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// === JWT secret — ต้องตั้งค่าผ่าน environment variable ===
// production: บังคับให้ตั้ง JWT_SECRET ไม่งั้นหยุดทำงาน (กัน token ถูกปลอม)
// dev: ถ้าไม่ตั้ง ใช้ค่า fallback ชั่วคราวพร้อมเตือน
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: ต้องตั้งค่า environment variable JWT_SECRET สำหรับ production');
    process.exit(1);
  }
  console.warn('⚠  ไม่ได้ตั้งค่า JWT_SECRET — ใช้ค่า fallback สำหรับ dev เท่านั้น (ห้ามใช้ใน production)');
  return 'insecure-dev-secret-change-me';
})();

const UPLOADS_DIR = path.join(__dirname, 'uploads', 'farm-images');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// สร้างโฟลเดอร์ถ้ายังไม่มี
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });

// === Middleware ===
// helmet — ตั้งค่า HTTP security headers พื้นฐาน
// crossOriginResourcePolicy: cross-origin เพื่อให้ frontend (คนละ origin) โหลดรูปจาก /uploads ได้
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// === CORS — จำกัดเฉพาะ origin ที่อนุญาต ===
// ตั้งค่าได้ผ่าน env CORS_ORIGIN (คั่นหลาย origin ด้วย comma)
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://map.surveywms.com')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // อนุญาต request ที่ไม่มี origin (เช่น curl, mobile app, same-origin)
    // origin ที่ไม่อยู่ในรายการ: ไม่ส่ง header CORS (เบราว์เซอร์จะบล็อกเอง)
    // ใช้ cb(null, false) แทนการ throw เพื่อไม่ให้ stack trace รั่วไหล
    cb(null, !origin || ALLOWED_ORIGINS.includes(origin));
  },
}));

app.use(express.json());

// Static serve รูปภาพ
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === Rate limit สำหรับ login ===
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10, // จำกัด 10 ครั้งต่อ IP
  message: { error: 'คำขอเข้าสู่ระบบมากเกินไป กรุณารอสักครู่' },
});

// === Helper: อ่าน/เขียนไฟล์ users ===
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// === Middleware: ตรวจสอบ JWT ===
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

// === Config ===
const MAX_IMAGES_PER_FARM = 24;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// === Multer config: จำกัดประเภทไฟล์และขนาด ===
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // เก็บในโฟลเดอร์ย่อยชื่อฟาร์ม
      const farmDir = path.join(UPLOADS_DIR, req.params.farmName);
      fs.mkdirSync(farmDir, { recursive: true });
      cb(null, farmDir);
    },
    filename: (req, file, cb) => {
      // ตั้งชื่อไฟล์: timestamp + นามสกุล
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // จำกัด 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('อนุญาตเฉพาะไฟล์ JPG, PNG, WEBP'));
    }
  },
});

// Helper: ดึงรูปทั้งหมดของฟาร์ม
function getFarmImages(farmName) {
  const farmDir = path.join(UPLOADS_DIR, farmName);
  if (!fs.existsSync(farmDir)) return [];
  return fs.readdirSync(farmDir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map(f => ({
      filename: f,
      url: `/uploads/farm-images/${encodeURIComponent(farmName)}/${encodeURIComponent(f)}`,
    }));
}

// ===========================
// Routes
// ===========================

// POST /api/auth/login — เข้าสู่ระบบ
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }

  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: user.username });
});

// GET /api/images — รายชื่อรูปฟาร์มทั้งหมด (จัดกลุ่มตามฟาร์ม)
app.get('/api/images', (req, res) => {
  if (!fs.existsSync(UPLOADS_DIR)) return res.json({});

  const entries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });
  const result = {};
  entries.forEach(entry => {
    if (entry.isDirectory()) {
      const images = getFarmImages(entry.name);
      if (images.length > 0) result[entry.name] = images;
    }
  });
  res.json(result);
});

// POST /api/images/:farmName — อัปโหลดรูปฟาร์ม (สูงสุด 24 รูป)
app.post('/api/images/:farmName', authMiddleware, (req, res) => {
  // ป้องกัน path traversal
  const farmName = path.basename(req.params.farmName);
  if (!farmName || farmName.includes('..')) {
    return res.status(400).json({ error: 'ชื่อฟาร์มไม่ถูกต้อง' });
  }
  req.params.farmName = farmName;

  // ตรวจจำนวนรูปที่มีอยู่
  const existing = getFarmImages(farmName);
  if (existing.length >= MAX_IMAGES_PER_FARM) {
    return res.status(400).json({ error: `อัปโหลดได้สูงสุด ${MAX_IMAGES_PER_FARM} รูปต่อฟาร์ม` });
  }

  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
    }
    res.json({
      message: 'อัปโหลดสำเร็จ',
      farmName,
      url: `/uploads/farm-images/${encodeURIComponent(farmName)}/${encodeURIComponent(req.file.filename)}`,
      count: existing.length + 1,
      max: MAX_IMAGES_PER_FARM,
    });
  });
});

// DELETE /api/images/:farmName/:filename — ลบรูปทีละไฟล์
app.delete('/api/images/:farmName/:filename', authMiddleware, (req, res) => {
  const farmName = path.basename(req.params.farmName);
  const filename = path.basename(req.params.filename);
  if (!farmName || !filename || farmName.includes('..') || filename.includes('..')) {
    return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
  }

  const filePath = path.join(UPLOADS_DIR, farmName, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ไม่พบรูปภาพนี้' });
  }

  fs.unlinkSync(filePath);
  res.json({ message: 'ลบรูปภาพสำเร็จ' });
});

// DELETE /api/images/:farmName — ลบรูปทั้งหมดของฟาร์ม
app.delete('/api/images/:farmName', authMiddleware, (req, res) => {
  const farmName = path.basename(req.params.farmName);
  if (!farmName || farmName.includes('..')) {
    return res.status(400).json({ error: 'ชื่อฟาร์มไม่ถูกต้อง' });
  }

  const farmDir = path.join(UPLOADS_DIR, farmName);
  if (!fs.existsSync(farmDir)) {
    return res.status(404).json({ error: 'ไม่พบรูปภาพ' });
  }

  fs.rmSync(farmDir, { recursive: true });
  res.json({ message: 'ลบรูปภาพทั้งหมดสำเร็จ' });
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`Farm Image Server running on http://localhost:${PORT}`);
  console.log(`รูปภาพเก็บที่: ${UPLOADS_DIR}`);
});
