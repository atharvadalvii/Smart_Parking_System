"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useParkingData } from '@/hooks/useParkingData';
import ParkingMap from '@/components/parking/ParkingMap';
import SlotIndicator from '@/components/parking/SlotIndicator';
import VehicleCounter from '@/components/parking/VehicleCounter';
import GateStatus from '@/components/parking/GateStatus';
import Card from '@/components/common/Card';

export default function DashboardPage() {
  const { slots, gates, vehicleCount, totalSlots, isConnected } = useParkingData();
  const router = useRouter();

  const handleSlotClick = (slotId) => {
    const slot = slots?.find(s => s.id === slotId);
    if (slot && slot.status === 'free') {
      router.push(`/booking?slot=${slot.name}`);
    }
  };

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 lg:px-10 max-w-[1440px] py-[32px] md:py-[48px]">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-[32px] gap-[16px]">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-starbucks-green mb-[4px]">Dashboard</h1>
          <p className="text-[16px] text-text-black-soft">Real-time parking status overview</p>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-[8px] bg-white px-[16px] py-[8px] rounded-[50px] shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_1px_1px_rgba(0,0,0,0.24)]">
          <div className="relative flex h-3 w-3">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-accent opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-accent' : 'bg-error'}`}></span>
          </div>
          <span className="text-[14px] font-bold text-text-black uppercase tracking-wider">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Main Content: Dual Column Layout */}
      <div className="flex flex-col lg:flex-row gap-[24px] lg:gap-[32px]">

        {/* Left Column: Map (Takes up ~65% on desktop) */}
        <div className="w-full lg:w-[65%] flex flex-col gap-[24px]">
          <Card elevated className="w-full h-[500px] lg:h-[600px] p-0 overflow-hidden flex flex-col">
            <div className="px-[24px] py-[16px] border-b border-divider bg-white shrink-0 flex items-center justify-between">
              <h2 className="text-[19px] font-semibold text-text-black">Parking Map</h2>
              <span className="text-[13px] text-text-black-soft">Click a green slot to book</span>
            </div>
            <div className="flex-grow bg-[#f2f0eb] relative overflow-hidden">
              <ParkingMap slots={slots} gates={gates} onSlotClick={handleSlotClick} />
            </div>
          </Card>
        </div>

        {/* Right Column: Status Panels (Takes up ~35% on desktop) */}
        <div className="w-full lg:w-[35%] flex flex-col gap-[24px]">

          <VehicleCounter vehicleCount={vehicleCount} totalSlots={totalSlots} />

          <GateStatus gates={gates} />

          {/* Slots List */}
          <div className="flex flex-col gap-[16px]">
            <h2 className="text-[19px] font-semibold text-text-black mt-[8px]">Slot Details</h2>
            <div className="flex flex-col gap-[12px] max-h-[500px] overflow-y-auto pr-2 pb-2">
              {slots && slots.map(slot => (
                <SlotIndicator key={slot.id} slot={slot} />
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
