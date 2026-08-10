/**
 * BacteriaLegend.js — คอมโพเนนต์แสดงคำอธิบายสัญลักษณ์สำหรับชั้นข้อมูลแบคทีเรีย (IDW)
 */
import React from 'react';

const BacteriaLegend = () => {
  // ดึงช่วงข้อมูลและสีมาจากไฟล์ SLD
  const legendData = [
    { label: '<= 110', color: '#1a9641' },
    { label: '110 - 220', color: '#58b453' },
    { label: '220 - 330', color: '#96d265' },
    { label: '330 - 440', color: '#c4e687' },
    { label: '440 - 550', color: '#ebf7ad' },
    { label: '550 - 660', color: '#ffedab' },
    { label: '660 - 770', color: '#fec981' },
    { label: '770 - 880', color: '#f99d59' },
    { label: '880 - 990', color: '#e85b3b' },
    { label: '> 990', color: '#d7191c' },
  ];

  return (
    <div style={{
      position: 'absolute',
      bottom: '124px',
      right: '24px', // แสดงที่มุมขวาล่างของแผนที่
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(4px)',
      padding: '12px 16px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontFamily: 'Sarabun-Medium, sans-serif',
      minWidth: '150px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b', textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
        ระดับความเข้มข้น
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {legendData.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '18px', 
              height: '18px', 
              backgroundColor: item.color, 
              marginRight: '10px', 
              borderRadius: '4px',
              border: '1px solid rgba(0,0,0,0.1)'
            }}></div>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BacteriaLegend;