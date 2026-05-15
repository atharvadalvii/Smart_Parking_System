import { httpService } from './httpService';

export const paymentApi = {
  /**
   * Create a payment intent for a booking
   * Expected backend response: { clientSecret: '...', amount: Number }
   */
  createIntent: async (bookingId, amount) => {
    return httpService.post('/api/payments/create-intent', { bookingId, amount });
  },

  /**
   * Get payment status for a booking
   * Expected backend response: { status: 'paid' | 'unpaid' | 'failed' }
   */
  getStatus: async (bookingId) => {
    return httpService.get(`/api/payments/${bookingId}`);
  },

  /**
   * Process/simulate the payment
   * Expected backend response: { success: true, paymentId: string }
   */
  processPayment: async (bookingId, paymentDetails) => {
    return httpService.post(`/api/payments/${bookingId}/process`, paymentDetails);
  }
};
