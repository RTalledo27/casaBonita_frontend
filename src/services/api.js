import axios from 'axios';

// Configuración base de axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de Collections
export const collectionsApi = {
  // Dashboard
  getDashboardMetrics: () => api.get('/collections/dashboard/metrics'),
  getUpcomingSchedules: (params = {}) => api.get('/collections/dashboard/upcoming-schedules', { params }),
  getOverdueSchedules: (params = {}) => api.get('/collections/dashboard/overdue-schedules', { params }),
  getCollectionsSummary: (params = {}) => api.get('/collections/dashboard/collections-summary', { params }),
  
  // Generación de cronogramas
  generateBulkSchedules: (data) => api.post('/collections/generate-bulk-schedules', data),
  getGenerationStats: () => api.get('/collections/generation-stats'),
  
  // Cuentas por cobrar
  getAccountsReceivable: (params = {}) => api.get('/collections/accounts-receivable', { params }),
  createAccountReceivable: (data) => api.post('/collections/accounts-receivable', data),
  updateAccountReceivable: (id, data) => api.put(`/collections/accounts-receivable/${id}`, data),
  deleteAccountReceivable: (id) => api.delete(`/collections/accounts-receivable/${id}`),
  
  // Pagos de clientes
  getCustomerPayments: (params = {}) => api.get('/collections/customer-payments', { params }),
  createCustomerPayment: (data) => api.post('/collections/customer-payments', data),
  updateCustomerPayment: (id, data) => api.put(`/collections/customer-payments/${id}`, data),
  deleteCustomerPayment: (id) => api.delete(`/collections/customer-payments/${id}`)
};

// Servicios de Sales (cronogramas de pagos)
export const salesApi = {
  getPaymentSchedules: (params = {}) => api.get('/sales/schedules', { params }),
  createPaymentSchedule: (data) => api.post('/sales/schedules', data),
  updatePaymentSchedule: (id, data) => api.put(`/sales/schedules/${id}`, data),
  deletePaymentSchedule: (id) => api.delete(`/sales/schedules/${id}`),
  generateSchedule: (data) => api.post('/sales/schedules/generate', data)
};

// Servicios de Inventory
export const inventoryApi = {
  getLots: (params = {}) => api.get('/inventory/lots', { params }),
  getLot: (id) => api.get(`/inventory/lots/${id}`),
  getLotFinancialTemplate: (lotId) => api.get(`/inventory/lots/${lotId}/financial-template`),
  getManzanaFinancingRules: (manzanaId) => api.get(`/inventory/manzanas/${manzanaId}/financing-rules`)
};

// Servicios de Contracts
export const contractsApi = {
  getContracts: (params = {}) => api.get('/sales/contracts', { params }),
  getContract: (id) => api.get(`/sales/contracts/${id}`),
  createContract: (data) => api.post('/sales/contracts', data),
  updateContract: (id, data) => api.put(`/sales/contracts/${id}`, data),
  deleteContract: (id) => api.delete(`/sales/contracts/${id}`)
};

// Servicios de Authentication
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Servicios de Clients
export const clientsApi = {
  getClients: (params = {}) => api.get('/sales/clients', { params }),
  getClient: (id) => api.get(`/sales/clients/${id}`),
  createClient: (data) => api.post('/sales/clients', data),
  updateClient: (id, data) => api.put(`/sales/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/sales/clients/${id}`)
};

export default api;