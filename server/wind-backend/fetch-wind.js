const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ฟังก์ชันสร้าง URL ของวันนี้
function getLatestNoaaUrl() {
    const now = new Date();
    
    // ใช้เวลา UTC
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 1. เปลี่ยน Cycle เป็นรอบ 06z (เริ่มพยากรณ์ตอน 13:00 น. เวลาไทย)
    const cycle = '06'; 
    
    // 2. ระบุ Forecast Hour เป็น 003 (ดูคำพยากรณ์ล่วงหน้า 3 ชั่วโมง -> 13.00 + 3 ชม. = 16.00 น.)
    const forecastHour = '003'; 
    
    const baseUrl = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl`;
    
    // 3. ประกอบ URL
    const params = `?file=gfs.t${cycle}z.pgrb2.1p00.f${forecastHour}&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&dir=%2Fgfs.${dateStr}%2F${cycle}%2Fatmos`;
    
    return baseUrl + params;
}

// ฟังก์ชันสำหรับแปลงไฟล์ .grb2 เป็น .json
function convertGribToJson(inputPath, outputPath) {
    console.log(`\n⚙️ กำลังแปลงไฟล์ GRIB2 เป็น JSON...`);
    
    // Path ไปยังตัวรันโปรแกรม grib2json (ตัดโฟลเดอร์ src ออกแล้ว)
    const grib2jsonPath = path.join(__dirname, 'grib2json', 'bin', 'grib2json.cmd'); 
    
    // คำสั่งแปลงไฟล์
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
    const url = getLatestNoaaUrl();
    const grb2Path = path.join(__dirname, 'latest.grb2'); 
    const jsonPath = path.join(__dirname, 'wind-data.json'); 

    console.log(`📡 กำลังดึงข้อมูลลมจาก NOAA...`);
    console.log(`🔗 URL: ${url}`);

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
            // เมื่อโหลดเสร็จ ให้เรียกฟังก์ชันแปลงไฟล์ทันที
            convertGribToJson(grb2Path, jsonPath);
        });

        writer.on('error', (err) => {
            console.error('❌ เกิดข้อผิดพลาดตอนบันทึกไฟล์:', err);
        });

    } catch (error) {
        console.error('❌ ดึงข้อมูลไม่สำเร็จ:', error.message);
        console.log('💡 สาเหตุที่เป็นไปได้: ข้อมูลรอบเวลาดังกล่าวยังไม่ถูกปล่อยออกมาจากเซิร์ฟเวอร์ NOAA');
    }
}

// เริ่มต้นทำงาน
downloadWindData();