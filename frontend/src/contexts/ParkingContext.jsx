"use client";

import React, { createContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export const ParkingContext = createContext();

export const ParkingProvider = ({ children }) => {
  const [slots, setSlots] = useState([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const fetchSlots = async () => {
    try {
      const data = await api.get('/api/slots/');
      setSlots(data.map(s => ({
        id: s.id,
        name: s.slot_number,
        status: s.status,
        sensorIR: s.sensor_ir ?? false,
        sensorUltrasonic: s.sensor_ultrasonic ?? 0,
      })));
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  };

  const fetchVehicleCount = async () => {
    try {
      const data = await api.get('/api/slots/count');
      setVehicleCount(data.vehicle_count);
    } catch {}
  };

  useEffect(() => {
    fetchSlots();
    fetchVehicleCount();
    const timer = setInterval(() => {
      fetchSlots();
      fetchVehicleCount();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ParkingContext.Provider value={{
      slots,
      gates: {
        entry: { isOpen: false, lastActivity: new Date().toISOString() },
        exit: { isOpen: false, lastActivity: new Date().toISOString() },
      },
      vehicleCount,
      totalSlots: slots.length,
      isConnected,
    }}>
      {children}
    </ParkingContext.Provider>
  );
};
