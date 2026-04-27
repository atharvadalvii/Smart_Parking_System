import React from 'react';
import Card from '../common/Card';

const SlotIndicator = ({ slot }) => {
  const { name, status, sensorIR, sensorUltrasonic } = slot;

  const getStatusColor = (status) => {
    switch (status) {
      case 'free': return 'bg-green-accent';
      case 'occupied': return 'bg-error';
      case 'reserved': return 'bg-gold';
      default: return 'bg-divider';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'free': return 'text-green-accent';
      case 'occupied': return 'text-error';
      case 'reserved': return 'text-gold';
      default: return 'text-text-black-soft';
    }
  };

  return (
    <Card elevated className="w-full">
      <div className="flex items-center justify-between mb-[16px]">
        <div className="flex items-center gap-[12px]">
          <h3 className="text-[20px] font-bold text-text-black">{name}</h3>
          <div className={`px-[12px] py-[4px] rounded-[50px] bg-opacity-10 flex items-center gap-[6px] ${getStatusTextColor(status)} bg-current`}>
            <div className={`w-[8px] h-[8px] rounded-[50%] ${getStatusColor(status)}`}></div>
            <span className="text-[13px] font-bold uppercase tracking-wider">{status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[12px] border-t border-divider pt-[16px]">
        <div className="flex flex-col">
          <span className="text-[12px] text-text-black-soft uppercase font-semibold mb-[4px]">IR Sensor</span>
          <span className={`text-[14px] font-medium ${sensorIR ? 'text-error' : 'text-green-accent'}`}>
            {sensorIR ? 'Detected' : 'Clear'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] text-text-black-soft uppercase font-semibold mb-[4px]">Ultrasonic</span>
          <span className="text-[14px] font-medium text-text-black">
            {sensorUltrasonic} cm
          </span>
        </div>
      </div>
    </Card>
  );
};

export default SlotIndicator;
