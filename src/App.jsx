import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CreateIncident from './components/incidents/CreateIncident';
import IncidentsSupervision from './components/incidents/IncidentsSupervision';
import PendingIncidents from './components/incidents/PendingIncidents';
import MyIncidents from './components/incidents/MyIncidents';
import ApprovedIncidents from './components/incidents/ApprovedIncidents';
import UserManagement from './components/UserManagement';
import WorkstationManagement from './components/WorkstationManagement';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Componente para rutas que requieren rol de admin
const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600">Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }
  
  return children;
};

// Componente placeholder para rutas que aún no están implementadas
const ComingSoon = ({ title }) => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
    <p className="text-gray-600">Esta sección está en desarrollo...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Rutas de incidencias */}
              <Route path="incidents/create" element={<CreateIncident />} />
              <Route path="incidents/pending" element={<PendingIncidents />} />
              <Route path="incidents/my-incidents" element={<MyIncidents />} />
              <Route path="incidents/supervision" element={<IncidentsSupervision />} />
              <Route path="incidents/approved" element={<ApprovedIncidents />} />
              
              {/* Rutas de gestión */}
              <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
              <Route path="workstations" element={<AdminRoute><WorkstationManagement /></AdminRoute>} />
            </Route>

            {/* Ruta catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
