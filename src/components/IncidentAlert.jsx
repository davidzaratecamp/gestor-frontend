import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AlertTriangle, 
    Clock, 
    X, 
    ExternalLink,
    Volume2,
    VolumeX 
} from 'lucide-react';
import { 
    findMostCriticalIncident, 
    getAlertMessage, 
    formatElapsedTime
} from '../utils/incidentAlerts';
import { playAlertByLevel } from '../utils/soundAlerts';

const IncidentAlert = ({ incidents, onDismiss, onViewIncident, soundEnabled = true }) => {
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);
    const [lastAlertTime, setLastAlertTime] = useState(null);
    const [soundPlayed, setSoundPlayed] = useState(false);
    const [dismissedIncidents, setDismissedIncidents] = useState(() => {
        // Cargar incidencias descartadas del localStorage
        const stored = localStorage.getItem('dismissedIncidents');
        return stored ? JSON.parse(stored) : [];
    });
    
    // Filtrar incidencias que no han sido descartadas permanentemente
    const activeIncidents = incidents.filter(incident => 
        !dismissedIncidents.includes(incident.id)
    );
    
    const criticalData = findMostCriticalIncident(activeIncidents);
    
    // Limpiar incidencias descartadas que ya no están pendientes
    useEffect(() => {
        const currentPendingIds = incidents.map(incident => incident.id);
        const filteredDismissed = dismissedIncidents.filter(id => 
            currentPendingIds.includes(id)
        );
        
        if (filteredDismissed.length !== dismissedIncidents.length) {
            setDismissedIncidents(filteredDismissed);
            localStorage.setItem('dismissedIncidents', JSON.stringify(filteredDismissed));
        }
    }, [incidents, dismissedIncidents]);
    
    // Reproducir sonido cuando hay nueva alerta crítica o urgente
    useEffect(() => {
        if (!criticalData || !soundEnabled || dismissed) return;
        
        const { incident, alert } = criticalData;
        const currentTime = new Date(incident.created_at).getTime();
        
        // Solo reproducir si es una nueva alerta o si cambió el nivel
        if (
            (alert.level === 'critical' || alert.level === 'urgent') &&
            (!lastAlertTime || currentTime !== lastAlertTime) &&
            !soundPlayed
        ) {
            playAlertByLevel(alert.level);
            setLastAlertTime(currentTime);
            setSoundPlayed(true);
            
            // Resetear el estado de sonido después de 30 segundos
            setTimeout(() => setSoundPlayed(false), 30000);
        }
    }, [criticalData, soundEnabled, dismissed, lastAlertTime, soundPlayed]);
    
    // Auto-refresh cada minuto para actualizar tiempos
    useEffect(() => {
        const interval = setInterval(() => {
            // Force re-render to update times
            setLastAlertTime(Date.now());
        }, 60000); // Cada minuto
        
        return () => clearInterval(interval);
    }, []);
    
    if (!criticalData || dismissed) return null;
    
    const { incident, alert } = criticalData;
    const message = getAlertMessage(incident.created_at, incident.failure_type);
    const timeElapsed = formatElapsedTime(incident.created_at);
    
    const handleDismiss = () => {
        if (criticalData?.incident) {
            // Agregar la incidencia a la lista de descartadas permanentemente
            const newDismissedIncidents = [...dismissedIncidents, criticalData.incident.id];
            setDismissedIncidents(newDismissedIncidents);
            
            // Guardar en localStorage
            localStorage.setItem('dismissedIncidents', JSON.stringify(newDismissedIncidents));
        }
        
        setDismissed(true);
        if (onDismiss) onDismiss();
    };
    
    const handleViewIncident = () => {
        if (onViewIncident) {
            // Si tenemos la función callback, usarla para abrir el modal
            onViewIncident(incident);
        } else {
            // Fallback: navegar a la página (comportamiento anterior)
            navigate(`/incidents/pending?highlight=${incident.id}`);
        }
    };
    
    const handleMuteSound = (e) => {
        e.stopPropagation();
        setSoundPlayed(true); // Evitar que suene de nuevo
    };
    
    return (
        <div className="fixed top-4 right-4 max-w-md z-50">
            <div 
                className={`
                    ${alert.bgColor} ${alert.borderColor} border-l-4 p-4 rounded-lg shadow-lg cursor-pointer
                    hover:shadow-xl transition-shadow duration-200
                `}
                onClick={handleViewIncident}
            >
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <AlertTriangle className={`h-5 w-5 ${alert.textColor}`} />
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className={`text-sm font-medium ${alert.textColor}`}>
                            Incidencia Sin Asignar
                        </h3>
                        <div className={`mt-1 text-sm ${alert.textColor}`}>
                            <p className="font-semibold">{message}</p>
                            <div className="mt-2 flex items-center space-x-2 text-xs">
                                <Clock className="h-3 w-3" />
                                <span>Estación: {incident.station_code}</span>
                                <span>•</span>
                                <span>{incident.sede?.toUpperCase()}</span>
                                {incident.departamento && (
                                    <>
                                        <span>•</span>
                                        <span>{incident.departamento?.toUpperCase()}</span>
                                    </>
                                )}
                            </div>
                            <p className="mt-1 text-xs opacity-75">
                                {incident.description}
                            </p>
                        </div>
                        <div className="mt-3 flex items-center space-x-2">
                            <span className={`text-xs ${alert.textColor} opacity-75`}>
                                👆 Hacer clic en cualquier parte para ver detalles completos
                            </span>
                            {(alert.level === 'critical' || alert.level === 'urgent') && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMuteSound(e);
                                    }}
                                    className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                    title="Silenciar alertas por 30 segundos"
                                >
                                    {soundPlayed ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss();
                            }}
                            className={`
                                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${alert.textColor} hover:${alert.bgColor}
                            `}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncidentAlert;