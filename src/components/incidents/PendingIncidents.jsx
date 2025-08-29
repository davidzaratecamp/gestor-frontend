import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { incidentService, userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import IncidentDetailModal from '../IncidentDetailModal';
import { 
    getAlertLevel, 
    formatElapsedTime, 
    getAlertMessage,
    getTop3DelayedIncidents,
    isInTop3Delayed
} from '../../utils/incidentAlerts';
import { 
    Clock, 
    User, 
    Monitor, 
    AlertCircle, 
    UserPlus,
    Calendar,
    FileText,
    Filter,
    X,
    ArrowLeft,
    AlertTriangle,
    Trophy,
    Target,
    Paperclip
} from 'lucide-react';

const PendingIncidents = () => {
    const { user, isAdmin, isTechnician, isJefeOperaciones, canSupervise } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [allIncidents, setAllIncidents] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [filters, setFilters] = useState({
        departamento: '',
        sede: ''
    });
    const [fromDashboard, setFromDashboard] = useState(false);
    const [highlightedIncident, setHighlightedIncident] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null);
    const [showTop3Only, setShowTop3Only] = useState(false);
    const [originalIncidents, setOriginalIncidents] = useState([]);
    const [incidentAttachments, setIncidentAttachments] = useState({});
    
    const allDepartamentos = [
        { value: 'obama', label: 'Obama' },
        { value: 'majority', label: 'Majority' },
        { value: 'claro', label: 'Claro' }
    ];
    
    const allSedes = [
        { value: 'bogota', label: 'Bogotá' },
        { value: 'barranquilla', label: 'Barranquilla' },
        { value: 'villavicencio', label: 'Villavicencio' }
    ];
    
    // Obtener sedes disponibles según el rol y sede del usuario
    const getAvailableSedes = () => {
        if (isAdmin) {
            return allSedes; // Admin ve todas las sedes
        } else if (isTechnician) {
            if (user?.sede === 'bogota') {
                return allSedes.filter(sede => sede.value === 'bogota' || sede.value === 'barranquilla');
            } else if (user?.sede === 'villavicencio') {
                return allSedes.filter(sede => sede.value === 'villavicencio' || sede.value === 'barranquilla');
            } else {
                return allSedes.filter(sede => sede.value === user?.sede);
            }
        } else if (isJefeOperaciones) {
            // Jefes de operaciones solo ven su sede específica
            return allSedes.filter(sede => sede.value === user?.sede);
        }
        return allSedes;
    };
    
    // Obtener departamentos disponibles según la sede seleccionada
    const getAvailableDepartments = (sedeSelected) => {
        if (sedeSelected === 'bogota' || !sedeSelected) {
            return allDepartamentos; // Bogotá tiene todos los departamentos
        } else {
            // Villavicencio y Barranquilla no tienen Majority
            return allDepartamentos.filter(dept => dept.value !== 'majority');
        }
    };

    useEffect(() => {
        // Procesar parámetros de URL al cargar el componente
        const searchParams = new URLSearchParams(location.search);
        const sedeParam = searchParams.get('sede');
        const departamentoParam = searchParams.get('departamento');
        const highlightParam = searchParams.get('highlight');
        
        if (sedeParam || departamentoParam) {
            setFromDashboard(true);
            const urlFilters = {
                sede: sedeParam || '',
                departamento: departamentoParam || ''
            };
            setFilters(urlFilters);
            
            // Construir filtros para la API
            const filterParams = {};
            if (urlFilters.departamento) filterParams.departamento = urlFilters.departamento;
            if (urlFilters.sede && isAdmin) filterParams.sede = urlFilters.sede;
            
            loadData(filterParams);
        } else {
            loadData();
        }
        
        // Configurar resaltado de incidencia específica
        if (highlightParam) {
            setHighlightedIncident(parseInt(highlightParam));
            // Desactivar resaltado después de 5 segundos
            setTimeout(() => setHighlightedIncident(null), 5000);
        }
    }, [location.search, isAdmin]);

    // Auto-refresh cada minuto para actualizar tiempos de alertas
    useEffect(() => {
        const interval = setInterval(() => {
            // Recargar datos cada minuto para mantener alertas actualizadas
            const filterParams = {};
            if (filters.departamento) filterParams.departamento = filters.departamento;
            if (filters.sede && isAdmin) filterParams.sede = filters.sede;
            loadData(filterParams);
        }, 60000); // Cada minuto
        
        return () => clearInterval(interval);
    }, [filters, isAdmin]);

    // Filtrar por Top 3 cuando cambia showTop3Only
    useEffect(() => {
        if (showTop3Only) {
            const top3Incidents = getTop3DelayedIncidents(originalIncidents);
            setIncidents(top3Incidents);
        } else {
            setIncidents(originalIncidents);
        }
    }, [showTop3Only, originalIncidents]);

    const loadData = async (filterParams = {}) => {
        try {
            setLoading(true);
            const [incidentsRes, techniciansRes] = await Promise.all([
                incidentService.getPending(filterParams),
                isAdmin ? userService.getTechnicians() : Promise.resolve({ data: [] })
            ]);
            
            setIncidents(incidentsRes.data);
            setAllIncidents(incidentsRes.data);
            setOriginalIncidents(incidentsRes.data);
            setTechnicians(techniciansRes.data);
            
            // Cargar información de archivos adjuntos para cada incidencia
            const attachmentsInfo = {};
            for (const incident of incidentsRes.data) {
                try {
                    const attachmentsRes = await incidentService.getAttachments(incident.id);
                    attachmentsInfo[incident.id] = attachmentsRes.data.length;
                } catch (error) {
                    // Si hay error, asumir que no hay archivos adjuntos
                    attachmentsInfo[incident.id] = 0;
                }
            }
            setIncidentAttachments(attachmentsInfo);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleFilterChange = (filterName, value) => {
        let newFilters = { ...filters, [filterName]: value };
        
        // Si cambia la sede, verificar si el departamento actual es válido
        if (filterName === 'sede') {
            const availableDepts = getAvailableDepartments(value);
            const currentDeptValid = availableDepts.some(dept => dept.value === newFilters.departamento);
            
            if (!currentDeptValid) {
                // Si el departamento actual no es válido para la nueva sede, limpiarlo
                newFilters.departamento = '';
            }
        }
        
        // Validar que la sede seleccionada esté disponible para el usuario
        if (filterName === 'sede' && value) {
            const availableSedes = getAvailableSedes();
            const sedeValid = availableSedes.some(sede => sede.value === value);
            
            if (!sedeValid) {
                // Si la sede no es válida para este usuario, no aplicar el filtro
                return;
            }
        }
        
        setFilters(newFilters);
        
        // Aplicar filtros (solo admin puede filtrar por sede)
        const filterParams = {};
        if (newFilters.departamento) filterParams.departamento = newFilters.departamento;
        if (newFilters.sede && isAdmin) filterParams.sede = newFilters.sede;
        
        loadData(filterParams);
    };
    
    const clearFilters = () => {
        setFilters({ departamento: '', sede: '' });
        setShowTop3Only(false);
        setFromDashboard(false);
        // Limpiar parámetros de URL
        navigate('/incidents/pending', { replace: true });
        loadData();
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const getFilterDisplayText = () => {        
        const parts = [];
        if (fromDashboard) {
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
        }
        if (showTop3Only) {
            parts.push('Top 3 con más retraso');
        }
        
        return parts.length > 0 ? ` (${parts.join(', ')})` : '';
    };

    const handleIncidentClick = (incident) => {
        setSelectedIncidentDetail(incident);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedIncidentDetail(null);
    };

    const handleAssignFromModal = (incident) => {
        setShowDetailModal(false);
        handleAssign(incident);
    };

    const handleSelfAssignFromModal = (incident) => {
        setShowDetailModal(false);
        handleSelfAssign(incident);
    };

    const handleAssign = (incident) => {
        setSelectedIncident(incident);
        setSelectedTechnician('');
        setShowAssignModal(true);
    };

    const confirmAssign = async () => {
        const technicianId = isAdmin ? selectedTechnician : user.id;
        
        if (isAdmin && !selectedTechnician) {
            alert('Por favor selecciona un técnico');
            return;
        }

        setAssignLoading(true);
        try {
            await incidentService.assignTechnician(selectedIncident.id, parseInt(technicianId));
            setShowAssignModal(false);
            await loadData();
        } catch (error) {
            console.error('Error asignando técnico:', error);
            alert(error.response?.data?.msg || 'Error al asignar técnico');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleSelfAssign = async (incident) => {
        if (window.confirm(`¿Estás seguro de que quieres tomar la incidencia de ${incident.station_code}?`)) {
            try {
                await incidentService.assignTechnician(incident.id, user.id);
                await loadData();
            } catch (error) {
                console.error('Error auto-asignándose:', error);
                alert(error.response?.data?.msg || 'Error al asignarse la incidencia');
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
                                Incidencias Pendientes{getFilterDisplayText()}
                            </h1>
                            <p className="text-gray-600">
                                {isAdmin 
                                    ? 'Asigna técnicos a las incidencias reportadas' 
                                    : 'Incidencias disponibles para auto-asignarse'
                                }
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-yellow-50 px-4 py-2 rounded-lg">
                    <span className="text-yellow-700 font-medium">
                        {incidents.length} incidencia(s) pendiente(s)
                    </span>
                </div>
            </div>

            {/* Filtros - Visible para admin, técnicos y jefes de operaciones */}
            {(isAdmin || isTechnician || isJefeOperaciones) && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filtros:</span>
                        </div>
                        
                        {/* Filtro por Campaña - Dinámico según sede (No visible para jefe_operaciones) */}
                        {!isJefeOperaciones && (
                            <div>
                                <select
                                    value={filters.departamento}
                                    onChange={(e) => handleFilterChange('departamento', e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Todas las campañas</option>
                                    {getAvailableDepartments(filters.sede).map(dept => (
                                        <option key={dept.value} value={dept.value}>
                                            {dept.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {/* Filtro por Sede - Solo admin puede filtrar por sede */}
                        {isAdmin && (
                            <div>
                                <select
                                    value={filters.sede}
                                    onChange={(e) => handleFilterChange('sede', e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Todas las sedes</option>
                                    {getAvailableSedes().map(sede => (
                                        <option key={sede.value} value={sede.value}>
                                            {sede.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {/* Filtro Top 3 con más retraso */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="showTop3Only"
                                checked={showTop3Only}
                                onChange={(e) => setShowTop3Only(e.target.checked)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showTop3Only" className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                                Top 3 con más retraso
                            </label>
                        </div>
                        
                        {/* Botón para limpiar filtros */}
                        {(filters.departamento || filters.sede || showTop3Only) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                            >
                                <X className="h-3 w-3" />
                                <span>Limpiar</span>
                            </button>
                        )}
                        
                        {/* Mostrar filtros activos y contexto para técnicos y jefes */}
                        <div className="text-sm text-gray-500">
                            {incidents.length} de {allIncidents.length} incidencia(s)
                            {isTechnician && (
                                <span className="ml-2 text-xs">
                                    ({user?.sede === 'bogota' ? 'Bogotá + Barranquilla' : 
                                      user?.sede === 'villavicencio' ? 'Villavicencio + Barranquilla' : 
                                      user?.sede})
                                </span>
                            )}
                            {isJefeOperaciones && (
                                <span className="ml-2 text-xs">
                                    ({user?.sede?.toUpperCase()} - {user?.departamento?.toUpperCase()})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {incidents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay incidencias pendientes
                    </h3>
                    <p className="text-gray-500">
                        Todas las incidencias han sido asignadas o están en proceso.
                    </p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-4">
                            {incidents.map((incident, index) => {
                                const alertInfo = getAlertLevel(incident.created_at, incident.failure_type);
                                const timeElapsed = formatElapsedTime(incident.created_at);
                                const alertMessage = getAlertMessage(incident.created_at, incident.failure_type);
                                const isHighlighted = highlightedIncident === incident.id;
                                const isInTop3 = showTop3Only || isInTop3Delayed(incident, originalIncidents);
                                
                                return (
                                <div 
                                    key={incident.id} 
                                    className={`
                                        border rounded-lg p-4 transition-colors relative cursor-pointer
                                        ${isHighlighted ? 
                                            'border-blue-500 bg-blue-50 border-2 ring-2 ring-blue-300 ring-opacity-50' :
                                            alertInfo ? 
                                                `${alertInfo.borderColor} ${alertInfo.bgColor} border-l-4 hover:shadow-md` : 
                                                'border-gray-200 hover:bg-gray-50 hover:shadow-md'
                                        }
                                        ${isHighlighted ? 'animate-pulse' : ''}
                                    `}
                                    onClick={() => handleIncidentClick(incident)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4 mb-2">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Monitor className="h-4 w-4 mr-1" />
                                                    <span className="font-medium">{incident.station_code}</span>
                                                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {incident.sede?.toUpperCase()} - {incident.departamento?.toUpperCase()}
                                                    </span>
                                                    {incidentAttachments[incident.id] > 0 && (
                                                        <div className="ml-2 flex items-center">
                                                            <Paperclip className="h-4 w-4 text-blue-500 mr-1" />
                                                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                                {incidentAttachments[incident.id]} archivo{incidentAttachments[incident.id] !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {isInTop3 && showTop3Only && (
                                                        <div className="ml-2 flex items-center">
                                                            <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                                                            <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                                                TOP {index + 1}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFailureTypeColor(incident.failure_type)}`}>
                                                    {getFailureTypeLabel(incident.failure_type)}
                                                </span>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <User className="h-4 w-4 mr-1" />
                                                    <span>Reportado por: {incident.reported_by_name}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start space-x-2 mb-2">
                                                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-gray-900 font-medium">
                                                    {incident.description}
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    <span>
                                                        Creado: {new Date(incident.created_at).toLocaleDateString()} a las {new Date(incident.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                
                                                {/* Información de tiempo transcurrido */}
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    <span className={alertInfo ? alertInfo.textColor : 'text-gray-500'}>
                                                        Sin asignar: {timeElapsed}
                                                    </span>
                                                </div>
                                                
                                                {/* Badge de estado con alerta si aplica */}
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    alertInfo ? 
                                                        `${alertInfo.bgColor} ${alertInfo.textColor}` : 
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {alertInfo ? 
                                                        (alertInfo.level === 'urgent' ? '🚨 URGENTE' :
                                                         alertInfo.level === 'critical' ? '⚠️ CRÍTICO' : 
                                                         '⚡ ATENCIÓN') : 
                                                        'Pendiente'
                                                    }
                                                </span>
                                            </div>
                                            
                                            {/* Mensaje de alerta si aplica */}
                                            {alertMessage && (
                                                <div className={`mt-2 p-2 rounded-md ${alertInfo.bgColor} flex items-center`}>
                                                    <AlertTriangle className={`h-4 w-4 mr-2 ${alertInfo.textColor}`} />
                                                    <span className={`text-sm font-medium ${alertInfo.textColor}`}>
                                                        {alertMessage}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Indicador de click para ver detalles */}
                                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                                                <span>👁️ Hacer clic para ver detalles completos</span>
                                            </div>
                                        </div>

                                        <div className="ml-4">
                                            {isAdmin ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAssign(incident);
                                                    }}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Asignar Técnico
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelfAssign(incident);
                                                    }}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                >
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Tomar Incidencia
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de detalles de incidencia */}
            <IncidentDetailModal
                incident={selectedIncidentDetail}
                isOpen={showDetailModal}
                onClose={handleCloseDetailModal}
                onAssign={handleAssignFromModal}
                onSelfAssign={handleSelfAssignFromModal}
                isAdmin={isAdmin}
                isTechnician={isTechnician}
                technicians={technicians}
                selectedTechnician={selectedTechnician}
                setSelectedTechnician={setSelectedTechnician}
                assignLoading={assignLoading}
            />

            {/* Modal para asignar técnico */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center mb-4">
                                <UserPlus className="h-6 w-6 text-blue-600 mr-2" />
                                <h3 className="text-lg font-medium text-gray-900">
                                    {isAdmin ? 'Asignar Técnico' : 'Confirmar Auto-asignación'}
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

                            {isAdmin ? (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seleccionar Técnico *
                                    </label>
                                    <select
                                        value={selectedTechnician}
                                        onChange={(e) => setSelectedTechnician(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar técnico...</option>
                                        {technicians.map((tech) => (
                                            <option key={tech.id} value={tech.id}>
                                                {tech.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-blue-50 rounded">
                                    <p className="text-sm text-blue-700">
                                        <strong>Te asignarás esta incidencia a:</strong> {user.fullName}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={assignLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAssign}
                                    disabled={assignLoading}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {assignLoading ? (isAdmin ? 'Asignando...' : 'Tomando...') : (isAdmin ? 'Asignar' : 'Tomar Incidencia')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingIncidents;