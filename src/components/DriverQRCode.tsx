'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Printer } from 'lucide-react';

interface DriverQRCodeProps {
  driverId: string;
  driverName?: string;
  size?: number;
  showActions?: boolean;
}

export default function DriverQRCode({ driverId, driverName, size = 200, showActions = true }: DriverQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState('');

  const reviewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/rate/driver/${driverId}`;

  useEffect(() => {
    if (!driverId) return;
    const url = `${window.location.origin}/rate/driver/${driverId}`;
    QRCode.toCanvas(canvasRef.current!, url, {
      width: size,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF',
      },
    }, (err) => {
      if (err) console.error('QR generation error:', err);
    });

    // Also generate a data URL for download
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF',
      },
    }).then(setDataUrl).catch(console.error);
  }, [driverId, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-driver-${driverName?.replace(/\s+/g, '-').toLowerCase() || driverId}.png`;
    link.click();
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Driver QR Code – ${driverName || 'Driver'}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
              padding: 2rem;
              box-sizing: border-box;
            }
            .qr-wrapper {
              border: 2px solid #1E293B;
              border-radius: 12px;
              padding: 1.5rem;
              display: inline-flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
              page-break-inside: avoid;
            }
            .logo-text {
              font-size: 1.4rem;
              font-weight: 800;
              color: #1E293B;
              letter-spacing: -0.02em;
            }
            .logo-accent {
              color: #F59E0B;
            }
            img { display: block; }
            .driver-name {
              font-size: 1.1rem;
              font-weight: 700;
              color: #1E293B;
              text-align: center;
            }
            .cta-text {
              font-size: 0.85rem;
              color: #64748B;
              text-align: center;
              max-width: 220px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="qr-wrapper">
            <div class="logo-text">Viji <span class="logo-accent">Drop</span> Taxi</div>
            <img src="${dataUrl}" width="${size}" height="${size}" />
            ${driverName ? `<div class="driver-name">${driverName}</div>` : ''}
            <div class="cta-text">Scan this QR code to rate your driver and share your experience 🙏</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        backgroundColor: '#fff',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Viji Drop Taxi
        </div>
        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px' }} />
        {driverName && (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', textAlign: 'center', maxWidth: `${size}px` }}>
            {driverName}
          </div>
        )}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: `${size}px`, lineHeight: 1.4 }}>
          Scan to rate this driver ⭐
        </div>
      </div>

      {showActions && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleDownload}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <Download size={13} /> Download
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <Printer size={13} /> Print QR
          </button>
        </div>
      )}
    </div>
  );
}
