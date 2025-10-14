import { useState, useEffect } from 'react';
import { incidentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useReturnedIncidents = () => {
    const { user } = useAuth();
    const [returnedCount, setReturnedCount] = useState(0);
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        if (user) {
            fetchReturnedCount();
        }
    }, [user]);

    return {
        returnedCount,
        loading,
        refetch: fetchReturnedCount
    };
};