"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
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

      <div className="bg-white rounded-[12px] p-[24px] border border-divider inline-block mb-[16px]">
        {booking.qrCode ? (
          <img
            src={`data:image/png;base64,${booking.qrCode}`}
            alt={`QR code for booking ${booking.id}`}
            width={160}
            height={160}
            className="block"
          />
        ) : (
          <div className="w-[160px] h-[160px] flex items-center justify-center text-text-black-soft text-[13px]">
            QR not available
          </div>
        )}
      </div>

      <p className="text-[11px] text-text-black-soft font-mono mb-[16px] break-all px-[8px]">
        {booking.id}
      </p>

      <div className="flex flex-col gap-[8px]">
        <Button variant="outlineDark" size="sm" onClick={handleDownload} className="w-full">
          ↓ Download
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
        setActiveBookings(bookings.filter(b =>
          (b.status === 'pending' || b.status === 'confirmed' || b.status === 'active') &&
          b.type !== 'walk_in'
        ))
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
    <div className="flex-grow container mx-auto px-4 md:px-6 lg:px-10 max-w-[640px] py-[32px] md:py-[48px]">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="text-center mb-[32px]">
        <h1 className="text-[24px] md:text-[32px] font-semibold text-starbucks-green mb-[4px]">
          My Parking Pass
        </h1>
        <p className="text-[16px] text-text-black-soft">
          Scan at the gate — works for walk-in and reservations
        </p>
      </div>

      {/* Personal Gate Pass QR */}
      <Card elevated className="mb-[32px]">
        <div className="flex flex-col items-center text-center">
          <div className="text-[13px] font-semibold text-text-black-soft uppercase tracking-widest mb-[16px]">
            Your Personal Gate Pass
          </div>

          <div className="bg-white p-[20px] rounded-[16px] inline-block mb-[16px] border border-divider shadow-sm">
            {currentUser?.id && (
              <QRCodeSVG
                value={currentUser.id}
                size={200}
              />
            )}
          </div>

          <p className="text-[15px] font-semibold text-text-black mb-[2px]">
            {currentUser?.name || currentUser?.email}
          </p>
          <p className="text-[12px] text-text-black-soft font-mono break-all px-4">
            {currentUser?.id}
          </p>

          <div className="mt-[16px] bg-[#f2f0eb] rounded-[12px] p-[16px] w-full text-left space-y-[10px]">
            <div className="flex items-start gap-[10px]">
              <span className="w-[22px] h-[22px] rounded-full bg-starbucks-green text-white text-[12px] font-bold flex items-center justify-center shrink-0">1</span>
              <p className="text-[13px] text-text-black-soft leading-[1.5]">
                <strong className="text-text-black">Entry gate:</strong> Scan this QR. If you have a reservation it activates — otherwise a free slot is assigned automatically.
              </p>
            </div>
            <div className="flex items-start gap-[10px]">
              <span className="w-[22px] h-[22px] rounded-full bg-starbucks-green text-white text-[12px] font-bold flex items-center justify-center shrink-0">2</span>
              <p className="text-[13px] text-text-black-soft leading-[1.5]">
                <strong className="text-text-black">Exit gate:</strong> Scan the same QR again. Your fare is calculated and the gate opens.
              </p>
            </div>
            <div className="flex items-start gap-[10px]">
              <span className="w-[22px] h-[22px] rounded-full bg-starbucks-green text-white text-[12px] font-bold flex items-center justify-center shrink-0">3</span>
              <p className="text-[13px] text-text-black-soft leading-[1.5]">
                <strong className="text-text-black">Payment:</strong> Check your booking history to review and pay the fare.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Active reservation QRs (if any) */}
      {activeBookings.length > 0 && (
        <>
          <h2 className="text-[18px] font-semibold text-text-black mb-[16px]">Active Reservations</h2>
          <div className="space-y-[16px] mb-[32px]">
            {activeBookings.map(booking => (
              <BookingQRCard key={booking.id} booking={booking} />
            ))}
          </div>
        </>
      )}

      <div className="text-center">
        <Link href="/dashboard">
          <Button variant="ghost">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
