import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    History,
    User,
    Calendar,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const AssetHistoryPanel = ({ activoId, canViewHistory = false }) => {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const fetchHistorial = async () => {
        if (!activoId || !canViewHistory) return;

        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE_URL}/activos-tecnico/${activoId}/historial`);
            setHistorial(response.data.historial || []);
        } catch (err) {
            console.error('Error al cargar historial:', err);
            if (err.response?.status === 403) {
                setError('No tiene permisos para ver el historial');
            } else {
                setError('Error al cargar el historial de cambios');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (expanded && historial.length === 0 && !error) {
            fetchHistorial();
        }
    }, [expanded, activoId, canViewHistory]);

    // Si el usuario no puede ver el historial, no mostrar nada
    if (!canViewHistory) {
        return null;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Fecha desconocida';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFieldColor = (campo) => {
        const colors = {
            cpu_procesador: 'bg-blue-100 text-blue-800',
            memoria_ram: 'bg-purple-100 text-purple-800',
            almacenamiento: 'bg-orange-100 text-orange-800',
            sistema_operativo: 'bg-green-100 text-green-800'
        };
        return colors[campo] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="border-t border-gray-200 mt-6 pt-6">
            {/* Header colapsable */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center">
                    <History className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                        Historial de Cambios
                    </h3>
                    {historial.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {historial.length} cambio{historial.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>

            {/* Contenido expandible */}
            {expanded && (
                <div className="mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                            <span className="ml-2 text-gray-500">Cargando historial...</span>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-8 text-red-500">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            {error}
                        </div>
                    ) : historial.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <History className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                            <p>No hay cambios registrados para este activo</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {historial.map((cambio) => (
                                <div
                                    key={cambio.id}
                                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getFieldColor(cambio.campo)}`}>
                                            {cambio.campoLabel}
                                        </span>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {formatDate(cambio.fecha)}
                                        </div>
                                    </div>

                                    <div className="flex items-center text-sm mt-2">
                                        <span className="text-gray-500 line-through">
                                            {cambio.valorAnterior || 'Sin valor'}
                                        </span>
                                        <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                        <span className="text-gray-900 font-medium">
                                            {cambio.valorNuevo}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-xs text-gray-500 mt-2">
                                        <User className="h-3 w-3 mr-1" />
                                        Modificado por: {cambio.modificadoPor}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Botón refrescar */}
                    {!loading && !error && (
                        <button
                            onClick={fetchHistorial}
                            className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refrescar historial
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AssetHistoryPanel;
