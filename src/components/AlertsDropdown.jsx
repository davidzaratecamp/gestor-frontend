import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Clock } from 'lucide-react';
import { incidentService } from '../services/api';

const AlertsDropdown = () => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadAlerts();
        // Recargar alertas cada 30 segundos
        const interval = setInterval(loadAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadAlerts = async () => {
        try {
            const response = await incidentService.getMyAlerts();
            setAlerts(response.data.alerts);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Error cargando alertas:', error);
        }
    };

    const handleMarkAsRead = async (alertId) => {
        try {
            await incidentService.markAlertAsRead(alertId);
            await loadAlerts(); // Recargar para actualizar estado
        } catch (error) {
            console.error('Error marcando alerta como leída:', error);
        }
    };

    const handleDismiss = async (alertId) => {
        try {
            await incidentService.dismissAlert(alertId);
            await loadAlerts(); // Recargar para actualizar lista
        } catch (error) {
            console.error('Error descartando alerta:', error);
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Marcar como leídas automáticamente al abrir
            alerts.filter(alert => alert.status === 'sent').forEach(alert => {
                handleMarkAsRead(alert.id);
            });
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const alertDate = new Date(dateString);
        const diffHours = Math.floor((now - alertDate) / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Hace menos de 1 hora';
        if (diffHours === 1) return 'Hace 1 hora';
        if (diffHours < 24) return `Hace ${diffHours} horas`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Hace 1 día';
        return `Hace ${diffDays} días`;
    };

    const visibleAlerts = alerts.filter(alert => alert.status !== 'dismissed');

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Alertas {unreadCount > 0 && `(${unreadCount} sin leer)`}
                        </h3>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {visibleAlerts.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>No tienes alertas</p>
                            </div>
                        ) : (
                            visibleAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                                        alert.status === 'sent' ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {alert.sent_by_name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({alert.sent_by_role})
                                                </span>
                                                {alert.status === 'sent' && (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        Nueva
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">
                                                {alert.message}
                                            </p>
                                            
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatTimeAgo(alert.created_at)}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-1 ml-3">
                                            {alert.status === 'sent' && (
                                                <button
                                                    onClick={() => handleMarkAsRead(alert.id)}
                                                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                                                    title="Marcar como leída"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDismiss(alert.id)}
                                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                                title="Descartar"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {visibleAlerts.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AlertsDropdown;