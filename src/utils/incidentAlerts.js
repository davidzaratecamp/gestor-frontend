// Utilidades para alertas de incidencias críticas

// Umbrales de tiempo en minutos
export const ALERT_THRESHOLDS = {
    WARNING: 30,    // 30 minutos - Alerta amarilla
    CRITICAL: 60,   // 1 hora - Alerta roja
    URGENT: 120     // 2 horas - Alerta roja parpadeante
};

// Tipos de incidencias que tienen prioridad más alta
export const CRITICAL_FAILURE_TYPES = ['internet', 'software'];

// Calcular el tiempo transcurrido desde la creación
export const calculateTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now - created;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    
    return {
        totalMinutes: diffInMinutes,
        hours: diffInHours,
        minutes: diffInMinutes % 60
    };
};

// Determinar el nivel de alerta basado en el tiempo y tipo de incidencia
export const getAlertLevel = (createdAt, failureType = '') => {
    const elapsed = calculateTimeElapsed(createdAt);
    const isCriticalType = CRITICAL_FAILURE_TYPES.includes(failureType);
    
    // Para incidencias críticas, reducir umbrales a la mitad
    const warningThreshold = isCriticalType ? ALERT_THRESHOLDS.WARNING / 2 : ALERT_THRESHOLDS.WARNING;
    const criticalThreshold = isCriticalType ? ALERT_THRESHOLDS.CRITICAL / 2 : ALERT_THRESHOLDS.CRITICAL;
    const urgentThreshold = isCriticalType ? ALERT_THRESHOLDS.URGENT / 2 : ALERT_THRESHOLDS.URGENT;
    
    if (elapsed.totalMinutes >= urgentThreshold) {
        return {
            level: 'urgent',
            color: 'red',
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-500',
            animate: true
        };
    } else if (elapsed.totalMinutes >= criticalThreshold) {
        return {
            level: 'critical',
            color: 'red',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-400',
            animate: false
        };
    } else if (elapsed.totalMinutes >= warningThreshold) {
        return {
            level: 'warning',
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-400',
            animate: false
        };
    }
    
    return null; // Sin alerta
};

// Formatear el tiempo transcurrido para mostrar
export const formatElapsedTime = (createdAt) => {
    const elapsed = calculateTimeElapsed(createdAt);
    
    if (elapsed.hours > 0) {
        return elapsed.minutes > 0 
            ? `${elapsed.hours}h ${elapsed.minutes}m`
            : `${elapsed.hours}h`;
    }
    
    return `${elapsed.minutes}m`;
};

// Obtener mensaje de alerta apropiado
export const getAlertMessage = (createdAt, failureType = '') => {
    const elapsed = calculateTimeElapsed(createdAt);
    const alert = getAlertLevel(createdAt, failureType);
    const timeStr = formatElapsedTime(createdAt);
    
    if (!alert) return null;
    
    const failureTypeLabel = failureType === 'internet' ? 'Internet' :
                            failureType === 'software' ? 'Software' :
                            failureType === 'pantalla' ? 'Pantalla' :
                            failureType === 'perifericos' ? 'Periféricos' : 'Incidencia';
    
    switch (alert.level) {
        case 'urgent':
            return `🚨 URGENTE: ${failureTypeLabel} sin asignar por ${timeStr}`;
        case 'critical':
            return `⚠️ CRÍTICO: ${failureTypeLabel} sin asignar por ${timeStr}`;
        case 'warning':
            return `⚡ ATENCIÓN: ${failureTypeLabel} sin asignar por ${timeStr}`;
        default:
            return null;
    }
};

// Encontrar la incidencia más crítica (más tiempo sin asignar)
export const findMostCriticalIncident = (incidents) => {
    if (!incidents || incidents.length === 0) return null;
    
    // Filtrar solo incidencias pendientes (sin asignar)
    const pendingIncidents = incidents.filter(incident => 
        incident.status === 'pendiente' && !incident.assigned_to_id
    );
    
    if (pendingIncidents.length === 0) return null;
    
    // Encontrar la más antigua
    const oldest = pendingIncidents.reduce((oldest, current) => {
        const oldestTime = new Date(oldest.created_at);
        const currentTime = new Date(current.created_at);
        return currentTime < oldestTime ? current : oldest;
    });
    
    const alert = getAlertLevel(oldest.created_at, oldest.failure_type);
    
    // Solo retornar si hay alerta (más de 30 min para tipos normales, 15 min para críticos)
    return alert ? { incident: oldest, alert } : null;
};

// Obtener las top 3 incidencias con más retraso
export const getTop3DelayedIncidents = (incidents) => {
    if (!incidents || incidents.length === 0) return [];
    
    // Filtrar solo incidencias pendientes (sin asignar)
    const pendingIncidents = incidents.filter(incident => 
        incident.status === 'pendiente' && !incident.assigned_to_id
    );
    
    if (pendingIncidents.length === 0) return [];
    
    // Ordenar por tiempo transcurrido (más antiguos primero)
    const sortedIncidents = pendingIncidents
        .map(incident => ({
            ...incident,
            timeElapsed: calculateTimeElapsed(incident.created_at),
            alertLevel: getAlertLevel(incident.created_at, incident.failure_type)
        }))
        .sort((a, b) => {
            // Ordenar por minutos totales transcurridos (descendente)
            return b.timeElapsed.totalMinutes - a.timeElapsed.totalMinutes;
        });
    
    // Retornar los top 3
    return sortedIncidents.slice(0, 3);
};

// Verificar si una incidencia está en el top 3 de más retraso
export const isInTop3Delayed = (incident, allIncidents) => {
    const top3 = getTop3DelayedIncidents(allIncidents);
    return top3.some(topIncident => topIncident.id === incident.id);
};

// Reproducir sonido de alerta
export const playAlertSound = (level = 'warning') => {
    try {
        // Crear diferentes tonos según el nivel
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar frecuencia según nivel
        const frequencies = {
            warning: 800,   // Tono medio
            critical: 1000, // Tono alto
            urgent: 1200    // Tono muy alto
        };
        
        oscillator.frequency.setValueAtTime(frequencies[level] || frequencies.warning, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Configurar volumen y duración
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Para urgente, reproducir dos beeps
        if (level === 'urgent') {
            setTimeout(() => {
                const oscillator2 = audioContext.createOscillator();
                const gainNode2 = audioContext.createGain();
                
                oscillator2.connect(gainNode2);
                gainNode2.connect(audioContext.destination);
                
                oscillator2.frequency.setValueAtTime(frequencies.urgent, audioContext.currentTime);
                oscillator2.type = 'sine';
                
                gainNode2.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator2.start();
                oscillator2.stop(audioContext.currentTime + 0.3);
            }, 400);
        }
    } catch (error) {
        console.warn('No se pudo reproducir el sonido de alerta:', error);
    }
};