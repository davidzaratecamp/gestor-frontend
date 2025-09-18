import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { incidentService, userService } from '../services/api';
import IncidentAlert from './IncidentAlert';
import IncidentDetailModal from './IncidentDetailModal';
import { 
    AlertTriangle, 
    Clock, 
    CheckCircle, 
    Settings, 
    TrendingUp,
    Users,
    Monitor,
    ChevronDown,
    ChevronUp,
    MapPin,
    UserPlus,
    BarChart3,
    UserCheck,
    UserX,
    Building,
    Activity
} from 'lucide-react';
import TechnicianRatings from './TechnicianRatings';
import TechniciansRankingPanel from './TechniciansRankingPanel';

const Dashboard = () => {
    const { user, isAdmin, isSupervisor, isTechnician, isAdministrativo, isJefeOperaciones } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pending: 0,
        inProcess: 0,
        inSupervision: 0,
        approved: 0,
        myIncidents: 0
    });
    const [pendingByCiudad, setPendingByCiudad] = useState({});
    const [inProcessByCiudad, setInProcessByCiudad] = useState({});
    const [inSupervisionByCiudad, setInSupervisionByCiudad] = useState({});
    const [approvedByCiudad, setApprovedByCiudad] = useState({});
    const [recentIncidents, setRecentIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPendingDropdown, setShowPendingDropdown] = useState(false);
    const [showInProcessDropdown, setShowInProcessDropdown] = useState(false);
    const [showInSupervisionDropdown, setShowInSupervisionDropdown] = useState(false);
    const [showApprovedDropdown, setShowApprovedDropdown] = useState(false);
    const [allPendingIncidents, setAllPendingIncidents] = useState([]);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [selectedIncidentFromAlert, setSelectedIncidentFromAlert] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedIncidentForAssign, setSelectedIncidentForAssign] = useState(null);
    const [statsBySede, setStatsBySede] = useState([]);
    const [techniciansStatus, setTechniciansStatus] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const anyDropdownOpen = showPendingDropdown || showInProcessDropdown || 
                                   showInSupervisionDropdown || showApprovedDropdown;
            
            if (anyDropdownOpen && !event.target.closest('.relative')) {
                setShowPendingDropdown(false);
                setShowInProcessDropdown(false);
                setShowInSupervisionDropdown(false);
                setShowApprovedDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPendingDropdown, showInProcessDropdown, showInSupervisionDropdown, showApprovedDropdown]);

    const groupIncidentsByCiudad = (incidents) => {
        return incidents.reduce((acc, incident) => {
            const ciudad = incident.sede || 'sin_sede';
            const ciudadLabel = ciudad === 'bogota' ? 'Bogotá' : 
                               ciudad === 'barranquilla' ? 'Barranquilla' : 
                               ciudad === 'villavicencio' ? 'Villavicencio' : 'Sin Sede';
            
            if (!acc[ciudad]) {
                acc[ciudad] = { 
                    count: 0, 
                    label: ciudadLabel,
                    departamentos: {}
                };
            }
            acc[ciudad].count++;
            
            // Agrupar también por departamento
            const departamento = incident.departamento || 'sin_departamento';
            const deptLabel = departamento === 'obama' ? 'Obama' :
                             departamento === 'majority' ? 'Majority' :
                             departamento === 'claro' ? 'Claro' : 'Sin Departamento';
            
            if (!acc[ciudad].departamentos[departamento]) {
                acc[ciudad].departamentos[departamento] = {
                    count: 0,
                    label: deptLabel
                };
            }
            acc[ciudad].departamentos[departamento].count++;
            
            return acc;
        }, {});
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Cargar estadísticas y técnicos si es admin
            const requests = [
                incidentService.getAll({ status: 'pendiente' }),
                incidentService.getAll({ status: 'aprobado' })
            ];
            
            if (isAdmin) {
                requests.push(userService.getTechnicians());
            }
            
            const results = await Promise.all(requests);
            const [pendingRes, approvedRes, techniciansRes] = results;
            
            if (techniciansRes) {
                setTechnicians(techniciansRes.data);
            }

            let inProcessCount = 0;
            let inSupervisionCount = 0;
            let myIncidentsCount = 0;
            let inProcessRes, inSupervisionRes;

            if (isTechnician) {
                const myIncidentsRes = await incidentService.getMyIncidents();
                myIncidentsCount = myIncidentsRes.data.length;
                inProcessCount = myIncidentsRes.data.filter(inc => inc.status === 'en_proceso').length;
            } else {
                [inProcessRes, inSupervisionRes] = await Promise.all([
                    incidentService.getAll({ status: 'en_proceso' }),
                    incidentService.getAll({ status: 'en_supervision' })
                ]);
                inProcessCount = inProcessRes.data.length;
                inSupervisionCount = inSupervisionRes.data.length;
            }

            // Guardar todas las incidencias pendientes para las alertas
            setAllPendingIncidents(pendingRes.data);

            // Agrupar incidencias por ciudad (solo para admin)
            if (isAdmin) {
                setPendingByCiudad(groupIncidentsByCiudad(pendingRes.data));
                setApprovedByCiudad(groupIncidentsByCiudad(approvedRes.data));
                
                if (inProcessRes) {
                    setInProcessByCiudad(groupIncidentsByCiudad(inProcessRes.data));
                }
                if (inSupervisionRes) {
                    setInSupervisionByCiudad(groupIncidentsByCiudad(inSupervisionRes.data));
                }
            }

            setStats({
                pending: pendingRes.data.length,
                inProcess: inProcessCount,
                inSupervision: inSupervisionCount,
                approved: approvedRes.data.length,
                myIncidents: myIncidentsCount
            });

            // Cargar incidencias recientes (últimas 5)
            const recentRes = await incidentService.getAll();
            setRecentIncidents(recentRes.data.slice(0, 5));

            // Cargar estadísticas adicionales solo para admin
            if (isAdmin) {
                const [statsRes, techStatusRes] = await Promise.all([
                    incidentService.getStatsBySede(),
                    incidentService.getTechniciansStatus()
                ]);
                setStatsBySede(statsRes.data);
                setTechniciansStatus(techStatusRes.data);
            }

        } catch (error) {
            console.error('Error cargando dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (type) => {
        if (isAdmin) {
            // Cerrar otros dropdowns primero
            setShowPendingDropdown(type === 'pending' ? !showPendingDropdown : false);
            setShowInProcessDropdown(type === 'inProcess' ? !showInProcessDropdown : false);
            setShowInSupervisionDropdown(type === 'inSupervision' ? !showInSupervisionDropdown : false);
            setShowApprovedDropdown(type === 'approved' ? !showApprovedDropdown : false);
        } else {
            // Para no-admin, navegar directamente
            const routes = {
                'pending': '/incidents/pending',
                'inProcess': '/incidents/pending', // Los técnicos ven sus asignadas en "Mis Incidencias"
                'inSupervision': '/incidents/supervision',
                'approved': '/incidents/approved'
            };
            navigate(routes[type]);
        }
    };

    const handleCiudadClick = (ciudadKey, type) => {
        const searchParams = new URLSearchParams();
        searchParams.set('sede', ciudadKey);
        
        // Agregar parámetro de status para incidencias en proceso
        if (type === 'inProcess') {
            searchParams.set('status', 'en_proceso');
        }
        
        const routes = {
            'pending': '/incidents/pending',
            'inProcess': '/incidents/pending',
            'inSupervision': '/incidents/supervision',
            'approved': '/incidents/approved'
        };
        
        navigate(`${routes[type]}?${searchParams.toString()}`);
        
        // Cerrar todos los dropdowns
        setShowPendingDropdown(false);
        setShowInProcessDropdown(false);
        setShowInSupervisionDropdown(false);
        setShowApprovedDropdown(false);
    };

    const handleDepartamentoClick = (ciudadKey, departamentoKey, type) => {
        const searchParams = new URLSearchParams();
        searchParams.set('sede', ciudadKey);
        searchParams.set('departamento', departamentoKey);
        
        // Agregar parámetro de status para incidencias en proceso
        if (type === 'inProcess') {
            searchParams.set('status', 'en_proceso');
        }
        
        const routes = {
            'pending': '/incidents/pending',
            'inProcess': '/incidents/pending',
            'inSupervision': '/incidents/supervision',
            'approved': '/incidents/approved'
        };
        
        navigate(`${routes[type]}?${searchParams.toString()}`);
        
        // Cerrar todos los dropdowns
        setShowPendingDropdown(false);
        setShowInProcessDropdown(false);
        setShowInSupervisionDropdown(false);
        setShowApprovedDropdown(false);
    };

    const renderDropdown = (type, data, isVisible, title, routePath) => {
        if (!isAdmin || !isVisible) return null;

        return (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
                        {title}
                    </div>
                    
                    {Object.entries(data).length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                            No hay incidencias {type === 'pending' ? 'pendientes' : 
                                                 type === 'inProcess' ? 'en proceso' :
                                                 type === 'inSupervision' ? 'en supervisión' : 'aprobadas'}
                        </div>
                    ) : (
                        Object.entries(data).map(([ciudadKey, ciudadData]) => (
                            <div key={ciudadKey} className="border-b border-gray-100 last:border-b-0">
                                <div 
                                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer rounded transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCiudadClick(ciudadKey, type);
                                    }}
                                >
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {ciudadData.label}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                                        type === 'pending' ? 'text-yellow-600 bg-yellow-50' :
                                        type === 'inProcess' ? 'text-blue-600 bg-blue-50' :
                                        type === 'inSupervision' ? 'text-purple-600 bg-purple-50' :
                                        'text-green-600 bg-green-50'
                                    }`}>
                                        {ciudadData.count}
                                    </span>
                                </div>
                                
                                {/* Departamentos - Mostrar siempre si hay departamentos */}
                                {Object.entries(ciudadData.departamentos).length > 0 && (
                                    <div className="ml-6 border-l border-gray-200">
                                        {Object.entries(ciudadData.departamentos).map(([deptKey, deptData]) => (
                                            <div 
                                                key={deptKey}
                                                className="flex items-center justify-between px-3 py-1 hover:bg-gray-50 cursor-pointer rounded transition-colors text-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDepartamentoClick(ciudadKey, deptKey, type);
                                                }}
                                            >
                                                <span className="text-gray-600 pl-4">
                                                    📂 {deptData.label}
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                    {deptData.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    
                    {/* Opción para ver todas */}
                    {Object.entries(data).length > 0 && (
                        <div 
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer rounded transition-colors border-t border-gray-200 mt-2"
                            onClick={() => {
                                // Para incidencias en proceso, agregar parámetro de status
                                const finalPath = type === 'inProcess' ? `${routePath}?status=en_proceso` : routePath;
                                navigate(finalPath);
                                setShowPendingDropdown(false);
                                setShowInProcessDropdown(false);
                                setShowInSupervisionDropdown(false);
                                setShowApprovedDropdown(false);
                            }}
                        >
                            <div className="flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                    Ver todas las incidencias {
                                        type === 'pending' ? 'pendientes' :
                                        type === 'inProcess' ? 'en proceso' :
                                        type === 'inSupervision' ? 'en supervisión' : 'aprobadas'
                                    }
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pendiente': 'bg-yellow-100 text-yellow-800',
            'en_proceso': 'bg-blue-100 text-blue-800',
            'en_supervision': 'bg-purple-100 text-purple-800',
            'aprobado': 'bg-green-100 text-green-800',
            'rechazado': 'bg-red-100 text-red-800'
        };
        
        const labels = {
            'pendiente': 'Pendiente',
            'en_proceso': 'En Proceso',
            'en_supervision': 'En Supervisión',
            'aprobado': 'Aprobado',
            'rechazado': 'Rechazado'
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || badges.pendiente}`}>
                {labels[status] || status}
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

    const handleSedeStatsClick = (sede, status) => {
        const searchParams = new URLSearchParams();
        searchParams.set('sede', sede);
        
        // Agregar parámetro de status para incidencias en proceso
        if (status === 'en_proceso') {
            searchParams.set('status', 'en_proceso');
        }
        
        const routes = {
            'pendientes': '/incidents/pending',
            'en_proceso': '/incidents/pending',
            'en_supervision': '/incidents/supervision',
            'aprobadas': '/incidents/approved'
        };
        
        navigate(`${routes[status]}?${searchParams.toString()}`);
    };

    const handleViewIncidentFromAlert = (incident) => {
        setSelectedIncidentFromAlert(incident);
        setShowIncidentModal(true);
        setAlertDismissed(true); // Cerrar la alerta al abrir el modal
    };

    const handleCloseIncidentModal = () => {
        setShowIncidentModal(false);
        setSelectedIncidentFromAlert(null);
        setSelectedTechnician('');
        // Recargar datos para actualizar alertas
        loadDashboardData();
    };

    const handleAssignFromDashboard = async (incident) => {
        // Cerrar el modal de detalles y abrir el modal de asignación
        setShowIncidentModal(false);
        setSelectedIncidentForAssign(incident);
        setSelectedTechnician('');
        setShowAssignModal(true);
    };

    const confirmAssignFromDashboard = async () => {
        if (!selectedTechnician) {
            alert('Por favor selecciona un técnico');
            return;
        }

        setAssignLoading(true);
        try {
            await incidentService.assignTechnician(selectedIncidentForAssign.id, parseInt(selectedTechnician));
            setShowAssignModal(false);
            setSelectedIncidentForAssign(null);
            setSelectedTechnician('');
            // Recargar datos del dashboard
            await loadDashboardData();
        } catch (error) {
            console.error('Error asignando técnico:', error);
            alert(error.response?.data?.msg || 'Error al asignar técnico');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleSelfAssignFromDashboard = async (incident) => {
        setAssignLoading(true);
        try {
            await incidentService.assignTechnician(incident.id, user.id);
            setShowIncidentModal(false);
            // Recargar datos del dashboard
            await loadDashboardData();
        } catch (error) {
            console.error('Error auto-asignándose:', error);
            alert(error.response?.data?.msg || 'Error al asignarse la incidencia');
        } finally {
            setAssignLoading(false);
        }
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
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Bienvenido, {user?.fullName}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Resumen del sistema de soporte técnico
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Pendientes - Interactivo para Admin */}
                <div className="relative">
                    <div 
                        className={`bg-white overflow-hidden shadow rounded-lg ${isAdmin ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={() => handleCardClick('pending')}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className="h-6 w-6 text-yellow-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                                            Pendientes
                                            {isAdmin && (
                                                <span className="ml-2">
                                                    {showPendingDropdown ? 
                                                        <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    }
                                                </span>
                                            )}
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.pending}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderDropdown('pending', pendingByCiudad, showPendingDropdown, 'Seleccionar Ciudad', '/incidents/pending')}
                </div>

                {/* En Proceso - Interactivo para Admin (No visible para jefe de operaciones) */}
                {!isJefeOperaciones && (
                    <div className="relative">
                        <div 
                            className={`bg-white overflow-hidden shadow rounded-lg ${isAdmin ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                            onClick={() => handleCardClick('inProcess')}
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Settings className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                                                En Proceso
                                                {isAdmin && (
                                                    <span className="ml-2">
                                                        {showInProcessDropdown ? 
                                                            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                                        }
                                                    </span>
                                                )}
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.inProcess}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {renderDropdown('inProcess', inProcessByCiudad, showInProcessDropdown, 'Seleccionar Ciudad', '/incidents/pending')}
                    </div>
                )}

                {/* En Supervisión o Mis Incidencias */}
                {isTechnician ? (
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Mis Incidencias
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.myIncidents}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <div 
                            className={`bg-white overflow-hidden shadow rounded-lg ${isAdmin ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                            onClick={() => handleCardClick('inSupervision')}
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <AlertTriangle className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                                                En Supervisión
                                                {isAdmin && (
                                                    <span className="ml-2">
                                                        {showInSupervisionDropdown ? 
                                                            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                                        }
                                                    </span>
                                                )}
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.inSupervision}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {renderDropdown('inSupervision', inSupervisionByCiudad, showInSupervisionDropdown, 'Seleccionar Ciudad', '/incidents/supervision')}
                    </div>
                )}

                {/* Aprobadas - Interactivo para Admin */}
                <div className="relative">
                    <div 
                        className={`bg-white overflow-hidden shadow rounded-lg ${isAdmin ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={() => handleCardClick('approved')}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                                            Aprobadas
                                            {isAdmin && (
                                                <span className="ml-2">
                                                    {showApprovedDropdown ? 
                                                        <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    }
                                                </span>
                                            )}
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.approved}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderDropdown('approved', approvedByCiudad, showApprovedDropdown, 'Seleccionar Ciudad', '/incidents/approved')}
                </div>
            </div>

            {/* Incidencias Recientes - Oculto solo para admin */}
            {!isAdmin && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Incidencias Recientes
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Últimas incidencias reportadas en el sistema
                    </p>
                </div>
                <ul className="divide-y divide-gray-200">
                    {recentIncidents.length === 0 ? (
                        <li className="px-6 py-4">
                            <p className="text-sm text-gray-500 text-center py-2">
                                No hay incidencias recientes
                            </p>
                        </li>
                    ) : (
                        recentIncidents.map((incident) => (
                            <li key={incident.id} className="px-4 sm:px-6 py-3 sm:py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                                    <div className="flex items-center flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                        </div>
                                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {incident.station_code} - {incident.failure_type}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                {incident.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 flex-shrink-0">
                                        {getStatusBadge(incident.status)}
                                        <span className="text-xs sm:text-sm text-gray-500">
                                            {new Date(incident.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
            )}

            {/* Sección de estadísticas detalladas - Solo para admin */}
            {isAdmin && (
                <div className="space-y-6">
                    {/* Estadísticas por Sede */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6 bg-gray-50">
                            <div className="flex items-center">
                                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Incidencias por Sede
                                </h3>
                            </div>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Estado de incidencias en cada ubicación
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                            {statsBySede.map((sedeStats) => (
                                <div key={sedeStats.sede} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center">
                                            <Building className="h-5 w-5 text-gray-400 mr-2" />
                                            <h4 className="text-base font-medium text-gray-900 capitalize">
                                                {sedeStats.sede === 'bogota' ? 'Bogotá' :
                                                 sedeStats.sede === 'barranquilla' ? 'Barranquilla' :
                                                 sedeStats.sede === 'villavicencio' ? 'Villavicencio' : sedeStats.sede}
                                            </h4>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            Total: {sedeStats.total}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleSedeStatsClick(sedeStats.sede, 'pendientes')}
                                            className="text-left p-2 rounded hover:bg-yellow-50 transition-colors"
                                        >
                                            <div className="text-xs text-gray-500">Pendientes</div>
                                            <div className="text-lg font-semibold text-yellow-600">
                                                {sedeStats.pendientes}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleSedeStatsClick(sedeStats.sede, 'en_proceso')}
                                            className="text-left p-2 rounded hover:bg-blue-50 transition-colors"
                                        >
                                            <div className="text-xs text-gray-500">En Proceso</div>
                                            <div className="text-lg font-semibold text-blue-600">
                                                {sedeStats.en_proceso}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleSedeStatsClick(sedeStats.sede, 'en_supervision')}
                                            className="text-left p-2 rounded hover:bg-purple-50 transition-colors"
                                        >
                                            <div className="text-xs text-gray-500">En Supervisión</div>
                                            <div className="text-lg font-semibold text-purple-600">
                                                {sedeStats.en_supervision}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleSedeStatsClick(sedeStats.sede, 'aprobadas')}
                                            className="text-left p-2 rounded hover:bg-green-50 transition-colors"
                                        >
                                            <div className="text-xs text-gray-500">Aprobadas</div>
                                            <div className="text-lg font-semibold text-green-600">
                                                {sedeStats.aprobadas}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Panel de Ranking de Técnicos */}
                    <TechniciansRankingPanel />
                </div>
            )}

            {/* Sección de calificaciones - Solo para admins */}
            {isAdmin && (
                <TechnicianRatings isOwnRatings={true} />
            )}

            {/* Alerta de incidencias críticas - Solo para admin y supervisores (NO coordinadores) */}
            {(isAdmin || user?.role === 'supervisor') && (
                <IncidentAlert
                    incidents={allPendingIncidents}
                    onDismiss={() => setAlertDismissed(true)}
                    onViewIncident={handleViewIncidentFromAlert}
                    soundEnabled={!alertDismissed}
                />
            )}

            {/* Modal de detalles de incidencia desde alerta */}
            <IncidentDetailModal
                incident={selectedIncidentFromAlert}
                isOpen={showIncidentModal}
                onClose={handleCloseIncidentModal}
                onAssign={handleAssignFromDashboard}
                onSelfAssign={handleSelfAssignFromDashboard}
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
                                    Asignar Técnico
                                </h3>
                            </div>
                            
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600">
                                    <strong>Estación:</strong> {selectedIncidentForAssign?.station_code}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Sede:</strong> {selectedIncidentForAssign?.sede?.toUpperCase()} - {selectedIncidentForAssign?.departamento?.toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Tipo:</strong> {getFailureTypeLabel(selectedIncidentForAssign?.failure_type)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Descripción:</strong> {selectedIncidentForAssign?.description}
                                </p>
                            </div>

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

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={assignLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAssignFromDashboard}
                                    disabled={assignLoading}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {assignLoading ? 'Asignando...' : 'Asignar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;