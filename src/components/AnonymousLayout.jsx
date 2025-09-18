import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, MessageCircle } from 'lucide-react';

const AnonymousLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header minimalista estilo GitHub */}
            <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    {/* Logo/Título */}
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-gray-300" />
                        </div>
                        <h1 className="text-lg font-semibold text-gray-100">
                            Chat de Soporte
                        </h1>
                    </div>

                    {/* Usuario y logout */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-300">
                                    {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                                </span>
                            </div>
                            <span className="text-sm text-gray-300">
                                {user?.full_name || 'Usuario Anónimo'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-md transition-colors"
                            title="Cerrar sesión"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido principal */}
            <main className="min-h-[calc(100vh-64px)] bg-gray-900">
                {children}
                <Outlet />
            </main>
        </div>
    );
};

export default AnonymousLayout;