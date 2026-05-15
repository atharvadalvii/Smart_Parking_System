import { httpService } from './httpService';

export const slotApi = {
  /**
   * Get all parking slots
   * Expected backend response: Array of { id, name, status, sensorIR, sensorUltrasonic }
   */
  listAll: async () => {
    return httpService.get('/api/slots/');
  },

  /**
   * Get a specific parking slot
   * Expected backend response: { id, name, status, sensorIR, sensorUltrasonic }
   */
  getSlot: async (slotId) => {
    return httpService.get(`/api/slots/${slotId}`);
  },

  /**
   * Get total vehicle count
   * Expected backend response: { count: Number }
   */
  getVehicleCount: async () => {
    return httpService.get('/api/slots/count');
  }
};
