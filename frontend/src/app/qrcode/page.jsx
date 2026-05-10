"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import UserQRCode from '@/components/qrcode/UserQRCode';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';

export default function QRCodePage() {
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { getUserBookings } = useBooking();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-text-black-soft text-[16px]">Loading...</div>
      </div>
    );
  }

  const activeBookings = getUserBookings(currentUser.id).filter(
    (b) => b.status === 'confirmed' || b.status === 'active'
  );

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 lg:px-10 max-w-[600px] py-[32px] md:py-[48px]">
      {/* Header */}
      <div className="text-center mb-[32px]">
        <h1 className="text-[24px] md:text-[32px] font-semibold text-starbucks-green mb-[4px]">
          My QR Code
        </h1>
        <p className="text-[16px] text-text-black-soft">
          Your personal parking membership code
        </p>
      </div>

      {/* QR Code Component */}
      <UserQRCode userId={currentUser.id} userName={currentUser.name} />

      {/* Instructions */}
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

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <Card elevated className="mt-[24px] bg-green-accent/5 border-green-accent/20">
          <h3 className="text-[16px] font-semibold text-text-black mb-[12px]">Active Bookings</h3>
          <div className="space-y-[10px]">
            {activeBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-[8px] p-[16px] border border-divider">
                <Link href={`/booking/${booking.id}`} className="block hover:opacity-80 transition-opacity mb-[12px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[14px] font-semibold text-text-black">Slot {booking.slotName}</span>
                      <span className="text-[13px] text-text-black-soft ml-[8px]">{booking.date} at {booking.startTime}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-green-accent">{booking.id} →</span>
                  </div>
                </Link>
                <Link href={`/payment?bookingId=${booking.id}`} className="block">
                  <Button variant="secondary" className="w-full !py-[10px] text-[14px] !bg-starbucks-green !text-white hover:!bg-starbucks-green/90">
                    🚙 Simulate Exit & Pay
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Back button */}
      <div className="mt-[24px] text-center">
        <Link href="/dashboard">
          <Button variant="ghost">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
