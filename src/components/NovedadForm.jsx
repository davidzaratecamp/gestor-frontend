import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { novedadRrhhService } from '../services/api';
import { X, Save } from 'lucide-react';

const fecha = (v) => (v ? String(v).substring(0, 10) : '');

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const sectionClass = "text-sm font-semibold text-indigo-700 uppercase tracking-wider pt-4 border-t border-gray-100";

const NovedadForm = ({ isOpen, onClose, novedad = null, onSuccess }) => {
    const [empleados, setEmpleados] = useState([]);
    const [tiposNovedad, setTiposNovedad] = useState([]);
    const [form, setForm] = useState({
        empleado_id: '', contrato_id: '', tipo_novedad_id: '', responsable_id: '',
        accidente_transito: false, fecha_inicial: '', fecha_final: '', fecha_retorno: '',
        total_dias: '', resumen_diagnostico: '', origen_incapacidad: '', observaciones: '',
        fecha_recibido: '', fecha_reporte: '',
        tiene_documento_original: false, tiene_copia_documento: false, tiene_historia_clinica: false,
        tiene_runt: false, tiene_furips: false, tiene_soat: false
    });
    const [loadingData, setLoadingData] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            setLoadingData(true);
            try {
                const [empRes, catRes] = await Promise.all([
                    api.get('/users-company'),
                    api.get('/users-company/catalogos')
                ]);
                setEmpleados(empRes.data.empleados);
                setTiposNovedad(catRes.data.catalogos.tipos_novedad || []);

                if (novedad) {
                    setForm({
                        empleado_id: novedad.empleado_id || '',
                        contrato_id: novedad.contrato_idcontrato || '',
                        tipo_novedad_id: novedad.tipo_novedad_idtipo_novedad || '',
                        responsable_id: novedad.responsable_id || '',
                        accidente_transito: !!novedad.accidente_transito,
                        fecha_inicial: fecha(novedad.fecha_inicial),
                        fecha_final: fecha(novedad.fecha_final),
                        fecha_retorno: fecha(novedad.fecha_retorno),
                        total_dias: novedad.total_dias ?? '',
                        resumen_diagnostico: novedad.resumen_diagnostico || '',
                        origen_incapacidad: novedad.origen_incapacidad || '',
                        observaciones: novedad.observaciones || '',
                        fecha_recibido: fecha(novedad.fecha_recibido),
                        fecha_reporte: fecha(novedad.fecha_reporte),
                        tiene_documento_original: !!novedad.tiene_documento_original,
                        tiene_copia_documento: !!novedad.tiene_copia_documento,
                        tiene_historia_clinica: !!novedad.tiene_historia_clinica,
                        tiene_runt: !!novedad.tiene_runt,
                        tiene_furips: !!novedad.tiene_furips,
                        tiene_soat: !!novedad.tiene_soat
                    });
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
    }, [novedad]);

    const onChangeEmpleado = (e) => {
        const empleadoId = e.target.value;
        const emp = empleados.find(x => String(x.id) === String(empleadoId));
        setForm(prev => ({ ...prev, empleado_id: empleadoId, contrato_id: emp?.idcontrato || '' }));
    };

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!form.contrato_id) {
            setError('Selecciona un empleado válido (con contrato activo)');
            setLoading(false);
            return;
        }

        const payload = {
            ...form,
            total_dias: form.total_dias !== '' ? parseInt(form.total_dias, 10) : null,
            responsable_id: form.responsable_id || null
        };

        try {
            let response;
            if (novedad) {
                response = await novedadRrhhService.update(novedad.idnovedad_rrhh, payload);
            } else {
                response = await novedadRrhhService.create(payload);
            }
            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Error al guardar novedad:', err);
            setError(err.response?.data?.message || err.message || 'Error al guardar la novedad');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const checkboxField = (label, name) => (
        <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name={name} checked={form[name]} onChange={onChange} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            {label}
        </label>
    );

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {novedad ? 'Editar Novedad' : 'Nueva Novedad'}
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
                            <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider">Empleado y tipo</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Empleado *</label>
                                    <select name="empleado_id" value={form.empleado_id} onChange={onChangeEmpleado} required className={inputClass} disabled={!!novedad}>
                                        <option value="">Seleccionar...</option>
                                        {empleados.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.nombre_completo} — {emp.numero_identificacion}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Tipo de novedad *</label>
                                    <select name="tipo_novedad_id" value={form.tipo_novedad_id} onChange={onChange} required className={inputClass}>
                                        <option value="">Seleccionar...</option>
                                        {tiposNovedad.map(t => (
                                            <option key={t.id} value={t.id}>[{t.categoria}] {t.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Responsable</label>
                                    <select name="responsable_id" value={form.responsable_id} onChange={onChange} className={inputClass}>
                                        <option value="">Sin especificar</option>
                                        {empleados.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" name="accidente_transito" checked={form.accidente_transito} onChange={onChange} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                Accidente de tránsito
                            </label>

                            <h3 className={sectionClass}>Fechas</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className={labelClass}>Fecha inicial *</label>
                                    <input type="date" name="fecha_inicial" value={form.fecha_inicial} onChange={onChange} required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Fecha final</label>
                                    <input type="date" name="fecha_final" value={form.fecha_final} onChange={onChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Fecha de retorno</label>
                                    <input type="date" name="fecha_retorno" value={form.fecha_retorno} onChange={onChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Total días</label>
                                    <input type="number" min="0" name="total_dias" value={form.total_dias} onChange={onChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Fecha de recibido</label>
                                    <input type="date" name="fecha_recibido" value={form.fecha_recibido} onChange={onChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Fecha de reporte</label>
                                    <input type="date" name="fecha_reporte" value={form.fecha_reporte} onChange={onChange} className={inputClass} />
                                </div>
                            </div>

                            <h3 className={sectionClass}>Detalle</h3>
                            <div>
                                <label className={labelClass}>Origen de la incapacidad</label>
                                <input type="text" name="origen_incapacidad" value={form.origen_incapacidad} onChange={onChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Diagnóstico</label>
                                <textarea name="resumen_diagnostico" value={form.resumen_diagnostico} onChange={onChange} rows={2} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Observaciones</label>
                                <textarea name="observaciones" value={form.observaciones} onChange={onChange} rows={2} className={inputClass} />
                            </div>

                            <h3 className={sectionClass}>Soportes documentales</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {checkboxField('Documento original', 'tiene_documento_original')}
                                {checkboxField('Copia del documento', 'tiene_copia_documento')}
                                {checkboxField('Historia clínica', 'tiene_historia_clinica')}
                                {checkboxField('RUNT', 'tiene_runt')}
                                {checkboxField('FURIPS', 'tiene_furips')}
                                {checkboxField('SOAT', 'tiene_soat')}
                            </div>
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

export default NovedadForm;
