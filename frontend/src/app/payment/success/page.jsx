"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <Card elevated className="w-full max-w-[500px] mx-auto text-center p-[32px] md:p-[48px]">
      <div className="w-[80px] h-[80px] bg-green-accent/10 rounded-full flex items-center justify-center mx-auto mb-[24px]">
        <span className="text-[40px]">✅</span>
      </div>
      
      <h1 className="text-[28px] md:text-[32px] font-bold text-text-black mb-[12px]">Payment Successful!</h1>
      <p className="text-[16px] text-text-black-soft mb-[32px]">
        Your parking session for <strong className="text-text-black">{bookingId ? `booking ${bookingId}` : 'your booking'}</strong> has been completed.
      </p>

      <div className="bg-gray-50 rounded-[12px] p-[24px] mb-[40px] inline-block text-left border border-divider shadow-sm w-full">
        <ul className="space-y-[12px]">
          <li className="flex items-start gap-[12px]">
            <span className="text-green-accent shrink-0">✓</span>
            <span className="text-[15px] text-text-black-soft">Payment processed successfully.</span>
          </li>
          <li className="flex items-start gap-[12px]">
            <span className="text-green-accent shrink-0">✓</span>
            <span className="text-[15px] text-text-black-soft">Exit gate has been opened.</span>
          </li>
          <li className="flex items-start gap-[12px]">
            <span className="text-green-accent shrink-0">✓</span>
            <span className="text-[15px] text-text-black-soft">Booking marked as completed.</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-[12px]">
        <Link href="/dashboard" className="flex-1">
          <Button variant="primary" className="w-full !py-[14px]">Return to Dashboard</Button>
        </Link>
        <Link href="/history" className="flex-1">
          <Button variant="outlineDark" className="w-full !py-[14px]">View History</Button>
        </Link>
      </div>
    </Card>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex-grow container mx-auto px-4 py-[32px] md:py-[64px] flex items-center justify-center">
      <Suspense fallback={<div className="text-center py-[64px] text-text-black-soft">Loading receipt...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
