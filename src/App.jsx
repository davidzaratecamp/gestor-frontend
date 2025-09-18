import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './components/Login';
import Layout from './components/Layout';
import AnonymousLayout from './components/AnonymousLayout';
import AnonymousChat from './components/AnonymousChat';
import Dashboard from './components/Dashboard';
import CreateIncident from './components/incidents/CreateIncident';
import IncidentsSupervision from './components/incidents/IncidentsSupervision';
import PendingIncidents from './components/incidents/PendingIncidents';
import MyIncidents from './components/incidents/MyIncidents';
import ApprovedIncidents from './components/incidents/ApprovedIncidents';
import MyIncidentsSupervision from './components/incidents/MyIncidentsSupervision';
import UserManagement from './components/UserManagement';
import WorkstationManagement from './components/WorkstationManagement';

// Componente para determinar el layout según el rol
const LayoutWrapper = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.role === 'anonimo') {
    return <AnonymousLayout>{children}</AnonymousLayout>;
  }
  
  return <Layout>{children}</Layout>;
};

// Componente específico para usuarios anónimos
const AnonymousRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user?.role === 'anonimo' ? children : <Navigate to="/dashboard" replace />;
};

// Componente para redirigir según el rol
const RedirectByRole = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (user?.role === 'anonimo') {
    return <Navigate to="/chat" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

// Componente que bloquea dashboard para anónimos
const DashboardRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (user?.role === 'anonimo') {
    return <Navigate to="/chat" replace />;
  }
  
  return <Dashboard />;
};

// Componente que bloquea rutas para usuarios anónimos
const NonAnonymousRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (user?.role === 'anonimo') {
    return <Navigate to="/chat" replace />;
  }
  
  return children;
};

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
            
            {/* Ruta específica para usuarios anónimos */}
            <Route path="/chat" element={
              <ProtectedRoute>
                <AnonymousRoute>
                  <AnonymousLayout>
                    <AnonymousChat />
                  </AnonymousLayout>
                </AnonymousRoute>
              </ProtectedRoute>
            } />
            
            <Route path="/" element={
              <ProtectedRoute>
                <LayoutWrapper />
              </ProtectedRoute>
            }>
              <Route index element={<RedirectByRole />} />
              <Route path="dashboard" element={<DashboardRoute />} />
              
              {/* Rutas de incidencias */}
              <Route path="incidents/create" element={<NonAnonymousRoute><CreateIncident /></NonAnonymousRoute>} />
              <Route path="incidents/pending" element={<NonAnonymousRoute><PendingIncidents /></NonAnonymousRoute>} />
              <Route path="incidents/my-incidents" element={<NonAnonymousRoute><MyIncidents /></NonAnonymousRoute>} />
              <Route path="incidents/supervision" element={<NonAnonymousRoute><IncidentsSupervision /></NonAnonymousRoute>} />
              <Route path="incidents/my-supervision" element={<NonAnonymousRoute><MyIncidentsSupervision /></NonAnonymousRoute>} />
              <Route path="incidents/approved" element={<NonAnonymousRoute><ApprovedIncidents /></NonAnonymousRoute>} />
              
              {/* Rutas de gestión */}
              <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
              <Route path="workstations" element={<AdminRoute><WorkstationManagement /></AdminRoute>} />
            </Route>

            {/* Ruta catch-all */}
            <Route path="*" element={<RedirectByRole />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
