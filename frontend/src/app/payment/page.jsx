"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getBooking, completeBooking } = useBooking();

  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [billingDetails, setBillingDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && bookingId) {
      getBooking(bookingId).then(data => {
        setBooking(data);
        setBookingLoading(false);
      });
    }
  }, [isAuthenticated, bookingId, getBooking]);

  // Derive billing details once booking is loaded
  useEffect(() => {
    if (!booking) return;

    if (booking.fareAmount != null) {
      // Backend has calculated the real fare from entry/exit timestamps
      setBillingDetails({
        exitTime: booking.exitTime || new Date().toTimeString().slice(0, 5),
        duration: booking.duration,
        cost: booking.fareAmount,
      });
    } else {
      // Booking not yet exited — use estimated cost based on start time vs now
      const now = new Date();
      const exitTimeStr = now.toTimeString().slice(0, 5);
      const [startH, startM] = (booking.startTime || '00:00').split(':').map(Number);
      const diffMins = (now.getHours() * 60 + now.getMinutes()) - (startH * 60 + startM);
      const actualDuration = Math.max(0.5, Math.ceil(Math.max(diffMins, 0) / 30) * 0.5);
      setBillingDetails({
        exitTime: exitTimeStr,
        duration: actualDuration,
        cost: booking.cost || parseFloat((actualDuration * 2).toFixed(2)),
      });
    }
  }, [booking]);

  if (authLoading || bookingLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-text-black-soft text-[16px]">Loading...</div>
      </div>
    );
  }

  if (!bookingId) {
    return (
      <Card elevated className="w-full max-w-[500px] mx-auto text-center py-[48px]">
        <div className="text-[48px] mb-[16px]">⚠️</div>
        <h2 className="text-[20px] font-semibold text-text-black mb-[16px]">No Booking Specified</h2>
        <Button variant="primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card elevated className="w-full max-w-[500px] mx-auto text-center py-[48px]">
        <div className="text-[48px] mb-[16px]">❓</div>
        <h2 className="text-[20px] font-semibold text-text-black mb-[16px]">Booking Not Found</h2>
        <Button variant="primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </Card>
    );
  }

  const handlePay = async () => {
    if (!billingDetails) return;
    setIsProcessing(true);
    const result = await completeBooking(bookingId);
    if (result.success) {
      router.push(`/payment/success?bookingId=${bookingId}`);
    } else {
      setIsProcessing(false);
      alert(`Payment failed: ${result.error}`);
    }
  };

  if (!billingDetails) {
    return <div className="text-center mt-10">Calculating billing summary...</div>;
  }

  return (
    <Card elevated className="w-full max-w-[500px] mx-auto p-[24px] md:p-[32px]">
      <h2 className="text-[24px] font-semibold text-text-black mb-[32px] text-center border-b border-divider pb-[16px]">
        Checkout Summary
      </h2>

      <div className="space-y-[16px] mb-[32px]">
        <div className="flex justify-between items-center">
          <span className="text-[15px] text-text-black-soft">Booking Ref</span>
          <span className="font-semibold text-text-black">{booking.id}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[15px] text-text-black-soft">Parking Slot</span>
          <span className="font-semibold text-text-black">{booking.slotName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[15px] text-text-black-soft">Date</span>
          <span className="font-semibold text-text-black">{booking.date}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[15px] text-text-black-soft">Entry Time</span>
          <span className="font-semibold text-text-black">{booking.startTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[15px] text-text-black-soft">Exit Time</span>
          <span className="font-semibold text-text-black">{billingDetails.exitTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[15px] text-text-black-soft">Duration</span>
          <span className="font-semibold text-text-black">
            {billingDetails.duration >= 1
              ? `${billingDetails.duration} hr${billingDetails.duration > 1 ? 's' : ''}`
              : '30 min'}
          </span>
        </div>
        <div className="flex justify-between items-center pt-[16px] mt-[16px] border-t border-divider border-dashed">
          <span className="text-[18px] font-bold text-text-black">Total Due</span>
          <span className="text-[28px] font-bold text-starbucks-green">${billingDetails.cost.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-gray-50 p-[20px] rounded-[12px] mb-[32px] border border-divider">
        <div className="text-[14px] text-text-black-soft mb-[12px] font-semibold uppercase tracking-wider text-center flex items-center justify-center gap-2">
          <span>💳</span> Mock Payment Method
        </div>
        <input
          type="text"
          disabled
          value="**** **** **** 4242"
          className="w-full bg-white border border-divider rounded-[8px] px-[16px] py-[12px] text-text-black text-[15px] font-mono tracking-widest text-center opacity-70 mb-[12px]"
        />
        <div className="text-[12px] text-text-black-soft text-center px-4">
          This is a simulated payment for demonstration purposes. No real transaction will occur.
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full !py-[16px] text-[16px] shadow-md hover:shadow-lg transition-shadow"
        onClick={handlePay}
        disabled={isProcessing || booking.status === 'completed'}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Processing Payment...
          </span>
        ) : (
          `Pay $${billingDetails.cost.toFixed(2)}`
        )}
      </Button>
    </Card>
  );
}

export default function PaymentPage() {
  return (
    <div className="flex-grow container mx-auto px-4 py-[32px] md:py-[64px]">
      <Suspense fallback={<div className="text-center py-[64px] text-text-black-soft">Loading payment portal...</div>}>
        <PaymentForm />
      </Suspense>
    </div>
  );
}
