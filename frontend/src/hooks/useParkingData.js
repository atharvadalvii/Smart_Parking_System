"use client";

import { useContext } from 'react';
import { ParkingContext } from '../contexts/ParkingContext';

export const useParkingData = () => {
  const context = useContext(ParkingContext);
  if (context === undefined) {
    throw new Error('useParkingData must be used within a ParkingProvider');
  }
  return context;
};
