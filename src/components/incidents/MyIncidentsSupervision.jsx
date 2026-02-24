import React, { useState, useEffect } from 'react';
import { incidentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CopyableId from '../CopyableId';
import { 
    Eye, 
    Check, 
    X, 
    Clock, 
    User, 
    Monitor, 
    AlertCircle,
    CheckCircle,
    XCircle,
    History,
    MessageCircle,
    Settings,
    Star
} from 'lucide-react';
import StarRating from '../StarRating';

const MyIncidentsSupervision = () => {
    const { user } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
    const [actionNotes, setActionNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [technicianRating, setTechnicianRating] = useState(0);
    const [ratingFeedback, setRatingFeedback] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [incidentHistory, setIncidentHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        loadIncidents();
    }, []);

    const loadIncidents = async () => {
        try {
            setLoading(true);
            // Obtener solo incidencias en supervisión creadas por el jefe de operaciones
            const response = await incidentService.getInSupervision();
            // Filtrar solo las que el usuario reportó
            const myIncidents = response.data.filter(incident => 
                incident.reported_by_name === user.full_name
            );
            setIncidents(myIncidents);
        } catch (error) {
            console.error('Error cargando mis incidencias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (incident, action) => {
        setSelectedIncident(incident);
        setActionType(action);
        setShowModal(true);
        setActionNotes('');
        setTechnicianRating(0);
        setRatingFeedback('');
    };

    const handleViewHistory = async (incident) => {
        try {
            setHistoryLoading(true);
            setSelectedIncident(incident);
            const response = await incidentService.getHistory(incident.id);
            setIncidentHistory(response.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Error cargando historial:', error);
            alert('Error cargando el historial de la incidencia');
        } finally {
            setHistoryLoading(false);
        }
    };

    const confirmAction = async () => {
        if (!selectedIncident) return;

        // Para jefes de operaciones, la calificación es obligatoria al aprobar
        if (actionType === 'approve' && technicianRating === 0) {
            alert('Debes calificar al técnico antes de aprobar la incidencia');
            return;
        }

        try {
            setActionLoading(true);

            const actionData = {
                notes: actionNotes
            };

            // Agregar calificación si se está aprobando
            if (actionType === 'approve' && technicianRating > 0) {
                actionData.rating = technicianRating;
                actionData.feedback = ratingFeedback;
            }

            if (actionType === 'approve') {
                await incidentService.approve(selectedIncident.id, actionData);
                alert('Incidencia aprobada exitosamente');
            } else {
                await incidentService.reject(selectedIncident.id, actionNotes);
                alert('Incidencia rechazada');
            }

            setShowModal(false);
            loadIncidents(); // Recargar la lista
        } catch (error) {
            console.error('Error procesando acción:', error);
            alert('Error al procesar la acción');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Mis Incidencias en Supervisión
                    </h1>
                    <p className="text-gray-600">
                        Revisa y aprueba tus incidencias resueltas por los técnicos
                    </p>
                </div>
                <div className="bg-purple-50 px-4 py-2 rounded-lg">
                    <span className="text-purple-700 font-medium">
                        {incidents.length} incidencia(s) mía(s)
                    </span>
                </div>
            </div>

            {incidents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        ¡Todo al día!
                    </h3>
                    <p className="text-gray-500">
                        No tienes incidencias esperando tu supervisión en este momento.
                    </p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-4">
                            {incidents.map((incident) => (
                                <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4 mb-2">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <CopyableId id={incident.id} className="mr-2" />
                                                    <Monitor className="h-4 w-4 mr-1" />
                                                    <span className="font-medium">{incident.station_code}</span>
                                                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {incident.sede?.toUpperCase()} - {incident.departamento?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                    <span className="font-medium">{getFailureTypeLabel(incident.failure_type)}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {formatDate(incident.created_at)}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 mb-2">{incident.description}</p>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <User className="h-4 w-4 mr-1" />
                                                <span>Técnico: <span className="font-medium">{incident.assigned_to_name}</span></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => handleViewHistory(incident)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <History className="h-4 w-4 mr-1" />
                                                Ver Historial
                                            </button>
                                            <button
                                                onClick={() => handleAction(incident, 'approve')}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => handleAction(incident, 'reject')}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Rechazar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para aprobar/rechazar */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {actionType === 'approve' ? 'Aprobar Incidencia' : 'Rechazar Incidencia'}
                            </h3>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {actionType === 'approve' ? 'Comentarios de aprobación:' : 'Motivo del rechazo:'}
                                </label>
                                <textarea
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                    placeholder={actionType === 'approve' ? 'Agregar comentarios (opcional)' : 'Especificar el motivo del rechazo'}
                                />
                            </div>

                            {actionType === 'approve' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Calificar al Técnico: <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <StarRating
                                            rating={technicianRating}
                                            onRatingChange={setTechnicianRating}
                                            size="large"
                                        />
                                        <span className="text-sm text-gray-600">
                                            ({technicianRating}/5)
                                        </span>
                                    </div>
                                    <textarea
                                        value={ratingFeedback}
                                        onChange={(e) => setRatingFeedback(e.target.value)}
                                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="2"
                                        placeholder="Feedback para el técnico (opcional)"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction}
                                    disabled={actionLoading}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        actionType === 'approve' 
                                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                                            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {actionLoading ? 'Procesando...' : (
                                        actionType === 'approve' ? 'Aprobar' : 'Rechazar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de historial */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Historial de Incidencia #{selectedIncident?.id}
                                </h3>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            
                            {historyLoading ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">
                                    <div className="space-y-4">
                                        {incidentHistory.map((entry, index) => (
                                            <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-gray-900">{entry.action}</span>
                                                        {entry.technician_rating && (
                                                            <div className="flex items-center space-x-1">
                                                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                                <span className="text-sm text-gray-600">{entry.technician_rating}/5</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(entry.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mt-1">{entry.user_name}</p>
                                                {entry.details && (
                                                    <p className="text-gray-700 mt-2">{entry.details}</p>
                                                )}
                                                {entry.rating_feedback && (
                                                    <p className="text-gray-600 text-sm mt-1 italic">
                                                        Feedback: {entry.rating_feedback}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyIncidentsSupervision;