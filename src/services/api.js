import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// === SERVICIOS DE USUARIOS ===
export const userService = {
    getTechnicians: () => api.get('/users/technicians'),
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (userData) => api.post('/users', userData),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`)
};

// === SERVICIOS DE ESTACIONES DE TRABAJO ===
export const workstationService = {
    getAll: () => api.get('/workstations'),
    getById: (id) => api.get(`/workstations/${id}`),
    create: (stationData) => api.post('/workstations', stationData),
    update: (id, stationData) => api.put(`/workstations/${id}`, stationData),
    delete: (id) => api.delete(`/workstations/${id}`)
};

// === SERVICIOS DE INCIDENCIAS ===
export const incidentService = {
    getAll: (params = {}) => api.get('/incidents', { params }),
    getMyIncidents: () => api.get('/incidents/my-incidents'),
    getPending: (params = {}) => api.get('/incidents/pending', { params }),
    getInSupervision: (params = {}) => api.get('/incidents/supervision', { params }),
    getApproved: (params = {}) => api.get('/incidents/approved', { params }),
    getById: (id) => api.get(`/incidents/${id}`),
    getHistory: (id) => api.get(`/incidents/${id}/history`),
    getAttachments: (id) => api.get(`/incidents/${id}/attachments`),
    getStatsBySede: () => api.get('/incidents/stats/by-sede'),
    getTechniciansStatus: () => api.get('/incidents/stats/technicians'),
    getTechniciansRanking: () => api.get('/incidents/stats/technicians-ranking'),
    create: (incidentData) => api.post('/incidents', incidentData),
    createWithFiles: (formData) => api.post('/incidents/with-files', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    assignTechnician: (id, technicianId) => api.put(`/incidents/${id}/assign`, { technician_id: technicianId }),
    markAsResolved: (id, resolutionNotes) => api.put(`/incidents/${id}/resolve`, { resolution_notes: resolutionNotes }),
    approve: (id, data) => api.put(`/incidents/${id}/approve`, data),
    reject: (id, rejectionReason) => api.put(`/incidents/${id}/reject`, { rejection_reason: rejectionReason }),
    getMyRatings: () => api.get('/incidents/my-ratings'),
    getTechnicianRatings: (technicianId) => api.get(`/incidents/ratings/${technicianId}`)
};

export default api;