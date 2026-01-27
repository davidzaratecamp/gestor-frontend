import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService, workstationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Save, ArrowLeft, Monitor, Upload, X, FileImage, FileText } from 'lucide-react';

const CreateIncident = () => {
    const navigate = useNavigate();
    const { user, isAdministrativo, isJefeOperaciones } = useAuth();
    const isIronManTheme = user?.username === 'davidlopez10';
    const [formData, setFormData] = useState({
        sede: user?.sede || 'bogota',
        // Solo pre-seleccionar departamento para no-admins y no-administrativos, jefes de operaciones usan su departamento
        departamento: (user?.role === 'admin' || user?.role === 'administrativo') ? '' : (user?.departamento || ''),
        puesto_numero: '',
        failure_type: '',
        peripheral_type: '',
        description: '',
        anydesk_address: '',
        advisor_cedula: '',
        advisor_contact: '' // Nuevo campo
    });
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [workstations, setWorkstations] = useState([]);
    
    // Obtener workstations de Barranquilla si el usuario puede crear incidencias allí
    useEffect(() => {
        if (user && (user.role === 'admin' || user.sede === 'barranquilla')) {
            loadWorkstations();
        }
    }, [user]);

    const loadWorkstations = async () => {
        try {
            const response = await workstationService.getAll();
            const barranquillaStations = response.data.filter(station => 
                station.sede === 'barranquilla' && 
                station.anydesk_address && 
                station.advisor_cedula
            );
            setWorkstations(barranquillaStations);
        } catch (error) {
            console.error('Error cargando workstations:', error);
        }
    };

    const sedes = [
        { value: 'bogota', label: 'Bogotá' },
        { value: 'barranquilla', label: 'Barranquilla' },
        { value: 'villavicencio', label: 'Villavicencio' }
    ];

    const departamentos = [
        { value: 'obama', label: 'Obama' },
        { value: 'majority', label: 'Majority' },
        { value: 'claro', label: 'Claro' }
    ];

    const departamentosAdministrativo = [
        { value: 'contratacion', label: 'Contratación' },
        { value: 'seleccion', label: 'Selección' },
        { value: 'reclutamiento', label: 'Reclutamiento' },
        { value: 'area_financiera', label: 'Área Financiera' }
    ];

    // Verificar si el usuario puede elegir departamento
    const canChooseDepartment = () => {
        // Administrativos y admins siempre pueden elegir departamento
        if (user?.role === 'admin' || user?.role === 'administrativo') {
            return true;
        }
        // Jefes de operaciones NO pueden elegir departamento (solo el suyo)
        if (user?.role === 'jefe_operaciones') {
            return false;
        }
        // Para otros roles, si no tienen departamento específico pueden elegir
        return !user?.departamento;
    };

    // Filtrar departamentos según la sede y rol
    const getAvailableDepartments = (sede) => {
        if (isAdministrativo) {
            return departamentosAdministrativo; // Administrativos tienen sus propios departamentos
        }
        if (sede === 'bogota') {
            return departamentos; // Bogotá tiene todos
        } else {
            return departamentos.filter(dept => dept.value !== 'majority'); // Villavicencio y Barranquilla no tienen Majority
        }
    };

    const failureTypes = [
        { value: 'pantalla', label: 'Pantalla' },
        { value: 'perifericos', label: 'Periféricos' },
        { value: 'internet', label: 'Internet' },
        { value: 'software', label: 'Software' },
        { value: 'otro', label: 'Otro' }
    ];

    const peripheralTypes = [
        { value: 'diadema', label: 'Diadema' },
        { value: 'mouse', label: 'Mouse' },
        { value: 'teclado', label: 'Teclado' }
    ];

    const getMaxPuestos = (departamento) => {
        return 300; // Todos los departamentos permiten puestos del 1-300
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Si cambia la sede, resetear datos dependientes
        if (name === 'sede') {
            setFormData({
                ...formData,
                [name]: value,
                // Mantener el departamento del usuario solo si no es admin ni administrativo
                departamento: (user?.role === 'admin' || user?.role === 'administrativo') ? '' : (user?.departamento || ''),
                puesto_numero: '',
                anydesk_address: '',
                advisor_cedula: '',
                advisor_contact: ''
            });
        }
        // Si cambia el departamento, limpiar el número de puesto
        else if (name === 'departamento') {
            setFormData({
                ...formData,
                [name]: value,
                puesto_numero: '',
                anydesk_address: '',
                advisor_cedula: '',
                advisor_contact: ''
            });
        } 
        // Si cambia el tipo de falla y no es periféricos, limpiar el tipo de periférico
        else if (name === 'failure_type' && value !== 'perifericos') {
            setFormData({
                ...formData,
                [name]: value,
                peripheral_type: ''
            });
        } 
        // Validar número de puesto
        else if (name === 'puesto_numero') {
            const numero = parseInt(value);
            if (value === '' || (numero >= 1 && numero <= 300)) {
                setFormData({
                    ...formData,
                    [name]: value
                });
            }
        } 
        // Manejar selección de workstation para Barranquilla
        else if (name === 'workstation_selection' && formData.sede === 'barranquilla') {
            const selectedStation = workstations.find(ws => ws.id == value);
            if (selectedStation) {
                setFormData({
                    ...formData,
                    anydesk_address: selectedStation.anydesk_address || '',
                    advisor_cedula: selectedStation.advisor_cedula || '',
                    advisor_contact: selectedStation.advisor_contact || ''
                });
            }
        }
        else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
        
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf'
        ];

        files.forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                setError(`El archivo ${file.name} no es un tipo válido. Solo se permiten imágenes (JPG, PNG, GIF, WebP) y PDFs.`);
                return;
            }
            if (file.size > maxSize) {
                setError(`El archivo ${file.name} es muy grande. Máximo 10MB por archivo.`);
                return;
            }
            validFiles.push(file);
        });

        if (validFiles.length > 0) {
            setAttachments(prev => [...prev, ...validFiles]);
            setError('');
        }

        // Limpiar el input
        e.target.value = '';
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) {
            return <FileImage className="h-4 w-4 text-blue-500" />;
        } else if (fileType === 'application/pdf') {
            return <FileText className="h-4 w-4 text-red-500" />;
        }
        return <FileText className="h-4 w-4 text-gray-500" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const isBarranquilla = formData.sede === 'barranquilla';

        if (!formData.sede || !formData.departamento || (!isBarranquilla && !isAdministrativo && !formData.puesto_numero) || !formData.failure_type || !formData.description.trim()) {
            setError('Todos los campos marcados con * son requeridos');
            return;
        }

        if (formData.failure_type === 'perifericos' && !formData.peripheral_type) {
            setError('Por favor selecciona el tipo de periférico');
            return;
        }

        // Validaciones especiales para Barranquilla
        if (isBarranquilla) {
            if (!formData.anydesk_address) {
                setError('La dirección AnyDesk es requerida para incidencias en Barranquilla');
                return;
            }
            if (!formData.advisor_cedula) {
                setError('La cédula del asesor es requerida para incidencias en Barranquilla');
                return;
            }
            if (!formData.advisor_contact) {
                setError('El número de contacto del asesor es requerido para incidencias en Barranquilla');
                return;
            }
        }

        if (!isBarranquilla) {
            const puestoNum = parseInt(formData.puesto_numero);
            if (puestoNum < 1 || puestoNum > 300) {
                setError('El número de puesto debe estar entre 1 y 300');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            // Si es periférico, agregar el tipo específico a la descripción
            let description = formData.description.trim();
            if (formData.failure_type === 'perifericos' && formData.peripheral_type) {
                const peripheralLabel = peripheralTypes.find(p => p.value === formData.peripheral_type)?.label || formData.peripheral_type;
                description = `[${peripheralLabel}] ${description}`;
            }

            // Crear FormData para envío de archivos
            const formDataToSend = new FormData();
            
            // Agregar datos del formulario
            formDataToSend.append('sede', formData.sede);
            formDataToSend.append('departamento', formData.departamento);
            formDataToSend.append('puesto_numero', isBarranquilla ? 1 : isAdministrativo ? 0 : parseInt(formData.puesto_numero));
            formDataToSend.append('failure_type', formData.failure_type);
            formDataToSend.append('description', description);

            // Agregar campos de trabajo remoto para Barranquilla
            if (isBarranquilla) {
                formDataToSend.append('anydesk_address', formData.anydesk_address);
                formDataToSend.append('advisor_cedula', formData.advisor_cedula);
                formDataToSend.append('advisor_contact', formData.advisor_contact);
            }

            // Agregar archivos adjuntos (para coordinadores y administrativos)
            if ((user?.role === 'coordinador' || user?.role === 'administrativo') && attachments.length > 0) {
                attachments.forEach((file, index) => {
                    formDataToSend.append(`attachments`, file);
                });
            }

            await incidentService.createWithFiles(formDataToSend);

            setSuccess('Incidencia creada exitosamente');
            
            // Limpiar formulario
            setFormData({
                sede: user?.sede || 'bogota',
                departamento: '',
                puesto_numero: '',
                failure_type: '',
                peripheral_type: '',
                description: '',
                anydesk_address: '',
                advisor_cedula: '',
                advisor_contact: ''
            });
            setAttachments([]);

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate('/incidents/supervision');
            }, 2000);

        } catch (error) {
            console.error('Error creando incidencia:', error);
            setError(error.response?.data?.msg || 'Error al crear la incidencia');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`max-w-2xl mx-auto px-4 sm:px-0 ${isIronManTheme ? 'bg-[#0B0F14] p-6 rounded-xl' : ''}`}>
            <div className="mb-4 sm:mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className={`flex items-center mb-4 ${isIronManTheme ? 'text-[#94A3B8] hover:text-[#00E5FF]' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <ArrowLeft className="h-5 w-5 mr-1" />
                    Volver
                </button>
                
                <div className="flex items-start sm:items-center">
                    <AlertTriangle className={`h-6 w-6 sm:h-8 sm:w-8 mr-3 mt-1 sm:mt-0 flex-shrink-0 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-500'}`} />
                    <div>
                        <h1 className={`text-xl sm:text-2xl font-bold ${isIronManTheme ? 'text-[#E5E7EB] ironman-glow' : 'text-gray-900'}`}>{isIronManTheme ? 'Nuevo Reporte de Incidencia' : 'Reportar Nueva Incidencia'}</h1>
                        <p className={`text-sm sm:text-base mt-1 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>Registra una nueva falla técnica en el sistema</p>
                    </div>
                </div>
            </div>

            <div className={`shadow-lg rounded-lg p-4 sm:p-6 ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20 shadow-cyan-500/10' : 'bg-white'}`}>
                {error && (
                    <div className={`mb-4 rounded-md p-3 ${isIronManTheme ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                        <p className={`text-sm ${isIronManTheme ? 'text-[#E10600]' : 'text-red-700'}`}>{error}</p>
                    </div>
                )}

                {success && (
                    <div className={`mb-4 rounded-md p-3 ${isIronManTheme ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-green-50 border border-green-200'}`}>
                        <p className={`text-sm ${isIronManTheme ? 'text-[#00E5FF]' : 'text-green-700'}`}>{success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Sede (solo visible para admin) */}
                    {user?.role === 'admin' && (
                        <div>
                            <label htmlFor="sede" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                Sede *
                            </label>
                            <select
                                id="sede"
                                name="sede"
                                required
                                value={formData.sede}
                                onChange={handleChange}
                                className={`w-full border rounded-md px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 text-base sm:text-sm ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            >
                                {sedes.map((sede) => (
                                    <option key={sede.value} value={sede.value}>
                                        {sede.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Mostrar sede actual para coordinadores y jefes de operaciones */}
                    {(user?.role === 'coordinador' || user?.role === 'jefe_operaciones') && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                Sede
                            </label>
                            <div className={`w-full border rounded-md px-3 py-3 sm:py-2 ${isIronManTheme ? 'bg-[#0B0F14] text-[#E5E7EB] border-cyan-500/20' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                {sedes.find(s => s.value === formData.sede)?.label || formData.sede}
                            </div>
                        </div>
                    )}

                    {/* Departamento */}
                    <div>
                        <label htmlFor="departamento" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                            Departamento *
                        </label>
                        {canChooseDepartment() ? (
                            <select
                                id="departamento"
                                name="departamento"
                                required
                                value={formData.departamento}
                                onChange={handleChange}
                                className={`w-full border rounded-md px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 text-base sm:text-sm ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            >
                                <option value="">Seleccionar departamento...</option>
                                {getAvailableDepartments(formData.sede).map((dept) => (
                                    <option key={dept.value} value={dept.value}>
                                        {dept.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className={`w-full border rounded-md px-3 py-3 sm:py-2 text-base sm:text-sm ${isIronManTheme ? 'bg-[#0B0F14] text-[#E5E7EB] border-cyan-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`}>
                                {getAvailableDepartments(formData.sede).find(dept => dept.value === formData.departamento)?.label || 
                                 departamentos.find(dept => dept.value === formData.departamento)?.label ||
                                 departamentosAdministrativo.find(dept => dept.value === formData.departamento)?.label ||
                                 formData.departamento}
                            </div>
                        )}
                    </div>

                    {/* Número de puesto (oculto para Barranquilla y administrativos) */}
                    {formData.sede !== 'barranquilla' && !isAdministrativo && (
                        <div>
                            <label htmlFor="puesto_numero" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                Número de Puesto *
                            </label>
                            <input
                                id="puesto_numero"
                                name="puesto_numero"
                                type="number"
                                min="1"
                                max="300"
                                required
                                value={formData.puesto_numero}
                                onChange={handleChange}
                                placeholder="Ingrese número del 1 al 300"
                                className={`w-full border rounded-md px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 text-base sm:text-sm ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            <p className={`mt-1 text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                {formData.departamento === 'obama' && `${sedes.find(s => s.value === formData.sede)?.label}: Obama - Puestos 1-300`}
                                {formData.departamento === 'majority' && `${sedes.find(s => s.value === formData.sede)?.label}: Majority - Puestos 1-300`}
                                {formData.departamento === 'claro' && `${sedes.find(s => s.value === formData.sede)?.label}: Claro - Puestos 1-300`}
                                {!formData.departamento && 'Selecciona un departamento primero'}
                            </p>
                        </div>
                    )}

                    {/* Tipo de falla */}
                    <div>
                        <label htmlFor="failure_type" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                            Tipo de Falla *
                        </label>
                        <select
                            id="failure_type"
                            name="failure_type"
                            required
                            value={formData.failure_type}
                            onChange={handleChange}
                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        >
                            <option value="">Seleccionar tipo de falla...</option>
                            {failureTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submenú de Periféricos (solo si se selecciona "perifericos") */}
                    {formData.failure_type === 'perifericos' && (
                        <div>
                            <label htmlFor="peripheral_type" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                Tipo de Periférico *
                            </label>
                            <select
                                id="peripheral_type"
                                name="peripheral_type"
                                required
                                value={formData.peripheral_type}
                                onChange={handleChange}
                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            >
                                <option value="">Seleccionar periférico...</option>
                                {peripheralTypes.map((peripheral) => (
                                    <option key={peripheral.value} value={peripheral.value}>
                                        {peripheral.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Campos de trabajo remoto para Barranquilla */}
                    {formData.sede === 'barranquilla' && (
                        <div className={`rounded-lg p-4 space-y-4 ${isIronManTheme ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                            <h4 className={`text-sm font-semibold flex items-center ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-900'}`}>
                                <Monitor className="h-4 w-4 mr-2" />
                                Información de Trabajo Remoto
                            </h4>
                            
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="anydesk_address" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Dirección AnyDesk *
                                    </label>
                                    <input
                                        id="anydesk_address"
                                        name="anydesk_address"
                                        type="text"
                                        required
                                        value={formData.anydesk_address}
                                        onChange={handleChange}
                                        placeholder="ej: 900123456"
                                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="advisor_cedula" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Cédula del Asesor *
                                    </label>
                                    <input
                                        id="advisor_cedula"
                                        name="advisor_cedula"
                                        type="text"
                                        required
                                        value={formData.advisor_cedula}
                                        onChange={handleChange}
                                        placeholder="ej: 12345678"
                                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="advisor_contact" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                    Número de Contacto del Asesor *
                                </label>
                                <input
                                    id="advisor_contact"
                                    name="advisor_contact"
                                    type="text"
                                    required
                                    value={formData.advisor_contact}
                                    onChange={handleChange}
                                    placeholder="ej: 3001234567"
                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Archivos adjuntos - Para coordinadores y administrativos */}
                    {(user?.role === 'coordinador' || user?.role === 'administrativo') && (
                        <div>
                            <label htmlFor="attachments" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                Archivos Adjuntos <span className={`text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>(Opcional)</span>
                            </label>
                            
                            {/* Mensaje de mantenimiento */}
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-800">
                                            <strong>La sección de adjuntos está en mantenimiento.</strong>
                                        </p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            Temporalmente no se pueden subir archivos. Puedes crear la incidencia sin adjuntos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Input de archivos - DESHABILITADO POR MANTENIMIENTO */}
                            <div className="mb-3">
                                <label
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed opacity-50"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Seleccionar Archivos (Deshabilitado)
                                </label>
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                    disabled
                                />
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-3">
                                Puedes subir imágenes (JPG, PNG, GIF, WebP) y archivos PDF. Máximo 10MB por archivo.
                            </p>

                            {/* Lista de archivos adjuntos */}
                            {attachments.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    <p className="text-sm font-medium text-gray-700">
                                        Archivos seleccionados ({attachments.length}):
                                    </p>
                                    <div className="space-y-2">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                                <div className="flex items-center space-x-2">
                                                    {getFileIcon(file.type)}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Descripción */}
                    <div>
                        <label htmlFor="description" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                            Descripción de la Falla *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            required
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe detalladamente la falla técnica que se está reportando..."
                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 resize-vertical ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        />
                        <p className={`mt-1 text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                            Proporciona todos los detalles necesarios para que el técnico pueda entender y solucionar el problema
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className={`px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isIronManTheme ? 'border-cyan-500/30 text-[#94A3B8] hover:bg-[#0B0F14]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${isIronManTheme ? 'bg-[#00E5FF] text-[#0B0F14] hover:bg-[#00B4D8]' : 'text-white bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Guardando...' : 'Crear Incidencia'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateIncident;