"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import SlotSelector from '@/components/booking/SlotSelector';
import BookingForm from '@/components/booking/BookingForm';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useParkingData } from '@/hooks/useParkingData';

export default function BookingPage() {
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { slots } = useParkingData();
  const { createBooking, hourlyRate } = useBooking();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // If ?slot=1 is passed (e.g. from dashboard), pre-select that slot
  useEffect(() => {
    const preselect = searchParams.get('slot');
    if (preselect && slots) {
      const match = slots.find(s => s.name === preselect || s.id === parseInt(preselect, 10));
      if (match && match.status === 'free') {
        setSelectedSlotId(match.id);
      }
    }
  }, [searchParams, slots]);

  // Redirect to login if not authenticated
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

  const selectedSlot = slots?.find(s => s.id === selectedSlotId);

  const handleSlotSelect = (slotId) => {
    setSelectedSlotId(slotId);
    setBookingError('');
  };

  const handleNextStep = () => {
    if (selectedSlotId && selectedSlot?.status === 'free') {
      setStep(2);
    }
  };

  const handleBookingSubmit = (formData) => {
    const result = createBooking(
      currentUser.id,
      selectedSlot.id,
      selectedSlot.name,
      formData.date,
      formData.startTime,
      formData.duration
    );

    if (result.success) {
      router.push(`/booking/${result.bookingId}`);
    } else {
      setBookingError(result.error);
    }
  };

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 lg:px-10 max-w-[800px] py-[32px] md:py-[48px]">
      {/* Page Header */}
      <div className="mb-[32px]">
        <h1 className="text-[24px] md:text-[32px] font-semibold text-starbucks-green mb-[4px]">
          Book a Parking Slot
        </h1>
        <p className="text-[16px] text-text-black-soft">
          Select an available slot and choose your parking time.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-[16px] mb-[32px]">
        <div className="flex items-center gap-[8px]">
          <div className={`w-[32px] h-[32px] rounded-full text-[14px] font-bold flex items-center justify-center transition-colors ${
            step >= 1 ? 'bg-green-accent text-white' : 'bg-ceramic text-text-black-soft'
          }`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <span className={`text-[14px] font-semibold ${step >= 1 ? 'text-text-black' : 'text-text-black-soft'}`}>
            Select Slot
          </span>
        </div>
        <div className={`flex-1 h-[2px] ${step >= 2 ? 'bg-green-accent' : 'bg-divider'} transition-colors`}></div>
        <div className="flex items-center gap-[8px]">
          <div className={`w-[32px] h-[32px] rounded-full text-[14px] font-bold flex items-center justify-center transition-colors ${
            step >= 2 ? 'bg-green-accent text-white' : 'bg-ceramic text-text-black-soft'
          }`}>
            2
          </div>
          <span className={`text-[14px] font-semibold ${step >= 2 ? 'text-text-black' : 'text-text-black-soft'}`}>
            Confirm Booking
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {bookingError && (
        <div className="bg-error/10 border border-error/30 text-error text-[14px] px-[16px] py-[12px] rounded-[8px] text-center font-medium mb-[24px]">
          {bookingError}
        </div>
      )}

      {/* Step Content */}
      <Card elevated>
        {step === 1 ? (
          <div>
            <h2 className="text-[19px] font-semibold text-text-black mb-[24px]">
              Choose an Available Slot
            </h2>
            <SlotSelector
              slots={slots}
              selectedSlotId={selectedSlotId}
              onSelect={handleSlotSelect}
            />
            <div className="mt-[24px] flex justify-end">
              <Button
                variant="primary"
                size="lg"
                disabled={!selectedSlotId}
                onClick={handleNextStep}
                className="w-full sm:w-auto"
              >
                Next: Set Time →
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-[19px] font-semibold text-text-black mb-[24px]">
              Booking Details
            </h2>
            <BookingForm
              selectedSlot={selectedSlot}
              hourlyRate={hourlyRate}
              onSubmit={handleBookingSubmit}
              onCancel={() => setStep(1)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
