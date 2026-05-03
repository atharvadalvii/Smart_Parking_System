"use client";

import React from 'react';
import Card from '@/components/common/Card';

const SlotSelector = ({ slots, selectedSlotId, onSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'free': return 'border-green-accent';
      case 'occupied': return 'border-error';
      case 'reserved': return 'border-gold';
      default: return 'border-divider';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'free': return 'bg-green-accent/5';
      case 'occupied': return 'bg-error/5';
      case 'reserved': return 'bg-gold/5';
      default: return 'bg-ceramic';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'free': return 'Available';
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      default: return 'Unknown';
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'free': return 'bg-green-accent';
      case 'occupied': return 'bg-error';
      case 'reserved': return 'bg-gold';
      default: return 'bg-ceramic';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px]">
      {slots && slots.map((slot) => {
        const isFree = slot.status === 'free';
        const isSelected = selectedSlotId === slot.id;

        return (
          <button
            key={slot.id}
            onClick={() => isFree && onSelect(slot.id)}
            disabled={!isFree}
            className={`
              relative text-left rounded-[12px] p-[20px] border-2 transition-all duration-200
              ${isFree ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : 'cursor-not-allowed opacity-60'}
              ${isSelected 
                ? 'border-green-accent bg-green-accent/10 shadow-md ring-2 ring-green-accent/20' 
                : `${getStatusColor(slot.status)} ${getStatusBg(slot.status)}`
              }
            `}
          >
            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute top-[10px] right-[10px] w-[24px] h-[24px] rounded-full bg-green-accent text-white flex items-center justify-center text-[14px] font-bold">
                ✓
              </div>
            )}

            {/* Slot name */}
            <div className="text-[28px] font-bold text-text-black mb-[8px]">
              {slot.name}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-[8px]">
              <span className={`w-[8px] h-[8px] rounded-full ${getStatusDotColor(slot.status)}`}></span>
              <span className={`text-[14px] font-semibold uppercase tracking-wider ${
                isFree ? 'text-green-accent' : 'text-text-black-soft'
              }`}>
                {getStatusLabel(slot.status)}
              </span>
            </div>

            {/* Sensor info (subtle) */}
            {isFree && (
              <div className="mt-[12px] text-[13px] text-text-black-soft">
                Tap to select this slot
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SlotSelector;
