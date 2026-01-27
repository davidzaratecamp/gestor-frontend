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
    Paperclip,
    Settings
} from 'lucide-react';

const PendingIncidents = () => {
    const { user, isAdmin, isTechnician, isJefeOperaciones, canSupervise } = useAuth();
    const isIronManTheme = user?.username === 'davidlopez10';
    const location = useLocation();
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [allIncidents, setAllIncidents] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [reassignReason, setReassignReason] = useState('');
    const [filters, setFilters] = useState({
        departamento: '',
        sede: '',
        coordinador: '',
        fecha: ''
    });
    const [fromDashboard, setFromDashboard] = useState(false);
    const [highlightedIncident, setHighlightedIncident] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null);
    const [showTop3Only, setShowTop3Only] = useState(false);
    const [originalIncidents, setOriginalIncidents] = useState([]);
    const [incidentAttachments, setIncidentAttachments] = useState({});
    const [currentStatus, setCurrentStatus] = useState('pendiente');
    const [coordinators, setCoordinators] = useState([]); // Track current status
    
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
    
    const dateFilters = [
        { value: 'hoy', label: 'Hoy' },
        { value: 'ayer', label: 'Ayer' },
        { value: '3dias', label: 'Últimos 3 días' },
        { value: 'semana', label: 'Última semana' }
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
        const statusParam = searchParams.get('status');
        const highlightParam = searchParams.get('highlight');
        
        // Establecer el status actual
        const status = statusParam || 'pendiente';
        setCurrentStatus(status);
        
        if (sedeParam || departamentoParam || statusParam) {
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
            if (statusParam) filterParams.status = statusParam;
            
            loadData(filterParams, status);
        } else {
            loadData({}, status);
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
            loadData(filterParams, currentStatus);
        }, 60000); // Cada minuto
        
        return () => clearInterval(interval);
    }, [filters, isAdmin, currentStatus]);

    // Filtrar por Top 3 cuando cambia showTop3Only
    useEffect(() => {
        if (showTop3Only) {
            const top3Incidents = getTop3DelayedIncidents(originalIncidents);
            setIncidents(top3Incidents);
        } else {
            setIncidents(originalIncidents);
        }
    }, [showTop3Only, originalIncidents]);

    const loadData = async (filterParams = {}, status = 'pendiente') => {
        try {
            setLoading(true);
            
            // Usar el endpoint apropiado según el status
            let incidentsPromise;
            if (status === 'en_proceso') {
                // Para incidencias en proceso, agregar el status a los filtros
                const processFilterParams = { ...filterParams, status: 'en_proceso' };
                incidentsPromise = incidentService.getAll(processFilterParams);
            } else {
                incidentsPromise = incidentService.getPending(filterParams);
            }
            
            const promises = [incidentsPromise];
            
            if (isAdmin) {
                promises.push(userService.getTechnicians());
            }
            
            // Cargar coordinadores si es jefe de operaciones
            if (isJefeOperaciones) {
                promises.push(userService.getCoordinators());
            }
            
            const results = await Promise.all(promises);
            const incidentsRes = results[0];
            const techniciansRes = isAdmin ? results[1] : { data: [] };
            const coordinatorsRes = isJefeOperaciones ? results[results.length - 1] : { data: [] };
            
            // Aplicar filtros de fecha y coordinador en el frontend
            let filteredIncidents = incidentsRes.data;
            
            // Filtro por coordinador
            if (filterParams.coordinador) {
                filteredIncidents = filteredIncidents.filter(incident => 
                    incident.reported_by_name?.toLowerCase().includes(filterParams.coordinador.toLowerCase())
                );
            }
            
            // Filtro por fecha
            if (filterParams.fecha) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                filteredIncidents = filteredIncidents.filter(incident => {
                    const incidentDate = new Date(incident.created_at);
                    incidentDate.setHours(0, 0, 0, 0);
                    
                    switch (filterParams.fecha) {
                        case 'hoy':
                            return incidentDate.getTime() === today.getTime();
                        case 'ayer':
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);
                            return incidentDate.getTime() === yesterday.getTime();
                        case '3dias':
                            const threeDaysAgo = new Date(today);
                            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                            return incidentDate >= threeDaysAgo;
                        case 'semana':
                            const weekAgo = new Date(today);
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return incidentDate >= weekAgo;
                        default:
                            return true;
                    }
                });
            }
            
            setIncidents(filteredIncidents);
            setAllIncidents(filteredIncidents);
            setOriginalIncidents(filteredIncidents);
            setTechnicians(techniciansRes.data);
            setCoordinators(coordinatorsRes.data);
            
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
        if (newFilters.coordinador) filterParams.coordinador = newFilters.coordinador;
        if (newFilters.fecha) filterParams.fecha = newFilters.fecha;
        
        loadData(filterParams, currentStatus);
    };
    
    const clearFilters = () => {
        setFilters({ departamento: '', sede: '', coordinador: '', fecha: '' });
        setShowTop3Only(false);
        setFromDashboard(false);
        // Limpiar parámetros de URL
        navigate('/incidents/pending', { replace: true });
        loadData({}, 'pendiente');
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
        if (filters.coordinador) {
            parts.push(`Coordinador: ${filters.coordinador}`);
        }
        if (filters.fecha) {
            const fechaLabel = dateFilters.find(f => f.value === filters.fecha)?.label || filters.fecha;
            parts.push(`Fecha: ${fechaLabel}`);
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
            await loadData({}, currentStatus);
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
                await loadData({}, currentStatus);
            } catch (error) {
                console.error('Error auto-asignándose:', error);
                alert(error.response?.data?.msg || 'Error al asignarse la incidencia');
            }
        }
    };

    const handleReassign = (incident) => {
        setSelectedIncident(incident);
        setSelectedTechnician('');
        setReassignReason('');
        setShowReassignModal(true);
    };

    const confirmReassign = async () => {
        if (!selectedTechnician) {
            alert('Por favor selecciona un técnico');
            return;
        }

        setAssignLoading(true);
        try {
            await incidentService.reassignTechnician(
                selectedIncident.id, 
                parseInt(selectedTechnician),
                reassignReason
            );
            setShowReassignModal(false);
            await loadData({}, currentStatus);
            alert('Técnico reasignado exitosamente');
        } catch (error) {
            console.error('Error reasignando técnico:', error);
            alert(error.response?.data?.msg || 'Error al reasignar técnico');
        } finally {
            setAssignLoading(false);
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
            <div className={`flex items-center justify-center h-64 ${isIronManTheme ? 'bg-[#0B0F14] rounded-xl' : ''}`}>
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isIronManTheme ? 'border-[#00E5FF]' : 'border-blue-600'}`}></div>
            </div>
        );
    }

    return (
        <div className={`space-y-4 md:space-y-6 ${isIronManTheme ? 'bg-[#0B0F14] p-6 rounded-xl' : ''}`}>
            {/* Header responsivo */}
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="space-y-3">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                        {fromDashboard && (
                            <button
                                onClick={handleBackToDashboard}
                                className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 self-start ${isIronManTheme ? 'text-[#94A3B8] bg-[#0F172A] hover:bg-[#0B0F14] border-cyan-500/30' : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'}`}
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Volver al Dashboard</span>
                                <span className="sm:hidden">Volver</span>
                            </button>
                        )}
                        <div>
                            <h1 className={`text-xl md:text-2xl font-bold break-words ${isIronManTheme ? 'text-[#E5E7EB] ironman-glow' : 'text-gray-900'}`}>
                                {currentStatus === 'en_proceso' ? 'Incidencias En Proceso' : 'Incidencias Pendientes'}{getFilterDisplayText()}
                            </h1>
                            <p className={`text-sm md:text-base mt-1 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                {currentStatus === 'en_proceso' 
                                    ? 'Incidencias que están siendo trabajadas por técnicos'
                                    : isAdmin 
                                        ? 'Asigna técnicos a las incidencias reportadas' 
                                        : 'Incidencias disponibles para auto-asignarse'
                                }
                            </p>
                        </div>
                    </div>
                </div>
                <div className={`px-3 py-2 md:px-4 rounded-lg self-start lg:self-auto ${
                    isIronManTheme
                        ? (currentStatus === 'en_proceso' ? 'bg-cyan-500/10' : 'bg-orange-500/10')
                        : (currentStatus === 'en_proceso' ? 'bg-blue-50' : 'bg-yellow-50')
                }`}>
                    <span className={`font-medium text-sm md:text-base ${
                        isIronManTheme
                            ? (currentStatus === 'en_proceso' ? 'text-[#00E5FF]' : 'text-[#FF6A00]')
                            : (currentStatus === 'en_proceso' ? 'text-blue-700' : 'text-yellow-700')
                    }`}>
                        {incidents.length} incidencia(s) {currentStatus === 'en_proceso' ? 'en proceso' : 'pendiente(s)'}
                    </span>
                </div>
            </div>

            {/* Filtros responsivos */}
            {(isAdmin || isTechnician || isJefeOperaciones) && (
                <div className={`p-3 md:p-4 rounded-lg shadow ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white'}`}>
                    <div className="space-y-3">
                        {/* Título de filtros */}
                        <div className="flex items-center space-x-2">
                            <Filter className={`h-4 w-4 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-500'}`} />
                            <span className={`text-sm font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>Filtros:</span>
                        </div>
                        
                        {/* Contenedor de filtros flexibles */}
                        <div className="flex flex-col space-y-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:space-y-0">
                            
                            {/* Filtros para Jefe de Operaciones */}
                            {isJefeOperaciones && (
                                <>
                                    {/* Filtro por Coordinador */}
                                    <div className="flex-shrink-0">
                                        <select
                                            value={filters.coordinador}
                                            onChange={(e) => handleFilterChange('coordinador', e.target.value)}
                                            className={`w-full sm:w-auto text-xs sm:text-sm border rounded-md px-2 sm:px-3 py-1 focus:outline-none focus:ring-1 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                        >
                                            <option value="">Todos los coordinadores</option>
                                            {coordinators.map(coord => (
                                                <option key={coord.id} value={coord.full_name}>
                                                    {coord.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtro por Fecha */}
                                    <div className="flex-shrink-0">
                                        <select
                                            value={filters.fecha}
                                            onChange={(e) => handleFilterChange('fecha', e.target.value)}
                                            className={`w-full sm:w-auto text-xs sm:text-sm border rounded-md px-2 sm:px-3 py-1 focus:outline-none focus:ring-1 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                        >
                                            <option value="">Todas las fechas</option>
                                            {dateFilters.map(date => (
                                                <option key={date.value} value={date.value}>
                                                    {date.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            
                            {/* Filtro por Campaña */}
                            {!isJefeOperaciones && (
                                <div className="flex-shrink-0">
                                    <select
                                        value={filters.departamento}
                                        onChange={(e) => handleFilterChange('departamento', e.target.value)}
                                        className={`w-full sm:w-auto text-xs sm:text-sm border rounded-md px-2 sm:px-3 py-1 focus:outline-none focus:ring-1 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
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
                            
                            {/* Filtro por Sede */}
                            {isAdmin && (
                                <div className="flex-shrink-0">
                                    <select
                                        value={filters.sede}
                                        onChange={(e) => handleFilterChange('sede', e.target.value)}
                                        className={`w-full sm:w-auto text-xs sm:text-sm border rounded-md px-2 sm:px-3 py-1 focus:outline-none focus:ring-1 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
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
                            
                            {/* Filtro Top 3 */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    id="showTop3Only"
                                    checked={showTop3Only}
                                    onChange={(e) => setShowTop3Only(e.target.checked)}
                                    className={`h-4 w-4 border-gray-300 rounded ${isIronManTheme ? 'text-[#E10600] focus:ring-red-500' : 'text-red-600 focus:ring-red-500'}`}
                                />
                                <label htmlFor="showTop3Only" className={`flex items-center text-xs sm:text-sm font-medium cursor-pointer ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                    <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-500" />
                                    <span className="hidden sm:inline">Top 3 con más retraso</span>
                                    <span className="sm:hidden">Top 3</span>
                                </label>
                            </div>
                            
                            {/* Botón limpiar filtros */}
                            {(filters.departamento || filters.sede || filters.coordinador || filters.fecha || showTop3Only) && (
                                <button
                                    onClick={clearFilters}
                                    className={`text-xs sm:text-sm flex items-center space-x-1 px-2 py-1 rounded flex-shrink-0 ${isIronManTheme ? 'text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-[#0B0F14]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                >
                                    <X className="h-3 w-3" />
                                    <span>Limpiar</span>
                                </button>
                            )}
                        </div>
                        
                        {/* Contador y contexto */}
                        <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div className={`text-xs sm:text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                <strong>{incidents.length}</strong> de <strong>{allIncidents.length}</strong> incidencia(s)
                            </div>
                            <div className={`text-xs ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                {isTechnician && (
                                    <span>
                                        Visible: {user?.sede === 'bogota' ? 'Bogotá + Barranquilla' : 
                                                 user?.sede === 'villavicencio' ? 'Villavicencio + Barranquilla' : 
                                                 user?.sede?.toUpperCase()}
                                    </span>
                                )}
                                {isJefeOperaciones && (
                                    <span>
                                        {user?.sede?.toUpperCase()} - {user?.departamento?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {incidents.length === 0 ? (
                <div className={`text-center py-12 rounded-lg shadow ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white'}`}>
                    <Clock className={`h-12 w-12 mx-auto mb-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                        No hay incidencias pendientes
                    </h3>
                    <p className={isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}>
                        Todas las incidencias han sido asignadas o están en proceso.
                    </p>
                </div>
            ) : (
                <div className={`shadow overflow-hidden sm:rounded-lg ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white'}`}>
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-6">
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
                                        border rounded p-3 sm:p-4 transition-colors relative cursor-pointer
                                        ${isHighlighted ?
                                            'border-blue-500 bg-blue-50 border-2 ring-2 ring-blue-300 ring-opacity-50' :
                                            alertInfo ?
                                                `${alertInfo.borderColor} ${alertInfo.bgColor} border-l-4 hover:shadow-md` :
                                                (isIronManTheme ? 'border-cyan-500/20 hover:bg-[#0B0F14] hover:shadow-md' : 'border-gray-200 hover:bg-gray-50 hover:shadow-md')
                                        }
                                        ${isHighlighted ? 'animate-pulse' : ''}
                                    `}
                                    onClick={() => handleIncidentClick(incident)}
                                >
                                        {/* Información expandida en múltiples líneas */}
                                    <div className="space-y-2">
                                        {/* Primera línea: Estación y ubicación */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Monitor className="h-5 w-5 text-blue-600" />
                                                <span className={`font-bold text-lg ${isIronManTheme ? 'text-[#E5E7EB]' : ''}`}>{incident.station_code}</span>
                                                <span className={`text-sm px-2 py-1 rounded ${isIronManTheme ? 'bg-[#0B0F14] text-[#94A3B8]' : 'bg-gray-100'}`}>
                                                    {incident.sede?.toUpperCase()} - {incident.departamento?.toUpperCase()}
                                                </span>
                                                <span className={`px-2 py-1 text-sm rounded ${getFailureTypeColor(incident.failure_type)}`}>
                                                    {getFailureTypeLabel(incident.failure_type)}
                                                </span>
                                                {incident.is_recently_reassigned && (
                                                    <span className="px-2 py-1 text-sm bg-orange-100 text-orange-800 rounded">
                                                        Reasignado
                                                    </span>
                                                )}
                                                {incidentAttachments[incident.id] > 0 && (
                                                    <span className="px-2 py-1 text-sm text-blue-700 bg-blue-100 rounded">
                                                        📎 {incidentAttachments[incident.id]} archivo(s)
                                                    </span>
                                                )}
                                            </div>
                                            {/* Info temporal a la derecha */}
                                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                                                <span>
                                                    <Calendar className="h-4 w-4 inline mr-1" />
                                                    {new Date(incident.created_at).toLocaleDateString()}
                                                </span>
                                                <span className={alertInfo ? alertInfo.textColor : 'text-yellow-600'}>
                                                    <Clock className="h-4 w-4 inline mr-1" />
                                                    {timeElapsed}
                                                </span>
                                                <span className={alertInfo ? alertInfo.textColor : 'text-green-600'}>
                                                    {alertInfo ? 
                                                        (alertInfo.level === 'urgent' ? '🚨' :
                                                         alertInfo.level === 'critical' ? '⚠️' : 
                                                         '⚡') : 
                                                        '✅'
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* Segunda línea: Personas involucradas */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-green-600" />
                                                    <span className="text-gray-700">
                                                        <strong>Reportado por:</strong> {incident.reported_by_name}
                                                    </span>
                                                </div>
                                                {currentStatus === 'en_proceso' && incident.assigned_to_name && (
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                        <span className="text-gray-700">
                                                            <strong>Técnico:</strong> {incident.assigned_to_name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Descripción expandida */}
                                    <div className={`text-sm mt-2 p-2 rounded ${isIronManTheme ? 'bg-[#0B0F14] text-[#E5E7EB]' : 'bg-gray-50 text-gray-700'}`}>
                                        <strong>Descripción:</strong> {incident.description}
                                    </div>
                                    
                                    {/* Mensaje de alerta si aplica */}
                                    {alertMessage && (
                                        <div className={`text-xs p-1 rounded ${alertInfo.bgColor} ${alertInfo.textColor}`}>
                                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                                            {alertMessage}
                                        </div>
                                    )}
                                    
                                    {/* Botones de acción expandidos */}
                                    <div className={`flex items-center justify-between pt-3 mt-3 border-t ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                                        <span className="text-sm text-gray-500">👁️ Clic para ver detalles completos</span>
                                        
                                        <div className="flex space-x-2">
                                            {currentStatus === 'pendiente' && (isAdmin || isTechnician) && (
                                                <>
                                                    {isAdmin ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAssign(incident);
                                                            }}
                                                            className={`px-3 py-1.5 text-sm font-medium rounded ${isIronManTheme ? 'bg-[#00E5FF] text-[#0B0F14] hover:bg-[#00B4D8]' : 'text-white bg-blue-600 hover:bg-blue-700'}`}
                                                        >
                                                            <UserPlus className="h-3 w-3 mr-1 inline" />
                                                            Asignar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelfAssign(incident);
                                                            }}
                                                            className="px-3 py-1.5 text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                                        >
                                                            <UserPlus className="h-3 w-3 mr-1 inline" />
                                                            Tomar
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            
                                            {currentStatus === 'en_proceso' && incident.assigned_to_name && (
                                                <>
                                                    <span className="px-3 py-1.5 text-sm bg-gray-100 rounded">
                                                        {incident.assigned_to_name}
                                                    </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleReassign(incident);
                                                            }}
                                                            className="px-3 py-1.5 text-sm font-medium rounded text-white bg-orange-600 hover:bg-orange-700"
                                                        >
                                                            Reasignar
                                                        </button>
                                                    )}
                                                </>
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
                <div className={`fixed inset-0 overflow-y-auto h-full w-full z-50 ${isIronManTheme ? 'bg-black bg-opacity-70' : 'bg-gray-600 bg-opacity-50'}`}>
                    <div className={`relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md ${isIronManTheme ? 'bg-[#0F172A] border-cyan-500/30 shadow-cyan-500/20' : 'bg-white'}`}>
                        <div className="mt-3">
                            <div className="flex items-center mb-4">
                                <UserPlus className={`h-6 w-6 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`} />
                                <h3 className={`text-lg font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                                    {isAdmin ? 'Asignar Técnico' : 'Confirmar Auto-asignación'}
                                </h3>
                            </div>

                            <div className={`mb-4 p-3 rounded ${isIronManTheme ? 'bg-[#0B0F14] border border-cyan-500/10' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    <strong>Estación:</strong> {selectedIncident?.station_code}
                                </p>
                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    <strong>Sede:</strong> {selectedIncident?.sede?.toUpperCase()} - {selectedIncident?.departamento?.toUpperCase()}
                                </p>
                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    <strong>Tipo:</strong> {getFailureTypeLabel(selectedIncident?.failure_type)}
                                </p>
                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    <strong>Descripción:</strong> {selectedIncident?.description}
                                </p>
                            </div>

                            {isAdmin ? (
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Seleccionar Técnico *
                                    </label>
                                    <select
                                        value={selectedTechnician}
                                        onChange={(e) => setSelectedTechnician(e.target.value)}
                                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
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
                                <div className={`mb-4 p-3 rounded ${isIronManTheme ? 'bg-[#0B0F14] border border-cyan-500/10' : 'bg-blue-50'}`}>
                                    <p className={`text-sm ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-700'}`}>
                                        <strong>Te asignarás esta incidencia a:</strong> {user.fullName}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className={`px-4 py-2 border rounded-md text-sm font-medium ${isIronManTheme ? 'border-cyan-500/30 text-[#94A3B8] hover:bg-[#0B0F14]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    disabled={assignLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAssign}
                                    disabled={assignLoading}
                                    className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${isIronManTheme ? 'bg-[#00E5FF] text-[#0B0F14] hover:bg-[#00B4D8] focus:ring-cyan-500' : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}
                                >
                                    {assignLoading ? (isAdmin ? 'Asignando...' : 'Tomando...') : (isAdmin ? 'Asignar' : 'Tomar Incidencia')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para reasignar técnico */}
            {showReassignModal && (
                <div className={`fixed inset-0 overflow-y-auto h-full w-full z-50 ${isIronManTheme ? 'bg-black bg-opacity-70' : 'bg-gray-600 bg-opacity-50'}`}>
                    <div className={`relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md ${isIronManTheme ? 'bg-[#0F172A] border-cyan-500/30 shadow-cyan-500/20' : 'bg-white'}`}>
                        <div className="mt-3">
                            <div className="flex items-center mb-4">
                                <UserPlus className={`h-6 w-6 mr-2 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`} />
                                <h3 className={`text-lg font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                                    Reasignar Técnico
                                </h3>
                            </div>

                            <div className={`mb-4 p-3 rounded ${isIronManTheme ? 'bg-[#0B0F14] border border-cyan-500/10' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    <strong>Estación:</strong> {selectedIncident?.station_code}
                                </p>
                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    <strong>Técnico actual:</strong> {selectedIncident?.assigned_to_name}
                                </p>
                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    <strong>Tipo:</strong> {getFailureTypeLabel(selectedIncident?.failure_type)}
                                </p>
                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    <strong>Descripción:</strong> {selectedIncident?.description}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                    Nuevo Técnico *
                                </label>
                                <select
                                    value={selectedTechnician}
                                    onChange={(e) => setSelectedTechnician(e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'}`}
                                >
                                    <option value="">Seleccionar nuevo técnico...</option>
                                    {technicians
                                        .filter(tech => tech.id !== selectedIncident?.assigned_to_id)
                                        .map((tech) => (
                                            <option key={tech.id} value={tech.id}>
                                                {tech.full_name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                    Motivo de la reasignación (opcional)
                                </label>
                                <textarea
                                    value={reassignReason}
                                    onChange={(e) => setReassignReason(e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'}`}
                                    rows="3"
                                    placeholder="Ej: Cambio de turno, técnico no disponible, especialización requerida..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowReassignModal(false)}
                                    className={`px-4 py-2 border rounded-md text-sm font-medium ${isIronManTheme ? 'border-cyan-500/30 text-[#94A3B8] hover:bg-[#0B0F14]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    disabled={assignLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmReassign}
                                    disabled={assignLoading}
                                    className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${isIronManTheme ? 'bg-[#FF6A00] text-[#0B0F14] hover:bg-[#E10600] focus:ring-orange-500' : 'text-white bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'}`}
                                >
                                    {assignLoading ? 'Reasignando...' : 'Reasignar'}
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