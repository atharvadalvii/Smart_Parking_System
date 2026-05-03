"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';

const STATUS_STYLES = {
  confirmed: { bg: 'bg-green-accent/10', text: 'text-green-accent', label: 'Confirmed' },
  active: { bg: 'bg-starbucks-green/10', text: 'text-starbucks-green', label: 'Active' },
  completed: { bg: 'bg-text-black-soft/10', text: 'text-text-black-soft', label: 'Completed' },
  cancelled: { bg: 'bg-error/10', text: 'text-error', label: 'Cancelled' },
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getBooking, cancelBooking } = useBooking();

  const booking = getBooking(params.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-text-black-soft text-[16px]">Loading...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex-grow flex items-center justify-center px-4">
        <Card elevated className="max-w-[500px] w-full text-center">
          <div className="text-[48px] mb-[16px]">🔍</div>
          <h1 className="text-[24px] font-semibold text-text-black mb-[8px]">Booking Not Found</h1>
          <p className="text-[16px] text-text-black-soft mb-[24px]">
            The booking ID "{params.id}" does not exist or has been removed.
          </p>
          <Link href="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.confirmed;
  const canCancel = booking.status === 'confirmed' || booking.status === 'active';

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelBooking(booking.id);
    }
  };

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 lg:px-10 max-w-[700px] py-[32px] md:py-[48px]">
      {/* Header */}
      <div className="mb-[32px]">
        <h1 className="text-[24px] md:text-[32px] font-semibold text-starbucks-green mb-[4px]">
          Booking Details
        </h1>
        <p className="text-[16px] text-text-black-soft">
          Booking reference: {booking.id}
        </p>
      </div>

      {/* Booking Info Card */}
      <Card elevated className="mb-[24px]">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-[24px]">
          <span className="text-[14px] font-semibold text-text-black-soft uppercase tracking-wider">
            Status
          </span>
          <span className={`px-[16px] py-[6px] rounded-[50px] text-[14px] font-bold ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>

        {/* Details Grid */}
        <div className="space-y-[16px]">
          <div className="flex justify-between items-center py-[12px] border-b border-divider">
            <span className="text-[14px] text-text-black-soft">Booking ID</span>
            <span className="text-[16px] font-semibold text-text-black">{booking.id}</span>
          </div>
          <div className="flex justify-between items-center py-[12px] border-b border-divider">
            <span className="text-[14px] text-text-black-soft">Parking Slot</span>
            <div className="flex items-center gap-[8px]">
              <span className="w-[32px] h-[32px] rounded-[6px] bg-green-accent text-white text-[14px] font-bold flex items-center justify-center">
                {booking.slotName}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center py-[12px] border-b border-divider">
            <span className="text-[14px] text-text-black-soft">Date</span>
            <span className="text-[16px] font-semibold text-text-black">{booking.date}</span>
          </div>
          <div className="flex justify-between items-center py-[12px] border-b border-divider">
            <span className="text-[14px] text-text-black-soft">Start Time</span>
            <span className="text-[16px] font-semibold text-text-black">{booking.startTime}</span>
          </div>
          <div className="flex justify-between items-center py-[12px] border-b border-divider">
            <span className="text-[14px] text-text-black-soft">Duration</span>
            <span className="text-[16px] font-semibold text-text-black">
              {booking.duration >= 1 ? `${booking.duration} hour${booking.duration > 1 ? 's' : ''}` : '30 min'}
            </span>
          </div>
          <div className="flex justify-between items-center py-[12px]">
            <span className="text-[14px] text-text-black-soft">Estimated Cost</span>
            <span className="text-[20px] font-bold text-starbucks-green">${booking.cost.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* QR Code Prompt */}
      {(booking.status === 'confirmed' || booking.status === 'active') && (
        <Card elevated className="mb-[24px] bg-green-accent/5 border-green-accent/20">
          <div className="flex items-start gap-[16px]">
            <div className="text-[32px] shrink-0">📱</div>
            <div>
              <h3 className="text-[16px] font-semibold text-text-black mb-[4px]">
                Ready to enter the parking lot?
              </h3>
              <p className="text-[14px] text-text-black-soft mb-[12px]">
                Use your personal QR code at the entrance gate. The system will verify your booking automatically.
              </p>
              <Link href="/qrcode">
                <Button variant="primary" size="sm">View My QR Code →</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-[12px]">
        <Link href="/dashboard" className="flex-1">
          <Button variant="outlineDark" className="w-full !py-[14px]">Back to Dashboard</Button>
        </Link>
        {canCancel && (
          <Button variant="secondary" className="flex-1 !py-[14px] !text-error !border-error hover:!bg-error/5" onClick={handleCancel}>
            Cancel Booking
          </Button>
        )}
      </div>
    </div>
  );
}
