import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; phone?: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

// Vehicles
export const vehicleApi = {
  list: () => api.get('/vehicles'),
  create: (data: object) => api.post('/vehicles', data),
  update: (id: string, data: object) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
};

// Service Requests
export const requestApi = {
  list: () => api.get('/requests'),
  get: (id: string) => api.get(`/requests/${id}`),
  create: (data: object) => api.post('/requests', data),
  updateStatus: (id: string, status: string) => api.put(`/requests/${id}/status`, { status }),
};

// Mechanics
export const mechanicApi = {
  nearby: (lat: number, lng: number, radius?: number) =>
    api.get('/mechanics/nearby', { params: { lat, lng, radius } }),
  profile: () => api.get('/mechanics/profile'),
  updateProfile: (data: object) => api.put('/mechanics/profile', data),
  updateLocation: (lat: number, lng: number) => api.put('/mechanics/location', { lat, lng }),
  submitQuote: (data: object) => api.post('/mechanics/quote', data),
  acceptQuote: (quoteId: string) => api.post(`/mechanics/quotes/${quoteId}/accept`),
  updateJobStatus: (jobId: string, status: string) => api.put(`/mechanics/jobs/${jobId}/status`, { status }),
  earnings: () => api.get('/mechanics/earnings'),
};

// Payments
export const paymentApi = {
  createIntent: (jobId: string) => api.post('/payments/intent', { jobId }),
  createMechanicAccount: (email: string) => api.post('/payments/mechanic-account', { email }),
};

// Jobs
export const jobApi = {
  list: () => api.get('/jobs'),
  get: (id: string) => api.get(`/jobs/${id}`),
};

// Reviews
export const reviewApi = {
  submit: (data: { job_id: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  forMechanic: (mechanicId: string) => api.get(`/reviews/mechanic/${mechanicId}`),
};

// Push Notifications
export const pushApi = {
  register: (token: string, platform: string) =>
    api.post('/push/register', { token, platform }),
  unregister: (token: string) =>
    api.delete('/push/unregister', { data: { token } }),
};

// Chat
export const chatApi = {
  getMessages: (jobId: string) => api.get(`/jobs/${jobId}/chat`),
  sendMessage: (jobId: string, message: string) =>
    api.post(`/jobs/${jobId}/chat`, { message }),
};

// Documents
export const documentApi = {
  list: () => api.get('/mechanics/documents'),
  upload: (doc_type: string, file_url: string, file_name: string) =>
    api.post('/mechanics/documents', { doc_type, file_url, file_name }),
  remove: (id: string) => api.delete(`/mechanics/documents/${id}`),
};

// Availability
export const availabilityApi = {
  list: () => api.get('/mechanics/availability'),
  create: (start_at: string, end_at: string, reason?: string) =>
    api.post('/mechanics/availability', { start_at, end_at, reason }),
  remove: (id: string) => api.delete(`/mechanics/availability/${id}`),
};

// Disputes
export const disputeApi = {
  file: (jobId: string, reason: string, details?: string) =>
    api.post(`/jobs/${jobId}/dispute`, { reason, details }),
};

// Job Notes
export const jobNotesApi = {
  list: (jobId: string) => api.get(`/jobs/${jobId}/notes`),
  add: (jobId: string, note: string) => api.post(`/jobs/${jobId}/notes`, { note }),
};

// AI diagnosis
export const diagnosisApi = {
  diagnose: (data: { symptoms: string; make?: string; model?: string; year?: string }) =>
    api.post('/diagnosis', data),
  checkQuote: (data: { image_base64: string; media_type?: string }) =>
    api.post('/diagnosis/quote-check', data, { timeout: 120000 }),
};

// Promo codes
export const promoApi = {
  validate: (code: string) => api.post('/promo/validate', { code }),
  redeem: (code: string) => api.post('/promo/redeem', { code }),
};

// Extended auth
export const authExtApi = {
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  registerProfessional: (data: object) => api.post('/auth/register/professional', data),
};
