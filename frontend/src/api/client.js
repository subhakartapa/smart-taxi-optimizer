import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}

export const taxiAPI = {
  getAll: () => api.get('/taxis/'),
  getById: (id) => api.get(`/taxis/${id}`),
  create: (data) => api.post('/taxis/', data),
  updateStatus: (id, status) => api.put(`/taxis/${id}/status`, { status }),
  delete: (id) => api.delete(`/taxis/${id}`),
  assign: (data) => api.post('/taxis/assign', data),
}

export const optimizeAPI = {
  route: (data) => api.post('/optimize/route', data),
  compare: (data) => api.post('/optimize/compare', data),
  multistop: (data) => api.post('/optimize/multistop', data),
}

export const tripAPI = {
  getAll: (params) => api.get('/trips/', { params }),
  save: (data) => api.post('/trips/', data),
  getById: (id) => api.get(`/trips/${id}`),
}

export default api
