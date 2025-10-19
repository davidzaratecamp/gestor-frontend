import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, Calendar, Building, User, Tag, FileText, Save } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const AssetForm = ({ isOpen, onClose, activo = null, onSuccess }) => {
    const [formData, setFormData] = useState({
        numero_placa: '',
        centro_costes: 1,
        ubicacion: '',
        responsable: '',
        proveedor: '',
        fecha_compra: '',
        numero_social: '',
        poliza: '',
        aseguradora: '',
        garantia: 'No',
        fecha_vencimiento_garantia: '',
        orden_compra: '',
        clasificacion: '',
        clasificacion_activo_fijo: '',
        adjunto_archivo: null
    });

    const [responsables, setResponsables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');

    const ubicaciones = [
        'Claro', 'Obama', 'IT', 'Contratación', 'Reclutamiento', 'Selección', 'Finanzas'
    ];

    const clasificaciones = [
        'Activo productivo', 'Activo no productivo'
    ];

    useEffect(() => {
        if (isOpen) {
            fetchResponsables();
            if (activo) {
                // Si estamos editando, cargar datos del activo
                setFormData({
                    numero_placa: activo.numero_placa || '',
                    centro_costes: activo.centro_costes || 1,
                    ubicacion: activo.ubicacion || '',
                    responsable: activo.responsable || '',
                    proveedor: activo.proveedor || '',
                    fecha_compra: activo.fecha_compra || '',
                    numero_social: activo.numero_social || '',
                    poliza: activo.poliza || '',
                    aseguradora: activo.aseguradora || '',
                    garantia: activo.garantia || 'No',
                    fecha_vencimiento_garantia: activo.fecha_vencimiento_garantia || '',
                    orden_compra: activo.orden_compra || '',
                    clasificacion: activo.clasificacion || '',
                    clasificacion_activo_fijo: activo.clasificacion_activo_fijo || '',
                    adjunto_archivo: null
                });
                setFileName(activo.adjunto_archivo || '');
            } else {
                // Si estamos creando, resetear formulario
                setFormData({
                    numero_placa: '',
                    centro_costes: 1,
                    ubicacion: '',
                    responsable: '',
                    proveedor: '',
                    fecha_compra: '',
                    numero_social: '',
                    poliza: '',
                    aseguradora: '',
                    garantia: 'No',
                    fecha_vencimiento_garantia: '',
                    orden_compra: '',
                    clasificacion: '',
                    clasificacion_activo_fijo: '',
                    adjunto_archivo: null
                });
                setFileName('');
            }
            setError('');
        }
    }, [isOpen, activo]);

    const fetchResponsables = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/activos/responsables`);
            setResponsables(response.data.responsables);
        } catch (error) {
            console.error('Error al cargar responsables:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Si cambia la garantía a "No", limpiar fecha de vencimiento
        if (name === 'garantia' && value === 'No') {
            setFormData(prev => ({
                ...prev,
                fecha_vencimiento_garantia: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                adjunto_archivo: file
            }));
            setFileName(file.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validaciones
            if (!formData.numero_placa || !formData.ubicacion || !formData.responsable || !formData.clasificacion) {
                throw new Error('Los campos número de placa, ubicación, responsable y clasificación son obligatorios');
            }

            if (formData.garantia === 'Si' && !formData.fecha_vencimiento_garantia) {
                throw new Error('La fecha de vencimiento de garantía es requerida cuando la garantía es "Sí"');
            }

            // Crear FormData para envío con archivo
            const submitData = new FormData();
            
            // Agregar todos los campos excepto el archivo
            Object.keys(formData).forEach(key => {
                if (key !== 'adjunto_archivo' && formData[key] !== '') {
                    submitData.append(key, formData[key]);
                }
            });

            // Agregar archivo si existe
            if (formData.adjunto_archivo) {
                submitData.append('adjunto_archivo', formData.adjunto_archivo);
            }

            let response;
            if (activo) {
                // Actualizar activo existente
                response = await axios.put(`${API_BASE_URL}/activos/${activo.id}`, submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                // Crear nuevo activo
                response = await axios.post(`${API_BASE_URL}/activos`, submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error al guardar activo:', error);
            setError(error.response?.data?.message || error.message || 'Error al guardar el activo');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {activo ? 'Editar Activo' : 'Crear Nuevo Activo'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Número de Placa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número de Placa *
                            </label>
                            <input
                                type="text"
                                name="numero_placa"
                                value={formData.numero_placa}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ingrese el número de placa"
                            />
                        </div>

                        {/* Centro de Costes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Centro de Costes *
                            </label>
                            <select
                                name="centro_costes"
                                value={formData.centro_costes}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ubicación */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ubicación *
                            </label>
                            <select
                                name="ubicacion"
                                value={formData.ubicacion}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccione una ubicación</option>
                                {ubicaciones.map(ubicacion => (
                                    <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
                                ))}
                            </select>
                        </div>

                        {/* Empresa (solo lectura) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Empresa
                            </label>
                            <input
                                type="text"
                                value="Asiste"
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                            />
                        </div>

                        {/* Responsable */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Responsable *
                            </label>
                            <select
                                name="responsable"
                                value={formData.responsable}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccione un responsable</option>
                                {responsables.map(responsable => (
                                    <option key={responsable} value={responsable}>{responsable}</option>
                                ))}
                            </select>
                        </div>

                        {/* Proveedor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Proveedor
                            </label>
                            <input
                                type="text"
                                name="proveedor"
                                value={formData.proveedor}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nombre del proveedor"
                            />
                        </div>

                        {/* Fecha de Compra */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Compra
                            </label>
                            <input
                                type="date"
                                name="fecha_compra"
                                value={formData.fecha_compra}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Número Social */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número de Serie
                            </label>
                            <input
                                type="text"
                                name="numero_social"
                                value={formData.numero_social}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Número social del activo"
                            />
                        </div>

                        {/* Póliza */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Póliza
                            </label>
                            <input
                                type="text"
                                name="poliza"
                                value={formData.poliza}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Número de póliza (opcional)"
                            />
                        </div>

                        {/* Aseguradora */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Aseguradora
                            </label>
                            <input
                                type="text"
                                name="aseguradora"
                                value={formData.aseguradora}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nombre de la aseguradora (opcional)"
                            />
                        </div>

                        {/* Garantía */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Garantía *
                            </label>
                            <select
                                name="garantia"
                                value={formData.garantia}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="No">No</option>
                                <option value="Si">Sí</option>
                            </select>
                        </div>

                        {/* Fecha de Vencimiento de Garantía (solo si garantía es Sí) */}
                        {formData.garantia === 'Si' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Vencimiento de Garantía *
                                </label>
                                <input
                                    type="date"
                                    name="fecha_vencimiento_garantia"
                                    value={formData.fecha_vencimiento_garantia}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}

                        {/* Orden de Compra */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Orden de Compra
                            </label>
                            <input
                                type="text"
                                name="orden_compra"
                                value={formData.orden_compra}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Número de orden de compra"
                            />
                        </div>

                        {/* Clasificación */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clasificación *
                            </label>
                            <select
                                name="clasificacion"
                                value={formData.clasificacion}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccione una clasificación</option>
                                {clasificaciones.map(clasificacion => (
                                    <option key={clasificacion} value={clasificacion}>{clasificacion}</option>
                                ))}
                            </select>
                        </div>

                        {/* Clasificación de Activo Fijo */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clasificación de Activo Fijo
                            </label>
                            <input
                                type="text"
                                name="clasificacion_activo_fijo"
                                value={formData.clasificacion_activo_fijo}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Descripción de la clasificación del activo fijo"
                            />
                        </div>

                        {/* Archivo Adjunto */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Archivo Adjunto (Imagen o PDF)
                            </label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <Upload className="h-5 w-5 mr-2 text-gray-400" />
                                    Seleccionar archivo
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                        className="hidden"
                                    />
                                </label>
                                {fileName && (
                                    <span className="text-sm text-gray-600">{fileName}</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Formatos permitidos: JPG, PNG, GIF, WebP, PDF. Máximo 15MB.
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {activo ? 'Actualizar' : 'Crear'} Activo
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssetForm;