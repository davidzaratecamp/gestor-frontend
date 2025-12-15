import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AssetForm from './AssetForm';
import { 
    Package, 
    Plus, 
    Search, 
    Filter, 
    Edit3, 
    Trash2, 
    Eye,
    FileText,
    Calendar,
    Building,
    User,
    Tag,
    AlertCircle,
    DollarSign,
    TrendingUp
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const AssetManagement = () => {
    const { user, isGestorActivos } = useAuth();
    const [activos, setActivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({});
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedActivo, setSelectedActivo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});

    // Si no es gestor de activos, mostrar mensaje de acceso denegado
    if (!isGestorActivos) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
                    <p className="text-gray-600">Solo los gestores de activos pueden acceder a esta sección.</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchActivos();
        fetchStats();
    }, []);

    const fetchActivos = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/activos`);
            setActivos(response.data.activos);
            setError('');
        } catch (error) {
            console.error('Error al cargar activos:', error);
            setError('Error al cargar los activos');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/activos/stats`);
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };

    const handleCreateActivo = () => {
        setSelectedActivo(null);
        setShowCreateForm(true);
    };

    const handleEditActivo = (activo) => {
        setSelectedActivo(activo);
        setShowEditForm(true);
    };


    const handleFormSuccess = async () => {
        await fetchActivos();
        await fetchStats();
        setShowCreateForm(false);
        setShowEditForm(false);
    };

    const handleDeleteActivo = async (id) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este activo?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/activos/${id}`);
            await fetchActivos();
            await fetchStats();
        } catch (error) {
            console.error('Error al eliminar activo:', error);
            setError('Error al eliminar el activo');
        }
    };

    const filteredActivos = activos.filter(activo => {
        const matchesSearch = activo.numero_placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             activo.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             activo.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando activos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ingresar Activos</h1>
                        <p className="text-gray-600">Registra y administra los activos de la empresa</p>
                    </div>
                    <button
                        onClick={handleCreateActivo}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Activo
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Activos</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Tag className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Productivos</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activos_productivos || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Tag className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">No Productivos</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activos_no_productivos || 0}</p>
                            </div>
                        </div>
                    </div>


                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-green-600 flex-shrink-0" />
                            <div className="ml-4 min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-500">Valor Total</p>
                                <p className="font-bold text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl overflow-hidden whitespace-nowrap">
                                    ${new Intl.NumberFormat('es-CO').format(stats.valor_total || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-indigo-600 flex-shrink-0" />
                            <div className="ml-4 min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-500">Valor Promedio</p>
                                <p className="font-bold text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl overflow-hidden whitespace-nowrap">
                                    ${new Intl.NumberFormat('es-CO').format(stats.valor_promedio || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar por número de placa, responsable o ubicación..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Filter className="h-5 w-5" />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Assets Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Activo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ubicación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Responsable
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Clasificación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Garantía
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredActivos.map((activo) => (
                                <tr key={activo.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {activo.numero_placa}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Centro: {activo.centro_costes}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {activo.ubicacion}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {activo.responsable}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            activo.clasificacion === 'Activo productivo' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {activo.clasificacion}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            activo.garantia === 'Si' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {activo.garantia}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {activo.valor ? 
                                            `$${new Intl.NumberFormat('es-CO').format(activo.valor)}` : 
                                            'No especificado'
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditActivo(activo)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Editar activo"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteActivo(activo.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Eliminar activo"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredActivos.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay activos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Comience creando un nuevo activo.
                        </p>
                    </div>
                )}
            </div>

            {/* Asset Form Modal */}
            <AssetForm
                isOpen={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                activo={null}
                onSuccess={handleFormSuccess}
            />

            <AssetForm
                isOpen={showEditForm}
                onClose={() => setShowEditForm(false)}
                activo={selectedActivo}
                onSuccess={handleFormSuccess}
            />

        </div>
    );
};

export default AssetManagement;