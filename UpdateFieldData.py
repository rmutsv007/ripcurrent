import psycopg2

DB_CONFIG = {
    "dbname": "DisasterMap", 
    "user": "wgo", 
    "password": "Skawater@397", 
    "host": "146.190.101.71", 
    "port": "2394"
}

# 1. กำหนดค่าวันที่ที่ต้องการอัปเดต (แนะนำให้ใส่ -DD ไปด้วยถ้า DB เป็นชนิด Date)
target_value = "2026-08" 
target_column = "DateSim" # หรือเปลี่ยนเป็น DateSim ตามที่ฐานข้อมูลมีจริง

# 2. สร้างรายชื่อตารางอัตโนมัติ (21 ชั้นข้อมูล)
categories = ["Runoff", "Drought", "WaterB"]
months = ["", "1", "2", "3", "4", "5", "6"]
# เปลี่ยนตรงนี้จาก Tambon เป็น Amphoe
layer_names = [f"Amphoe_m{m}_{cat}" for cat in categories for m in months]

connection = None
cursor = None

try:
    connection = psycopg2.connect(**DB_CONFIG)
    cursor = connection.cursor()
    
    print(f"🚀 เริ่มดำเนินการอัปเดตชั้นข้อมูล (ฟิลด์: {target_column} -> {target_value})...")
    print("-" * 50)
    
    # 3. ลูปอัปเดตทีละตาราง
    for layer_name in layer_names:
        
        # คำสั่ง UPDATE (ถ้าต้องการอัปเดตทุกบรรทัด ให้ใช้แบบนี้ได้เลย)
        sql_query = f"""
            UPDATE "{layer_name}"
            SET "{target_column}" = %s;
        """
        
        cursor.execute(sql_query, (target_value,))
        print(f"✔️ ชั้นข้อมูล '{layer_name}' -> อัปเดตสำเร็จ ({cursor.rowcount} แถว)")
        
    connection.commit()
    print("-" * 50)
    print(f"🎉 อัปเดตข้อมูลเสร็จเรียบร้อยครบทั้ง {len(layer_names)} ชั้นข้อมูล!")

except Exception as error:
    print("-" * 50)
    print(f"❌ เกิดข้อผิดพลาด: {error}")
    if connection:
        print("🔄 กำลัง Rollback ยกเลิกการแก้ไขทั้งหมดเพื่อความปลอดภัย...")
        connection.rollback()
finally:
    if cursor: cursor.close()
    if connection: connection.close()