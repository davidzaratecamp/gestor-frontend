import React, { useState, useEffect } from 'react';
import { incidentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Wrench,
    CheckCircle,
    Clock,
    Monitor,
    AlertCircle,
    FileText,
    Calendar,
    User,
    Settings,
    History,
    MessageCircle,
    XCircle,
    Star,
    RotateCcw
} from 'lucide-react';
import StarRating from '../StarRating';

const MyIncidents = () => {
    const { user, isAdmin } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resolveLoading, setResolveLoading] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [incidentHistory, setIncidentHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [returnLoading, setReturnLoading] = useState(false);

    useEffect(() => {
        loadMyIncidents();
    }, []);

    const loadMyIncidents = async () => {
        try {
            setLoading(true);
            const response = await incidentService.getMyIncidents();
            setIncidents(response.data);
        } catch (error) {
            console.error('Error cargando mis incidencias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = (incident) => {
        setSelectedIncident(incident);
        setResolutionNotes('');
        setShowResolveModal(true);
    };

    const confirmResolve = async () => {
        setResolveLoading(true);
        try {
            await incidentService.markAsResolved(selectedIncident.id, resolutionNotes.trim());
            setShowResolveModal(false);
            await loadMyIncidents();
        } catch (error) {
            console.error('Error marcando como resuelto:', error);
            alert(error.response?.data?.msg || 'Error al marcar como resuelto');
        } finally {
            setResolveLoading(false);
        }
    };

    const handleReturn = (incident) => {
        setSelectedIncident(incident);
        setReturnReason('');
        setShowReturnModal(true);
    };

    const confirmReturn = async () => {
        if (!returnReason.trim()) {
            alert('Por favor ingresa el motivo de la devolución');
            return;
        }

        setReturnLoading(true);
        try {
            await incidentService.returnToCreator(selectedIncident.id, returnReason.trim());
            setShowReturnModal(false);
            alert('Incidencia devuelta exitosamente al creador');
            await loadMyIncidents();
        } catch (error) {
            console.error('Error devolviendo incidencia:', error);
            alert(error.response?.data?.msg || 'Error al devolver la incidencia');
        } finally {
            setReturnLoading(false);
        }
    };

    const handleViewHistory = async (incident) => {
        setSelectedIncident(incident);
        setHistoryLoading(true);
        setShowHistoryModal(true);
        
        try {
            const response = await incidentService.getHistory(incident.id);
            setIncidentHistory(response.data);
        } catch (error) {
            console.error('Error cargando historial:', error);
            alert('Error al cargar el historial');
        } finally {
            setHistoryLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        const statusInfo = {
            'en_proceso': {
                label: 'En Proceso',
                color: 'bg-blue-100 text-blue-800',
                icon: Settings
            },
            'en_supervision': {
                label: 'En Supervisión',
                color: 'bg-purple-100 text-purple-800',
                icon: Clock
            },
            'aprobado': {
                label: 'Aprobado',
                color: 'bg-green-100 text-green-800',
                icon: CheckCircle
            },
            'rechazado': {
                label: 'Rechazado',
                color: 'bg-red-100 text-red-800',
                icon: AlertCircle
            },
            'devuelto': {
                label: 'Devuelto',
                color: 'bg-orange-100 text-orange-800',
                icon: RotateCcw
            }
        };
        return statusInfo[status] || statusInfo.en_proceso;
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

    const getFailureTypeColor = (type) => {
        const colors = {
            'pantalla': 'bg-blue-100 text-blue-800',
            'perifericos': 'bg-purple-100 text-purple-800',
            'internet': 'bg-red-100 text-red-800',
            'software': 'bg-green-100 text-green-800',
            'otro': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || colors.otro;
    };

    const canResolve = (status) => status === 'en_proceso';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Separar incidencias por estado
    const inProcessIncidents = incidents.filter(inc => inc.status === 'en_proceso');
    const otherIncidents = incidents.filter(inc => inc.status !== 'en_proceso');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Incidencias</h1>
                    <p className="text-gray-600">
                        Incidencias asignadas a {user?.fullName}
                    </p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-blue-700 font-medium">
                        {incidents.length} incidencia(s) asignada(s)
                    </span>
                </div>
            </div>

            {incidents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No tienes incidencias asignadas
                    </h3>
                    <p className="text-gray-500">
                        Las nuevas incidencias aparecerán aquí cuando sean asignadas por el administrador.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Incidencias en proceso */}
                    {inProcessIncidents.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Settings className="h-5 w-5 text-blue-600 mr-2" />
                                Para Trabajar ({inProcessIncidents.length})
                            </h2>
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="space-y-1">
                                        {inProcessIncidents.map((incident) => {
                                            const StatusIcon = getStatusInfo(incident.status).icon;
                                            const isRejected = incident.status === 'rechazado';
                                            return (
                                                <div key={incident.id} className={`border rounded p-1 sm:p-2 ${
                                                    isRejected 
                                                        ? 'border-red-300 bg-red-50' 
                                                        : 'border-blue-200 bg-blue-50'
                                                }`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 sm:space-x-4">
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <Monitor className="h-4 w-4 mr-1" />
                                                                    <span className="font-medium">{incident.station_code}</span>
                                                                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {incident.sede?.toUpperCase()} - {incident.departamento?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFailureTypeColor(incident.failure_type)}`}>
                                                                    {getFailureTypeLabel(incident.failure_type)}
                                                                </span>
                                                                {incident.is_recently_reassigned && (
                                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                                                        <Settings className="h-3 w-3 mr-1" />
                                                                        Reasignado
                                                                    </span>
                                                                )}
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <User className="h-4 w-4 mr-1" />
                                                                    <span>Reportado por: {incident.reported_by_name}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-start space-x-2">
                                                                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                <div className="flex-1">
                                                                    <p className="text-gray-900 font-medium">
                                                                        {incident.description}
                                                                    </p>
                                                                    {isRejected && (
                                                                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                                                                            <div className="flex items-center">
                                                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                                                <strong>Incidencia rechazada</strong>
                                                                            </div>
                                                                            <p className="mt-1">
                                                                                Revisa el historial para ver los comentarios del supervisor.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-4 w-4 mr-1" />
                                                                    <span>
                                                                        Asignado: {new Date(incident.updated_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <StatusIcon className="h-4 w-4 mr-1" />
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(incident.status).color}`}>
                                                                        {getStatusInfo(incident.status).label}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="ml-4 flex space-x-2">
                                                            <button
                                                                onClick={() => handleViewHistory(incident)}
                                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <History className="h-4 w-4 mr-1" />
                                                                Ver Historial
                                                            </button>
                                                            <button
                                                                onClick={() => handleReturn(incident)}
                                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                                            >
                                                                <RotateCcw className="h-4 w-4 mr-1" />
                                                                Devolver Caso
                                                            </button>
                                                            <button
                                                                onClick={() => handleResolve(incident)}
                                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Marcar como Resuelto
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Otras incidencias */}
                    {otherIncidents.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="h-5 w-5 text-gray-600 mr-2" />
                                Historial ({otherIncidents.length})
                            </h2>
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="space-y-1">
                                        {otherIncidents.map((incident) => {
                                            const StatusIcon = getStatusInfo(incident.status).icon;
                                            return (
                                                <div key={incident.id} className="border border-gray-200 rounded p-1 sm:p-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 sm:space-x-4">
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <Monitor className="h-4 w-4 mr-1" />
                                                                    <span className="font-medium">{incident.station_code}</span>
                                                                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {incident.sede?.toUpperCase()} - {incident.departamento?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFailureTypeColor(incident.failure_type)}`}>
                                                                    {getFailureTypeLabel(incident.failure_type)}
                                                                </span>
                                                                {incident.is_recently_reassigned && (
                                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                                                        <Settings className="h-3 w-3 mr-1" />
                                                                        Reasignado
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex items-start space-x-2">
                                                                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                <p className="text-gray-900 font-medium">
                                                                    {incident.description}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-4 w-4 mr-1" />
                                                                    <span>
                                                                        Actualizado: {new Date(incident.updated_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <StatusIcon className="h-4 w-4 mr-1" />
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(incident.status).color}`}>
                                                                        {getStatusInfo(incident.status).label}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="ml-4">
                                                            <button
                                                                onClick={() => handleViewHistory(incident)}
                                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <History className="h-4 w-4 mr-1" />
                                                                Ver Historial
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal para marcar como resuelto */}
            {showResolveModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                                <h3 className="text-lg font-medium text-gray-900">
                                    Marcar como Resuelto
                                </h3>
                            </div>
                            
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600">
                                    <strong>Estación:</strong> {selectedIncident?.station_code}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Sede:</strong> {selectedIncident?.sede?.toUpperCase()} - {selectedIncident?.departamento?.toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Tipo:</strong> {getFailureTypeLabel(selectedIncident?.failure_type)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Descripción:</strong> {selectedIncident?.description}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notas de Resolución (opcional)
                                </label>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Describe brevemente cómo se solucionó el problema..."
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Estas notas ayudarán al supervisor a entender la solución aplicada.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowResolveModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={resolveLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmResolve}
                                    disabled={resolveLoading}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {resolveLoading ? 'Enviando...' : 'Marcar como Resuelto'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Devolver Caso */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center mb-4">
                                <RotateCcw className="h-6 w-6 text-orange-600 mr-2" />
                                <h3 className="text-lg font-medium text-gray-900">
                                    Devolver Caso al Creador
                                </h3>
                            </div>

                            <div className="mb-4 p-3 bg-orange-50 rounded border border-orange-200">
                                <p className="text-sm text-gray-600">
                                    <strong>Estación:</strong> {selectedIncident?.station_code}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Sede:</strong> {selectedIncident?.sede?.toUpperCase()} - {selectedIncident?.departamento?.toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Tipo:</strong> {getFailureTypeLabel(selectedIncident?.failure_type)}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    <strong>Descripción:</strong> {selectedIncident?.description}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Motivo de la Devolución <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Ej: AnyDesk incorrecto, falta información del puesto, descripción insuficiente..."
                                    required
                                />
                                <p className="mt-1 text-sm text-orange-600">
                                    Explica qué información está incorrecta o falta para poder resolver el caso.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowReturnModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={returnLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmReturn}
                                    disabled={returnLoading || !returnReason.trim()}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                                >
                                    {returnLoading ? 'Devolviendo...' : 'Devolver Caso'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ver historial */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <History className="h-6 w-6 text-blue-600 mr-2" />
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Historial de Incidencia
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600">
                                    <strong>Estación:</strong> {selectedIncident?.station_code}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Sede:</strong> {selectedIncident?.sede?.toUpperCase()} - {selectedIncident?.departamento?.toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Tipo:</strong> {getFailureTypeLabel(selectedIncident?.failure_type)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Descripción:</strong> {selectedIncident?.description}
                                </p>
                                {selectedIncident?.anydesk_address && (
                                    <p className="text-sm text-gray-600">
                                        <strong>AnyDesk:</strong> <span className="font-mono text-blue-600">{selectedIncident.anydesk_address}</span>
                                    </p>
                                )}
                                {selectedIncident?.advisor_cedula && (
                                    <p className="text-sm text-gray-600">
                                        <strong>Cédula del Agente:</strong> <span className="font-mono">{selectedIncident.advisor_cedula}</span>
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <h4 className="text-md font-medium text-gray-900 mb-3">Historial de Acciones:</h4>
                                
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : incidentHistory.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No hay historial disponible
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {incidentHistory.map((entry, index) => (
                                            <div key={entry.id || index} className="border-l-4 border-blue-200 pl-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            {entry.action.includes('Rechazado') ? (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            ) : entry.action.includes('Aprobado') ? (
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                            ) : entry.action.includes('resuelto') ? (
                                                                <Settings className="h-4 w-4 text-blue-500" />
                                                            ) : (
                                                                <MessageCircle className="h-4 w-4 text-gray-500" />
                                                            )}
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {entry.action}
                                                            </span>
                                                        </div>
                                                        
                                                        <p className="text-sm text-gray-600 mb-1">
                                                            Por: <strong>{entry.user_name}</strong>
                                                        </p>
                                                        
                                                        {entry.details && (
                                                            <div className={`text-sm p-2 rounded mt-2 ${
                                                                entry.action.includes('Rechazado') 
                                                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                                                    : 'bg-gray-50 text-gray-700'
                                                            }`}>
                                                                {entry.details}
                                                            </div>
                                                        )}

                                                        {/* Mostrar calificación si existe (solo para admins para evitar conflictos) */}
                                                        {isAdmin && entry.action.includes('Aprobado') && entry.technician_rating && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <Star className="h-4 w-4 text-yellow-600" />
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        Calificación Recibida
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <StarRating 
                                                                        rating={entry.technician_rating} 
                                                                        readonly={true} 
                                                                        size="sm" 
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-gray-600">
                                                                    Calificado por: <strong>{entry.rated_by_name}</strong>
                                                                </p>
                                                                {entry.rating_feedback && (
                                                                    <p className="text-sm text-gray-700 mt-2">
                                                                        <strong>Comentarios:</strong> {entry.rating_feedback}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        {new Date(entry.timestamp).toLocaleDateString()} <br />
                                                        {new Date(entry.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyIncidents;