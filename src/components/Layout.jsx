import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from './NotificationBell';
import AlertsDropdown from './AlertsDropdown';
import IntrusiveAlerts from './IntrusiveAlerts';
import ChatBox from './ChatBox';
import AdminChatBox from './AdminChatBox';
import '../styles/hanny-theme.css';
import { 
    Menu, 
    X, 
    Home, 
    AlertTriangle, 
    Users, 
    Monitor, 
    CheckCircle, 
    Clock, 
    Settings, 
    LogOut,
    User,
    Heart
} from 'lucide-react';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [hearts, setHearts] = useState([]);
    const { user, logout, isAdmin, isSupervisor, isCoordinador, isJefeOperaciones, isTechnician, canSupervise } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Detectar si es el usuario especial de Hanny
    const isHannyTheme = user?.username === 'hannycita10';
    
    // Hook de notificaciones para técnicos
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        testNotificationSound
    } = useNotifications(user);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Crear efecto de corazoncito
    const createHeart = (event) => {
        if (!isHannyTheme) return;
        
        const heart = {
            id: Date.now() + Math.random(),
            x: event.clientX,
            y: event.clientY,
        };
        
        setHearts(prev => [...prev, heart]);
        
        // Remover el corazón después de la animación
        setTimeout(() => {
            setHearts(prev => prev.filter(h => h.id !== heart.id));
        }, 1000);
    };

    // Limpiar corazones al cambiar de usuario
    useEffect(() => {
        if (!isHannyTheme) {
            setHearts([]);
        }
    }, [isHannyTheme]);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'supervisor', 'coordinador', 'jefe_operaciones', 'technician', 'administrativo'] },
        
        // Incidencias
        { name: 'Crear Incidencia', href: '/incidents/create', icon: AlertTriangle, roles: ['admin', 'supervisor', 'coordinador', 'jefe_operaciones', 'administrativo'] },
        { name: 'Incidencias Pendientes', href: '/incidents/pending', icon: Clock, roles: ['admin', 'technician', 'jefe_operaciones'] },
        { name: 'Mis Incidencias', href: '/incidents/my-incidents', icon: User, roles: ['technician'], showBadge: true },
        { name: 'En Supervisión', href: '/incidents/supervision', icon: Settings, roles: ['admin', 'supervisor', 'coordinador', 'jefe_operaciones', 'administrativo'] },
        { name: 'Mis Incidencias en Supervisión', href: '/incidents/my-supervision', icon: User, roles: ['jefe_operaciones'] },
        { name: 'Historial Aprobadas', href: '/incidents/approved', icon: CheckCircle, roles: ['admin', 'supervisor', 'coordinador', 'jefe_operaciones', 'technician', 'administrativo'] },
        
        // Gestión (solo admin)
        { name: 'Usuarios', href: '/users', icon: Users, roles: ['admin'] },
        { name: 'Estaciones', href: '/workstations', icon: Monitor, roles: ['admin'] },
    ];

    const filteredNavigation = navigation.filter(item => 
        item.roles.includes(user?.role)
    );

    const isActive = (href) => location.pathname === href;

    return (
        <div className={`h-screen flex ${isHannyTheme ? 'bg-gray-900 hanny-theme' : 'bg-gray-50'} relative`}>
            
            {/* Modal intrusivo de alertas */}
            {(isCoordinador || isJefeOperaciones || user?.role === 'administrativo') && (
                <IntrusiveAlerts />
            )}
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 ${isHannyTheme ? 'bg-gray-800' : 'bg-white'} shadow-lg transform lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300`}>
                <div className={`flex items-center justify-between p-4 ${isHannyTheme ? 'border-gray-700' : 'border-b'}`}>
                    <h1 className={`text-lg sm:text-xl font-bold ${isHannyTheme ? 'text-purple-300' : 'text-gray-900'} truncate`}>
                    {isHannyTheme ? '💜 Panel de Hanny' : 'Soporte Asiste ING.'}
                    </h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className={`lg:hidden p-1 rounded-md ${isHannyTheme ? 'text-purple-400 hover:text-purple-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-5 px-2 space-y-1">
                    {filteredNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={(e) => {
                                    setSidebarOpen(false);
                                    createHeart(e);
                                }}
                                className={`${
                                    isActive(item.href)
                                        ? isHannyTheme 
                                            ? 'bg-purple-900 border-r-4 border-purple-500 text-purple-300'
                                            : 'bg-blue-50 border-r-4 border-blue-600 text-blue-700'
                                        : isHannyTheme
                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-purple-300'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } group flex items-center px-2 py-2 text-sm font-medium rounded-l-md transition-colors duration-200`}
                            >
                                <Icon
                                    className={`${
                                        isActive(item.href) 
                                            ? isHannyTheme ? 'text-purple-400' : 'text-blue-500'
                                            : isHannyTheme ? 'text-gray-400 group-hover:text-purple-400' : 'text-gray-400 group-hover:text-gray-500'
                                    } mr-3 h-5 w-5`}
                                />
                                <span className="flex-1">{item.name}</span>
                                {item.showBadge && isTechnician && unreadCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info and logout */}
                <div className={`absolute bottom-0 w-full p-4 ${isHannyTheme ? 'border-gray-700 bg-gray-800' : 'border-t bg-gray-50'}`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className={`h-8 w-8 rounded-full ${isHannyTheme ? 'bg-purple-600' : 'bg-blue-500'} flex items-center justify-center`}>
                                <span className="text-sm font-medium text-white">
                                    {isHannyTheme ? '💜' : (user?.fullName?.charAt(0) || 'U')}
                                </span>
                            </div>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className={`text-sm font-medium ${isHannyTheme ? 'text-purple-200' : 'text-gray-700'}`}>
                                {user?.fullName || 'Usuario'}
                            </p>
                            <p className={`text-xs ${isHannyTheme ? 'text-purple-400' : 'text-gray-500'} capitalize`}>
                                {isHannyTheme ? '👑 Admin' : (
                                    user?.role === 'admin' ? 'Administrador' : 
                                    user?.role === 'supervisor' ? 'Supervisor' : 
                                    user?.role === 'coordinador' ? 'Coordinador' :
                                    user?.role === 'jefe_operaciones' ? 'Jefe Operaciones' :
                                    user?.role === 'administrativo' ? 'Administrativo' :
                                    'Técnico'
                                )}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`ml-2 p-1 rounded-md ${isHannyTheme ? 'text-purple-400 hover:text-purple-300' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Cerrar sesión"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Top bar */}
                <div className={`${isHannyTheme ? 'bg-gray-800 shadow-sm border-gray-700' : 'bg-white shadow-sm border-b'} px-4 py-3 lg:px-6`}>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={(e) => {
                                setSidebarOpen(true);
                                createHeart(e);
                            }}
                            className={`lg:hidden p-1 rounded-md ${isHannyTheme ? 'text-purple-400 hover:text-purple-300' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <h2 className={`text-sm font-semibold ${isHannyTheme ? 'text-purple-200' : 'text-gray-900'} sm:text-lg lg:text-xl truncate flex-1 lg:text-center`}>
                            {isHannyTheme ? '💜 Sistema de Soporte de Hanny 💜' : 'Call Center - Sistema de Soporte Técnico'}
                        </h2>
                        
                        <div className="flex items-center space-x-2">
                            {/* Alertas para coordinadores, jefes de operaciones y administrativos */}
                            {(isCoordinador || isJefeOperaciones || user?.role === 'administrativo') && (
                                <AlertsDropdown />
                            )}
                            
                            {/* Notification Bell for Technicians */}
                            {isTechnician && (
                                <NotificationBell
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    markAsRead={markAsRead}
                                    markAllAsRead={markAllAsRead}
                                    clearNotifications={clearNotifications}
                                    testNotificationSound={testNotificationSound}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
            
            {/* Efectos de corazón para Hanny */}
            {isHannyTheme && hearts.map((heart) => (
                <div
                    key={heart.id}
                    className="fixed pointer-events-none z-50"
                    style={{
                        left: heart.x - 10,
                        top: heart.y - 10,
                        animation: 'heartFloat 1s ease-out forwards',
                    }}
                >
                    <Heart className="h-5 w-5 text-pink-500 fill-current" />
                </div>
            ))}
            
            {/* Chat Box para usuarios anónimos */}
            <ChatBox />
            
            {/* Chat Admin simplificado para Hanny */}
            <AdminChatBox />
        </div>
    );
};

export default Layout;