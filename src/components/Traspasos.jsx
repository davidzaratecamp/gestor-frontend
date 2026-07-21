import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { traspasoService } from '../services/api';
import TraspasoForm from './TraspasoForm';
import Pagination from './Pagination';
import { ArrowLeftRight, Plus, Search, Edit3, Trash2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const PAGE_SIZE = 20;

const DetailField = ({ label, value }) => (
    <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{value ?? '—'}</p>
    </div>
);

const CompareRow = ({ label, before, after }) => (
    <tr className="border-b border-gray-100 last:border-0">
        <td className="py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{label}</td>
        <td className="py-2 pr-4 text-sm text-gray-600">{before ?? '—'}</td>
        <td className="py-2 text-sm font-medium text-gray-900">{after ?? '—'}</td>
    </tr>
);

const Traspasos = () => {
    const { isRecursosHumanos } = useAuth();
    const [traspasos, setTraspasos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedTraspaso, setSelectedTraspaso] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchTraspasos();
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

    const fetchTraspasos = async () => {
        try {
            setLoading(true);
            const response = await traspasoService.getAll();
            setTraspasos(response.data.traspasos);
            setError('');
        } catch (err) {
            console.error('Error al cargar traspasos:', err);
            setError('Error al cargar los traspasos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedTraspaso(null);
        setShowCreateForm(true);
    };

    const handleEdit = (traspaso) => {
        setSelectedTraspaso(traspaso);
        setShowEditForm(true);
    };

    const handleFormSuccess = async () => {
        await fetchTraspasos();
        setShowCreateForm(false);
        setShowEditForm(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este traspaso?')) return;
        try {
            await traspasoService.delete(id);
            await fetchTraspasos();
        } catch (err) {
            console.error('Error al eliminar traspaso:', err);
            setError('Error al eliminar el traspaso');
        }
    };

    const filtered = traspasos.filter(t =>
        (t.empleado_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.empleado_identificacion || '').includes(searchTerm) ||
        (t.area_nueva_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.campania_nueva_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fmtFecha = (v) => v ? new Date(v).toLocaleDateString('es-CO') : '—';
    const fmtMoneda = (v) => v == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

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
                    <p className="mt-4 text-gray-600">Cargando traspasos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Traspasos</h1>
                        <p className="text-gray-600">Cambios de área, cargo, campaña o salario de un empleado</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Traspaso
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar por empleado, identificación, área o campaña nueva..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha inicio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área → Nueva</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo → Nuevo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salario → Nuevo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratificación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginated.map((t) => (
                                <React.Fragment key={t.idtraspaso}>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => toggleExpand(t.idtraspaso)}
                                            className="text-gray-400 hover:text-gray-700"
                                            title={expandedIds.has(t.idtraspaso) ? 'Ocultar detalle' : 'Ver detalle'}
                                        >
                                            {expandedIds.has(t.idtraspaso) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{t.empleado_nombre}</div>
                                        <div className="text-xs text-gray-400">{t.empleado_identificacion}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtFecha(t.fecha_inicio)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {t.area_anterior_nombre || '—'} → <span className="font-medium text-gray-900">{t.area_nueva_nombre || '—'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {t.cargo_anterior_nombre || '—'} → <span className="font-medium text-gray-900">{t.cargo_nuevo_nombre || '—'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {fmtMoneda(t.salario_anterior)} → <span className="font-medium text-gray-900">{fmtMoneda(t.salario_nuevo)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {t.ratificacion ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle2 className="h-3 w-3" /> Sí
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-900" title="Editar">
                                                <Edit3 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(t.idtraspaso)} className="text-red-600 hover:text-red-900" title="Eliminar">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedIds.has(t.idtraspaso) && (
                                    <tr>
                                        <td colSpan={7} className="bg-gray-50 px-8 py-5 border-t border-gray-100">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                                <DetailField label="Estado" value={t.estado} />
                                                <DetailField label="Fecha fin" value={fmtFecha(t.fecha_fin)} />
                                                <DetailField label="Modalidad" value={t.modalidad_nombre} />
                                                <DetailField label="Centro de costo → Nuevo" value={<>{t.centro_costo_anterior_nombre || '—'} → {t.centro_costo_nuevo_nombre || '—'}</>} />
                                                <DetailField label="Trabajo en casa - inicio" value={fmtFecha(t.fecha_inicio_trabajo_casa)} />
                                                <DetailField label="Trabajo en casa - fin" value={fmtFecha(t.fecha_fin_trabajo_casa)} />
                                                <DetailField label="Diadema" value={t.diadema} />
                                                <DetailField label="Equipo de cómputo" value={t.equipo_computo} />
                                            </div>

                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Comparación anterior / nuevo</p>
                                            <div className="bg-white border border-gray-200 rounded-lg px-4 overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-gray-200">
                                                            <th className="py-2 pr-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                                                            <th className="py-2 pr-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Anterior</th>
                                                            <th className="py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nuevo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <CompareRow label="Campaña" before={t.campania_anterior_nombre} after={t.campania_nueva_nombre} />
                                                        <CompareRow label="Cargo SSFF" before={t.cargo_ssff_anterior} after={t.cargo_ssff_nuevo} />
                                                        <CompareRow label="Usuario SSFF" before={t.usuario_ssff_anterior} after={t.usuario_ssff_nuevo} />
                                                        <CompareRow label="Bono no prestacional" before={fmtMoneda(t.bono_no_prestacional_anterior)} after={fmtMoneda(t.bono_no_prestacional_nuevo)} />
                                                        <CompareRow label="Bono cafetería" before={fmtMoneda(t.bono_cafeteria_anterior)} after={fmtMoneda(t.bono_cafeteria_nuevo)} />
                                                        <CompareRow label="Jefe de área" before={t.jefe_area_anterior_nombre} after={t.jefe_area_nuevo_nombre} />
                                                        <CompareRow label="Jefe inmediato" before={t.jefe_inmediato_anterior_nombre} after={t.jefe_inmediato_nuevo_nombre} />
                                                    </tbody>
                                                </table>
                                            </div>

                                            {t.observaciones && (
                                                <div className="mt-4">
                                                    <DetailField label="Observaciones" value={t.observaciones} />
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
                        <ArrowLeftRight className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay traspasos</h3>
                        <p className="mt-1 text-sm text-gray-500">Registra un nuevo traspaso para empezar.</p>
                    </div>
                )}

                <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>

            {showCreateForm && (
                <TraspasoForm isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} traspaso={null} onSuccess={handleFormSuccess} />
            )}
            {showEditForm && selectedTraspaso && (
                <TraspasoForm isOpen={showEditForm} onClose={() => setShowEditForm(false)} traspaso={selectedTraspaso} onSuccess={handleFormSuccess} />
            )}
        </div>
    );
};

export default Traspasos;
