"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function WalkInTicket() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/walkin/${id}`);
        if (!res.ok) throw new Error('Not found');
        setBooking(await res.json());
      } catch {
        setError('Ticket not found');
      }
    };

    load();
    // Poll every 3 seconds until completed
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/walkin/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setBooking(data);
        if (data.status === 'completed') clearInterval(timer);
      } catch {}
    }, 3000);

    return () => clearInterval(timer);
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
        <div className="text-gray-400 text-base">Loading ticket...</div>
      </div>
    );
  }

  const isActive = booking.status === 'active';
  const entryTime = booking.entry_time ? new Date(booking.entry_time) : null;
  const exitTime = booking.exit_time ? new Date(booking.exit_time) : null;

  const durationLabel = () => {
    if (!entryTime) return null;
    const end = exitTime || new Date();
    const mins = Math.round((end - entryTime) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">

        {/* Status icon */}
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl
          ${isActive ? 'bg-green-100' : 'bg-[#1E3932]'}`}>
          {isActive ? '🚗' : '✅'}
        </div>

        <h1 className="text-2xl font-bold text-[#1E3932] mb-1">
          {isActive ? 'Parking Active' : 'Session Complete'}
        </h1>
        <p className="text-gray-400 text-sm mb-6">Walk-in ticket</p>

        {/* Check-in time */}
        {entryTime && (
          <div className="bg-gray-50 rounded-xl p-4 mb-3 text-left">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Checked in</p>
            <p className="font-semibold text-gray-800">
              {entryTime.toLocaleDateString()} &nbsp;{entryTime.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Duration */}
        <div className="bg-gray-50 rounded-xl p-4 mb-3 text-left">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            {isActive ? 'Time so far' : 'Total duration'}
          </p>
          <p className="font-semibold text-gray-800">{durationLabel()}</p>
        </div>

        {/* Fare — only when completed */}
        {!isActive && booking.fare_amount != null && (
          <div className="bg-[#1E3932] rounded-xl p-5 mb-4">
            <p className="text-xs text-green-300 uppercase tracking-wide mb-1">Amount due</p>
            <p className="text-4xl font-bold text-white">${booking.fare_amount.toFixed(2)}</p>
            <p className="text-green-400 text-xs mt-1">AUD · Pay at exit terminal</p>
          </div>
        )}

        {/* Time limit warning — shown when slot has a future booking */}
        {isActive && booking.time_limit && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-3 text-left">
            <p className="text-xs text-amber-600 uppercase tracking-wide font-semibold mb-1">⚠ Slot Pre-booked</p>
            <p className="text-sm text-amber-800 font-medium">
              Please vacate by <strong>{booking.time_limit}</strong> — this slot is reserved from that time.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">
          {isActive
            ? 'Rate: $3.00 / hr · $2.00 minimum · Amount calculated on exit'
            : 'Thank you for using Smart Parking'}
        </p>
      </div>
    </div>
  );
}
