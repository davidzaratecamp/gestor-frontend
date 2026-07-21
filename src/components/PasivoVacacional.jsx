import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vacacionesService } from '../services/api';
import VacacionesForm from './VacacionesForm';
import Pagination from './Pagination';
import { CalendarClock, Plus, Search, Edit3, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const PAGE_SIZE = 20;

const DetailField = ({ label, value }) => (
    <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{value ?? '—'}</p>
    </div>
);

const PasivoVacacional = () => {
    const { isRecursosHumanos } = useAuth();
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedRegistro, setSelectedRegistro] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [periodosPorRegistro, setPeriodosPorRegistro] = useState({});
    const [loadingPeriodos, setLoadingPeriodos] = useState(new Set());
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchRegistros();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    if (!isRecursosHumanos) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
                    <p className="text-gray-600">Solo Recursos Humanos puede acceder a esta sección.</p>
                </div>
            </div>
        );
    }

    const fetchRegistros = async () => {
        try {
            setLoading(true);
            const response = await vacacionesService.getAll();
            setRegistros(response.data.vacaciones);
            setError('');
        } catch (err) {
            console.error('Error al cargar pasivo vacacional:', err);
            setError('Error al cargar el pasivo vacacional');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedRegistro(null);
        setShowCreateForm(true);
    };

    const handleEdit = (registro) => {
        setSelectedRegistro(registro);
        setShowEditForm(true);
    };

    const handleFormSuccess = async () => {
        await fetchRegistros();
        setShowCreateForm(false);
        setShowEditForm(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este registro de vacaciones?')) return;
        try {
            await vacacionesService.delete(id);
            await fetchRegistros();
        } catch (err) {
            console.error('Error al eliminar registro de vacaciones:', err);
            setError('Error al eliminar el registro de vacaciones');
        }
    };

    const filtered = registros.filter(r =>
        (r.empleado_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.empleado_identificacion || '').includes(searchTerm) ||
        (r.campania_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fmtFecha = (v) => v ? new Date(v).toLocaleDateString('es-CO') : '—';
    const fmtMoneda = (v) => v == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleExpand = async (registro) => {
        const id = registro.idvacaciones;
        const isExpanded = expandedIds.has(id);

        setExpandedIds(prev => {
            const next = new Set(prev);
            if (isExpanded) next.delete(id); else next.add(id);
            return next;
        });

        if (!isExpanded && !periodosPorRegistro[id]) {
            setLoadingPeriodos(prev => new Set(prev).add(id));
            try {
                const response = await vacacionesService.getById(id);
                setPeriodosPorRegistro(prev => ({ ...prev, [id]: response.data.vacaciones.periodos || [] }));
            } catch (err) {
                console.error('Error al cargar periodos:', err);
            } finally {
                setLoadingPeriodos(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando pasivo vacacional...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pasivo Vacacional</h1>
                        <p className="text-gray-600">Días acumulados, tomados y compensados por empleado</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Corte
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar por empleado, identificación o campaña..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 w-10"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de corte</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días trabajados</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acumulados</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tomados</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compensados</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pasivo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginated.map((r) => (
                                <React.Fragment key={r.idvacaciones}>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => toggleExpand(r)}
                                            className="text-gray-400 hover:text-gray-700"
                                            title={expandedIds.has(r.idvacaciones) ? 'Ocultar detalle' : 'Ver detalle'}
                                        >
                                            {expandedIds.has(r.idvacaciones) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{r.empleado_nombre}</div>
                                        <div className="text-xs text-gray-400">{r.empleado_identificacion}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtFecha(r.fecha_corte)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.dias_trabajados}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.dias_acumulados}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.dias_tomados}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.dias_compensados}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fmtMoneda(r.pasivo_vacacional)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {r.total_periodos}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-900" title="Editar">
                                                <Edit3 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(r.idvacaciones)} className="text-red-600 hover:text-red-900" title="Eliminar">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedIds.has(r.idvacaciones) && (
                                    <tr>
                                        <td colSpan={9} className="bg-gray-50 px-8 py-5 border-t border-gray-100">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                                <DetailField label="Cargo" value={r.cargo_nombre} />
                                                <DetailField label="Campaña" value={r.campania_nombre} />
                                                <DetailField label="Centro de costo" value={r.centro_costo_nombre} />
                                            </div>

                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Periodos tomados</p>
                                            {loadingPeriodos.has(r.idvacaciones) ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                                    Cargando periodos...
                                                </div>
                                            ) : (periodosPorRegistro[r.idvacaciones] || []).length === 0 ? (
                                                <p className="text-sm text-gray-500 italic">Sin periodos registrados.</p>
                                            ) : (
                                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-gray-200">
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha inicio</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha final</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {periodosPorRegistro[r.idvacaciones].map(p => (
                                                                <tr key={p.idperiodo_vacacional}>
                                                                    <td className="px-4 py-2 text-sm text-gray-900">{p.periodo_tomado || '—'}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-600">{fmtFecha(p.fecha_inicio)}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-600">{fmtFecha(p.fecha_final)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <CalendarClock className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
                        <p className="mt-1 text-sm text-gray-500">Registra un corte de vacaciones para empezar.</p>
                    </div>
                )}

                <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>

            {showCreateForm && (
                <VacacionesForm isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} vacaciones={null} onSuccess={handleFormSuccess} />
            )}
            {showEditForm && selectedRegistro && (
                <VacacionesForm isOpen={showEditForm} onClose={() => setShowEditForm(false)} vacaciones={selectedRegistro} onSuccess={handleFormSuccess} />
            )}
        </div>
    );
};

export default PasivoVacacional;
