import React, { useState, useEffect } from 'react';
import { workstationService, incidentService } from '../services/api';
import { 
    Monitor, 
    Search, 
    MapPin, 
    AlertTriangle, 
    TrendingUp,
    BarChart3,
    Calendar,
    Filter,
    Download,
    Settings
} from 'lucide-react';

const WorkstationManagement = () => {
    const [workstations, setWorkstations] = useState([]);
    const [filteredWorkstations, setFilteredWorkstations] = useState([]);
    const [incidentStats, setIncidentStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sedeFilter, setSedeFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [sortBy, setSortBy] = useState('failures_desc'); // failures_desc, station_code, created_date
    const [error, setError] = useState('');

    const sedes = [
        { value: 'bogota', label: 'Bogotá' },
        { value: 'barranquilla', label: 'Barranquilla' },
        { value: 'villavicencio', label: 'Villavicencio' }
    ];

    const departamentos = [
        { value: 'obama', label: 'Obama' },
        { value: 'majority', label: 'Majority' },
        { value: 'claro', label: 'Claro' },
        { value: 'contratacion', label: 'Contratación' },
        { value: 'seleccion', label: 'Selección' },
        { value: 'reclutamiento', label: 'Reclutamiento' },
        { value: 'area_financiera', label: 'Área Financiera' }
    ];

    const sortOptions = [
        { value: 'failures_desc', label: 'Más fallas primero' },
        { value: 'failures_asc', label: 'Menos fallas primero' },
        { value: 'station_code', label: 'Código de estación' },
        { value: 'created_date', label: 'Fecha de creación' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterAndSortWorkstations();
    }, [workstations, incidentStats, searchTerm, sedeFilter, departmentFilter, sortBy]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Cargar estaciones de trabajo y estadísticas de incidencias
            const [workstationsResponse, incidentsResponse] = await Promise.all([
                workstationService.getAll(),
                incidentService.getAll() // Obtener todas las incidencias para calcular estadísticas
            ]);

            const workstationsData = workstationsResponse.data;
            const incidentsData = incidentsResponse.data;

            // Calcular estadísticas de fallas por estación
            const stats = calculateIncidentStatistics(incidentsData);
            
            setWorkstations(workstationsData);
            setIncidentStats(stats);
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            setError('Error al cargar los datos de las estaciones');
        } finally {
            setLoading(false);
        }
    };

    const calculateIncidentStatistics = (incidents) => {
        const stats = {};
        
        incidents.forEach(incident => {
            const stationId = incident.workstation_id;
            
            if (!stats[stationId]) {
                stats[stationId] = {
                    totalIncidents: 0,
                    pendingIncidents: 0,
                    resolvedIncidents: 0,
                    approvedIncidents: 0,
                    rejectedIncidents: 0,
                    failureTypes: {},
                    averageResolutionTime: 0,
                    lastIncidentDate: null,
                    riskScore: 0 // Puntuación de riesgo basada en frecuencia y tipos de fallas
                };
            }
            
            const stat = stats[stationId];
            stat.totalIncidents++;
            
            // Contar por estado
            switch (incident.status) {
                case 'pendiente':
                    stat.pendingIncidents++;
                    break;
                case 'en_proceso':
                case 'en_supervision':
                    stat.pendingIncidents++;
                    break;
                case 'aprobado':
                    stat.approvedIncidents++;
                    stat.resolvedIncidents++;
                    break;
                case 'rechazado':
                    stat.rejectedIncidents++;
                    break;
            }
            
            // Contar por tipo de falla
            const failureType = incident.failure_type;
            stat.failureTypes[failureType] = (stat.failureTypes[failureType] || 0) + 1;
            
            // Fecha de última incidencia
            const incidentDate = new Date(incident.created_at);
            if (!stat.lastIncidentDate || incidentDate > stat.lastIncidentDate) {
                stat.lastIncidentDate = incidentDate;
            }
            
            // Calcular tiempo promedio de resolución (solo para incidencias aprobadas)
            if (incident.status === 'aprobado') {
                const createdDate = new Date(incident.created_at);
                const resolvedDate = new Date(incident.updated_at);
                const resolutionTime = (resolvedDate - createdDate) / (1000 * 60 * 60); // en horas
                stat.averageResolutionTime = 
                    (stat.averageResolutionTime * (stat.approvedIncidents - 1) + resolutionTime) / stat.approvedIncidents;
            }
        });
        
        // Calcular puntuación de riesgo
        Object.keys(stats).forEach(stationId => {
            const stat = stats[stationId];
            let riskScore = 0;
            
            // Factor 1: Frecuencia de fallas (40% del score)
            const frequencyScore = Math.min(stat.totalIncidents * 2, 40);
            
            // Factor 2: Tipos de fallas críticas (30% del score)
            const criticalFailures = (stat.failureTypes['pantalla'] || 0) + (stat.failureTypes['internet'] || 0);
            const criticalScore = Math.min(criticalFailures * 5, 30);
            
            // Factor 3: Incidencias pendientes (20% del score)
            const pendingScore = Math.min(stat.pendingIncidents * 3, 20);
            
            // Factor 4: Tiempo desde última falla (10% del score)
            let timeScore = 0;
            if (stat.lastIncidentDate) {
                const daysSinceLastIncident = (new Date() - stat.lastIncidentDate) / (1000 * 60 * 60 * 24);
                if (daysSinceLastIncident < 7) timeScore = 10;
                else if (daysSinceLastIncident < 30) timeScore = 5;
            }
            
            stat.riskScore = frequencyScore + criticalScore + pendingScore + timeScore;
        });
        
        return stats;
    };

    const filterAndSortWorkstations = () => {
        let filtered = workstations;

        // Filtro por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(station => 
                station.station_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (station.location_details && station.location_details.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filtro por sede
        if (sedeFilter !== 'all') {
            filtered = filtered.filter(station => station.sede === sedeFilter);
        }

        // Filtro por departamento
        if (departmentFilter !== 'all') {
            filtered = filtered.filter(station => station.departamento === departmentFilter);
        }

        // Ordenamiento
        filtered.sort((a, b) => {
            const statsA = incidentStats[a.id] || { totalIncidents: 0, riskScore: 0 };
            const statsB = incidentStats[b.id] || { totalIncidents: 0, riskScore: 0 };

            switch (sortBy) {
                case 'failures_desc':
                    return statsB.totalIncidents - statsA.totalIncidents;
                case 'failures_asc':
                    return statsA.totalIncidents - statsB.totalIncidents;
                case 'station_code':
                    return a.station_code.localeCompare(b.station_code);
                case 'created_date':
                    return new Date(b.created_at) - new Date(a.created_at);
                default:
                    return 0;
            }
        });

        setFilteredWorkstations(filtered);
    };

    const getRiskLevel = (riskScore) => {
        if (riskScore >= 70) return { level: 'Alto', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' };
        if (riskScore >= 40) return { level: 'Medio', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' };
        if (riskScore > 0) return { level: 'Bajo', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' };
        return { level: 'Sin datos', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '⚪' };
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

    const exportToCSV = () => {
        const csvData = filteredWorkstations.map(station => {
            const stats = incidentStats[station.id] || {};
            const risk = getRiskLevel(stats.riskScore || 0);
            
            return {
                'Código': station.station_code,
                'Ubicación': station.location_details || 'N/A',
                'Sede': sedes.find(s => s.value === station.sede)?.label || station.sede,
                'Departamento': departamentos.find(d => d.value === station.departamento)?.label || station.departamento,
                'AnyDesk': station.sede === 'barranquilla' ? (station.anydesk_address || 'N/A') : 'N/A',
                'Cédula Asesor': station.sede === 'barranquilla' ? (station.advisor_cedula || 'N/A') : 'N/A',
                'Total Incidencias': stats.totalIncidents || 0,
                'Incidencias Pendientes': stats.pendingIncidents || 0,
                'Incidencias Resueltas': stats.resolvedIncidents || 0,
                'Nivel de Riesgo': risk.level,
                'Puntuación de Riesgo': Math.round(stats.riskScore || 0),
                'Tiempo Promedio Resolución (hrs)': Math.round(stats.averageResolutionTime || 0),
                'Última Incidencia': stats.lastIncidentDate 
                    ? stats.lastIncidentDate.toLocaleDateString() 
                    : 'Nunca'
            };
        });

        const csvContent = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estaciones_estadisticas_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Estaciones</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Monitoreo de estaciones de trabajo y análisis de fallas
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="bg-blue-50 px-3 sm:px-4 py-2 rounded-lg">
                        <span className="text-blue-700 font-medium text-sm">
                            {filteredWorkstations.length} de {workstations.length} estación(es)
                        </span>
                    </div>
                    {filteredWorkstations.length > 0 && (
                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Exportar CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Estadísticas generales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center">
                        <Monitor className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Estaciones</p>
                            <p className="text-2xl font-bold text-gray-900">{workstations.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Alto Riesgo</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Object.values(incidentStats).filter(s => s.riskScore >= 70).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-yellow-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Riesgo Medio</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Object.values(incidentStats).filter(s => s.riskScore >= 40 && s.riskScore < 70).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Incidencias</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Object.values(incidentStats).reduce((sum, s) => sum + (s.totalIncidents || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Búsqueda */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por código o ubicación..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filtro por sede */}
                    <div>
                        <select
                            value={sedeFilter}
                            onChange={(e) => setSedeFilter(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todas las sedes</option>
                            {sedes.map(sede => (
                                <option key={sede.value} value={sede.value}>{sede.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por departamento */}
                    <div>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todos los departamentos</option>
                            {departamentos.map(dept => (
                                <option key={dept.value} value={dept.value}>{dept.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Ordenamiento */}
                    <div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de estaciones */}
            {filteredWorkstations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {workstations.length === 0 ? 'No hay estaciones registradas' : 'No se encontraron estaciones'}
                    </h3>
                    <p className="text-gray-500">
                        {workstations.length === 0 
                            ? 'Las estaciones se crean automáticamente al reportar incidencias'
                            : 'Intenta ajustar los filtros de búsqueda'
                        }
                    </p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-4">
                            {filteredWorkstations.map((station) => {
                                const stats = incidentStats[station.id] || { 
                                    totalIncidents: 0, 
                                    pendingIncidents: 0, 
                                    resolvedIncidents: 0,
                                    riskScore: 0,
                                    failureTypes: {},
                                    averageResolutionTime: 0,
                                    lastIncidentDate: null
                                };
                                const risk = getRiskLevel(stats.riskScore);
                                
                                return (
                                    <div key={station.id} className={`border rounded-lg p-4 ${risk.color.includes('red') ? 'border-red-200 bg-red-50' : 
                                                                                                    risk.color.includes('yellow') ? 'border-yellow-200 bg-yellow-50' :
                                                                                                    risk.color.includes('green') ? 'border-green-200 bg-green-50' : 
                                                                                                    'border-gray-200'}`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                                                    <div className="flex items-center">
                                                        <Monitor className="h-5 w-5 mr-2 text-gray-600" />
                                                        <span className="text-lg font-bold text-gray-900">
                                                            {station.station_code}
                                                        </span>
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${risk.color}`}>
                                                        <span className="mr-1">{risk.icon}</span>
                                                        {risk.level} Riesgo ({Math.round(stats.riskScore)})
                                                    </span>
                                                </div>
                                                
                                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600 mb-3">
                                                    <div className="flex items-center">
                                                        <MapPin className="h-4 w-4 mr-1" />
                                                        <span>
                                                            {sedes.find(s => s.value === station.sede)?.label || station.sede}
                                                            {station.departamento && ` - ${departamentos.find(d => d.value === station.departamento)?.label || station.departamento}`}
                                                        </span>
                                                    </div>
                                                    {station.location_details && (
                                                        <span>{station.location_details}</span>
                                                    )}
                                                </div>

                                                {/* Información de trabajo remoto para Barranquilla */}
                                                {station.sede === 'barranquilla' && (station.anydesk_address || station.advisor_cedula) && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                                                            <Monitor className="h-4 w-4 mr-2" />
                                                            Trabajo Remoto
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                            {station.anydesk_address && (
                                                                <div>
                                                                    <span className="font-medium text-gray-700">AnyDesk:</span>
                                                                    <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded text-blue-800">
                                                                        {station.anydesk_address}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {station.advisor_cedula && (
                                                                <div>
                                                                    <span className="font-medium text-gray-700">Cédula Asesor:</span>
                                                                    <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded text-blue-800">
                                                                        {station.advisor_cedula}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="font-medium text-gray-900">Total Incidencias:</span>
                                                        <span className="ml-1 text-blue-600 font-bold">{stats.totalIncidents}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-900">Pendientes:</span>
                                                        <span className="ml-1 text-orange-600 font-bold">{stats.pendingIncidents}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-900">Resueltas:</span>
                                                        <span className="ml-1 text-green-600 font-bold">{stats.resolvedIncidents}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-900">Tiempo Promedio:</span>
                                                        <span className="ml-1 text-purple-600 font-bold">
                                                            {Math.round(stats.averageResolutionTime || 0)}h
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Tipos de fallas más comunes */}
                                                {Object.keys(stats.failureTypes).length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-sm font-medium text-gray-900 mb-2">Fallas más comunes:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(stats.failureTypes)
                                                                .sort((a, b) => b[1] - a[1])
                                                                .slice(0, 3)
                                                                .map(([type, count]) => (
                                                                    <span key={type} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                                                        {getFailureTypeLabel(type)}: {count}
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {stats.lastIncidentDate && (
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        <Calendar className="h-3 w-3 inline mr-1" />
                                                        Última incidencia: {stats.lastIncidentDate.toLocaleDateString()}
                                                    </div>
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
        </div>
    );
};

export default WorkstationManagement;