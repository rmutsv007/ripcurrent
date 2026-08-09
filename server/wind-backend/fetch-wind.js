const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ฟังก์ชันสร้าง URL ที่คำนวณเวลาอัตโนมัติ
function getDynamicNoaaUrl() {
    const now = new Date();
    
    // NOAA มีดีเลย์การประมวลผลประมาณ 4 ชั่วโมง
    // เราจึงต้องถอยเวลาปัจจุบันลงไป 4 ชั่วโมง เพื่อหารอบข้อมูลล่าสุดที่ "พร้อมให้ดาวน์โหลด"
    const targetTime = new Date(now.getTime());
    targetTime.setUTCHours(targetTime.getUTCHours() - 4);

    // คำนวณหารอบ Cycle (0, 6, 12, 18)
    const cycle = Math.floor(targetTime.getUTCHours() / 6) * 6;
    const cycleStr = String(cycle).padStart(2, '0');

    // หาวันที่ของรอบ Cycle นั้น
    const cycleDate = new Date(targetTime);
    cycleDate.setUTCHours(cycle, 0, 0, 0);

    // คำนวณความห่างระหว่าง "เวลาปัจจุบันจริงๆ" กับ "รอบ Cycle" เพื่อเป็น Forecast Hour
    const diffMs = now - cycleDate;
    const diffHoursRaw = diffMs / (1000 * 60 * 60);

    // ปัดลงให้เป็นตัวคูณของ 3 เพื่อให้ตรงกับไฟล์ที่มีจริง (f000, f003, f006, ...)
    const diffHours = Math.floor(diffHoursRaw / 3) * 3;

    const fHourStr = String(diffHours).padStart(3, '0');

    // จัดรูปแบบวันที่ YYYYMMDD
    const year = cycleDate.getUTCFullYear();
    const month = String(cycleDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(cycleDate.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const baseUrl = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl`;
    const params = `?file=gfs.t${cycleStr}z.pgrb2.1p00.f${fHourStr}&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&dir=%2Fgfs.${dateStr}%2F${cycleStr}%2Fatmos`;
    
    console.log(`🕒 เวลาปัจจุบัน: ${now.toLocaleString('th-TH')}`);
    console.log(`🔄 ใช้ข้อมูลรอบ (Cycle): ${cycleStr}z | ล่วงหน้า (Forecast): ${fHourStr} ชั่วโมง`);
    
    return baseUrl + params;
}

// ฟังก์ชันสำหรับแปลงไฟล์ .grb2 เป็น .json
function convertGribToJson(inputPath, outputPath) {
    console.log(`\n⚙️ กำลังแปลงไฟล์ GRIB2 เป็น JSON...`);
    
    const grib2jsonPath = path.join(__dirname, 'grib2json', 'bin', 'grib2json.cmd'); 
    const command = `"${grib2jsonPath}" -d -n -o "${outputPath}" "${inputPath}"`;

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ ข้อผิดพลาดในการแปลงไฟล์: ${error.message}`);
            return;
        }
        if (stderr && !stderr.includes('SLF4J')) { 
            console.warn(`⚠️ แจ้งเตือน: ${stderr}`);
        }
        console.log(`✅ แปลงไฟล์สำเร็จ!`);
        console.log(`🎉 ไฟล์ข้อมูลลมพร้อมใช้งานที่: ${outputPath}`);
    });
}

async function downloadWindData() {
    const url = getDynamicNoaaUrl();
    const grb2Path = path.join(__dirname, 'latest.grb2'); 
    const jsonPath = path.join(__dirname, 'wind-data.json'); 

    console.log(`📡 กำลังดึงข้อมูลลมจาก NOAA...`);

    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream' 
        });

        const writer = fs.createWriteStream(grb2Path);
        response.data.pipe(writer);

        writer.on('finish', () => {
            console.log(`✅ บันทึกไฟล์ข้อมูลดิบสำเร็จ!`);
            convertGribToJson(grb2Path, jsonPath);
        });

        writer.on('error', (err) => {
            console.error('❌ เกิดข้อผิดพลาดตอนบันทึกไฟล์:', err);
        });

    } catch (error) {
        console.error('❌ ดึงข้อมูลไม่สำเร็จ:', error.message);
        console.log('💡 สาเหตุที่เป็นไปได้: เซิร์ฟเวอร์ NOAA อาจจะเพิ่งเริ่มประมวลผลข้อมูลรอบใหม่ ลองรันใหม่อีกครั้งใน 10-15 นาทีครับ');
    }
}

// เริ่มต้นทำงาน
downloadWindData();