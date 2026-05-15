import { httpService } from './httpService';

export const authApi = {
  login: async (email, password) => {
    return httpService.post('/api/auth/login', { email, password });
  },

  register: async (data) => {
    // data expected: { name, email, password, phone, licensePlate }
    const payload = {
      ...data,
      'license-plate': data.licensePlate
    };
    delete payload.licensePlate;
    return httpService.post('/api/auth/register', payload);
  },

  getCurrentUser: async () => {
    return httpService.get('/api/auth/me');
  }
};
