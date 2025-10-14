import { useState, useEffect } from 'react';
import { incidentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useReturnedIncidents = () => {
    const { user } = useAuth();
    const [returnedCount, setReturnedCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasViewed, setHasViewed] = useState(false);

    const fetchReturnedCount = async () => {
        try {
            setLoading(true);
            // Solo cargar si el usuario tiene permiso
            if (user?.role === 'admin' || user?.role === 'coordinador' || user?.role === 'supervisor' || 
                user?.role === 'jefe_operaciones' || user?.role === 'administrativo') {
                const response = await incidentService.getReturnedIncidents();
                const incidentsData = response.data || response || [];
                const incidentsArray = Array.isArray(incidentsData) ? incidentsData : [];
                setReturnedCount(incidentsArray.length);
            }
        } catch (error) {
            console.error('Error obteniendo incidencias devueltas:', error);
            setReturnedCount(0);
        } finally {
            setLoading(false);
        }
    };

    const markAsViewed = () => {
        setHasViewed(true);
        // Guardar en localStorage para persistir entre sesiones
        if (user) {
            localStorage.setItem(`returned_incidents_viewed_${user.id}`, 'true');
        }
    };

    useEffect(() => {
        if (user) {
            // Verificar si ya se han visto las incidencias devueltas
            const viewed = localStorage.getItem(`returned_incidents_viewed_${user.id}`) === 'true';
            setHasViewed(viewed);
            fetchReturnedCount();
        }
    }, [user]);

    return {
        returnedCount: hasViewed ? 0 : returnedCount, // Mostrar 0 si ya se vieron
        loading,
        refetch: fetchReturnedCount,
        markAsViewed
    };
};