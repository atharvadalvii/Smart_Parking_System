"use client";

import React, { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

const UserQRCode = ({ userId, userName }) => {
  const qrRef = useRef(null);

  const qrData = JSON.stringify({
    userId,
    type: 'parking_member',
  });

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);

      const link = document.createElement('a');
      link.download = `smartparking-qr-${userId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [userId]);

  return (
    <Card elevated className="max-w-[400px] w-full mx-auto text-center">
      {/* Header */}
      <div className="mb-[24px]">
        <div className="w-[48px] h-[48px] rounded-full bg-starbucks-green text-white text-[20px] font-bold flex items-center justify-center mx-auto mb-[12px]">
          {userName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h2 className="text-[19px] font-semibold text-text-black">{userName}</h2>
        <p className="text-[13px] text-text-black-soft mt-[4px] font-mono">{userId}</p>
      </div>

      {/* QR Code */}
      <div ref={qrRef} className="bg-white rounded-[12px] p-[24px] border border-divider inline-block mb-[20px]">
        <QRCodeSVG
          value={qrData}
          size={220}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#1E3932"
        />
      </div>

      {/* Label */}
      <p className="text-[14px] text-text-black-soft mb-[20px]">
        Personal Parking Membership QR Code
      </p>

      {/* Download */}
      <Button variant="outlineDark" size="sm" onClick={handleDownload} className="w-full">
        ↓ Download QR Code
      </Button>
    </Card>
  );
};

export default UserQRCode;
