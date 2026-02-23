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
    Activity,
    Search
} from 'lucide-react';
import TechnicianRatings from './TechnicianRatings';
import TechniciansRankingPanel from './TechniciansRankingPanel';

const Dashboard = () => {
    const { user, isAdmin, isSupervisor, isTechnician, isAdministrativo, isJefeOperaciones } = useAuth();
    const isIronManTheme = user?.username === 'davidlopez10';
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pending: 0,
        inProcess: 0,
        inSupervision: 0,
        approved: 0,
        returned: 0,
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
    const [searchId, setSearchId] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');

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
                             departamento === 'claro' ? 'Claro' :
                             departamento === 'contratacion' ? 'Contratación' :
                             departamento === 'seleccion' ? 'Selección' :
                             departamento === 'reclutamiento' ? 'Reclutamiento' :
                             departamento === 'area_financiera' ? 'Área Financiera' : 'Sin Departamento';
            
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
            console.log('Cargando datos del dashboard...');
            setLoading(true);
            
            // Cargar estadísticas y técnicos si es admin
            const requests = [
                incidentService.getAll({ status: 'pendiente' }),
                incidentService.getAll({ status: 'aprobado' })
            ];

            // Agregar carga de incidencias devueltas si el usuario puede verlas
            if (user?.role === 'admin' || user?.role === 'coordinador' || user?.role === 'supervisor' || 
                user?.role === 'jefe_operaciones' || user?.role === 'administrativo') {
                requests.push(incidentService.getReturnedIncidents());
            }
            
            if (isAdmin) {
                requests.push(userService.getTechnicians());
            }
            
            const results = await Promise.all(requests);
            let pendingRes, approvedRes, returnedRes, techniciansRes;
            
            if (user?.role === 'admin' || user?.role === 'coordinador' || user?.role === 'supervisor' || 
                user?.role === 'jefe_operaciones' || user?.role === 'administrativo') {
                if (isAdmin) {
                    [pendingRes, approvedRes, returnedRes, techniciansRes] = results;
                } else {
                    [pendingRes, approvedRes, returnedRes] = results;
                }
            } else {
                if (isAdmin) {
                    [pendingRes, approvedRes, techniciansRes] = results;
                } else {
                    [pendingRes, approvedRes] = results;
                }
            }
            
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
                
                // Para técnicos, también cargar estadísticas por ciudad con su lógica de visibilidad
                [inProcessRes, inSupervisionRes] = await Promise.all([
                    incidentService.getAll({ status: 'en_proceso' }),
                    incidentService.getAll({ status: 'en_supervision' })
                ]);
                // Los contadores para técnicos siguen siendo de "mis incidencias"
                inSupervisionCount = myIncidentsRes.data.filter(inc => inc.status === 'en_supervision').length;
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

            // Agrupar incidencias por ciudad (para admin y técnicos)
            if (isAdmin || isTechnician) {
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
                returned: returnedRes ? returnedRes.data.length : 0,
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
            console.error('Error details:', error.response?.data);
            // No mostrar error, pero asegurar que loading se complete
        } finally {
            console.log('Dashboard carga completada');
            setLoading(false);
        }
    };

    const handleCardClick = (type) => {
        if (isAdmin || isTechnician) {
            // Cerrar otros dropdowns primero
            setShowPendingDropdown(type === 'pending' ? !showPendingDropdown : false);
            setShowInProcessDropdown(type === 'inProcess' ? !showInProcessDropdown : false);
            setShowInSupervisionDropdown(type === 'inSupervision' ? !showInSupervisionDropdown : false);
            setShowApprovedDropdown(type === 'approved' ? !showApprovedDropdown : false);
        } else {
            // Para no-admin, no-technician, navegar directamente
            const routes = {
                'pending': '/incidents/pending',
                'inProcess': '/incidents/pending',
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

    const handleSearchById = async (e) => {
        e.preventDefault();
        const id = searchId.trim();
        if (!id || isNaN(id)) {
            setSearchError('Ingresa un ID válido');
            return;
        }
        setSearchError('');
        setSearchLoading(true);
        try {
            const response = await incidentService.getById(id);
            const incident = response.data;
            const statusRoutes = {
                'pendiente': `/incidents/pending?highlight=${id}`,
                'en_proceso': `/incidents/pending?highlight=${id}`,
                'en_supervision': `/incidents/supervision?highlight=${id}`,
                'aprobado': `/incidents/approved?highlight=${id}`,
                'devuelto': `/incidents/returned?highlight=${id}`,
                'rechazado': `/incidents/approved?highlight=${id}`
            };
            const route = statusRoutes[incident.status];
            if (route) {
                setSearchId('');
                navigate(route);
            } else {
                setSearchError('Estado desconocido');
            }
        } catch (error) {
            setSearchError('No se encontró la incidencia');
        } finally {
            setSearchLoading(false);
        }
    };

    const renderDropdown = (type, data, isVisible, title, routePath) => {
        if ((!isAdmin && !isTechnician) || !isVisible) return null;

        return (
            <div className={`absolute top-full left-0 right-0 mt-2 border rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto ${
                isIronManTheme ? 'bg-[#0F172A] border-cyan-500/30 shadow-cyan-500/20' : 'bg-white border-gray-200'
            }`}>
                <div className="p-2">
                    <div className={`text-xs font-medium uppercase tracking-wide px-3 py-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-500'}`}>
                        {title}
                    </div>

                    {Object.entries(data).length === 0 ? (
                        <div className={`px-3 py-2 text-sm ${textSecondaryClass}`}>
                            No hay incidencias {type === 'pending' ? 'pendientes' :
                                                 type === 'inProcess' ? 'en proceso' :
                                                 type === 'inSupervision' ? 'en supervisión' : 'aprobadas'}
                        </div>
                    ) : (
                        Object.entries(data).map(([ciudadKey, ciudadData]) => (
                            <div key={ciudadKey} className={`border-b last:border-b-0 ${isIronManTheme ? 'border-cyan-500/10' : 'border-gray-100'}`}>
                                <div
                                    className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded transition-colors ${
                                        isIronManTheme ? 'hover:bg-[#0B0F14]' : 'hover:bg-gray-50'
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCiudadClick(ciudadKey, type);
                                    }}
                                >
                                    <div className="flex items-center">
                                        <MapPin className={`h-4 w-4 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-500'}`} />
                                        <span className={`text-sm font-medium ${textPrimaryClass}`}>
                                            {ciudadData.label}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                                        isIronManTheme ? (
                                            type === 'pending' ? 'text-[#FF6A00] bg-orange-500/20' :
                                            type === 'inProcess' ? 'text-[#00E5FF] bg-cyan-500/20' :
                                            type === 'inSupervision' ? 'text-[#E10600] bg-red-500/20' :
                                            'text-[#00B4D8] bg-cyan-500/20'
                                        ) : (
                                            type === 'pending' ? 'text-yellow-600 bg-yellow-50' :
                                            type === 'inProcess' ? 'text-blue-600 bg-blue-50' :
                                            type === 'inSupervision' ? 'text-purple-600 bg-purple-50' :
                                            'text-green-600 bg-green-50'
                                        )
                                    }`}>
                                        {ciudadData.count}
                                    </span>
                                </div>

                                {/* Departamentos - Mostrar siempre si hay departamentos */}
                                {Object.entries(ciudadData.departamentos).length > 0 && (
                                    <div className={`ml-6 border-l ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                                        {Object.entries(ciudadData.departamentos).map(([deptKey, deptData]) => (
                                            <div
                                                key={deptKey}
                                                className={`flex items-center justify-between px-3 py-1 cursor-pointer rounded transition-colors text-sm ${
                                                    isIronManTheme ? 'hover:bg-[#0B0F14]' : 'hover:bg-gray-50'
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDepartamentoClick(ciudadKey, deptKey, type);
                                                }}
                                            >
                                                <span className={`pl-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                                    📂 {deptData.label}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    isIronManTheme ? 'text-[#94A3B8] bg-[#0B0F14]' : 'text-gray-500 bg-gray-100'
                                                }`}>
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
                            className={`px-3 py-2 cursor-pointer rounded transition-colors border-t mt-2 ${
                                isIronManTheme ? 'hover:bg-[#0B0F14] border-cyan-500/20' : 'hover:bg-blue-50 border-gray-200'
                            }`}
                            onClick={() => {
                                const finalPath = type === 'inProcess' ? `${routePath}?status=en_proceso` : routePath;
                                navigate(finalPath);
                                setShowPendingDropdown(false);
                                setShowInProcessDropdown(false);
                                setShowInSupervisionDropdown(false);
                                setShowApprovedDropdown(false);
                            }}
                        >
                            <div className="flex items-center justify-center">
                                <span className={`text-sm font-medium ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`}>
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

    // Clases condicionales para Iron Man theme
    const cardClass = isIronManTheme
        ? 'bg-[#0F172A] overflow-hidden shadow-lg shadow-cyan-500/10 rounded-lg border border-cyan-500/20'
        : 'bg-white overflow-hidden shadow rounded-lg';
    const textPrimaryClass = isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900';
    const textSecondaryClass = isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500';
    const textMutedClass = isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600';

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-64 ${isIronManTheme ? 'bg-[#0B0F14] rounded-xl' : ''}`}>
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isIronManTheme ? 'border-[#00E5FF]' : 'border-blue-600'}`}></div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isIronManTheme ? 'bg-[#0B0F14] p-6 rounded-xl' : ''}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className={`text-xl sm:text-2xl font-bold ${textPrimaryClass} ${isIronManTheme ? 'ironman-glow' : ''}`}>
                        {isIronManTheme ? `Bienvenido, Sr. Stark` : `Bienvenido, ${user?.fullName}`}
                    </h1>
                    <p className={`text-sm sm:text-base ${textMutedClass} mt-1`}>
                        {isIronManTheme ? 'J.A.R.V.I.S. - Sistema de soporte técnico activo' : 'Resumen del sistema de soporte técnico'}
                    </p>
                </div>
                {isAdmin && (
                    <form onSubmit={handleSearchById} className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center rounded-lg border px-3 py-1.5 ${isIronManTheme ? 'bg-[#0F172A] border-cyan-500/30' : 'bg-white border-gray-300'}`}>
                                <Search className={`h-4 w-4 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-400'}`} />
                                <input
                                    type="number"
                                    min="1"
                                    value={searchId}
                                    onChange={(e) => { setSearchId(e.target.value); setSearchError(''); }}
                                    placeholder="Ir a incidencia #"
                                    className={`w-36 text-sm bg-transparent outline-none ${isIronManTheme ? 'text-[#E5E7EB] placeholder-[#94A3B8]' : 'text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={searchLoading}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${isIronManTheme ? 'bg-cyan-500/20 text-[#00E5FF] border border-cyan-500/30 hover:bg-cyan-500/30' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50`}
                            >
                                {searchLoading ? '...' : 'Ir'}
                            </button>
                        </div>
                        {searchError && (
                            <span className="text-xs text-red-500">{searchError}</span>
                        )}
                    </form>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Pendientes - Interactivo para Admin y Técnicos */}
                <div className="relative">
                    <div
                        className={`${cardClass} ${(isAdmin || isTechnician) ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={() => handleCardClick('pending')}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className={`h-6 w-6 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-yellow-400'}`} />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className={`text-sm font-medium ${textSecondaryClass} truncate flex items-center`}>
                                            Pendientes
                                            {(isAdmin || isTechnician) && (
                                                <span className="ml-2">
                                                    {showPendingDropdown ?
                                                        <ChevronUp className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} /> :
                                                        <ChevronDown className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                                                    }
                                                </span>
                                            )}
                                        </dt>
                                        <dd className={`text-lg font-medium ${textPrimaryClass}`}>
                                            {stats.pending}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderDropdown('pending', pendingByCiudad, showPendingDropdown, 'Seleccionar Ciudad', '/incidents/pending')}
                </div>

                {/* En Proceso - Interactivo para Admin y Técnicos (No visible para jefe de operaciones) */}
                {!isJefeOperaciones && (
                    <div className="relative">
                        <div
                            className={`${cardClass} ${(isAdmin || isTechnician) ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                            onClick={() => handleCardClick('inProcess')}
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Settings className={`h-6 w-6 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-400'}`} />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className={`text-sm font-medium ${textSecondaryClass} truncate flex items-center`}>
                                                En Proceso
                                                {(isAdmin || isTechnician) && (
                                                    <span className="ml-2">
                                                        {showInProcessDropdown ?
                                                            <ChevronUp className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} /> :
                                                            <ChevronDown className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                                                        }
                                                    </span>
                                                )}
                                            </dt>
                                            <dd className={`text-lg font-medium ${textPrimaryClass}`}>
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
                    <div className="relative">
                        <div
                            className={`${cardClass} cursor-pointer hover:shadow-md transition-shadow`}
                            onClick={() => handleCardClick('inSupervision')}
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <AlertTriangle className={`h-6 w-6 ${isIronManTheme ? 'text-[#E10600]' : 'text-purple-400'}`} />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className={`text-sm font-medium ${textSecondaryClass} truncate flex items-center`}>
                                                En Supervisión
                                                <span className="ml-2">
                                                    {showInSupervisionDropdown ?
                                                        <ChevronUp className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} /> :
                                                        <ChevronDown className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                                                    }
                                                </span>
                                            </dt>
                                            <dd className={`text-lg font-medium ${textPrimaryClass}`}>
                                                {stats.inSupervision}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {renderDropdown('inSupervision', inSupervisionByCiudad, showInSupervisionDropdown, 'Seleccionar Ciudad', '/incidents/supervision')}
                    </div>
                ) : (
                    <div className="relative">
                        <div
                            className={`${cardClass} ${isAdmin ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                            onClick={() => handleCardClick('inSupervision')}
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <AlertTriangle className={`h-6 w-6 ${isIronManTheme ? 'text-[#E10600]' : 'text-purple-400'}`} />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className={`text-sm font-medium ${textSecondaryClass} truncate flex items-center`}>
                                                En Supervisión
                                                {isAdmin && (
                                                    <span className="ml-2">
                                                        {showInSupervisionDropdown ?
                                                            <ChevronUp className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} /> :
                                                            <ChevronDown className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                                                        }
                                                    </span>
                                                )}
                                            </dt>
                                            <dd className={`text-lg font-medium ${textPrimaryClass}`}>
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

                {/* Aprobadas - Interactivo para Admin y Técnicos */}
                <div className="relative">
                    <div
                        className={`${cardClass} ${(isAdmin || isTechnician) ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={() => handleCardClick('approved')}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className={`h-6 w-6 ${isIronManTheme ? 'text-[#00B4D8]' : 'text-green-400'}`} />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className={`text-sm font-medium ${textSecondaryClass} truncate flex items-center`}>
                                            Aprobadas
                                            {(isAdmin || isTechnician) && (
                                                <span className="ml-2">
                                                    {showApprovedDropdown ?
                                                        <ChevronUp className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} /> :
                                                        <ChevronDown className={`h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                                                    }
                                                </span>
                                            )}
                                        </dt>
                                        <dd className={`text-lg font-medium ${textPrimaryClass}`}>
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
                <div className={`shadow overflow-hidden sm:rounded-md ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white'}`}>
                <div className={`px-4 py-5 sm:px-6`}>
                    <h3 className={`text-lg leading-6 font-medium ${textPrimaryClass}`}>
                        Incidencias Recientes
                    </h3>
                    <p className={`mt-1 max-w-2xl text-sm ${textSecondaryClass}`}>
                        Últimas incidencias reportadas en el sistema
                    </p>
                </div>
                <ul className={`divide-y ${isIronManTheme ? 'divide-cyan-500/10' : 'divide-gray-200'}`}>
                    {recentIncidents.length === 0 ? (
                        <li className="px-6 py-4">
                            <p className={`text-sm ${textSecondaryClass} text-center py-2`}>
                                No hay incidencias recientes
                            </p>
                        </li>
                    ) : (
                        recentIncidents.map((incident) => (
                            <li key={incident.id} className="px-4 sm:px-6 py-3 sm:py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                                    <div className="flex items-center flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            <Monitor className={`h-4 w-4 sm:h-5 sm:w-5 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-400'}`} />
                                        </div>
                                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                            <p className={`text-sm font-medium ${textPrimaryClass} truncate`}>
                                                {incident.station_code} - {incident.failure_type}
                                            </p>
                                            <p className={`text-xs sm:text-sm ${textSecondaryClass} truncate`}>
                                                {incident.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 flex-shrink-0">
                                        {getStatusBadge(incident.status)}
                                        <span className={`text-xs sm:text-sm ${textSecondaryClass}`}>
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
                    <div className={`shadow overflow-hidden sm:rounded-md ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white'}`}>
                        <div className={`px-4 py-5 sm:px-6 ${isIronManTheme ? 'bg-[#0B0F14]' : 'bg-gray-50'}`}>
                            <div className="flex items-center">
                                <BarChart3 className={`h-5 w-5 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`} />
                                <h3 className={`text-lg leading-6 font-medium ${textPrimaryClass}`}>
                                    Incidencias por Sede
                                </h3>
                            </div>
                            <p className={`mt-1 max-w-2xl text-sm ${textSecondaryClass}`}>
                                Estado de incidencias en cada ubicación
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                            {statsBySede.map((sedeStats) => (
                                <div key={sedeStats.sede} className={`rounded-lg p-4 ${isIronManTheme ? 'bg-[#0B0F14] border border-cyan-500/10' : 'bg-gray-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center">
                                            <Building className={`h-5 w-5 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-400'}`} />
                                            <h4 className={`text-base font-medium ${textPrimaryClass} capitalize`}>
                                                {sedeStats.sede === 'bogota' ? 'Bogotá' :
                                                 sedeStats.sede === 'barranquilla' ? 'Barranquilla' :
                                                 sedeStats.sede === 'villavicencio' ? 'Villavicencio' : sedeStats.sede}
                                            </h4>
                                        </div>
                                        <span className={`text-sm ${textSecondaryClass}`}>
                                            Total: {sedeStats.total}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleSedeStatsClick(sedeStats.sede, 'pendientes')}
                                            className={`text-left p-2 rounded transition-colors ${isIronManTheme ? 'hover:bg-orange-500/10' : 'hover:bg-yellow-50'}`}
                                        >
                                            <div className={`text-xs ${textSecondaryClass}`}>Pendientes</div>
                                            <div className={`text-lg font-semibold ${isIronManTheme ? 'text-[#FF6A00]' : 'text-yellow-600'}`}>
                                                {sedeStats.pendientes}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleSedeStatsClick(sedeStats.sede, 'en_proceso')}
                                            className={`text-left p-2 rounded transition-colors ${isIronManTheme ? 'hover:bg-cyan-500/10' : 'hover:bg-blue-50'}`}
                                        >
                                            <div className={`text-xs ${textSecondaryClass}`}>En Proceso</div>
                                            <div className={`text-lg font-semibold ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`}>
                                                {sedeStats.en_proceso}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleSedeStatsClick(sedeStats.sede, 'en_supervision')}
                                            className={`text-left p-2 rounded transition-colors ${isIronManTheme ? 'hover:bg-red-500/10' : 'hover:bg-purple-50'}`}
                                        >
                                            <div className={`text-xs ${textSecondaryClass}`}>En Supervisión</div>
                                            <div className={`text-lg font-semibold ${isIronManTheme ? 'text-[#E10600]' : 'text-purple-600'}`}>
                                                {sedeStats.en_supervision}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleSedeStatsClick(sedeStats.sede, 'aprobadas')}
                                            className={`text-left p-2 rounded transition-colors ${isIronManTheme ? 'hover:bg-cyan-500/10' : 'hover:bg-green-50'}`}
                                        >
                                            <div className={`text-xs ${textSecondaryClass}`}>Aprobadas</div>
                                            <div className={`text-lg font-semibold ${isIronManTheme ? 'text-[#00B4D8]' : 'text-green-600'}`}>
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

                    {/* Botón de exportación Excel */}
                    <div className={`rounded-lg shadow p-6 ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20 shadow-cyan-500/10' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <Activity className={`h-6 w-6 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-green-600'}`} />
                                <h3 className={`text-lg font-semibold ${textPrimaryClass}`}>
                                    Exportación de Datos
                                </h3>
                            </div>
                        </div>
                        <button
                            onClick={handleExportOldIncidents}
                            className={`w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isIronManTheme
                                    ? 'bg-gradient-to-r from-[#E10600] to-[#FF6A00] hover:from-[#FF6A00] hover:to-[#E10600] focus:ring-[#FF6A00]'
                                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            }`}
                        >
                            <Activity className="h-5 w-5 mr-2" />
                            Exportar Incidencias Más Viejas (Excel)
                        </button>
                        <p className={`text-xs mt-2 text-center ${textSecondaryClass}`}>
                            Exporta las 10 incidencias más viejas sin resolver en formato Excel
                        </p>
                    </div>
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
                <div className={`fixed inset-0 overflow-y-auto h-full w-full z-50 ${isIronManTheme ? 'bg-black bg-opacity-70' : 'bg-gray-600 bg-opacity-50'}`}>
                    <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${
                        isIronManTheme ? 'bg-[#0F172A] border-cyan-500/30 shadow-cyan-500/20' : 'bg-white'
                    }`}>
                        <div className="mt-3">
                            <div className="flex items-center mb-4">
                                <UserPlus className={`h-6 w-6 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`} />
                                <h3 className={`text-lg font-medium ${textPrimaryClass}`}>
                                    Asignar Técnico
                                </h3>
                            </div>

                            <div className={`mb-4 p-3 rounded ${isIronManTheme ? 'bg-[#0B0F14] border border-cyan-500/10' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${textMutedClass}`}>
                                    <strong className={textPrimaryClass}>Estación:</strong> {selectedIncidentForAssign?.station_code}
                                </p>
                                <p className={`text-sm ${textMutedClass}`}>
                                    <strong className={textPrimaryClass}>Sede:</strong> {selectedIncidentForAssign?.sede?.toUpperCase()} - {selectedIncidentForAssign?.departamento?.toUpperCase()}
                                </p>
                                <p className={`text-sm ${textMutedClass}`}>
                                    <strong className={textPrimaryClass}>Tipo:</strong> {getFailureTypeLabel(selectedIncidentForAssign?.failure_type)}
                                </p>
                                <p className={`text-sm ${textMutedClass}`}>
                                    <strong className={textPrimaryClass}>Descripción:</strong> {selectedIncidentForAssign?.description}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                    Seleccionar Técnico *
                                </label>
                                <select
                                    value={selectedTechnician}
                                    onChange={(e) => setSelectedTechnician(e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                                        isIronManTheme
                                            ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
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
                                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                                        isIronManTheme
                                            ? 'border-cyan-500/30 text-[#94A3B8] hover:bg-[#0B0F14]'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    disabled={assignLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAssignFromDashboard}
                                    disabled={assignLoading}
                                    className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                                        isIronManTheme
                                            ? 'bg-[#00E5FF] text-[#0B0F14] hover:bg-[#00B4D8] focus:ring-[#00E5FF]'
                                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                    }`}
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