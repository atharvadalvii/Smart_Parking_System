"use client";

import React, { createContext, useState } from 'react';

export const ParkingContext = createContext();

export const ParkingProvider = ({ children }) => {
  const [parkingData] = useState({
    slots: [
      { id: 1, name: "A1", status: "free", sensorIR: false, sensorUltrasonic: 120 },
      { id: 2, name: "A2", status: "occupied", sensorIR: true, sensorUltrasonic: 15 },
      { id: 3, name: "A3", status: "free", sensorIR: false, sensorUltrasonic: 200 }
    ],
    gates: {
      entry: { isOpen: false, lastActivity: new Date().toISOString() },
      exit: { isOpen: false, lastActivity: new Date(Date.now() - 120000).toISOString() }
    },
    vehicleCount: 1,
    totalSlots: 3,
    isConnected: true
  });

  // Real-time updates will come from WebSocket in Phase 4.
  // Slot status changes are now driven by booking actions.

  return (
    <ParkingContext.Provider value={parkingData}>
      {children}
    </ParkingContext.Provider>
  );
};
