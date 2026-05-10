"use client";

import React, { createContext, useState, useCallback, useEffect } from 'react';

export const BookingContext = createContext();

const LOCAL_STORAGE_KEY = 'smartparking_bookings';

// Pre-seeded mock booking history for the test user
const SEED_BOOKINGS = [
  {
    id: 'BK-001',
    userId: 'user-001',
    slotId: 2,
    slotName: 'A2',
    date: '2026-04-28',
    startTime: '09:00',
    duration: 2, // hours
    cost: 4.00,
    status: 'completed', // confirmed | active | completed | cancelled
    exitTime: '11:00',
    createdAt: '2026-04-28T08:45:00Z',
  },
  {
    id: 'BK-002',
    userId: 'user-001',
    slotId: 1,
    slotName: 'A1',
    date: '2026-05-01',
    startTime: '14:00',
    duration: 3,
    cost: 6.00,
    status: 'completed',
    exitTime: '17:00',
    createdAt: '2026-05-01T13:30:00Z',
  },
  {
    id: 'BK-003',
    userId: 'user-001',
    slotId: 3,
    slotName: 'A3',
    date: '2026-05-03',
    startTime: '10:00',
    duration: 1,
    cost: 2.00,
    status: 'cancelled',
    createdAt: '2026-05-03T09:00:00Z',
  },
];

const HOURLY_RATE = 2; // $2 per hour

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // On mount, load bookings from localStorage (or seed data)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setBookings(JSON.parse(stored));
      } else {
        // First time — use seed data
        setBookings(SEED_BOOKINGS);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_BOOKINGS));
      }
    } catch {
      setBookings(SEED_BOOKINGS);
    }
    setIsLoaded(true);
  }, []);

  // Persist bookings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
    }
  }, [bookings, isLoaded]);

  /**
   * Generate next booking ID (e.g. BK-004)
   */
  const generateId = useCallback(() => {
    const maxNum = bookings.reduce((max, b) => {
      const num = parseInt(b.id.replace('BK-', ''), 10);
      return num > max ? num : max;
    }, 0);
    return `BK-${String(maxNum + 1).padStart(3, '0')}`;
  }, [bookings]);

  /**
   * Create a new booking.
   * @returns {{ success: boolean, bookingId?: string, error?: string }}
   */
  const createBooking = useCallback((userId, slotId, slotName, date, startTime, duration) => {
    // Check if the slot already has an active/confirmed booking
    const conflict = bookings.find(
      (b) => b.slotId === slotId && 
             b.date === date &&
             (b.status === 'confirmed' || b.status === 'active')
    );
    if (conflict) {
      return { success: false, error: 'This slot is already booked for the selected date' };
    }

    const cost = parseFloat((duration * HOURLY_RATE).toFixed(2));
    const newBooking = {
      id: generateId(),
      userId,
      slotId,
      slotName,
      date,
      startTime,
      duration,
      cost,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [...prev, newBooking]);
    return { success: true, bookingId: newBooking.id };
  }, [bookings, generateId]);

  /**
   * Get a booking by ID.
   */
  const getBooking = useCallback((bookingId) => {
    return bookings.find((b) => b.id === bookingId) || null;
  }, [bookings]);

  /**
   * Get all bookings for a specific user.
   */
  const getUserBookings = useCallback((userId) => {
    return bookings
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
  }, [bookings]);

  /**
   * Cancel a booking.
   */
  const cancelBooking = useCallback((bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId && (b.status === 'confirmed' || b.status === 'active')
          ? { ...b, status: 'cancelled' }
          : b
      )
    );
    return { success: true };
  }, []);

  /**
   * Complete a booking (after payment is processed)
   */
  const completeBooking = useCallback((bookingId, finalData) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'completed', ...finalData }
          : b
      )
    );
    return { success: true };
  }, []);

  const value = {
    bookings,
    hourlyRate: HOURLY_RATE,
    createBooking,
    getBooking,
    getUserBookings,
    cancelBooking,
    completeBooking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
