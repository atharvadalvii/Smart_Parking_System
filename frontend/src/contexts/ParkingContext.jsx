"use client";

import React, { createContext, useState, useEffect } from 'react';

export const ParkingContext = createContext();

export const ParkingProvider = ({ children }) => {
  const [parkingData, setParkingData] = useState({
    slots: [
      { id: 1, name: "A1", status: "free", sensorIR: false, sensorUltrasonic: 120 },
      { id: 2, name: "A2", status: "occupied", sensorIR: true, sensorUltrasonic: 15 },
      { id: 3, name: "A3", status: "reserved", sensorIR: false, sensorUltrasonic: 200 }
    ],
    gates: {
      entry: { isOpen: false, lastActivity: new Date().toISOString() },
      exit: { isOpen: true, lastActivity: new Date(Date.now() - 120000).toISOString() }
    },
    vehicleCount: 1,
    totalSlots: 3,
    isConnected: true // Simulated Live status
  });

  useEffect(() => {
    // Simulate real-time updates every 5 seconds
    const interval = setInterval(() => {
      setParkingData(prevData => {
        // Randomly toggle one slot's status between free and occupied
        const newSlots = [...prevData.slots];
        const randomSlotIndex = Math.floor(Math.random() * newSlots.length);
        const slot = newSlots[randomSlotIndex];
        
        // Don't modify reserved slots
        if (slot.status !== 'reserved') {
          slot.status = slot.status === 'free' ? 'occupied' : 'free';
          slot.sensorIR = slot.status === 'occupied';
          slot.sensorUltrasonic = slot.status === 'occupied' ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 100) + 100;
        }

        // Update vehicle count based on occupied slots + maybe a random car moving
        const occupiedCount = newSlots.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
        
        // Randomly toggle gates
        const newGates = {
          entry: { 
            isOpen: Math.random() > 0.8 ? !prevData.gates.entry.isOpen : prevData.gates.entry.isOpen,
            lastActivity: Math.random() > 0.8 ? new Date().toISOString() : prevData.gates.entry.lastActivity
          },
          exit: { 
            isOpen: Math.random() > 0.8 ? !prevData.gates.exit.isOpen : prevData.gates.exit.isOpen,
            lastActivity: Math.random() > 0.8 ? new Date().toISOString() : prevData.gates.exit.lastActivity
          }
        };

        return {
          ...prevData,
          slots: newSlots,
          gates: newGates,
          vehicleCount: occupiedCount
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ParkingContext.Provider value={parkingData}>
      {children}
    </ParkingContext.Provider>
  );
};
