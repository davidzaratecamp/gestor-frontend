import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { incidentService } from '../services/api';

const IntrusiveAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentAlert, setCurrentAlert] = useState(null);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [incidentsInSupervision, setIncidentsInSupervision] = useState([]);
    const audioRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        loadAlerts();
        loadIncidentsInSupervision();
        // Verificar cada 10 segundos
        const interval = setInterval(() => {
            loadAlerts();
            loadIncidentsInSupervision();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (alerts.length > 0 && incidentsInSupervision.length > 0 && !isAcknowledged) {
            const unreadAlerts = alerts.filter(alert => alert.status === 'active');
            if (unreadAlerts.length > 0) {
                setCurrentAlert(unreadAlerts[0]);
                setShowModal(true);
                playAlertSound();
                
                // Repetir sonido cada 30 minutos hasta que respondan
                intervalRef.current = setInterval(() => {
                    if (!isAcknowledged) {
                        playAlertSound();
                    }
                }, 1800000); // 30 minutos = 30 * 60 * 1000
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [alerts, incidentsInSupervision, isAcknowledged]);

    const loadAlerts = async () => {
        try {
            const response = await incidentService.getMyAlerts();
            setAlerts(response.data.alerts);
        } catch (error) {
            console.error('Error cargando alertas:', error);
        }
    };

    const loadIncidentsInSupervision = async () => {
        try {
            const response = await incidentService.getInSupervision();
            setIncidentsInSupervision(response.data);
        } catch (error) {
            console.error('Error cargando incidencias en supervisión:', error);
            setIncidentsInSupervision([]);
        }
    };

    const playAlertSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('No se pudo reproducir sonido:', e));
        }
    };

    const handleAcknowledge = async () => {
        if (currentAlert) {
            try {
                await incidentService.markAlertAsRead(currentAlert.id);
                setIsAcknowledged(true);
                setShowModal(false);
                
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                
                await loadAlerts();
                
                // Resetear para la siguiente alerta
                setTimeout(() => {
                    setIsAcknowledged(false);
                }, 1000);
                
            } catch (error) {
                console.error('Error marcando alerta como leída:', error);
            }
        }
    };

    const handleGoToSupervision = () => {
        handleAcknowledge();
        window.location.href = '/incidents/supervision';
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

    if (!showModal || !currentAlert) return null;

    return (
        <>
            {/* Audio para la alerta */}
            <audio
                ref={audioRef}
                preload="auto"
                style={{ display: 'none' }}
            >
                <source src="/notification.mp3" type="audio/mpeg" />
                <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+LyvmUcBT2H0fPMcy0GMnfE8OKSQAoUXrTp66hVFApGn+LyvmUcBT2H0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+LyvmUcBT2H0fPMcy0GMXLF8OOTRQsWYLDn7LJaEwlCm+LvuWYdBjiR1/LMeiwFJIHO8tiJOQgZZ7zs6J9OEAxPq+PztmMcBjiS2PLKC" type="audio/wav" />
            </audio>

            {/* Modal de Alerta (No Bloqueante) */}
            <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[9999]">
                <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 pointer-events-auto">
                    {/* Header con advertencia */}
                    <div className="bg-red-600 text-white p-4 rounded-t-lg">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-8 w-8 animate-bounce" />
                            <div>
                                <h2 className="text-xl font-bold">🚨 ALERTA CRÍTICA - ACCIÓN REQUERIDA 🚨</h2>
                                <p className="text-red-100">Tienes incidencias pendientes que requieren tu atención</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-6">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                        Mensaje del Administrador
                                    </h3>
                                    <div className="text-yellow-700 whitespace-pre-line text-sm mb-3">
                                        {currentAlert.message}
                                    </div>
                                    <div className="flex items-center text-xs text-yellow-600 space-x-4">
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-1" />
                                            Enviado por: {currentAlert.sent_by_name}
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {formatTimeAgo(currentAlert.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <h4 className="text-red-800 font-semibold mb-2">⚠️ IMPORTANTE:</h4>
                            <ul className="text-red-700 text-sm space-y-1">
                                <li>• Tienes <strong>{incidentsInSupervision.length}</strong> incidencia(s) pendiente(s) de supervisión</li>
                                <li>• Las incidencias llevan más de 3 horas sin supervisión</li>
                                <li>• Esto afecta los tiempos de respuesta del equipo técnico</li>
                                <li>• Debes revisar y aprobar/rechazar las incidencias pendientes</li>
                                <li>• Puedes seguir trabajando mientras tanto</li>
                            </ul>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex space-x-4">
                            <button
                                onClick={handleGoToSupervision}
                                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                ✅ IR A SUPERVISIÓN AHORA
                            </button>
                            <button
                                onClick={handleAcknowledge}
                                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                            >
                                📋 HE VISTO LA ALERTA
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500">
                                Esta alerta se repetirá cada 30 minutos hasta que sea atendida
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default IntrusiveAlerts;