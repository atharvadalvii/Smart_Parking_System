"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function GuestParkingPage() {
  const [plate, setPlate] = useState('');
  const [plateError, setPlateError] = useState('');
  const [qrValue, setQrValue] = useState(null);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = plate.trim().toUpperCase();
    if (!trimmed) {
      setPlateError('Number plate is required');
      return;
    }
    setPlateError('');
    setServerError('');
    setLoading(true);

    fetch(`${API_BASE}/api/entry/plate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate: trimmed }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (ok) {
          setQrValue(data.qr_value);
        } else {
          setServerError(data.error || 'Failed to generate QR. Please try again.');
        }
      })
      .catch(() => setServerError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  };

  // ── QR display screen ────────────────────────────────────────────────────
  if (qrValue) {
    return (
      <div className="flex-grow flex items-center justify-center bg-neutral-warm p-4 py-[48px]">
        <div className="w-full max-w-[400px]">
          <Card elevated className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center text-2xl">🚗</div>
            <h1 className="text-[22px] font-bold text-starbucks-green mb-1">Your Parking QR</h1>
            <p className="text-text-black-soft text-[13px] mb-5">
              Plate <strong className="text-text-black">{qrValue}</strong> — scan at entry gate to park
            </p>

            {/* QR Code */}
            <div className="bg-white p-5 rounded-2xl inline-block mb-5 border border-divider shadow-sm">
              <QRCodeSVG value={qrValue} size={200} />
            </div>

            {/* Instructions */}
            <div className="bg-[#f2f0eb] rounded-xl p-4 text-left text-[13px] text-text-black-soft space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <span className="w-[22px] h-[22px] shrink-0 rounded-full bg-starbucks-green text-white text-[11px] font-bold flex items-center justify-center">1</span>
                <p><strong className="text-text-black">Entry:</strong> Scan this QR at the entry gate — a free slot will be assigned automatically.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-[22px] h-[22px] shrink-0 rounded-full bg-starbucks-green text-white text-[11px] font-bold flex items-center justify-center">2</span>
                <p><strong className="text-text-black">Exit:</strong> Scan the same QR at the exit gate — your fare is calculated and the gate opens.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-[22px] h-[22px] shrink-0 rounded-full bg-starbucks-green text-white text-[11px] font-bold flex items-center justify-center">3</span>
                <p><strong className="text-text-black">Rate:</strong> $3.00 / hr · $2.00 minimum · payment calculated on exit.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="ghost" className="w-full" onClick={() => { setQrValue(null); setPlate(''); }}>
                ← Use a different plate
              </Button>
              <Link href="/dashboard">
                <Button variant="primary" className="w-full">Back to Dashboard</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Plate input form ─────────────────────────────────────────────────────
  return (
    <div className="flex-grow flex items-center justify-center bg-neutral-warm p-4 py-[48px]">
      <div className="w-full max-w-[400px]">
        <Card elevated>
          <div className="text-center mb-6">
            <div className="inline-block bg-[#1E3932] text-white text-[13px] font-bold px-4 py-1.5 rounded-full mb-4">
              Guest Parking
            </div>
            <h1 className="text-[24px] font-bold text-starbucks-green mb-1">Quick Park</h1>
            <p className="text-text-black-soft text-[14px]">Enter your number plate to get your parking QR code.</p>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] px-4 py-3 rounded-lg mb-5 text-center">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold mb-2 text-text-black">
                Vehicle Number Plate
              </label>
              <input
                type="text"
                value={plate}
                onChange={e => { setPlate(e.target.value.toUpperCase()); setPlateError(''); }}
                placeholder="e.g. 1ABC234"
                className={`w-full px-3 py-3 border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent transition-colors uppercase tracking-widest font-mono text-[16px] ${plateError ? 'border-red-400 bg-red-50' : 'border-[#d6dbde]'}`}
              />
              {plateError && <p className="mt-1 text-[12px] text-red-500">{plateError}</p>}
            </div>

            <div className="bg-[#f2f0eb] rounded-xl p-3 text-[12px] text-text-black-soft">
              Rate: <strong className="text-text-black">$3.00/hr</strong> · Minimum: <strong className="text-text-black">$2.00</strong> · Slot assigned on entry
            </div>

            <Button type="submit" variant="primary" className="w-full !py-[14px]" disabled={loading}>
              {loading ? 'Generating QR…' : 'Get Parking QR'}
            </Button>
          </form>

          <div className="mt-5 text-center text-[13px] text-text-black-soft border-t border-divider pt-5">
            Have an account?{' '}
            <Link href="/login" className="text-green-accent font-semibold hover:underline">Log in</Link>
            {' '}to pre-book a slot.
          </div>
        </Card>
      </div>
    </div>
  );
}
