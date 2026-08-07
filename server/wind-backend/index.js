const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000; // กำหนดพอร์ตของ Backend

// อนุญาตให้ Frontend (React) ดึงข้อมูลข้ามโดเมน/พอร์ตได้
app.use(cors());

// สร้าง API Endpoint สำหรับขอข้อมูลลม
app.get('/api/wind', (req, res) => {
    // ชี้ Path ไปหาไฟล์ wind-data.json ที่เราเพิ่งแปลงเสร็จ
    const windDataPath = path.join(__dirname, 'wind-data.json');
    
    // ส่งไฟล์เป็น JSON กลับไปให้คนที่เรียก (React)
    res.sendFile(windDataPath, (err) => {
        if (err) {
            console.error('หาไฟล์ไม่พบ กรุณารัน fetch-wind.js ก่อน');
            res.status(404).json({ error: 'Wind data not found' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend Server รันอยู่บนพอร์ต http://localhost:${PORT}`);
    console.log(`ลมพร้อมใช้งานที่: http://localhost:${PORT}/api/wind`);
});