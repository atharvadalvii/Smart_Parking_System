import { httpService } from './httpService';

export const bookingApi = {
  /**
   * Create a new booking
   * Expected backend response: the full booking object in frontend format
   * { id, userId, slotId, slotName, date, startTime, duration, cost, status, createdAt }
   */
  create: async (userId, slotId, slotName, date, startTime, duration, cost) => {
    return httpService.post('/api/bookings/', { 
      userId, 
      slotId, 
      slotName, 
      date, 
      startTime, 
      duration, 
      cost 
    });
  },

  /**
   * Get a booking by ID
   * Expected backend response: the full booking object in frontend format
   */
  getById: async (bookingId) => {
    return httpService.get(`/api/bookings/${bookingId}`);
  },

  /**
   * Get all bookings for a user
   * Expected backend response: array of booking objects in frontend format
   */
  getUserBookings: async (userId) => {
    return httpService.get(`/api/bookings/user/${userId}`);
  },

  /**
   * Cancel a booking
   * Expected backend response: { success: true }
   */
  cancel: async (bookingId) => {
    return httpService.delete(`/api/bookings/${bookingId}`);
  },

  /**
   * Simulate gate entry (QR code scan)
   * Expected backend response: updated booking object with entryTime and status='active'
   */
  gateEntry: async (bookingId) => {
    return httpService.put(`/api/bookings/${bookingId}/entry`, {});
  },

  /**
   * Simulate gate exit (QR code scan)
   * Expected backend response: updated booking object with exitTime and possibly calculated final cost
   */
  gateExit: async (bookingId) => {
    return httpService.put(`/api/bookings/${bookingId}/exit`, {});
  },

  /**
   * Complete a booking (e.g. after payment)
   * finalData might contain { status: 'completed' }
   * Expected backend response: { success: true }
   */
  complete: async (bookingId, finalData) => {
    return httpService.put(`/api/bookings/${bookingId}/complete`, finalData);
  }
};
