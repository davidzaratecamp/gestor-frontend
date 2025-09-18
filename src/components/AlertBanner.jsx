import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { incidentService } from '../services/api';

const AlertBanner = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        loadAlerts();
        const interval = setInterval(loadAlerts, 15000);
        return () => clearInterval(interval);
    }, []);

    const loadAlerts = async () => {
        try {
            const response = await incidentService.getMyAlerts();
            const unread = response.data.alerts.filter(alert => alert.status === 'sent').length;
            setUnreadCount(unread);
            setIsVisible(unread > 0);
        } catch (error) {
            console.error('Error cargando alertas:', error);
        }
    };

    const handleGoToSupervision = () => {
        window.location.href = '/incidents/supervision';
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white z-50 shadow-lg animate-pulse">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-6 w-6 animate-bounce" />
                        <div>
                            <span className="font-bold text-lg">
                                🚨 ALERTA: {unreadCount} mensaje(s) crítico(s) pendiente(s)
                            </span>
                            <div className="text-red-100 text-sm">
                                Tienes incidencias que llevan +3 horas sin supervisión
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleGoToSupervision}
                        className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>REVISAR AHORA</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertBanner;