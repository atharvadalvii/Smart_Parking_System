"use client";

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function WalkInKiosk() {
  const [bookingId, setBookingId] = useState(null);
  const resetTimer = useRef(null);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/events/slots`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.walk_in_pending && data.booking_id) {
          setBookingId(data.booking_id);
          clearTimeout(resetTimer.current);
          // Reset back to waiting state after 45 seconds (car has entered)
          resetTimer.current = setTimeout(() => setBookingId(null), 45000);
        }
        if (data.walk_in_completed) {
          setBookingId(null);
          clearTimeout(resetTimer.current);
        }
      } catch {}
    };

    return () => {
      es.close();
      clearTimeout(resetTimer.current);
    };
  }, []);

  const ticketUrl = bookingId
    ? (typeof window !== 'undefined' ? `${window.location.origin}/walkin/ticket/${bookingId}` : '')
    : '';

  return (
    <div className="min-h-screen bg-[#1E3932] flex flex-col items-center justify-center p-8">
      {!bookingId ? (
        <div className="text-center">
          <div className="w-5 h-5 rounded-full bg-green-400 animate-pulse mx-auto mb-8" />
          <h1 className="text-white text-5xl font-bold mb-4">Smart Parking</h1>
          <p className="text-green-300 text-xl">Drive up to be detected</p>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-white text-4xl font-bold mb-2">Welcome!</h1>
          <p className="text-green-200 text-lg mb-8">Scan with your phone to get your ticket</p>
          <div className="bg-white p-6 rounded-2xl inline-block shadow-2xl mb-6">
            {ticketUrl && <QRCodeSVG value={ticketUrl} size={240} />}
          </div>
          <p className="text-green-400 text-base">$3.00 / hour &nbsp;·&nbsp; $2.00 minimum</p>
        </div>
      )}
    </div>
  );
}
