"use client";

import React, { createContext, useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export const ParkingContext = createContext();

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const ParkingProvider = ({ children }) => {
  const [slots, setSlots] = useState([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const sseRef = useRef(null);

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

  // Apply a single slot update received from SSE
  const applySlotUpdate = ({ slot_id, status }) => {
    setSlots(prev =>
      prev.map(s => s.id === slot_id ? { ...s, status } : s)
    );
  };

  useEffect(() => {
    fetchSlots();
    fetchVehicleCount();

    // Vehicle count still uses polling (SSE covers slot status only)
    const countTimer = setInterval(fetchVehicleCount, 10000);

    // Real-time slot updates via SSE
    const es = new EventSource(`${API_BASE}/api/events/slots`);
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        applySlotUpdate(JSON.parse(e.data));
      } catch {}
    };

    es.onerror = () => {
      // SSE dropped — fall back to polling until reconnect
      setIsConnected(false);
    };

    es.onopen = () => setIsConnected(true);

    return () => {
      es.close();
      clearInterval(countTimer);
    };
  }, []);

  return (
    <ParkingContext.Provider value={{
      slots,
      gates: {
        entry: { isOpen: false, lastActivity: null },
        exit: { isOpen: false, lastActivity: null },
      },
      vehicleCount,
      totalSlots: slots.length,
      isConnected,
    }}>
      {children}
    </ParkingContext.Provider>
  );
};
