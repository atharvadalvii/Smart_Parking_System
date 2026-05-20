"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Toast from '@/components/common/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';

function BookingQRCard({ booking }) {
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.download = `parking-qr-${booking.id}.png`;
    link.href = `data:image/png;base64,${booking.qrCode}`;
    link.click();
  }, [booking.id, booking.qrCode]);

  return (
    <Card elevated className="text-center">
      <div className="mb-[12px]">
        <span className="text-[16px] font-semibold text-text-black">Slot {booking.slotName}</span>
        {booking.date && (
          <span className="text-[13px] text-text-black-soft ml-[8px]">
            {booking.date}{booking.startTime ? ` at ${booking.startTime}` : ''}
          </span>
        )}
      </div>

      {/* QR image from backend base64 PNG */}
      <div className="bg-white rounded-[12px] p-[24px] border border-divider inline-block mb-[16px]">
        {booking.qrCode ? (
          <img
            src={`data:image/png;base64,${booking.qrCode}`}
            alt={`QR code for booking ${booking.id}`}
            width={220}
            height={220}
            className="block"
          />
        ) : (
          <div className="w-[220px] h-[220px] flex items-center justify-center text-text-black-soft text-[13px]">
            QR not available
          </div>
        )}
      </div>

      <p className="text-[12px] text-text-black-soft font-mono mb-[16px] break-all px-[8px]">
        {booking.id}
      </p>

      <div className="flex flex-col gap-[8px]">
        <Button variant="outlineDark" size="sm" onClick={handleDownload} className="w-full">
          ↓ Download QR Code
        </Button>
        <Link href={`/payment?bookingId=${booking.id}`} className="block">
          <Button variant="secondary" className="w-full !py-[10px] text-[14px] !bg-starbucks-green !text-white hover:!bg-starbucks-green/90">
            Simulate Exit &amp; Pay
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function QRCodePage() {
  // All hooks must be declared before any conditional returns
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { getUserBookings } = useBooking();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (searchParams.get('bookingId')) {
      setToast('Booking confirmed!');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      getUserBookings(currentUser.id).then(bookings =>
        setActiveBookings(bookings.filter(b => b.status === 'confirmed' || b.status === 'active'))
      );
    }
  }, [isAuthenticated, currentUser]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-text-black-soft text-[16px]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 lg:px-10 max-w-[600px] py-[32px] md:py-[48px]">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="text-center mb-[32px]">
        <h1 className="text-[24px] md:text-[32px] font-semibold text-starbucks-green mb-[4px]">
          My QR Code{activeBookings.length > 1 ? 's' : ''}
        </h1>
        <p className="text-[16px] text-text-black-soft">
          Present your booking QR code at the gate scanner
        </p>
      </div>

      {/* Active booking QR codes */}
      {activeBookings.length > 0 ? (
        <div className="space-y-[24px]">
          {activeBookings.map(booking => (
            <BookingQRCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <Card elevated className="text-center py-[48px]">
          <div className="text-[48px] mb-[16px]">🅿️</div>
          <h2 className="text-[18px] font-semibold text-text-black mb-[8px]">No Active Bookings</h2>
          <p className="text-[14px] text-text-black-soft mb-[24px]">
            You don&apos;t have any confirmed or active bookings right now.
          </p>
          <Link href="/booking">
            <Button variant="primary">Book a Parking Slot</Button>
          </Link>
        </Card>
      )}

      {/* How to Use */}
      <Card elevated className="mt-[24px]">
        <h3 className="text-[16px] font-semibold text-text-black mb-[16px]">How to Use</h3>
        <div className="space-y-[16px]">
          <div className="flex items-start gap-[12px]">
            <div className="w-[28px] h-[28px] rounded-full bg-green-accent text-white text-[14px] font-bold flex items-center justify-center shrink-0">1</div>
            <p className="text-[14px] text-text-black-soft leading-[1.6]">
              <strong className="text-text-black">At the entrance gate:</strong> Present this QR code to the scanner. The gate will open if you have an active booking.
            </p>
          </div>
          <div className="flex items-start gap-[12px]">
            <div className="w-[28px] h-[28px] rounded-full bg-green-accent text-white text-[14px] font-bold flex items-center justify-center shrink-0">2</div>
            <p className="text-[14px] text-text-black-soft leading-[1.6]">
              <strong className="text-text-black">At the exit gate:</strong> Scan the same QR code again. The system will calculate your parking duration and fees.
            </p>
          </div>
        </div>
      </Card>

      {/* Back button */}
      <div className="mt-[24px] text-center">
        <Link href="/dashboard">
          <Button variant="ghost">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
