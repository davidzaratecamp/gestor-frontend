import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { traspasoService } from '../services/api';
import { X, Save } from 'lucide-react';

const fecha = (v) => (v ? String(v).substring(0, 10) : '');
const val = (v) => (v === undefined || v === null ? '' : v);

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const sectionClass = "text-sm font-semibold text-indigo-700 uppercase tracking-wider pt-4 border-t border-gray-100";

const CATALOGOS_VACIOS = { areas: [], campanias: [], centros_costo: [], cargos: [], modalidades: [], empleados: [] };

const ESTADO_VACIO = {
    area_id: '', campania_id: '', centro_costo_id: '', cargo_id: '',
    cargo_ssff: '', usuario_ssff: '', salario: '', bono_no_prestacional: '', bono_cafeteria: '',
    jefe_area_id: '', jefe_inmediato_id: ''
};

const TraspasoForm = ({ isOpen, onClose, traspaso = null, onSuccess }) => {
    const [empleados, setEmpleados] = useState([]);
    const [catalogos, setCatalogos] = useState(CATALOGOS_VACIOS);
    const [empleadoId, setEmpleadoId] = useState('');
    const [contratoId, setContratoId] = useState('');

    const [general, setGeneral] = useState({
        estado: '', fecha_inicio: '', fecha_fin: '', ratificacion: false, observaciones: '',
        modalidad_id: '', fecha_inicio_trabajo_casa: '', fecha_fin_trabajo_casa: '', diadema: '', equipo_computo: ''
    });
    const [anterior, setAnterior] = useState(ESTADO_VACIO);
    const [nuevo, setNuevo] = useState(ESTADO_VACIO);

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
                setCatalogos(catRes.data.catalogos);

                if (traspaso) {
                    setEmpleadoId(traspaso.empleado_id || '');
                    setContratoId(traspaso.contrato_idcontrato || '');
                    setGeneral({
                        estado: traspaso.estado || '',
                        fecha_inicio: fecha(traspaso.fecha_inicio),
                        fecha_fin: fecha(traspaso.fecha_fin),
                        ratificacion: !!traspaso.ratificacion,
                        observaciones: traspaso.observaciones || '',
                        modalidad_id: traspaso.modalidad_idmodalidad || '',
                        fecha_inicio_trabajo_casa: fecha(traspaso.fecha_inicio_trabajo_casa),
                        fecha_fin_trabajo_casa: fecha(traspaso.fecha_fin_trabajo_casa),
                        diadema: traspaso.diadema || '',
                        equipo_computo: traspaso.equipo_computo || ''
                    });
                    setAnterior({
                        area_id: val(traspaso.area_anterior_id), campania_id: val(traspaso.campania_anterior_id),
                        centro_costo_id: val(traspaso.centro_costo_anterior_id), cargo_id: val(traspaso.cargo_anterior_id),
                        cargo_ssff: traspaso.cargo_ssff_anterior || '', usuario_ssff: traspaso.usuario_ssff_anterior || '',
                        salario: val(traspaso.salario_anterior), bono_no_prestacional: val(traspaso.bono_no_prestacional_anterior),
                        bono_cafeteria: val(traspaso.bono_cafeteria_anterior),
                        jefe_area_id: val(traspaso.jefe_area_anterior_id), jefe_inmediato_id: val(traspaso.jefe_inmediato_anterior_id)
                    });
                    setNuevo({
                        area_id: val(traspaso.area_nueva_id), campania_id: val(traspaso.campania_nueva_id),
                        centro_costo_id: val(traspaso.centro_costo_nuevo_id), cargo_id: val(traspaso.cargo_nuevo_id),
                        cargo_ssff: traspaso.cargo_ssff_nuevo || '', usuario_ssff: traspaso.usuario_ssff_nuevo || '',
                        salario: val(traspaso.salario_nuevo), bono_no_prestacional: val(traspaso.bono_no_prestacional_nuevo),
                        bono_cafeteria: val(traspaso.bono_cafeteria_nuevo),
                        jefe_area_id: val(traspaso.jefe_area_nuevo_id), jefe_inmediato_id: val(traspaso.jefe_inmediato_nuevo_id)
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
    }, [traspaso]);

    const onSelectEmpleado = async (e) => {
        const id = e.target.value;
        setEmpleadoId(id);
        if (!id) {
            setContratoId('');
            setAnterior(ESTADO_VACIO);
            setNuevo(ESTADO_VACIO);
            return;
        }
        try {
            const res = await api.get(`/users-company/${id}`);
            const emp = res.data.empleado;
            setContratoId(emp.contrato?.idcontrato || '');

            const snapshot = {
                area_id: val(emp.contrato?.area_idarea), campania_id: val(emp.contrato?.campania_idcampania),
                centro_costo_id: val(emp.contrato?.centro_costo_idcentro_costo), cargo_id: val(emp.contrato?.cargo_idcargo),
                cargo_ssff: '', usuario_ssff: emp.usuario_ssff || '',
                salario: val(emp.salario_actual?.salario), bono_no_prestacional: val(emp.salario_actual?.bono_no_prestacional),
                bono_cafeteria: val(emp.salario_actual?.bono_cafeteria),
                jefe_area_id: val(emp.contrato?.jefe_area_id), jefe_inmediato_id: val(emp.contrato?.jefe_inmediato_id)
            };
            setAnterior(snapshot);
            setNuevo(snapshot); // el usuario edita desde aca lo que cambio
        } catch (err) {
            console.error('Error al cargar empleado:', err);
            setError('Error al cargar los datos actuales del empleado');
        }
    };

    const onChangeGeneral = (e) => {
        const { name, value, type, checked } = e.target;
        setGeneral(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const onChangeAnterior = (e) => setAnterior(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const onChangeNuevo = (e) => setNuevo(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
            estado: general.estado || null,
            fecha_inicio: general.fecha_inicio,
            fecha_fin: general.fecha_fin || null,
            ratificacion: general.ratificacion,
            observaciones: general.observaciones || null,
            modalidad_idmodalidad: general.modalidad_id || null,
            fecha_inicio_trabajo_casa: general.fecha_inicio_trabajo_casa || null,
            fecha_fin_trabajo_casa: general.fecha_fin_trabajo_casa || null,
            diadema: general.diadema || null,
            equipo_computo: general.equipo_computo || null,

            area_anterior_id: anterior.area_id || null, campania_anterior_id: anterior.campania_id || null,
            centro_costo_anterior_id: anterior.centro_costo_id || null, cargo_anterior_id: anterior.cargo_id || null,
            cargo_ssff_anterior: anterior.cargo_ssff || null, usuario_ssff_anterior: anterior.usuario_ssff || null,
            salario_anterior: anterior.salario || null, bono_no_prestacional_anterior: anterior.bono_no_prestacional || null,
            bono_cafeteria_anterior: anterior.bono_cafeteria || null,
            jefe_area_anterior_id: anterior.jefe_area_id || null, jefe_inmediato_anterior_id: anterior.jefe_inmediato_id || null,

            area_nueva_id: nuevo.area_id || null, campania_nueva_id: nuevo.campania_id || null,
            centro_costo_nuevo_id: nuevo.centro_costo_id || null, cargo_nuevo_id: nuevo.cargo_id || null,
            cargo_ssff_nuevo: nuevo.cargo_ssff || null, usuario_ssff_nuevo: nuevo.usuario_ssff || null,
            salario_nuevo: nuevo.salario || null, bono_no_prestacional_nuevo: nuevo.bono_no_prestacional || null,
            bono_cafeteria_nuevo: nuevo.bono_cafeteria || null,
            jefe_area_nuevo_id: nuevo.jefe_area_id || null, jefe_inmediato_nuevo_id: nuevo.jefe_inmediato_id || null
        };

        try {
            let response;
            if (traspaso) {
                response = await traspasoService.update(traspaso.idtraspaso, payload);
            } else {
                response = await traspasoService.create(payload);
            }
            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Error al guardar traspaso:', err);
            setError(err.response?.data?.message || err.message || 'Error al guardar el traspaso');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const bloqueEstado = (estado, onChangeEstado, titulo) => (
        <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{titulo}</h4>
            <div className="space-y-3">
                <div>
                    <label className={labelClass}>Área</label>
                    <select name="area_id" value={estado.area_id} onChange={onChangeEstado} className={inputClass}>
                        <option value="">Sin especificar</option>
                        {catalogos.areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Campaña</label>
                    <select name="campania_id" value={estado.campania_id} onChange={onChangeEstado} className={inputClass}>
                        <option value="">Sin especificar</option>
                        {catalogos.campanias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Centro de costo</label>
                    <select name="centro_costo_id" value={estado.centro_costo_id} onChange={onChangeEstado} className={inputClass}>
                        <option value="">Sin especificar</option>
                        {catalogos.centros_costo.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Cargo</label>
                    <select name="cargo_id" value={estado.cargo_id} onChange={onChangeEstado} className={inputClass}>
                        <option value="">Sin especificar</option>
                        {catalogos.cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Cargo SSFF</label>
                    <input type="text" name="cargo_ssff" value={estado.cargo_ssff} onChange={onChangeEstado} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Usuario SSFF</label>
                    <input type="text" name="usuario_ssff" value={estado.usuario_ssff} onChange={onChangeEstado} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Salario</label>
                    <input type="number" min="0" step="0.01" name="salario" value={estado.salario} onChange={onChangeEstado} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Bono no prestacional</label>
                    <input type="number" min="0" step="0.01" name="bono_no_prestacional" value={estado.bono_no_prestacional} onChange={onChangeEstado} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Bono cafetería</label>
                    <input type="number" min="0" step="0.01" name="bono_cafeteria" value={estado.bono_cafeteria} onChange={onChangeEstado} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Jefe de área</label>
                    <select name="jefe_area_id" value={estado.jefe_area_id} onChange={onChangeEstado} className={inputClass}>
                        <option value="">Sin especificar</option>
                        {catalogos.empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Jefe inmediato</label>
                    <select name="jefe_inmediato_id" value={estado.jefe_inmediato_id} onChange={onChangeEstado} className={inputClass}>
                        <option value="">Sin especificar</option>
                        {catalogos.empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {traspaso ? 'Editar Traspaso' : 'Nuevo Traspaso'}
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
                                <select value={empleadoId} onChange={onSelectEmpleado} required className={inputClass} disabled={!!traspaso}>
                                    <option value="">Seleccionar...</option>
                                    {empleados.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nombre_completo} — {emp.numero_identificacion}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Al seleccionar, se precarga el estado "Anterior" con los datos actuales del contrato.</p>
                            </div>

                            <h3 className={sectionClass}>Datos generales</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className={labelClass}>Estado</label>
                                    <input type="text" name="estado" value={general.estado} onChange={onChangeGeneral} className={inputClass} placeholder="Ej: aprobado" />
                                </div>
                                <div>
                                    <label className={labelClass}>Fecha inicio *</label>
                                    <input type="date" name="fecha_inicio" value={general.fecha_inicio} onChange={onChangeGeneral} required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Fecha fin</label>
                                    <input type="date" name="fecha_fin" value={general.fecha_fin} onChange={onChangeGeneral} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Modalidad</label>
                                    <select name="modalidad_id" value={general.modalidad_id} onChange={onChangeGeneral} className={inputClass}>
                                        <option value="">Sin especificar</option>
                                        {catalogos.modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Trabajo en casa - inicio</label>
                                    <input type="date" name="fecha_inicio_trabajo_casa" value={general.fecha_inicio_trabajo_casa} onChange={onChangeGeneral} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Trabajo en casa - fin</label>
                                    <input type="date" name="fecha_fin_trabajo_casa" value={general.fecha_fin_trabajo_casa} onChange={onChangeGeneral} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Diadema</label>
                                    <input type="text" name="diadema" value={general.diadema} onChange={onChangeGeneral} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Equipo de cómputo</label>
                                    <input type="text" name="equipo_computo" value={general.equipo_computo} onChange={onChangeGeneral} className={inputClass} />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" name="ratificacion" checked={general.ratificacion} onChange={onChangeGeneral} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                Ratificación
                            </label>
                            <div>
                                <label className={labelClass}>Observaciones</label>
                                <textarea name="observaciones" value={general.observaciones} onChange={onChangeGeneral} rows={2} className={inputClass} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                {bloqueEstado(anterior, onChangeAnterior, 'Estado anterior')}
                                {bloqueEstado(nuevo, onChangeNuevo, 'Estado nuevo')}
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

export default TraspasoForm;
