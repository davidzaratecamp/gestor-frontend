import React, { useState, useEffect } from 'react';
import { incidentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
    RotateCcw, 
    Monitor, 
    User, 
    Calendar, 
    FileText, 
    Search,
    AlertCircle,
    MessageCircle,
    ArrowLeft,
    Clock,
    RefreshCw
} from 'lucide-react';

const ReturnedIncidents = () => {
    const { user } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        fetchReturnedIncidents();
    }, []);

    useEffect(() => {
        filterIncidents();
    }, [incidents, searchTerm, typeFilter]);

    const fetchReturnedIncidents = async () => {
        try {
            setLoading(true);
            const response = await incidentService.getReturnedIncidents();
            console.log('Response from API:', response); // Debug log
            
            // Manejar la respuesta correctamente
            const incidentsData = response.data || response || [];
            console.log('Incidents data:', incidentsData); // Debug log
            
            // Asegurar que siempre sea un array
            const incidentsArray = Array.isArray(incidentsData) ? incidentsData : [];
            setIncidents(incidentsArray);
        } catch (error) {
            console.error('Error obteniendo incidencias devueltas:', error);
            setIncidents([]); // Establecer array vacío en caso de error
        } finally {
            setLoading(false);
        }
    };

    const filterIncidents = () => {
        // Asegurar que incidents sea un array
        if (!Array.isArray(incidents)) {
            console.warn('incidents is not an array:', incidents);
            setFilteredIncidents([]);
            return;
        }

        let filtered = incidents;

        // Filtrar por término de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(incident =>
                (incident.station_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (incident.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (incident.return_reason || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por tipo de falla
        if (typeFilter !== 'all') {
            filtered = filtered.filter(incident => incident.failure_type === typeFilter);
        }

        setFilteredIncidents(filtered);
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

    const handleRetryIncident = (incident) => {
        // Aquí podrías implementar lógica para crear una nueva incidencia
        // basada en la información de la incidencia devuelta
        console.log('Reintentando incidencia:', incident);
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
                    <RotateCcw className="w-8 h-8 text-orange-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Incidencias Devueltas
                        </h1>
                        <p className="text-gray-600">
                            Casos devueltos por los técnicos que requieren correcciones
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchReturnedIncidents}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualizar</span>
                </button>
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
                                placeholder="Buscar por código, descripción o motivo de devolución..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtro por tipo */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="pantalla">Pantalla</option>
                        <option value="perifericos">Periféricos</option>
                        <option value="internet">Internet</option>
                        <option value="software">Software</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-600 font-medium">Total Devueltas</p>
                            <p className="text-2xl font-bold text-orange-800">{incidents.length}</p>
                        </div>
                        <RotateCcw className="w-8 h-8 text-orange-600" />
                    </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-600 font-medium">Reincidencias</p>
                            <p className="text-2xl font-bold text-yellow-800">
                                {incidents.filter(i => i.return_count > 1).length}
                            </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 font-medium">Filtradas</p>
                            <p className="text-2xl font-bold text-blue-800">{filteredIncidents.length}</p>
                        </div>
                        <Search className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Lista de incidencias */}
            {filteredIncidents.length === 0 ? (
                <div className="text-center py-12">
                    <RotateCcw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay incidencias devueltas
                    </h3>
                    <p className="text-gray-500">
                        {incidents.length === 0 
                            ? "No tienes incidencias devueltas en este momento."
                            : "No se encontraron incidencias que coincidan con los filtros."
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredIncidents.map((incident) => (
                        <div
                            key={incident.id}
                            className="bg-white border border-orange-200 rounded-lg p-6 shadow-sm hover:shadow-md transition duration-200"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Header de la tarjeta */}
                                    <div className="flex items-center space-x-3 mb-3">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                            <RotateCcw className="w-4 h-4 mr-1" />
                                            Devuelto
                                        </span>
                                        
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFailureTypeColor(incident.failure_type)}`}>
                                            {incident.failure_type}
                                        </span>

                                        {incident.return_count > 1 && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Reincidencia ({incident.return_count}x)
                                            </span>
                                        )}
                                    </div>

                                    {/* Información principal */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Monitor className="w-4 h-4 mr-2" />
                                                <span className="font-medium">Estación:</span>
                                                <span className="ml-1 font-mono">{incident.station_code}</span>
                                            </div>
                                            
                                            <div className="flex items-center text-sm text-gray-600">
                                                <User className="w-4 h-4 mr-2" />
                                                <span className="font-medium">Devuelto por:</span>
                                                <span className="ml-1">{incident.returned_by_name}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                <span className="font-medium">Creado:</span>
                                                <span className="ml-1">{formatDateTime(incident.created_at)}</span>
                                            </div>
                                            
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Clock className="w-4 h-4 mr-2" />
                                                <span className="font-medium">Devuelto:</span>
                                                <span className="ml-1">{formatDateTime(incident.returned_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className="mb-4">
                                        <div className="flex items-start">
                                            <FileText className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Descripción:</span>
                                                <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Motivo de devolución */}
                                    <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                                        <div className="flex items-start">
                                            <MessageCircle className="w-4 h-4 mr-2 mt-0.5 text-orange-600" />
                                            <div>
                                                <span className="text-sm font-medium text-orange-800">
                                                    Motivo de devolución:
                                                </span>
                                                <p className="text-sm text-orange-700 mt-1">{incident.return_reason}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información adicional para Barranquilla */}
                                    {incident.sede === 'barranquilla' && (incident.anydesk_address || incident.advisor_cedula) && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <div className="flex flex-wrap gap-4">
                                                {incident.anydesk_address && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">AnyDesk:</span>
                                                        <span className="ml-1 font-mono">{incident.anydesk_address}</span>
                                                    </div>
                                                )}
                                                {incident.advisor_cedula && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Cédula:</span>
                                                        <span className="ml-1 font-mono">{incident.advisor_cedula}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleRetryIncident(incident)}
                                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Crear Nueva Incidencia</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReturnedIncidents;