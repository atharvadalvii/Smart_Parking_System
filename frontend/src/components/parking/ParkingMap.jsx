import React from 'react';

const ParkingMap = ({ slots, gates, onSlotClick }) => {
  const getSlotColor = (status) => {
    switch (status) {
      case 'free': return '#00754A'; // Green Accent
      case 'occupied': return '#c82014'; // Error Red
      case 'reserved': return '#cba258'; // Gold
      default: return '#edebe9'; // Ceramic (disabled/unknown)
    }
  };

  const getGateColor = (isOpen) => {
    return isOpen ? '#00754A' : '#c82014';
  };

  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center p-4">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full max-w-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background / Pavement */}
        <rect x="0" y="0" width="800" height="600" fill="#f9f9f9" rx="20" />
        <rect x="20" y="20" width="760" height="560" fill="#edebe9" rx="10" />


        {/* Driveway path */}
        <path d="M 100 180 L 100 220 L 700 220 L 700 420" stroke="#ffffff" strokeWidth="8" strokeDasharray="15, 15" fill="none" />

        {/* Parking Slots */}
        {slots && slots.map((slot, index) => {
          // Calculate positions: centered horizontally
          // A1: 150, A2: 325, A3: 500
          const xPos = 150 + index * 175;
          const yPos = 250;
          const slotWidth = 120;
          const slotHeight = 180;
          const color = getSlotColor(slot.status);

          return (
            <g 
              key={slot.id} 
              transform={`translate(${xPos}, ${yPos})`}
              onClick={() => onSlotClick && onSlotClick(slot.id)}
              className={onSlotClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
            >
              {/* Slot Border */}
              <rect 
                x="0" 
                y="0" 
                width={slotWidth} 
                height={slotHeight} 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="4" 
              />
              
              {/* Slot Area Fill */}
              <rect 
                x="4" 
                y="4" 
                width={slotWidth - 8} 
                height={slotHeight - 8} 
                fill={color} 
                fillOpacity="0.1" 
                rx="4"
              />

              {/* Status Indicator Bar */}
              <rect 
                x="10" 
                y={slotHeight - 20} 
                width={slotWidth - 20} 
                height="10" 
                fill={color} 
                rx="5"
              />

              {/* Slot Name */}
              <text 
                x={slotWidth / 2} 
                y="40" 
                fontSize="28" 
                fill="#1E3932" 
                fontWeight="bold" 
                textAnchor="middle"
              >
                {slot.name}
              </text>

              {/* Status Text */}
              <text 
                x={slotWidth / 2} 
                y="70" 
                fontSize="14" 
                fill={color} 
                fontWeight="bold" 
                textAnchor="middle"
                className="uppercase tracking-widest"
              >
                {slot.status}
              </text>

              {/* Car Graphic (if occupied or reserved) */}
              {(slot.status === 'occupied' || slot.status === 'reserved') && (
                <g transform={`translate(${slotWidth / 2 - 30}, 90)`}>
                  <rect x="0" y="0" width="60" height="40" fill={color} rx="8" />
                  <rect x="10" y="5" width="40" height="15" fill="#ffffff" fillOpacity="0.5" rx="4" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ParkingMap;
