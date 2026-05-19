import React from 'react';
import Card from '../common/Card';

const VehicleCounter = ({ vehicleCount, totalSlots }) => {
  // Simple percentage calculation
  const percentage = totalSlots > 0 ? Math.min((vehicleCount / totalSlots) * 100, 100) : 0;

  return (
    <Card elevated className="w-full bg-house-green text-white">
      <div className="flex flex-col items-center justify-center p-[8px]">
        <h3 className="text-[14px] text-text-black-soft uppercase font-semibold tracking-wider mb-[8px]">
          Vehicles Currently Parked
        </h3>

        <div className="flex items-baseline gap-[8px] mb-[16px]">
          <span className="text-[48px] font-bold text-text-black-soft leading-none">
            {vehicleCount}
          </span>
          <span className="text-[20px] text-text-black-soft font-medium">
            / {totalSlots}
          </span>
        </div>

        {/* Simple Progress Bar */}
        <div className="w-full bg-black bg-opacity-30 rounded-[50px] h-[8px] overflow-hidden">
          <div
            className="bg-green-accent h-full transition-all duration-500 ease-in-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        <div className="w-full flex justify-between mt-[8px]">
          <span className="text-[12px] text-text-black-soft">0</span>
          <span className="text-[12px] text-text-black-soft">{totalSlots} Max</span>
        </div>
      </div>
    </Card>
  );
};

export default VehicleCounter;
