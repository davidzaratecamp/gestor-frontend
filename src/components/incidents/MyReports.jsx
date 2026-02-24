import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { incidentService } from '../../services/api';
import CopyableId from '../CopyableId';
import { 
    FileText, 
    Monitor, 
    User, 
    Calendar, 
    Search,
    Clock,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    RotateCcw,
    Settings,
    X,
    Eye,
    Edit,
    ArrowRight
} from 'lucide-react';

const MyReports = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({});
    const [filteredReports, setFilteredReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedReport, setSelectedReport] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchMyReports();
    }, []);

    useEffect(() => {
        filterReports();
    }, [reports, searchTerm, statusFilter]);

    const fetchMyReports = async () => {
        try {
            setLoading(true);
            const response = await incidentService.getMyReports();
            setReports(response.data.incidents);
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error obteniendo mis reportes:', error);
            setReports([]);
            setStats({});
        } finally {
            setLoading(false);
        }
    };

    const filterReports = () => {
        let filtered = reports;

        // Filtrar por término de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(report =>
                (report.station_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (report.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (report.technician_name || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(report => report.status === statusFilter);
        }

        setFilteredReports(filtered);
    };

    const getStatusInfo = (status) => {
        const statusInfo = {
            'pendiente': {
                label: 'Pendiente',
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: Clock,
                description: 'Esperando asignación de técnico'
            },
            'en_proceso': {
                label: 'En Proceso',
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                icon: Settings,
                description: 'Técnico trabajando en el caso'
            },
            'en_supervision': {
                label: 'En Supervisión',
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                icon: Eye,
                description: 'Esperando tu aprobación'
            },
            'aprobado': {
                label: 'Aprobado',
                color: 'bg-green-100 text-green-800 border-green-200',
                icon: CheckCircle,
                description: 'Caso resuelto y aprobado'
            },
            'rechazado': {
                label: 'Rechazado',
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: AlertCircle,
                description: 'Regresado al técnico para revisión'
            },
            'devuelto': {
                label: 'Devuelto',
                color: 'bg-orange-100 text-orange-800 border-orange-200',
                icon: RotateCcw,
                description: 'Requiere correcciones de tu parte'
            }
        };
        return statusInfo[status] || statusInfo.pendiente;
    };

    const getFailureTypeColor = (type) => {
        const colors = {
            pantalla: 'bg-red-100 text-red-800',
            perifericos: 'bg-yellow-100 text-yellow-800',
            internet: 'bg-blue-100 text-blue-800',
            software: 'bg-green-100 text-green-800',
            otro: 'bg-gray-100 text-gray-800'
        };
        return colors[type] || colors.otro;
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewDetails = (report) => {
        setSelectedReport(report);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedReport(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Mis Casos Reportados
                        </h1>
                        <p className="text-gray-600">
                            Seguimiento completo de las incidencias que has reportado
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchMyReports}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualizar</span>
                </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-center">
                        <p className="text-gray-600 font-medium">Total</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
                    </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-center">
                        <p className="text-yellow-600 font-medium">Pendiente</p>
                        <p className="text-2xl font-bold text-yellow-800">{stats.pendiente || 0}</p>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-center">
                        <p className="text-blue-600 font-medium">En Proceso</p>
                        <p className="text-2xl font-bold text-blue-800">{stats.en_proceso || 0}</p>
                    </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-center">
                        <p className="text-purple-600 font-medium">Supervisión</p>
                        <p className="text-2xl font-bold text-purple-800">{stats.en_supervision || 0}</p>
                    </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-center">
                        <p className="text-green-600 font-medium">Aprobado</p>
                        <p className="text-2xl font-bold text-green-800">{stats.aprobado || 0}</p>
                    </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-center">
                        <p className="text-orange-600 font-medium">Devuelto</p>
                        <p className="text-2xl font-bold text-orange-800">{stats.devuelto || 0}</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por código, descripción o técnico..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtro por estado */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="en_supervision">En Supervisión</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="devuelto">Devuelto</option>
                    </select>
                </div>
            </div>

            {/* Lista de reportes */}
            {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay reportes
                    </h3>
                    <p className="text-gray-500">
                        {reports.length === 0 
                            ? "No has reportado ninguna incidencia aún."
                            : "No se encontraron reportes que coincidan con los filtros."
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredReports.map((report) => {
                        const statusInfo = getStatusInfo(report.status);
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                            <div
                                key={report.id}
                                className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition duration-200 cursor-pointer ${statusInfo.color.includes('border') ? statusInfo.color : 'border-gray-200'}`}
                                onClick={() => handleViewDetails(report)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        {/* Estado */}
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                                <StatusIcon className="w-4 h-4 mr-1" />
                                                {statusInfo.label}
                                            </span>
                                            
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFailureTypeColor(report.failure_type)}`}>
                                                {report.failure_type}
                                            </span>

                                            {report.return_count > 0 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {report.return_count}x devuelto
                                                </span>
                                            )}
                                        </div>

                                        {/* Información */}
                                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <CopyableId id={report.id} className="mr-2" />
                                                <Monitor className="w-4 h-4 mr-1" />
                                                <span className="font-mono font-medium">{report.station_code}</span>
                                            </div>
                                            
                                            {report.technician_name && (
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-1" />
                                                    <span>{report.technician_name}</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                <span>{formatDateTime(report.updated_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón Ver Detalles */}
                                    <div className="flex items-center">
                                        <ArrowRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="mt-2 text-sm text-gray-600 line-clamp-1">
                                    {report.description}
                                </div>

                                {/* Indicador de estado */}
                                <div className="mt-2 text-xs text-gray-500">
                                    {statusInfo.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de detalles */}
            {showModal && selectedReport && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                                Detalles del Caso #{selectedReport.id}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition duration-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Estado y badges */}
                            <div className="flex items-center space-x-2 mb-6">
                                {(() => {
                                    const statusInfo = getStatusInfo(selectedReport.status);
                                    const StatusIcon = statusInfo.icon;
                                    return (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                            <StatusIcon className="w-4 h-4 mr-1" />
                                            {statusInfo.label}
                                        </span>
                                    );
                                })()}
                                
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFailureTypeColor(selectedReport.failure_type)}`}>
                                    {selectedReport.failure_type}
                                </span>

                                {selectedReport.return_count > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Devuelto {selectedReport.return_count} veces
                                    </span>
                                )}
                            </div>

                            {/* Información principal */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <Monitor className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium text-gray-700">Estación:</span>
                                        <span className="ml-2 font-mono">{selectedReport.station_code}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm">
                                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium text-gray-700">Sede:</span>
                                        <span className="ml-2 capitalize">{selectedReport.sede}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm">
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium text-gray-700">Técnico:</span>
                                        <span className="ml-2">{selectedReport.technician_name || 'Sin asignar'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium text-gray-700">Creado:</span>
                                        <span className="ml-2">{formatDateTime(selectedReport.created_at)}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm">
                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium text-gray-700">Actualizado:</span>
                                        <span className="ml-2">{formatDateTime(selectedReport.updated_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="mb-6">
                                <div className="flex items-start">
                                    <FileText className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-700">Descripción del problema:</span>
                                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-md">{selectedReport.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Información específica de Barranquilla */}
                            {selectedReport.sede === 'barranquilla' && (selectedReport.anydesk_address || selectedReport.advisor_cedula) && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Información de trabajo remoto:</h4>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedReport.anydesk_address && (
                                                <div className="text-sm">
                                                    <span className="font-medium text-blue-800">AnyDesk:</span>
                                                    <span className="ml-2 font-mono text-blue-700">{selectedReport.anydesk_address}</span>
                                                </div>
                                            )}
                                            {selectedReport.advisor_cedula && (
                                                <div className="text-sm">
                                                    <span className="font-medium text-blue-800">Cédula del asesor:</span>
                                                    <span className="ml-2 font-mono text-blue-700">{selectedReport.advisor_cedula}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Motivo de devolución si aplica */}
                            {selectedReport.status === 'devuelto' && selectedReport.return_reason && (
                                <div className="mb-6">
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <div className="flex items-start">
                                            <RotateCcw className="w-5 h-5 mr-2 mt-0.5 text-orange-600" />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-orange-800">
                                                    Motivo de devolución:
                                                </span>
                                                <p className="text-sm text-orange-700 mt-2">{selectedReport.return_reason}</p>
                                                <p className="text-xs text-orange-600 mt-1">
                                                    Devuelto por: {selectedReport.returned_by_name} • {formatDateTime(selectedReport.returned_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="flex justify-end pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition duration-200"
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

export default MyReports;