import React from 'react';
import Card from '../common/Card';

const GateStatus = ({ gates }) => {
  const { entry, exit } = gates || {};

  const GateItem = ({ name, data }) => {
    const isOpen = data?.isOpen;
    
    return (
      <div className="flex items-center justify-between p-[12px] rounded-[8px] bg-neutral-warm">
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-text-black">{name}</span>
          <span className="text-[12px] text-text-black-soft mt-[2px]">
            Last: {data?.lastActivity ? new Date(data.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Unknown'}
          </span>
        </div>
        
        <div className={`flex items-center gap-[6px] px-[10px] py-[4px] rounded-[50px] border ${isOpen ? 'border-green-accent text-green-accent bg-green-accent/5' : 'border-error text-error bg-error/5'}`}>
          <div className={`w-[6px] h-[6px] rounded-[50%] ${isOpen ? 'bg-green-accent' : 'bg-error'}`}></div>
          <span className="text-[12px] font-bold uppercase">{isOpen ? 'Open' : 'Closed'}</span>
        </div>
      </div>
    );
  };

  return (
    <Card elevated className="w-full">
      <h3 className="text-[16px] font-semibold text-text-black mb-[16px]">Gate Status</h3>
      
      <div className="flex flex-col gap-[12px]">
        <GateItem name="Entry Gate" data={entry} />
        <GateItem name="Exit Gate" data={exit} />
      </div>
    </Card>
  );
};

export default GateStatus;
