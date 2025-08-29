import { useState, useEffect, useRef } from 'react';
import { incidentService } from '../services/api';

export const useNotifications = (user) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastCheckRef = useRef(new Date());
    const intervalRef = useRef(null);

    // Solicitar permisos de notificación del navegador y preparar audio
    useEffect(() => {
        if (user && user.role === 'technician') {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                        console.log('Notificaciones habilitadas');
                    }
                });
            }
            
            // Preparar audio en la primera interacción del usuario
            const enableAudio = async (event) => {
                console.log('👆 Usuario hizo clic, habilitando audio...', event.target);
                initAudio();
                
                // Probar reproducir un sonido silencioso para habilitar el audio
                try {
                    if (audioRef.current) {
                        audioRef.current.volume = 0.01;
                        await audioRef.current.play();
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        audioRef.current.volume = 0.7;
                        audioEnabledRef.current = true;
                        console.log('✅ Audio habilitado correctamente');
                    }
                } catch (error) {
                    console.warn('⚠️ No se pudo habilitar el audio:', error);
                }
                
                // Remover los listeners
                document.removeEventListener('click', enableAudio, true);
                document.removeEventListener('touchstart', enableAudio, true);
                document.removeEventListener('keydown', enableAudio, true);
            };
            
            // Agregar listeners para múltiples tipos de interacción
            document.addEventListener('click', enableAudio, { capture: true, once: true });
            document.addEventListener('touchstart', enableAudio, { capture: true, once: true });
            document.addEventListener('keydown', enableAudio, { capture: true, once: true });
            
            return () => {
                document.removeEventListener('click', enableAudio, true);
                document.removeEventListener('touchstart', enableAudio, true);
                document.removeEventListener('keydown', enableAudio, true);
            };
        }
    }, [user]);

    // Función para mostrar notificación del navegador
    const showBrowserNotification = (incident) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = incident.status === 'en_proceso' ? 'Nueva incidencia asignada' : 'Nueva incidencia pendiente';
            const notification = new Notification(title, {
                body: `Estación: ${incident.station_code}\nTipo: ${getFailureTypeLabel(incident.failure_type)}\nDescripción: ${incident.description.substring(0, 100)}${incident.description.length > 100 ? '...' : ''}`,
                icon: '/vite.svg', // Puedes cambiar esto por tu logo
                badge: '/vite.svg',
                tag: `incident-${incident.id}`,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                // Opcional: navegar a la página de mis incidencias
                notification.close();
            };

            // Auto cerrar después de 10 segundos
            setTimeout(() => notification.close(), 10000);
        }
    };

    // Audio para notificaciones
    const audioRef = useRef(null);
    const audioEnabledRef = useRef(false);

    // Función para inicializar el audio
    const initAudio = () => {
        if (!audioRef.current) {
            // Usar tu archivo de sonido personalizado
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.7;
            audioRef.current.preload = 'auto';
            console.log('🎵 Audio inicializado con notification.mp3');
        }
    };

    // Función para reproducir sonido de notificación
    const playNotificationSound = async () => {
        console.log('🔊 Intentando reproducir sonido de notificación...');
        console.log('🎵 Audio habilitado:', audioEnabledRef.current);
        
        if (!audioEnabledRef.current) {
            console.warn('❌ Audio no habilitado por el usuario aún. Haz clic en cualquier lugar primero.');
            return;
        }
        
        try {
            initAudio();
            
            if (!audioRef.current) {
                console.warn('❌ Audio no disponible');
                return;
            }
            
            // Reiniciar el audio al principio
            audioRef.current.currentTime = 0;
            
            // Intentar reproducir
            await audioRef.current.play();
            console.log('✅ Sonido de notificación reproducido correctamente');
            
        } catch (error) {
            console.warn('❌ No se pudo reproducir el sonido de notificación:', error);
            
            // Método de respaldo: crear un beep simple
            try {
                const beep = () => {
                    const context = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.frequency.value = 800;
                    gainNode.gain.setValueAtTime(0.3, context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
                    
                    oscillator.start(context.currentTime);
                    oscillator.stop(context.currentTime + 0.3);
                };
                
                beep();
                console.log('✅ Sonido de respaldo reproducido');
            } catch (fallbackError) {
                console.warn('❌ Método de respaldo de audio también falló:', fallbackError);
            }
        }
    };

    const getFailureTypeLabel = (type) => {
        const labels = {
            'pantalla': 'Pantalla',
            'perifericos': 'Periféricos', 
            'internet': 'Internet',
            'software': 'Software',
            'otro': 'Otro'
        };
        return labels[type] || type;
    };

    // Función para verificar nuevas incidencias
    const checkForNewIncidents = async () => {
        if (!user || user.role !== 'technician') {
            console.log('Usuario no es técnico, saltando verificación de notificaciones');
            return;
        }

        console.log('🔔 Verificando nuevas incidencias...', new Date().toLocaleTimeString());

        try {
            // Obtener tanto mis incidencias como las pendientes
            const [myIncidentsResponse, pendingIncidentsResponse] = await Promise.all([
                incidentService.getMyIncidents(),
                incidentService.getAll({ status: 'pendiente' })
            ]);
            
            const myIncidents = myIncidentsResponse.data;
            const pendingIncidents = pendingIncidentsResponse.data;
            
            // Filtrar mis incidencias nuevas (asignadas después de la última verificación)
            const newAssignedIncidents = myIncidents.filter(incident => {
                const incidentDate = new Date(incident.updated_at);
                return incidentDate > lastCheckRef.current && incident.status === 'en_proceso';
            });

            // Filtrar incidencias pendientes nuevas (creadas después de la última verificación)
            const newPendingIncidents = pendingIncidents.filter(incident => {
                const incidentDate = new Date(incident.created_at);
                return incidentDate > lastCheckRef.current;
            });

            // Combinar ambos tipos de incidencias nuevas
            const allNewIncidents = [...newAssignedIncidents, ...newPendingIncidents];

            console.log(`📊 Nuevas asignadas: ${newAssignedIncidents.length}, Nuevas pendientes: ${newPendingIncidents.length}, Total nuevas: ${allNewIncidents.length}`);

            if (allNewIncidents.length > 0) {
                console.log('🎵 Nuevas incidencias encontradas, reproduciendo sonido y mostrando notificaciones');
                // Agregar nuevas notificaciones
                const newNotifications = allNewIncidents.map(incident => ({
                    id: `incident-${incident.id}-${Date.now()}`,
                    incidentId: incident.id,
                    title: incident.status === 'en_proceso' ? 'Nueva incidencia asignada' : 'Nueva incidencia pendiente',
                    message: `${incident.station_code} - ${getFailureTypeLabel(incident.failure_type)}`,
                    timestamp: new Date(),
                    read: false,
                    incident: incident
                }));

                setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Mantener solo las últimas 10
                setUnreadCount(prev => prev + newNotifications.length);

                // Mostrar notificaciones del navegador y sonido
                allNewIncidents.forEach(incident => {
                    showBrowserNotification(incident);
                });
                
                if (allNewIncidents.length > 0) {
                    playNotificationSound();
                }
            }

            lastCheckRef.current = new Date();
        } catch (error) {
            console.error('Error verificando nuevas incidencias:', error);
        }
    };

    // Configurar polling cada 30 segundos para técnicos
    useEffect(() => {
        if (user && user.role === 'technician') {
            // Verificar inmediatamente
            checkForNewIncidents();
            
            // Configurar polling cada 30 segundos
            intervalRef.current = setInterval(checkForNewIncidents, 30000);
            
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [user]);

    // Marcar notificación como leída
    const markAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, read: true }
                    : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Marcar todas como leídas
    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
    };

    // Limpiar notificaciones
    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        checkForNewIncidents,
        testNotificationSound: playNotificationSound
    };
};