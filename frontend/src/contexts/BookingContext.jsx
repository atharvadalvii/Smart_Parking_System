"use client";

import React, { createContext, useCallback } from 'react';
import { api } from '@/lib/api';

export const BookingContext = createContext();

function normalizeBooking(b) {
  const id = b.id || b.booking_id;
  const exitIso = b.exit_time;
  const entryIso = b.entry_time;
  return {
    id,
    userId: b.user_id,
    slotId: b.slot_id,
    slotName: b.slot_number || b.slot_id || '',
    date: b.date || '',
    startTime: b.start_time || (entryIso ? new Date(entryIso).toTimeString().slice(0, 5) : ''),
    duration: b.duration || 0,
    cost: b.fare_amount ?? b.estimated_cost ?? 0,
    status: b.status === 'pending' ? 'confirmed' : b.status,
    exitTime: exitIso ? new Date(exitIso).toTimeString().slice(0, 5) : null,
    entryTime: entryIso,
    fareAmount: b.fare_amount,
    paymentStatus: b.payment_status,
    qrCode: b.qr_code,
    createdAt: b.created_at,
  };
}

export const BookingProvider = ({ children }) => {
  const createBooking = useCallback(async (userId, slotId, _slotName, date, startTime, duration, plate) => {
    const estimatedCost = parseFloat((duration * 3).toFixed(2));
    try {
      const data = await api.post('/api/bookings/', {
        slot_id: slotId,
        plate,
        date,
        start_time: startTime,
        duration,
        estimated_cost: estimatedCost,
      });
      return { success: true, bookingId: data.booking_id, qrCode: data.qr_code, plate: data.plate };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const getBooking = useCallback(async (bookingId) => {
    try {
      const data = await api.get(`/api/bookings/${bookingId}`);
      return normalizeBooking(data);
    } catch {
      return null;
    }
  }, []);

  const getUserBookings = useCallback(async (userId) => {
    try {
      const data = await api.get(`/api/bookings/user/${userId}`);
      return data
        .map(normalizeBooking)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch {
      return [];
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const completeBooking = useCallback(async (bookingId) => {
    try {
      // Record exit to get real fare from actual timestamps
      try {
        await api.put(`/api/bookings/${bookingId}/exit`);
      } catch {
        // booking may not be active (e.g. never entered) — simulate handles fallback fare
      }
      await api.post(`/api/payments/simulate/${bookingId}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return (
    <BookingContext.Provider value={{
      hourlyRate: 3,
      createBooking,
      getBooking,
      getUserBookings,
      cancelBooking,
      completeBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
};
