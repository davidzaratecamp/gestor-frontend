import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Plus,
    Clock,
    RefreshCw,
    X,
    Eye,
    Edit,
    Save,
    History,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const ReturnedIncidents = () => {
    const { user, isAdmin } = useAuth();
    const isIronManTheme = user?.username === 'davidlopez10';
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCorrectionModal, setShowCorrectionModal] = useState(false);
    const [correctionLoading, setCorrectionLoading] = useState(false);
    
    // Estados para el historial
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Estados para el formulario de corrección
    const [description, setDescription] = useState('');
    const [anydeskAddress, setAnydeskAddress] = useState('');
    const [advisorCedula, setAdvisorCedula] = useState('');
    const [puestoNumero, setPuestoNumero] = useState('');
    const [failureType, setFailureType] = useState('');

    // Función para marcar como visto
    const markAsViewed = () => {
        if (user) {
            localStorage.setItem(`returned_incidents_viewed_${user.id}`, 'true');
        }
    };

    useEffect(() => {
        fetchReturnedIncidents();
        // Marcar como visto cuando se accede a la página
        markAsViewed();
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

    const handleRetryIncident = () => {
        // Redirigir a la página de crear incidencia
        navigate('/incidents/create');
    };

    const handleViewDetails = (incident) => {
        setSelectedIncident(incident);
        setShowModal(true);
    };

    const handleCorrectIncident = (incident) => {
        setSelectedIncident(incident);
        // Pre-llenar formulario con datos actuales
        setDescription(incident.description || '');
        setAnydeskAddress(incident.anydesk_address || '');
        setAdvisorCedula(incident.advisor_cedula || '');
        setPuestoNumero(incident.puesto_numero || '');
        setFailureType(incident.failure_type || '');
        setShowCorrectionModal(true);
    };

    const handleSubmitCorrection = async () => {
        if (!selectedIncident) return;

        // Validar que al menos un campo haya sido modificado
        const corrections = {};
        if (description.trim() !== (selectedIncident.description || '')) {
            corrections.description = description.trim();
        }
        if (anydeskAddress.trim() !== (selectedIncident.anydesk_address || '')) {
            corrections.anydesk_address = anydeskAddress.trim();
        }
        if (advisorCedula.trim() !== (selectedIncident.advisor_cedula || '')) {
            corrections.advisor_cedula = advisorCedula.trim();
        }
        if (puestoNumero !== (selectedIncident.puesto_numero || '')) {
            corrections.puesto_numero = parseInt(puestoNumero) || null;
        }
        if (failureType !== (selectedIncident.failure_type || '')) {
            corrections.failure_type = failureType;
        }

        if (Object.keys(corrections).length === 0) {
            alert('No has realizado cambios en la información');
            return;
        }

        setCorrectionLoading(true);
        try {
            await incidentService.correctIncident(selectedIncident.id, corrections);
            setShowCorrectionModal(false);
            alert('Incidencia corregida y reenviada exitosamente. Ahora está disponible para asignación.');
            await fetchReturnedIncidents();
        } catch (error) {
            console.error('Error corrigiendo incidencia:', error);
            alert(error.response?.data?.msg || 'Error al corregir la incidencia');
        } finally {
            setCorrectionLoading(false);
        }
    };

    const loadHistory = async (incidentId) => {
        try {
            setLoadingHistory(true);
            const response = await incidentService.getHistory(incidentId);
            setHistory(response.data);
        } catch (error) {
            console.error('Error cargando historial:', error);
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleToggleHistory = () => {
        if (!showHistory && history.length === 0) {
            loadHistory(selectedIncident.id);
        }
        setShowHistory(prev => !prev);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedIncident(null);
        setShowHistory(false);
        setHistory([]);
    };

    const closeCorrectionModal = () => {
        setShowCorrectionModal(false);
        setSelectedIncident(null);
        setDescription('');
        setAnydeskAddress('');
        setAdvisorCedula('');
        setPuestoNumero('');
        setFailureType('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className={`animate-spin rounded-full h-32 w-32 border-b-2 ${isIronManTheme ? 'border-[#00E5FF]' : 'border-indigo-500'}`}></div>
            </div>
        );
    }

    return (
        <div className={`p-6 min-h-screen ${isIronManTheme ? 'bg-[#0B0F14]' : 'bg-white'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <RotateCcw className={`w-8 h-8 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`} />
                    <div>
                        <h1 className={`text-2xl font-bold ${isIronManTheme ? 'text-[#E5E7EB] ironman-glow' : 'text-gray-900'}`}>
                            Incidencias Devueltas
                        </h1>
                        <p className={isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}>
                            Casos devueltos por los técnicos que requieren correcciones
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchReturnedIncidents}
                    className={`flex items-center space-x-2 text-white px-4 py-2 rounded-lg transition duration-200 ${isIronManTheme ? 'bg-gradient-to-r from-[#E10600] to-[#FF6A00] hover:from-[#FF6A00] hover:to-[#E10600]' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualizar</span>
                </button>
            </div>

            {/* Filtros */}
            <div className={`p-4 rounded-lg mb-6 ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-gray-50'}`}>
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
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500'}`}
                            />
                        </div>
                    </div>

                    {/* Filtro por tipo */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className={`px-4 py-2 border rounded-lg focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500'}`}
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
                <div className={`p-4 rounded-lg border ${isIronManTheme ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-medium ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`}>Total Devueltas</p>
                            <p className={`text-2xl font-bold ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-800'}`}>{incidents.length}</p>
                        </div>
                        <RotateCcw className={`w-8 h-8 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`} />
                    </div>
                </div>

                <div className={`p-4 rounded-lg border ${isIronManTheme ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-medium ${isIronManTheme ? 'text-[#E10600]' : 'text-yellow-600'}`}>Reincidencias</p>
                            <p className={`text-2xl font-bold ${isIronManTheme ? 'text-[#E10600]' : 'text-yellow-800'}`}>
                                {incidents.filter(i => i.return_count > 1).length}
                            </p>
                        </div>
                        <AlertCircle className={`w-8 h-8 ${isIronManTheme ? 'text-[#E10600]' : 'text-yellow-600'}`} />
                    </div>
                </div>

                <div className={`p-4 rounded-lg border ${isIronManTheme ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-medium ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`}>Filtradas</p>
                            <p className={`text-2xl font-bold ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-800'}`}>{filteredIncidents.length}</p>
                        </div>
                        <Search className={`w-8 h-8 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`} />
                    </div>
                </div>
            </div>

            {/* Lista de incidencias */}
            {filteredIncidents.length === 0 ? (
                <div className="text-center py-12">
                    <RotateCcw className={`w-16 h-16 mx-auto mb-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-300'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                        No hay incidencias devueltas
                    </h3>
                    <p className={isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}>
                        {incidents.length === 0 
                            ? "No tienes incidencias devueltas en este momento."
                            : "No se encontraron incidencias que coincidan con los filtros."
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredIncidents.map((incident) => (
                        <div
                            key={incident.id}
                            className={`rounded-lg p-4 shadow-sm hover:shadow-md transition duration-200 cursor-pointer ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white border border-orange-200'}`}
                            onClick={() => handleViewDetails(incident)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {/* Badges */}
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isIronManTheme ? 'bg-orange-500/20 text-[#FF6A00]' : 'bg-orange-100 text-orange-800'}`}>
                                            <RotateCcw className="w-3 h-3 mr-1" />
                                            Devuelto
                                        </span>
                                        
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFailureTypeColor(incident.failure_type)}`}>
                                            {incident.failure_type}
                                        </span>

                                        {incident.return_count > 1 && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                {incident.return_count}x
                                            </span>
                                        )}
                                    </div>

                                    {/* Información básica */}
                                    <div className="flex items-center space-x-4">
                                        <div className={`flex items-center text-sm ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-600'}`}>
                                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded mr-2 ${isIronManTheme ? 'bg-[#0B0F14] text-[#94A3B8] border border-cyan-500/20' : 'bg-gray-100 text-gray-500'}`}>#{incident.id}</span>
                                            <Monitor className="w-4 h-4 mr-1" />
                                            <span className="font-mono font-medium">{incident.station_code}</span>
                                        </div>

                                        <div className={`flex items-center text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                            <Clock className="w-4 h-4 mr-1" />
                                            <span>{formatDateTime(incident.returned_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewDetails(incident);
                                        }}
                                        className={`flex items-center space-x-1 px-2 py-1 rounded transition duration-200 ${isIronManTheme ? 'text-[#00E5FF] hover:text-[#00B4D8]' : 'text-blue-600 hover:text-blue-700'}`}
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span className="text-sm">Ver</span>
                                    </button>
                                    
                                    {!isAdmin && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCorrectIncident(incident);
                                            }}
                                            className={`flex items-center space-x-1 text-white px-3 py-1 rounded transition duration-200 ${isIronManTheme ? 'bg-gradient-to-r from-[#E10600] to-[#FF6A00] hover:from-[#FF6A00] hover:to-[#E10600]' : 'bg-orange-600 hover:bg-orange-700'}`}
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span className="text-sm">Corregir</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Descripción truncada */}
                            <div className="mt-2">
                                <p className={`text-sm line-clamp-1 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                    {incident.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de detalles */}
            {showModal && selectedIncident && (
                <div className={`fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 ${isIronManTheme ? 'bg-black bg-opacity-70' : 'bg-gray-600 bg-opacity-50'}`}>
                    <div className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/30' : 'bg-white'}`}>
                        <div className={`flex items-center justify-between p-6 border-b ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-semibold flex items-center ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                                <RotateCcw className={`w-5 h-5 mr-2 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`} />
                                Detalles de Incidencia Devuelta
                            </h3>
                            <button
                                onClick={closeModal}
                                className={`transition duration-200 ${isIronManTheme ? 'text-[#94A3B8] hover:text-[#E5E7EB]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Badges */}
                            <div className="flex items-center space-x-2 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Devuelto
                                </span>
                                
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFailureTypeColor(selectedIncident.failure_type)}`}>
                                    {selectedIncident.failure_type}
                                </span>

                                {selectedIncident.return_count > 1 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Reincidencia ({selectedIncident.return_count}x)
                                    </span>
                                )}
                            </div>

                            {/* Información principal */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <Monitor className={`w-4 h-4 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>Estación:</span>
                                        <span className="ml-2 font-mono">{selectedIncident.station_code}</span>
                                    </div>

                                    <div className="flex items-center text-sm">
                                        <User className={`w-4 h-4 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>Devuelto por:</span>
                                        <span className="ml-2">{selectedIncident.returned_by_name}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <Calendar className={`w-4 h-4 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>Creado:</span>
                                        <span className="ml-2">{formatDateTime(selectedIncident.created_at)}</span>
                                    </div>

                                    <div className="flex items-center text-sm">
                                        <Clock className={`w-4 h-4 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>Devuelto:</span>
                                        <span className="ml-2">{formatDateTime(selectedIncident.returned_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="mb-6">
                                <div className="flex items-start">
                                    <FileText className={`w-4 h-4 mr-2 mt-0.5 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-400'}`} />
                                    <div className="flex-1">
                                        <span className={`text-sm font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>Descripción del problema:</span>
                                        <p className={`text-sm mt-1 p-3 rounded-md ${isIronManTheme ? 'text-[#94A3B8] bg-[#0B0F14]' : 'text-gray-600 bg-gray-50'}`}>{selectedIncident.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Motivo de devolución */}
                            <div className="mb-6">
                                <div className={`p-4 rounded-lg border ${isIronManTheme ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                                    <div className="flex items-start">
                                        <MessageCircle className={`w-5 h-5 mr-2 mt-0.5 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`} />
                                        <div className="flex-1">
                                            <span className={`text-sm font-medium ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-800'}`}>
                                                Motivo de devolución:
                                            </span>
                                            <p className={`text-sm mt-2 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-700'}`}>{selectedIncident.return_reason}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Información adicional para Barranquilla */}
                            {selectedIncident.sede === 'barranquilla' && (selectedIncident.anydesk_address || selectedIncident.advisor_cedula) && (
                                <div className="mb-6">
                                    <h4 className={`text-sm font-medium mb-3 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>Información de trabajo remoto:</h4>
                                    <div className={`p-3 rounded-lg border ${isIronManTheme ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedIncident.anydesk_address && (
                                                <div className="text-sm">
                                                    <span className="font-medium text-blue-800">AnyDesk:</span>
                                                    <span className="ml-2 font-mono text-blue-700">{selectedIncident.anydesk_address}</span>
                                                </div>
                                            )}
                                            {selectedIncident.advisor_cedula && (
                                                <div className="text-sm">
                                                    <span className="font-medium text-blue-800">Cédula del asesor:</span>
                                                    <span className="ml-2 font-mono text-blue-700">{selectedIncident.advisor_cedula}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Historial */}
                            <div className="mb-6">
                                <button
                                    onClick={handleToggleHistory}
                                    className="flex items-center justify-between w-full text-left"
                                >
                                    <div className="flex items-center space-x-2">
                                        <History className={`w-4 h-4 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-600'}`} />
                                        <span className={`text-sm font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                            Historial de la Incidencia
                                        </span>
                                    </div>
                                    {showHistory
                                        ? <ChevronUp className={`w-4 h-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`} />
                                        : <ChevronDown className={`w-4 h-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`} />
                                    }
                                </button>

                                {showHistory && (
                                    <div className="mt-3">
                                        {loadingHistory ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                                                <span className={`ml-2 text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                                    Cargando historial...
                                                </span>
                                            </div>
                                        ) : history.length === 0 ? (
                                            <div className={`text-center py-4 rounded-lg ${isIronManTheme ? 'bg-[#0B0F14]' : 'bg-gray-50'}`}>
                                                <History className={`w-8 h-8 mx-auto mb-2 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                                                <p className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                                    Sin historial registrado
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {history.map((entry) => (
                                                    <div key={entry.id} className={`flex space-x-3 p-3 rounded-lg ${isIronManTheme ? 'bg-[#0B0F14]' : 'bg-gray-50'}`}>
                                                        <div className="flex-shrink-0 mt-1.5">
                                                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                                                                    {entry.action}
                                                                </span>
                                                                <span className={`text-xs ml-2 flex-shrink-0 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                                                    {new Date(entry.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className={`text-sm mt-0.5 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                                                {entry.details}
                                                            </p>
                                                            <p className={`text-xs mt-0.5 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`}>
                                                                Por: {entry.user_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Acciones del modal */}
                            <div className={`flex justify-end space-x-3 pt-4 border-t ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                                <button
                                    onClick={closeModal}
                                    className={`px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 transition duration-200 ${isIronManTheme ? 'text-[#94A3B8] bg-[#0B0F14] border border-cyan-500/30' : 'text-gray-700 bg-gray-100 border border-gray-300'}`}
                                >
                                    Cerrar
                                </button>
                                {!isAdmin && (
                                    <button
                                        onClick={() => {
                                            closeModal();
                                            handleCorrectIncident(selectedIncident);
                                        }}
                                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md transition duration-200 ${isIronManTheme ? 'bg-gradient-to-r from-[#E10600] to-[#FF6A00] hover:from-[#FF6A00] hover:to-[#E10600]' : 'bg-orange-600 hover:bg-orange-700'}`}
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Corregir Incidencia</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de corrección */}
            {showCorrectionModal && selectedIncident && (
                <div className={`fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 ${isIronManTheme ? 'bg-black bg-opacity-70' : 'bg-gray-600 bg-opacity-50'}`}>
                    <div className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/30' : 'bg-white'}`}>
                        <div className={`flex items-center justify-between p-6 border-b ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-semibold flex items-center ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                                <Edit className={`w-5 h-5 mr-2 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`} />
                                Corregir Incidencia Devuelta
                            </h3>
                            <button
                                onClick={closeCorrectionModal}
                                className={`transition duration-200 ${isIronManTheme ? 'text-[#94A3B8] hover:text-[#E5E7EB]' : 'text-gray-400 hover:text-gray-600'}`}
                                disabled={correctionLoading}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Información de la incidencia */}
                            <div className={`mb-6 p-4 rounded-lg border ${isIronManTheme ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                                <div className="flex items-start">
                                    <AlertCircle className={`w-5 h-5 mr-2 mt-0.5 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`} />
                                    <div>
                                        <h4 className={`text-sm font-medium ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-800'}`}>Motivo de devolución:</h4>
                                        <p className={`text-sm mt-1 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-700'}`}>{selectedIncident.return_reason}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Formulario de corrección */}
                            <div className="space-y-4">
                                {/* Descripción */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Descripción del problema
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe detalladamente el problema..."
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500'}`}
                                        rows="3"
                                        disabled={correctionLoading}
                                    />
                                </div>

                                {/* Tipo de falla */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Tipo de falla
                                    </label>
                                    <select
                                        value={failureType}
                                        onChange={(e) => setFailureType(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500'}`}
                                        disabled={correctionLoading}
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        <option value="pantalla">Pantalla</option>
                                        <option value="perifericos">Periféricos</option>
                                        <option value="internet">Internet</option>
                                        <option value="software">Software</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>

                                {/* Número de puesto */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Número de puesto
                                    </label>
                                    <input
                                        type="number"
                                        value={puestoNumero}
                                        onChange={(e) => setPuestoNumero(e.target.value)}
                                        placeholder="Ej: 45"
                                        min="1"
                                        max="300"
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500'}`}
                                        disabled={correctionLoading}
                                    />
                                </div>

                                {/* Campos específicos para Barranquilla */}
                                {selectedIncident.sede === 'barranquilla' && (
                                    <>
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                                Dirección AnyDesk
                                            </label>
                                            <input
                                                type="text"
                                                value={anydeskAddress}
                                                onChange={(e) => setAnydeskAddress(e.target.value)}
                                                placeholder="Ej: 123456789"
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500'}`}
                                                disabled={correctionLoading}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                                Cédula del asesor
                                            </label>
                                            <input
                                                type="text"
                                                value={advisorCedula}
                                                onChange={(e) => setAdvisorCedula(e.target.value)}
                                                placeholder="Ej: 1234567890"
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 focus:ring-orange-500'}`}
                                                disabled={correctionLoading}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Acciones del modal */}
                            <div className={`flex justify-end space-x-3 pt-6 border-t mt-6 ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                                <button
                                    onClick={closeCorrectionModal}
                                    disabled={correctionLoading}
                                    className={`px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 transition duration-200 disabled:opacity-50 ${isIronManTheme ? 'text-[#94A3B8] bg-[#0B0F14] border border-cyan-500/30' : 'text-gray-700 bg-gray-100 border border-gray-300'}`}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmitCorrection}
                                    disabled={correctionLoading}
                                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md transition duration-200 disabled:opacity-50 ${isIronManTheme ? 'bg-gradient-to-r from-[#E10600] to-[#FF6A00] hover:from-[#FF6A00] hover:to-[#E10600]' : 'bg-orange-600 hover:bg-orange-700'}`}
                                >
                                    {correctionLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Corregir y Reenviar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturnedIncidents;