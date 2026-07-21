import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { novedadRrhhService } from '../services/api';
import NovedadForm from './NovedadForm';
import Pagination from './Pagination';
import { ClipboardList, Plus, Search, Edit3, Trash2, AlertCircle, FileCheck, ChevronDown, ChevronUp, Check, X as XIcon } from 'lucide-react';

const PAGE_SIZE = 20;

const DetailField = ({ label, value }) => (
    <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{value ?? '—'}</p>
    </div>
);

const SoporteBadge = ({ label, ok }) => (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${ok ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        {ok ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
        {label}
    </div>
);

const NovedadesRRHH = () => {
    const { isRecursosHumanos } = useAuth();
    const [novedades, setNovedades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedNovedad, setSelectedNovedad] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchNovedades();
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

    const fetchNovedades = async () => {
        try {
            setLoading(true);
            const response = await novedadRrhhService.getAll();
            setNovedades(response.data.novedades);
            setError('');
        } catch (err) {
            console.error('Error al cargar novedades:', err);
            setError('Error al cargar las novedades');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedNovedad(null);
        setShowCreateForm(true);
    };

    const handleEdit = (novedad) => {
        setSelectedNovedad(novedad);
        setShowEditForm(true);
    };

    const handleFormSuccess = async () => {
        await fetchNovedades();
        setShowCreateForm(false);
        setShowEditForm(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de que desea eliminar esta novedad?')) return;
        try {
            await novedadRrhhService.delete(id);
            await fetchNovedades();
        } catch (err) {
            console.error('Error al eliminar novedad:', err);
            setError('Error al eliminar la novedad');
        }
    };

    const filtered = novedades.filter(n =>
        (n.empleado_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.empleado_identificacion || '').includes(searchTerm) ||
        (n.tipo_novedad_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.campania_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fmtFecha = (v) => v ? new Date(v).toLocaleDateString('es-CO') : '—';

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando novedades...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Consolidado de Novedades</h1>
                        <p className="text-gray-600">Incapacidades, licencias y demás novedades de RRHH por empleado</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Nueva Novedad
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar por empleado, identificación, tipo de novedad o campaña..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Novedad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicial</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soportes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginated.map((n) => {
                                const soportes = [n.tiene_documento_original, n.tiene_copia_documento, n.tiene_historia_clinica, n.tiene_runt, n.tiene_furips, n.tiene_soat].filter(Boolean).length;
                                return (
                                    <React.Fragment key={n.idnovedad_rrhh}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => toggleExpand(n.idnovedad_rrhh)}
                                                className="text-gray-400 hover:text-gray-700"
                                                title={expandedIds.has(n.idnovedad_rrhh) ? 'Ocultar detalle' : 'Ver detalle'}
                                            >
                                                {expandedIds.has(n.idnovedad_rrhh) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{n.empleado_nombre}</div>
                                            <div className="text-xs text-gray-400">{n.empleado_identificacion}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{n.campania_nombre || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {n.tipo_novedad_nombre}
                                            </span>
                                            {!!n.accidente_transito && (
                                                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    accidente tránsito
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtFecha(n.fecha_inicial)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtFecha(n.fecha_final)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{n.total_dias ?? '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${soportes > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                <FileCheck className="h-3 w-3" /> {soportes}/6
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{n.responsable_nombre || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleEdit(n)} className="text-blue-600 hover:text-blue-900" title="Editar">
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(n.idnovedad_rrhh)} className="text-red-600 hover:text-red-900" title="Eliminar">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedIds.has(n.idnovedad_rrhh) && (
                                        <tr>
                                            <td colSpan={9} className="bg-gray-50 px-8 py-5 border-t border-gray-100">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <DetailField label="Cargo" value={n.cargo_nombre} />
                                                    <DetailField label="Centro de costo" value={n.centro_costo_nombre} />
                                                    <DetailField label="Fecha de retorno" value={fmtFecha(n.fecha_retorno)} />
                                                    <DetailField label="Fecha de recibido" value={fmtFecha(n.fecha_recibido)} />
                                                    <DetailField label="Fecha de reporte" value={fmtFecha(n.fecha_reporte)} />
                                                    <DetailField label="Origen de la incapacidad" value={n.origen_incapacidad} />
                                                </div>
                                                {(n.resumen_diagnostico || n.observaciones) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        {n.resumen_diagnostico && <DetailField label="Diagnóstico" value={n.resumen_diagnostico} />}
                                                        {n.observaciones && <DetailField label="Observaciones" value={n.observaciones} />}
                                                    </div>
                                                )}
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Soportes documentales</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <SoporteBadge label="Documento original" ok={!!n.tiene_documento_original} />
                                                    <SoporteBadge label="Copia del documento" ok={!!n.tiene_copia_documento} />
                                                    <SoporteBadge label="Historia clínica" ok={!!n.tiene_historia_clinica} />
                                                    <SoporteBadge label="RUNT" ok={!!n.tiene_runt} />
                                                    <SoporteBadge label="FURIPS" ok={!!n.tiene_furips} />
                                                    <SoporteBadge label="SOAT" ok={!!n.tiene_soat} />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay novedades</h3>
                        <p className="mt-1 text-sm text-gray-500">Registra una nueva novedad para empezar.</p>
                    </div>
                )}

                <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>

            {showCreateForm && (
                <NovedadForm isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} novedad={null} onSuccess={handleFormSuccess} />
            )}
            {showEditForm && selectedNovedad && (
                <NovedadForm isOpen={showEditForm} onClose={() => setShowEditForm(false)} novedad={selectedNovedad} onSuccess={handleFormSuccess} />
            )}
        </div>
    );
};

export default NovedadesRRHH;
