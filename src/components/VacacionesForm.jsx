import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { vacacionesService } from '../services/api';
import { X, Save, Plus, Trash2 } from 'lucide-react';

const fecha = (v) => (v ? String(v).substring(0, 10) : '');

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const sectionClass = "text-sm font-semibold text-indigo-700 uppercase tracking-wider pt-4 border-t border-gray-100";

const PERIODO_VACIO = { periodo_tomado: '', fecha_inicio: '', fecha_final: '' };

const VacacionesForm = ({ isOpen, onClose, vacaciones = null, onSuccess }) => {
    const [empleados, setEmpleados] = useState([]);
    const [empleadoId, setEmpleadoId] = useState('');
    const [contratoId, setContratoId] = useState('');
    const [form, setForm] = useState({
        fecha_corte: '', dias_trabajados: '', dias_acumulados: '',
        dias_tomados: '', dias_compensados: '', pasivo_vacacional: ''
    });
    const [periodos, setPeriodos] = useState([]);

    const [loadingData, setLoadingData] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            setLoadingData(true);
            try {
                const empRes = await api.get('/users-company');
                setEmpleados(empRes.data.empleados);

                if (vacaciones) {
                    setEmpleadoId(vacaciones.empleado_id || '');
                    setContratoId(vacaciones.contrato_idcontrato || '');
                    setForm({
                        fecha_corte: fecha(vacaciones.fecha_corte),
                        dias_trabajados: vacaciones.dias_trabajados ?? '',
                        dias_acumulados: vacaciones.dias_acumulados ?? '',
                        dias_tomados: vacaciones.dias_tomados ?? '',
                        dias_compensados: vacaciones.dias_compensados ?? '',
                        pasivo_vacacional: vacaciones.pasivo_vacacional ?? ''
                    });

                    const detalle = await vacacionesService.getById(vacaciones.idvacaciones);
                    setPeriodos((detalle.data.vacaciones.periodos || []).map(p => ({
                        periodo_tomado: p.periodo_tomado || '',
                        fecha_inicio: fecha(p.fecha_inicio),
                        fecha_final: fecha(p.fecha_final)
                    })));
                }
                setError('');
            } catch (err) {
                console.error('Error al cargar datos del formulario:', err);
                setError('Error al cargar los datos del formulario');
            } finally {
                setLoadingData(false);
            }
        };
        cargar();
    }, [vacaciones]);

    const onSelectEmpleado = (e) => {
        const id = e.target.value;
        setEmpleadoId(id);
        const emp = empleados.find(x => String(x.id) === String(id));
        setContratoId(emp?.idcontrato || '');
    };

    const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const addPeriodo = () => setPeriodos(prev => [...prev, { ...PERIODO_VACIO }]);
    const removePeriodo = (idx) => setPeriodos(prev => prev.filter((_, i) => i !== idx));
    const changePeriodo = (idx, campo, valor) => {
        setPeriodos(prev => prev.map((p, i) => i === idx ? { ...p, [campo]: valor } : p));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!contratoId) {
            setError('Selecciona un empleado válido (con contrato activo)');
            setLoading(false);
            return;
        }

        const payload = {
            contrato_id: contratoId,
            fecha_corte: form.fecha_corte,
            dias_trabajados: form.dias_trabajados !== '' ? parseInt(form.dias_trabajados, 10) : 0,
            dias_acumulados: form.dias_acumulados !== '' ? parseFloat(form.dias_acumulados) : 0,
            dias_tomados: form.dias_tomados !== '' ? parseFloat(form.dias_tomados) : 0,
            dias_compensados: form.dias_compensados !== '' ? parseFloat(form.dias_compensados) : 0,
            pasivo_vacacional: form.pasivo_vacacional !== '' ? parseFloat(form.pasivo_vacacional) : null,
            periodos: periodos.filter(p => p.fecha_inicio)
        };

        try {
            let response;
            if (vacaciones) {
                response = await vacacionesService.update(vacaciones.idvacaciones, payload);
            } else {
                response = await vacacionesService.create(payload);
            }
            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Error al guardar vacaciones:', err);
            setError(err.response?.data?.message || err.message || 'Error al guardar el registro de vacaciones');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {vacaciones ? 'Editar Pasivo Vacacional' : 'Nuevo Pasivo Vacacional'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {loadingData ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6">
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider">Empleado</h3>
                            <div>
                                <label className={labelClass}>Empleado *</label>
                                <select value={empleadoId} onChange={onSelectEmpleado} required className={inputClass} disabled={!!vacaciones}>
                                    <option value="">Seleccionar...</option>
                                    {empleados.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nombre_completo} — {emp.numero_identificacion}</option>
                                    ))}
                                </select>
                            </div>

                            <h3 className={sectionClass}>Corte de vacaciones</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Fecha de corte *</label>
                                    <input type="date" name="fecha_corte" value={form.fecha_corte} onChange={onChange} required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Días trabajados</label>
                                    <input type="number" min="0" name="dias_trabajados" value={form.dias_trabajados} onChange={onChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Días acumulados</label>
                                    <input type="number" min="0" step="0.01" name="dias_acumulados" value={form.dias_acumulados} onChange={onChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Días tomados</label>
                                    <input type="number" min="0" step="0.01" name="dias_tomados" value={form.dias_tomados} onChange={onChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Días compensados</label>
                                    <input type="number" min="0" step="0.01" name="dias_compensados" value={form.dias_compensados} onChange={onChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Pasivo vacacional ($)</label>
                                    <input type="number" min="0" step="0.01" name="pasivo_vacacional" value={form.pasivo_vacacional} onChange={onChange} className={inputClass} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider">Periodos tomados</h3>
                                <button type="button" onClick={addPeriodo} className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
                                    <Plus className="h-4 w-4" /> Agregar periodo
                                </button>
                            </div>

                            {periodos.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">Sin periodos registrados.</p>
                            ) : (
                                <div className="space-y-3">
                                    {periodos.map((p, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-gray-50 p-3 rounded-lg">
                                            <div>
                                                <label className={labelClass}>Periodo</label>
                                                <input type="text" value={p.periodo_tomado} onChange={(e) => changePeriodo(idx, 'periodo_tomado', e.target.value)} placeholder="Ej: 2025-2026" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Fecha inicio</label>
                                                <input type="date" value={p.fecha_inicio} onChange={(e) => changePeriodo(idx, 'fecha_inicio', e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Fecha final</label>
                                                <input type="date" value={p.fecha_final} onChange={(e) => changePeriodo(idx, 'fecha_final', e.target.value)} className={inputClass} />
                                            </div>
                                            <button type="button" onClick={() => removePeriodo(idx)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm justify-center h-10">
                                                <Trash2 className="h-4 w-4" /> Quitar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                <Save className="h-4 w-4" />
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VacacionesForm;
