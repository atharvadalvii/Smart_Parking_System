"use client";

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function GuestBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slotName = searchParams.get('slot') || '';
  const slotId = searchParams.get('slotId') || '';

  const [form, setForm] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [booking, setBooking] = useState(null);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    fetch(`${API_BASE}/api/guest/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), slot_id: slotId }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (ok) {
          setBooking(data);
        } else {
          setServerError(data.error || 'Booking failed. Please try again.');
        }
      })
      .catch(() => setServerError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  };

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (booking) {
    return (
      <div className="flex-grow flex items-center justify-center bg-neutral-warm p-4 py-[48px]">
        <div className="w-full max-w-[440px]">
          <Card elevated className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center text-2xl">✅</div>
            <h1 className="text-[22px] font-bold text-starbucks-green mb-1">Slot Reserved!</h1>
            <p className="text-text-black-soft text-[14px] mb-6">
              Hey <strong>{booking.name}</strong> — slot <strong>{booking.slot}</strong> is held for you.
            </p>

            {/* QR */}
            <div className="bg-white p-5 rounded-2xl inline-block mb-5 border border-divider shadow-sm">
              <QRCodeSVG value={booking.booking_id} size={200} />
            </div>

            <p className="text-[13px] text-text-black-soft mb-6">
              Show this QR at the entry gate to activate your parking session.
            </p>

            <div className="bg-[#f2f0eb] rounded-xl p-4 text-left text-[13px] text-text-black-soft space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Slot</span>
                <span className="font-semibold text-text-black">{booking.slot}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate</span>
                <span className="font-semibold text-text-black">$3.00 / hr</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum</span>
                <span className="font-semibold text-text-black">$2.00</span>
              </div>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className="font-semibold text-text-black">Calculated on exit</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/dashboard">
                <Button variant="primary" className="w-full">Back to Dashboard</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="w-full">Create an account</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Booking form ─────────────────────────────────────────────────────────
  return (
    <div className="flex-grow flex items-center justify-center bg-neutral-warm p-4 py-[48px]">
      <div className="w-full max-w-[440px]">
        <Card elevated>
          <div className="text-center mb-6">
            <div className="inline-block bg-[#1E3932] text-white text-[13px] font-bold px-4 py-1.5 rounded-full mb-4">
              Slot {slotName}
            </div>
            <h1 className="text-[24px] font-bold text-starbucks-green mb-1">Book as Guest</h1>
            <p className="text-text-black-soft text-[14px]">No account needed — just your name and phone.</p>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] px-4 py-3 rounded-lg mb-5 text-center">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold mb-2 text-text-black">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                placeholder="e.g. John Smith"
                className={`w-full px-3 py-3 border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent transition-colors ${errors.name ? 'border-red-400 bg-red-50' : 'border-[#d6dbde]'}`}
              />
              {errors.name && <p className="mt-1 text-[12px] text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[14px] font-semibold mb-2 text-text-black">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: '' })); }}
                placeholder="e.g. 0412 345 678"
                className={`w-full px-3 py-3 border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent transition-colors ${errors.phone ? 'border-red-400 bg-red-50' : 'border-[#d6dbde]'}`}
              />
              {errors.phone && <p className="mt-1 text-[12px] text-red-500">{errors.phone}</p>}
            </div>

            <div className="bg-[#f2f0eb] rounded-xl p-3 text-[12px] text-text-black-soft">
              Rate: <strong className="text-text-black">$3.00/hr</strong> · Minimum: <strong className="text-text-black">$2.00</strong> · Payment on exit
            </div>

            <Button type="submit" variant="primary" className="w-full !py-[14px]" disabled={loading}>
              {loading ? 'Reserving…' : 'Reserve Slot'}
            </Button>
          </form>

          <div className="mt-5 text-center text-[13px] text-text-black-soft border-t border-divider pt-5">
            Have an account?{' '}
            <Link href="/login" className="text-green-accent font-semibold hover:underline">Log in</Link>
            {' '}for extra features.
          </div>
        </Card>
      </div>
    </div>
  );
}
