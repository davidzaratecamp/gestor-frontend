import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { incidentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
    ArrowLeft,
    Star
} from 'lucide-react';
import StarRating from '../StarRating';

const IncidentsSupervision = () => {
    const { user, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
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
    const [filters, setFilters] = useState({
        departamento: '',
        sede: ''
    });
    const [fromDashboard, setFromDashboard] = useState(false);

    useEffect(() => {
        // Procesar parámetros de URL al cargar el componente
        const searchParams = new URLSearchParams(location.search);
        const sedeParam = searchParams.get('sede');
        const departamentoParam = searchParams.get('departamento');
        
        if (sedeParam || departamentoParam) {
            setFromDashboard(true);
            const urlFilters = {
                sede: sedeParam || '',
                departamento: departamentoParam || ''
            };
            setFilters(urlFilters);
        }
        
        loadIncidents();
    }, [location.search]);

    const loadIncidents = async () => {
        try {
            setLoading(true);
            
            // Construir filtros para la API
            const filterParams = {};
            if (filters.departamento) filterParams.departamento = filters.departamento;
            if (filters.sede && isAdmin) filterParams.sede = filters.sede;
            
            const response = await incidentService.getInSupervision(filterParams);
            setIncidents(response.data);
        } catch (error) {
            console.error('Error cargando incidencias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const getFilterDisplayText = () => {
        if (!fromDashboard) return '';
        
        const parts = [];
        if (filters.sede) {
            const sedeLabel = filters.sede === 'bogota' ? 'Bogotá' : 
                             filters.sede === 'barranquilla' ? 'Barranquilla' : 
                             filters.sede === 'villavicencio' ? 'Villavicencio' : filters.sede;
            parts.push(`Ciudad: ${sedeLabel}`);
        }
        if (filters.departamento) {
            const deptLabel = filters.departamento === 'obama' ? 'Obama' :
                             filters.departamento === 'majority' ? 'Majority' :
                             filters.departamento === 'claro' ? 'Claro' : filters.departamento;
            parts.push(`Departamento: ${deptLabel}`);
        }
        
        return parts.length > 0 ? ` (Filtrado por: ${parts.join(', ')})` : '';
    };

    const handleAction = (incident, action) => {
        setSelectedIncident(incident);
        setActionType(action);
        setActionNotes('');
        setTechnicianRating(0);
        setRatingFeedback('');
        setShowModal(true);
    };

    const confirmAction = async () => {
        if (actionType === 'reject' && !actionNotes.trim()) {
            alert('El motivo del rechazo es requerido');
            return;
        }
        
        // Para coordinadores, la calificación es obligatoria al aprobar
        if (actionType === 'approve' && user?.role === 'coordinador' && technicianRating === 0) {
            alert('Debes calificar al técnico antes de aprobar la incidencia');
            return;
        }

        setActionLoading(true);
        try {
            if (actionType === 'approve') {
                const approvalData = {
                    approval_notes: actionNotes,
                    technician_rating: technicianRating > 0 ? technicianRating : undefined,
                    rating_feedback: ratingFeedback.trim() || undefined
                };
                await incidentService.approve(selectedIncident.id, approvalData);
            } else {
                await incidentService.reject(selectedIncident.id, actionNotes);
            }
            
            setShowModal(false);
            await loadIncidents();
        } catch (error) {
            console.error('Error en la acción:', error);
            alert(error.response?.data?.msg || 'Error al procesar la acción');
        } finally {
            setActionLoading(false);
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

    const getStatusBadge = (status) => {
        const badges = {
            'en_supervision': 'bg-purple-100 text-purple-800'
        };
        
        const labels = {
            'en_supervision': 'En Supervisión'
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
                {labels[status]}
            </span>
        );
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
                    <div className="flex items-center space-x-3">
                        {fromDashboard && (
                            <button
                                onClick={handleBackToDashboard}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Volver al Dashboard
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Incidencias en Supervisión{getFilterDisplayText()}
                            </h1>
                            <p className="text-gray-600">
                                Revisa y aprueba las incidencias resueltas por los técnicos
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-purple-50 px-4 py-2 rounded-lg">
                    <span className="text-purple-700 font-medium">
                        {incidents.length} incidencia(s) pendiente(s)
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
                        No hay incidencias esperando supervisión en este momento.
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
                                                    <Monitor className="h-4 w-4 mr-1" />
                                                    <span className="font-medium">{incident.station_code}</span>
                                                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {incident.sede?.toUpperCase()} - {incident.departamento?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                    <span className="capitalize">{incident.failure_type}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <User className="h-4 w-4 mr-1" />
                                                    <span>{incident.assigned_to_name}</span>
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-900 font-medium mb-1">
                                                {incident.description}
                                            </p>
                                            
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    <span>
                                                        Actualizado: {new Date(incident.updated_at).toLocaleDateString()} a las {new Date(incident.updated_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                {getStatusBadge(incident.status)}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => handleViewHistory(incident)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <History className="h-4 w-4 mr-1" />
                                                Ver Historial
                                            </button>
                                            {user.role !== 'jefe_operaciones' && (
                                                <>
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
                                                </>
                                            )}
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
                            <div className="flex items-center mb-4">
                                {actionType === 'approve' ? (
                                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-600 mr-2" />
                                )}
                                <h3 className="text-lg font-medium text-gray-900">
                                    {actionType === 'approve' ? 'Aprobar Incidencia' : 'Rechazar Incidencia'}
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
                                    <strong>Técnico:</strong> {selectedIncident?.assigned_to_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Descripción:</strong> {selectedIncident?.description}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {actionType === 'approve' ? 'Comentarios (opcional)' : 'Motivo del rechazo *'}
                                </label>
                                <textarea
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={actionType === 'approve' 
                                        ? 'Comentarios adicionales...' 
                                        : 'Explica por qué se rechaza esta solución...'
                                    }
                                />
                            </div>

                            {/* Sección de calificación - Solo para aprobaciones */}
                            {actionType === 'approve' && user?.role === 'coordinador' && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <Star className="h-5 w-5 text-yellow-600 mr-2" />
                                        <h4 className="text-sm font-medium text-gray-900">
                                            Calificar al Técnico *
                                        </h4>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3">
                                        ¿Cómo calificas el trabajo realizado por <strong>{selectedIncident?.assigned_to_name}</strong>?
                                    </p>
                                    
                                    <div className="mb-3">
                                        <StarRating 
                                            rating={technicianRating}
                                            onRatingChange={setTechnicianRating}
                                            size="lg"
                                        />
                                    </div>
                                    
                                    {technicianRating > 0 && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Comentarios sobre el desempeño (opcional)
                                            </label>
                                            <textarea
                                                value={ratingFeedback}
                                                onChange={(e) => setRatingFeedback(e.target.value)}
                                                rows={2}
                                                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                                placeholder="Describe qué aspectos destacas del trabajo del técnico..."
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={actionLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction}
                                    disabled={actionLoading}
                                    className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                                        actionType === 'approve' 
                                            ? 'bg-green-600 hover:bg-green-700' 
                                            : 'bg-red-600 hover:bg-red-700'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        actionType === 'approve' 
                                            ? 'focus:ring-green-500' 
                                            : 'focus:ring-red-500'
                                    } disabled:opacity-50`}
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
                                <p className="text-sm text-gray-600">
                                    <strong>Técnico Asignado:</strong> {selectedIncident?.assigned_to_name}
                                </p>
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
                                                            ) : entry.action.includes('resuelto') || entry.action.includes('Marcado') ? (
                                                                <Settings className="h-4 w-4 text-blue-500" />
                                                            ) : entry.action.includes('Asignación') ? (
                                                                <User className="h-4 w-4 text-purple-500" />
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
                                                                    : entry.action.includes('resuelto') || entry.action.includes('Marcado')
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                    : 'bg-gray-50 text-gray-700'
                                                            }`}>
                                                                <strong>
                                                                    {entry.action.includes('Rechazado') ? 'Motivo del rechazo: ' :
                                                                     entry.action.includes('resuelto') || entry.action.includes('Marcado') ? 'Notas del técnico: ' :
                                                                     'Detalles: '}
                                                                </strong>
                                                                {entry.details}
                                                            </div>
                                                        )}

                                                        {/* Mostrar calificación si existe (solo para acciones de aprobación) */}
                                                        {entry.action.includes('Aprobado') && entry.technician_rating && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <Star className="h-4 w-4 text-yellow-600" />
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        Calificación del Técnico
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

export default IncidentsSupervision;