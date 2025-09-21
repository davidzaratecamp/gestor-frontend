import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { incidentService, userService } from '../../services/api';
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
    Star,
    UserPlus,
    Filter,
    Bell,
    Calendar,
    Users,
    ChevronDown,
    ChevronUp,
    Activity,
    MoreVertical,
    FileText
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
        sede: '',
        creador: '',  // coordinador, jefe_operaciones, administrativo
        tiempo_supervision: ''  // hoy, 3dias, semana, mes
    });
    const [fromDashboard, setFromDashboard] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedIncidentForReassign, setSelectedIncidentForReassign] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [reassignReason, setReassignReason] = useState('');
    const [reassignLoading, setReassignLoading] = useState(false);
    const [creators, setCreators] = useState([]);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [selectedIncidentsForAlert, setSelectedIncidentsForAlert] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertLoading, setAlertLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [coordinatorsRanking, setCoordinatorsRanking] = useState([]);
    const [showCoordinatorsPanel, setShowCoordinatorsPanel] = useState(false);
    const [openDropdowns, setOpenDropdowns] = useState({});

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
            
            // Llamar loadIncidents con los filtros directamente
            loadIncidentsWithFilters(urlFilters);
        } else {
            loadIncidents();
        }

        // Cargar técnicos y creadores para filtros si es admin
        if (user?.role === 'admin') {
            loadTechnicians();
            loadCreators();
            loadCoordinatorsRanking();
        }
    }, [location.search, user]);

    const loadIncidents = async () => {
        try {
            setLoading(true);
            
            // Construir filtros para la API
            const filterParams = {};
            if (filters.departamento) filterParams.departamento = filters.departamento;
            if (filters.sede && isAdmin) filterParams.sede = filters.sede;
            if (filters.creador) filterParams.creador = filters.creador;
            if (filters.tiempo_supervision) filterParams.tiempo_supervision = filters.tiempo_supervision;
            
            const response = await incidentService.getInSupervision(filterParams);
            
            // Aplicar filtros adicionales del lado cliente si es necesario
            let filteredIncidents = response.data;
            
            // Agregar información de tiempo en supervisión
            filteredIncidents = filteredIncidents.map(incident => {
                const resolvedAt = new Date(incident.resolved_at || incident.updated_at);
                const now = new Date();
                const hoursInSupervision = Math.floor((now - resolvedAt) / (1000 * 60 * 60));
                
                return {
                    ...incident,
                    hoursInSupervision,
                    daysInSupervision: Math.floor(hoursInSupervision / 24),
                    isOverdue: hoursInSupervision > 3, // Más de 3 horas es "atrasado"
                    isUrgent: hoursInSupervision > 168 // Más de 7 días es "urgente"
                };
            });
            
            setIncidents(filteredIncidents);
        } catch (error) {
            console.error('Error cargando incidencias:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTechnicians = async () => {
        try {
            const response = await userService.getTechnicians();
            setTechnicians(response.data);
        } catch (error) {
            console.error('Error cargando técnicos:', error);
        }
    };

    const loadCreators = async () => {
        try {
            // Cargar usuarios que pueden crear incidencias
            const response = await userService.getUsers();
            const supervisors = response.data.filter(user => 
                ['coordinador', 'jefe_operaciones', 'administrativo'].includes(user.role)
            );
            setCreators(supervisors);
        } catch (error) {
            console.error('Error cargando creadores:', error);
        }
    };

    const loadCoordinatorsRanking = async () => {
        try {
            const response = await incidentService.getCoordinatorsRanking();
            setCoordinatorsRanking(response.data);
        } catch (error) {
            console.error('Error cargando ranking de coordinadores:', error);
        }
    };

    const loadIncidentsWithFilters = async (customFilters) => {
        try {
            setLoading(true);
            
            // Construir filtros para la API
            const filterParams = {};
            if (customFilters.departamento) filterParams.departamento = customFilters.departamento;
            if (customFilters.sede && isAdmin) filterParams.sede = customFilters.sede;
            if (customFilters.creador) filterParams.creador = customFilters.creador;
            if (customFilters.tiempo_supervision) filterParams.tiempo_supervision = customFilters.tiempo_supervision;
            
            const response = await incidentService.getInSupervision(filterParams);
            
            // Agregar información de tiempo en supervisión
            let filteredIncidents = response.data.map(incident => {
                const resolvedAt = new Date(incident.resolved_at || incident.updated_at);
                const now = new Date();
                const hoursInSupervision = Math.floor((now - resolvedAt) / (1000 * 60 * 60));
                
                return {
                    ...incident,
                    hoursInSupervision,
                    daysInSupervision: Math.floor(hoursInSupervision / 24),
                    isOverdue: hoursInSupervision > 3, // Más de 3 horas es "atrasado"
                    isUrgent: hoursInSupervision > 168 // Más de 7 días es "urgente"
                };
            });
            
            setIncidents(filteredIncidents);
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
                             filters.departamento === 'claro' ? 'Claro' :
                             filters.departamento === 'contratacion' ? 'Contratación' :
                             filters.departamento === 'seleccion' ? 'Selección' :
                             filters.departamento === 'reclutamiento' ? 'Reclutamiento' :
                             filters.departamento === 'area_financiera' ? 'Área Financiera' :
                             filters.departamento === 'administrativo' ? 'Administrativo' : filters.departamento;
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
        
        // Para coordinadores y administrativos, la calificación es obligatoria al aprobar
        if (actionType === 'approve' && (user?.role === 'coordinador' || user?.role === 'administrativo') && technicianRating === 0) {
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

    const handleReassign = (incident) => {
        setSelectedIncidentForReassign(incident);
        setSelectedTechnician('');
        setReassignReason('');
        setShowReassignModal(true);
    };

    const confirmReassign = async () => {
        if (!selectedTechnician) {
            alert('Por favor selecciona un técnico');
            return;
        }

        setReassignLoading(true);
        try {
            await incidentService.reassignTechnician(
                selectedIncidentForReassign.id, 
                parseInt(selectedTechnician),
                reassignReason
            );
            setShowReassignModal(false);
            await loadIncidents();
            alert('Técnico reasignado exitosamente');
        } catch (error) {
            console.error('Error reasignando técnico:', error);
            alert(error.response?.data?.msg || 'Error al reasignar técnico');
        } finally {
            setReassignLoading(false);
        }
    };

    const handleFilterChange = (filterName, value) => {
        const newFilters = { ...filters, [filterName]: value };
        setFilters(newFilters);
        // Recargar incidencias inmediatamente con los nuevos filtros
        loadIncidentsWithFilters(newFilters);
    };

    const handleSendAlert = (incident) => {
        setSelectedIncidentsForAlert([incident]);
        setAlertMessage('');
        setShowAlertModal(true);
    };

    const handleBulkAlert = () => {
        // Filtrar incidencias atrasadas (más de 3 horas)
        const overdueIncidents = incidents.filter(inc => inc.isOverdue);
        if (overdueIncidents.length === 0) {
            alert('No hay incidencias atrasadas para alertar');
            return;
        }
        setSelectedIncidentsForAlert(overdueIncidents);
        setAlertMessage('');
        setShowAlertModal(true);
    };

    const confirmSendAlert = async () => {
        if (!alertMessage.trim()) {
            alert('Debes escribir un mensaje de alerta');
            return;
        }

        setAlertLoading(true);
        try {
            const incident_ids = selectedIncidentsForAlert.map(inc => inc.id);
            const response = await incidentService.sendApprovalAlerts(incident_ids, alertMessage);
            
            alert(response.data.msg);
            setShowAlertModal(false);
            setSelectedIncidentsForAlert([]);
            setAlertMessage('');
        } catch (error) {
            console.error('Error enviando alerta:', error);
            alert(error.response?.data?.msg || 'Error al enviar la alerta');
        } finally {
            setAlertLoading(false);
        }
    };

    const clearFilters = () => {
        const clearedFilters = {
            departamento: '',
            sede: '',
            creador: '',
            tiempo_supervision: ''
        };
        setFilters(clearedFilters);
        loadIncidentsWithFilters(clearedFilters);
    };

    const handleExportOldIncidents = async () => {
        if (!window.confirm('¿Deseas exportar las 10 incidencias más viejas sin resolver?')) {
            return;
        }

        try {
            const response = await incidentService.exportOldIncidents(10);
            const data = response.data;

            if (data.length === 0) {
                alert('No hay incidencias sin resolver para exportar');
                return;
            }

            // Crear archivo Excel usando la librería XLSX
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            
            // Agregar la hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Incidencias Más Viejas');
            
            // Generar y descargar el archivo
            const fileName = `incidencias_mas_viejas_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            alert(`Archivo ${fileName} descargado exitosamente con ${data.length} incidencias`);
        } catch (error) {
            console.error('Error exportando incidencias:', error);
            alert('Error al exportar las incidencias');
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
                
                {/* Botones de acción para admin */}
                {user.role === 'admin' && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filtros Avanzados
                            {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                        </button>
                        <button
                            onClick={handleBulkAlert}
                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <Bell className="h-4 w-4 mr-2" />
                            Alertar Atrasadas +3h ({incidents.filter(inc => inc.isOverdue).length})
                        </button>
                        <button
                            onClick={() => setShowCoordinatorsPanel(!showCoordinatorsPanel)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Top 10 Coordinadores
                            {showCoordinatorsPanel ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                        </button>
                        <button
                            onClick={handleExportOldIncidents}
                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <Activity className="h-4 w-4 mr-2" />
                            Exportar Excel
                        </button>
                    </div>
                )}
            </div>

            {/* Panel de filtros */}
            {showFilters && user.role === 'admin' && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Filtro por Sede */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sede
                            </label>
                            <select
                                value={filters.sede}
                                onChange={(e) => handleFilterChange('sede', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todas las sedes</option>
                                <option value="bogota">Bogotá</option>
                                <option value="barranquilla">Barranquilla</option>
                                <option value="villavicencio">Villavicencio</option>
                            </select>
                        </div>

                        {/* Filtro por Departamento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Departamento
                            </label>
                            <select
                                value={filters.departamento}
                                onChange={(e) => handleFilterChange('departamento', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todos los departamentos</option>
                                <option value="obama">Obama</option>
                                <option value="majority">Majority</option>
                                <option value="claro">Claro</option>
                                <option value="contratacion">Contratación</option>
                                <option value="seleccion">Selección</option>
                                <option value="reclutamiento">Reclutamiento</option>
                                <option value="area_financiera">Área Financiera</option>
                                <option value="administrativo">Administrativo (General)</option>
                            </select>
                        </div>

                        {/* Filtro por Creador */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Creado por
                            </label>
                            <select
                                value={filters.creador}
                                onChange={(e) => handleFilterChange('creador', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todos los creadores</option>
                                <option value="coordinador">Coordinadores</option>
                                <option value="jefe_operaciones">Jefes de Operaciones</option>
                                <option value="administrativo">Administrativos</option>
                            </select>
                        </div>

                        {/* Filtro por Tiempo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiempo en supervisión
                            </label>
                            <select
                                value={filters.tiempo_supervision}
                                onChange={(e) => handleFilterChange('tiempo_supervision', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todo el tiempo</option>
                                <option value="hoy">Resueltas hoy</option>
                                <option value="3horas">Más de 3 horas</option>
                                <option value="semana">Más de 7 días</option>
                                <option value="mes">Más de 30 días</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Panel de Top 10 Coordinadores */}
            {showCoordinatorsPanel && user.role === 'admin' && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Users className="h-6 w-6 text-orange-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Top 10 Coordinadores - Incidencias Sin Cerrar
                            </h3>
                        </div>
                    </div>
                    
                    {coordinatorsRanking.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                            No hay coordinadores con incidencias sin cerrar
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {coordinatorsRanking.map((coordinator, index) => (
                                <div key={coordinator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                            index === 1 ? 'bg-gray-100 text-gray-800' :
                                            index === 2 ? 'bg-orange-100 text-orange-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{coordinator.full_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {coordinator.role} - {coordinator.sede?.toUpperCase()}
                                                {coordinator.departamento && ` - ${coordinator.departamento.toUpperCase()}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-red-600">
                                            {coordinator.incidencias_sin_cerrar}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            P:{coordinator.pendientes} | 
                                            EP:{coordinator.en_proceso} | 
                                            ES:{coordinator.en_supervision}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
                                                        En supervisión: {incident.hoursInSupervision}h 
                                                        {incident.daysInSupervision > 0 && ` (${incident.daysInSupervision}d)`}
                                                    </span>
                                                    {incident.isUrgent && (
                                                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                            ¡URGENTE! +7 días
                                                        </span>
                                                    )}
                                                    {incident.isOverdue && !incident.isUrgent && (
                                                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                                            Atrasado +3 horas
                                                        </span>
                                                    )}
                                                </div>
                                                {getStatusBadge(incident.status)}
                                            </div>
                                        </div>

                                        {/* Botones de acción - Desktop y Móvil */}
                                        <div className="flex items-center justify-end mt-4 lg:mt-0 lg:ml-4 w-full lg:w-auto">
                                            {/* Vista Desktop - Botones horizontales */}
                                            <div className="hidden lg:flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewHistory(incident)}
                                                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver Historial
                                                </button>
                                                
                                                {/* Botón de reasignar - solo para admins */}
                                                {user.role === 'admin' && incident.assigned_to_name && (
                                                    <button
                                                        onClick={() => handleReassign(incident)}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-lg transition-all duration-200"
                                                    >
                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                        Reasignar
                                                    </button>
                                                )}
                                                
                                                {/* Solo mostrar botones de aprobar/rechazar si es permitido */}
                                                {(user.role !== 'jefe_operaciones' || incident.reported_by_name === user.full_name) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(incident, 'approve')}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transition-all duration-200"
                                                        >
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(incident, 'reject')}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transition-all duration-200"
                                                        >
                                                            <X className="h-4 w-4 mr-2" />
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {/* Botón de alerta individual - solo para admin en incidencias atrasadas */}
                                                {user.role === 'admin' && incident.isOverdue && (
                                                    <button
                                                        onClick={() => handleSendAlert(incident)}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transition-all duration-200"
                                                    >
                                                        <Bell className="h-4 w-4 mr-2" />
                                                        Alertar
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {/* Vista Móvil/Tablet - Menú desplegable */}
                                            <div className="lg:hidden relative">
                                                <button
                                                    onClick={() => setOpenDropdowns(prev => ({ 
                                                        ...prev, 
                                                        [incident.id]: !prev[incident.id] 
                                                    }))}
                                                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all duration-200 mr-2"
                                                >
                                                    <MoreVertical className="h-4 w-4 mr-1" />
                                                    <span className="hidden sm:inline">Opciones</span>
                                                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${
                                                        openDropdowns[incident.id] ? 'transform rotate-180' : ''
                                                    }`} />
                                                </button>
                                                
                                                {/* Menú desplegable */}
                                                {openDropdowns[incident.id] && (
                                                    <>
                                                        {/* Overlay para cerrar el menú */}
                                                        <div 
                                                            className="fixed inset-0 z-10" 
                                                            onClick={() => setOpenDropdowns(prev => ({ ...prev, [incident.id]: false }))}
                                                        ></div>
                                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                                                        <div className="py-2">
                                                            <button
                                                                onClick={() => {
                                                                    handleViewHistory(incident);
                                                                    setOpenDropdowns(prev => ({ ...prev, [incident.id]: false }));
                                                                }}
                                                                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                            >
                                                                <Eye className="h-4 w-4 mr-3 text-blue-600" />
                                                                Ver Historial
                                                            </button>
                                                            
                                                            {user.role === 'admin' && incident.assigned_to_name && (
                                                                <button
                                                                    onClick={() => {
                                                                        handleReassign(incident);
                                                                        setOpenDropdowns(prev => ({ ...prev, [incident.id]: false }));
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                >
                                                                    <UserPlus className="h-4 w-4 mr-3 text-orange-600" />
                                                                    Reasignar Técnico
                                                                </button>
                                                            )}
                                                            
                                                            {(user.role !== 'jefe_operaciones' || incident.reported_by_name === user.full_name) && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleAction(incident, 'approve');
                                                                            setOpenDropdowns(prev => ({ ...prev, [incident.id]: false }));
                                                                        }}
                                                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors duration-150"
                                                                    >
                                                                        <Check className="h-4 w-4 mr-3 text-green-600" />
                                                                        Aprobar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleAction(incident, 'reject');
                                                                            setOpenDropdowns(prev => ({ ...prev, [incident.id]: false }));
                                                                        }}
                                                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition-colors duration-150"
                                                                    >
                                                                        <X className="h-4 w-4 mr-3 text-red-600" />
                                                                        Rechazar
                                                                    </button>
                                                                </>
                                                            )}
                                                            
                                                            {user.role === 'admin' && incident.isOverdue && (
                                                                <button
                                                                    onClick={() => {
                                                                        handleSendAlert(incident);
                                                                        setOpenDropdowns(prev => ({ ...prev, [incident.id]: false }));
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition-colors duration-150"
                                                                >
                                                                    <Bell className="h-4 w-4 mr-3 text-red-600" />
                                                                    Enviar Alerta
                                                                </button>
                                                            )}
                                                        </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Para jefes de operaciones: mostrar mensaje informativo en incidencias de otros */}
                                            {user.role === 'jefe_operaciones' && incident.reported_by_name !== user.full_name && (
                                                <div className="text-sm text-gray-500 italic px-3 py-2 bg-gray-50 rounded-lg">
                                                    Solo supervisión - no puedes aprobar incidencias de otros
                                                </div>
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
                            {actionType === 'approve' && (user?.role === 'coordinador' || user?.role === 'administrativo') && (
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

            {/* Modal para enviar alertas */}
            {showAlertModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center mb-4">
                                <Bell className="h-6 w-6 text-red-600 mr-2" />
                                <h3 className="text-lg font-medium text-gray-900">
                                    Enviar Alerta
                                </h3>
                            </div>
                            
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm text-red-700 mb-2">
                                    <strong>Incidencias a alertar:</strong> {selectedIncidentsForAlert.length}
                                </p>
                                <div className="max-h-32 overflow-y-auto">
                                    {selectedIncidentsForAlert.map(inc => (
                                        <div key={inc.id} className="text-xs text-red-600 mb-1">
                                            • {inc.station_code} - {inc.reported_by_name} ({inc.hoursInSupervision}h)
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-red-600 mt-2">
                                    Responsables que recibirán la alerta: {[...new Set(selectedIncidentsForAlert.map(inc => inc.reported_by_name))].join(', ')}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mensaje de Alerta *
                                </label>
                                <textarea
                                    value={alertMessage}
                                    onChange={(e) => setAlertMessage(e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Estimado/a [nombre], tienes incidencias pendientes de aprobación que requieren tu atención urgente. Por favor procede con la revisión y aprobación en el sistema..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowAlertModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={alertLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmSendAlert}
                                    disabled={alertLoading || !alertMessage.trim()}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    {alertLoading ? 'Enviando...' : 'Enviar Alerta'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para reasignar técnico */}
            {showReassignModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center mb-4">
                                <UserPlus className="h-6 w-6 text-orange-600 mr-2" />
                                <h3 className="text-lg font-medium text-gray-900">
                                    Reasignar Técnico
                                </h3>
                            </div>
                            
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600">
                                    <strong>Estación:</strong> {selectedIncidentForReassign?.station_code}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Estado:</strong> En Supervisión
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Técnico actual:</strong> {selectedIncidentForReassign?.assigned_to_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Descripción:</strong> {selectedIncidentForReassign?.description}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nuevo Técnico *
                                </label>
                                <select
                                    value={selectedTechnician}
                                    onChange={(e) => setSelectedTechnician(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Seleccionar nuevo técnico...</option>
                                    {technicians
                                        .filter(tech => tech.id !== selectedIncidentForReassign?.assigned_to_id)
                                        .map((tech) => (
                                            <option key={tech.id} value={tech.id}>
                                                {tech.full_name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Motivo de la reasignación
                                </label>
                                <textarea
                                    value={reassignReason}
                                    onChange={(e) => setReassignReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    rows="3"
                                    placeholder="Ej: Necesita revisión adicional, técnico especializado requerido, corrección de errores..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowReassignModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={reassignLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmReassign}
                                    disabled={reassignLoading}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                                >
                                    {reassignLoading ? 'Reasignando...' : 'Reasignar'}
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