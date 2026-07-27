import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService, workstationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Save, ArrowLeft, Monitor, Search } from 'lucide-react';

const SITES = [
    { value: 'site1', label: 'Site 1' },
    { value: 'site2', label: 'Site 2' },
    { value: 'area_financiera', label: 'Área Financiera' }
];

const SITE_AREAS = {
    site1: [
        { value: 'claro', label: 'Claro' },
        { value: 'formacion_claro', label: 'Sala Formación Claro' },
        { value: 'rrhh', label: 'Recursos Humanos' },
        { value: 'tecnologia', label: 'Tecnología' },
        { value: 'recepcion', label: 'Recepción' }
    ],
    site2: [
        { value: 'claro', label: 'Claro' },
        { value: 'obama', label: 'Obama' },
        { value: 'vital', label: 'Vital' },
        { value: 'tecnologia', label: 'Tecnología' },
        { value: 'reclutamiento', label: 'Reclutamiento' },
        { value: 'formacion_obama', label: 'Sala Formación Obama' },
        { value: 'recepcion', label: 'Recepción' }
    ]
};

const BARRANQUILLA_DEPARTAMENTOS = [
    { value: 'obama', label: 'Obama' },
    { value: 'claro', label: 'Claro' }
];

const CreateIncident = () => {
    const navigate = useNavigate();
    const { user, isDirectivoFinanciero } = useAuth();
    const isIronManTheme = user?.username === 'davidlopez10';
    const [formData, setFormData] = useState({
        sede: isDirectivoFinanciero ? 'bogota' : (user?.sede || 'bogota'),
        site: '',
        departamento: '',
        station_code: '',
        failure_type: '',
        peripheral_type: '',
        description: '',
        anydesk_address: '',
        advisor_cedula: '',
        advisor_contact: '',
        es_teletrabajo: false,
        anydesk_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [workstations, setWorkstations] = useState([]);

    // Catálogo de puestos (Site 1 / Site 2 / Área Financiera)
    const [stationOptions, setStationOptions] = useState([]);
    const [loadingStations, setLoadingStations] = useState(false);
    const [stationSearch, setStationSearch] = useState('');
    const [stationDropdownOpen, setStationDropdownOpen] = useState(false);

    const isBarranquilla = formData.sede === 'barranquilla';
    // Cualquier usuario puede elegir "Área Financiera" desde el selector de Site, no solo el rol directivoFinanciero
    const isAreaFinanciera = isDirectivoFinanciero || formData.site === 'area_financiera';
    const isTeletrabajo = !isBarranquilla && !isAreaFinanciera && formData.es_teletrabajo;
    const needsStationPicker = isAreaFinanciera || (!isBarranquilla && !isTeletrabajo && formData.site && formData.departamento);

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

    // Cargar catálogo de puestos fijos cuando corresponda (Site+Área elegidos, o Área Financiera)
    useEffect(() => {
        const loadCatalog = async () => {
            if (isAreaFinanciera) {
                setLoadingStations(true);
                try {
                    const res = await workstationService.getCatalog({ departamento: 'area_financiera' });
                    setStationOptions(res.data);
                } catch (err) {
                    console.error('Error cargando catálogo de Área Financiera:', err);
                } finally {
                    setLoadingStations(false);
                }
                return;
            }

            if (!isBarranquilla && !isTeletrabajo && formData.site && formData.departamento) {
                setLoadingStations(true);
                try {
                    const res = await workstationService.getCatalog({ site: formData.site, departamento: formData.departamento });
                    setStationOptions(res.data);
                } catch (err) {
                    console.error('Error cargando catálogo de puestos:', err);
                } finally {
                    setLoadingStations(false);
                }
            } else {
                setStationOptions([]);
            }
        };
        loadCatalog();
    }, [isAreaFinanciera, isBarranquilla, isTeletrabajo, formData.site, formData.departamento]);

    const sedes = [
        { value: 'bogota', label: 'Bogotá' },
        { value: 'barranquilla', label: 'Barranquilla' }
    ];

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

    const resetStationSelection = (overrides = {}) => {
        setStationSearch('');
        setStationDropdownOpen(false);
        return { station_code: '', ...overrides };
    };

    const handleChange = (e) => {
        const { name, value, checked } = e.target;

        // Si cambia la sede, resetear datos dependientes
        if (name === 'sede') {
            setFormData({
                ...formData,
                [name]: value,
                site: '',
                departamento: '',
                ...resetStationSelection(),
                anydesk_address: '',
                advisor_cedula: '',
                advisor_contact: '',
                es_teletrabajo: false,
                anydesk_password: ''
            });
        }
        // Si cambia el site, limpiar área y puesto (Área Financiera no requiere elegir área aparte)
        else if (name === 'site') {
            setFormData({
                ...formData,
                [name]: value,
                departamento: value === 'area_financiera' ? 'area_financiera' : '',
                ...resetStationSelection(),
                es_teletrabajo: false,
                anydesk_address: '',
                anydesk_password: ''
            });
        }
        // Si cambia el departamento/área, limpiar el puesto elegido
        else if (name === 'departamento') {
            setFormData({
                ...formData,
                [name]: value,
                ...resetStationSelection(),
                anydesk_address: '',
                advisor_cedula: '',
                advisor_contact: ''
            });
        }
        // Toggle de teletrabajo: limpiar los campos que dependen de la modalidad
        else if (name === 'es_teletrabajo') {
            setFormData({
                ...formData,
                es_teletrabajo: checked,
                ...resetStationSelection(),
                anydesk_address: '',
                anydesk_password: ''
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

    const filteredStations = stationOptions.filter(s =>
        s.station_code.toLowerCase().includes(stationSearch.toLowerCase())
    );

    const selectStation = (station) => {
        setFormData(prev => ({ ...prev, station_code: station.station_code }));
        setStationSearch(station.station_code);
        setStationDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.failure_type || !formData.description.trim()) {
            setError('Todos los campos marcados con * son requeridos');
            return;
        }

        if (formData.failure_type === 'perifericos' && !formData.peripheral_type) {
            setError('Por favor selecciona el tipo de periférico');
            return;
        }

        if (isBarranquilla) {
            if (!formData.departamento) {
                setError('Debes seleccionar el departamento (Obama o Claro)');
                return;
            }
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
        } else if (isAreaFinanciera) {
            if (!formData.station_code) {
                setError('Debes elegir un puesto de Área Financiera');
                return;
            }
        } else {
            if (!formData.site) {
                setError('Debes elegir Site 1 o Site 2');
                return;
            }
            if (!formData.departamento) {
                setError('Debes elegir un área');
                return;
            }
            if (isTeletrabajo) {
                if (!formData.anydesk_address) {
                    setError('El usuario de AnyDesk es requerido para incidencias en teletrabajo');
                    return;
                }
                if (!formData.anydesk_password) {
                    setError('La contraseña de AnyDesk es requerida para incidencias en teletrabajo');
                    return;
                }
            } else if (!formData.station_code) {
                setError('Debes elegir un puesto del catálogo');
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

            formDataToSend.append('sede', formData.sede);
            formDataToSend.append('failure_type', formData.failure_type);
            formDataToSend.append('description', description);
            formDataToSend.append('es_teletrabajo', isTeletrabajo);

            if (isBarranquilla) {
                formDataToSend.append('departamento', formData.departamento);
                formDataToSend.append('anydesk_address', formData.anydesk_address);
                formDataToSend.append('advisor_cedula', formData.advisor_cedula);
                formDataToSend.append('advisor_contact', formData.advisor_contact);
            } else if (isAreaFinanciera) {
                formDataToSend.append('departamento', 'area_financiera');
                formDataToSend.append('station_code', formData.station_code);
            } else {
                formDataToSend.append('site', formData.site);
                formDataToSend.append('departamento', formData.departamento);
                if (isTeletrabajo) {
                    formDataToSend.append('anydesk_address', formData.anydesk_address);
                    formDataToSend.append('anydesk_password', formData.anydesk_password);
                } else {
                    formDataToSend.append('station_code', formData.station_code);
                }
            }

            await incidentService.createWithFiles(formDataToSend);

            setSuccess('Incidencia creada exitosamente');

            // Limpiar formulario
            setFormData({
                sede: isDirectivoFinanciero ? 'bogota' : (user?.sede || 'bogota'),
                site: '',
                departamento: '',
                station_code: '',
                failure_type: '',
                peripheral_type: '',
                description: '',
                anydesk_address: '',
                advisor_cedula: '',
                advisor_contact: '',
                es_teletrabajo: false,
                anydesk_password: ''
            });
            setStationSearch('');

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

                {isDirectivoFinanciero ? (
                    <div className={`mb-4 rounded-md p-3 ${isIronManTheme ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                        <p className={`text-sm ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-800'}`}>
                            Reportas incidencias únicamente para los puestos de <strong>Área Financiera</strong>.
                        </p>
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Sede (solo visible para admin, y no aplica para directivoFinanciero) */}
                    {user?.role === 'admin' && !isDirectivoFinanciero && (
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

                    {/* Flujo Barranquilla: departamento + AnyDesk (sin cambios) */}
                    {isBarranquilla && (
                        <div>
                            <label htmlFor="departamento" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                Departamento *
                            </label>
                            <select
                                id="departamento"
                                name="departamento"
                                required
                                value={formData.departamento}
                                onChange={handleChange}
                                className={`w-full border rounded-md px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 text-base sm:text-sm ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            >
                                <option value="">Seleccionar departamento...</option>
                                {BARRANQUILLA_DEPARTAMENTOS.map((dept) => (
                                    <option key={dept.value} value={dept.value}>
                                        {dept.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Flujo Bogotá (no directivoFinanciero): Site -> Área */}
                    {!isBarranquilla && !isDirectivoFinanciero && (
                        <>
                            <div>
                                <label htmlFor="site" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                    Site *
                                </label>
                                <select
                                    id="site"
                                    name="site"
                                    required
                                    value={formData.site}
                                    onChange={handleChange}
                                    className={`w-full border rounded-md px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 text-base sm:text-sm ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                >
                                    <option value="">Seleccionar site...</option>
                                    {SITES.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.site && formData.site !== 'area_financiera' && (
                                <div>
                                    <label htmlFor="departamento" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Área *
                                    </label>
                                    <select
                                        id="departamento"
                                        name="departamento"
                                        required
                                        value={formData.departamento}
                                        onChange={handleChange}
                                        className={`w-full border rounded-md px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 text-base sm:text-sm ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                    >
                                        <option value="">Seleccionar área...</option>
                                        {SITE_AREAS[formData.site].map((a) => (
                                            <option key={a.value} value={a.value}>{a.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    {/* Toggle de teletrabajo (solo Bogotá, no aplica a Barranquilla, directivoFinanciero ni Área Financiera) */}
                    {!isBarranquilla && !isAreaFinanciera && (
                        <div className="flex items-center">
                            <input
                                id="es_teletrabajo"
                                name="es_teletrabajo"
                                type="checkbox"
                                checked={formData.es_teletrabajo}
                                onChange={handleChange}
                                className={`h-4 w-4 rounded focus:ring-2 ${isIronManTheme ? 'text-cyan-500 border-cyan-500/30 focus:ring-cyan-500/50' : 'text-blue-600 border-gray-300 focus:ring-blue-500'}`}
                            />
                            <label htmlFor="es_teletrabajo" className={`ml-2 block text-sm font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                Este usuario está en teletrabajo
                            </label>
                        </div>
                    )}

                    {/* Selector de puesto (catálogo fijo con buscador): Site+Área en Bogotá, o Área Financiera */}
                    {needsStationPicker && (
                        <div className="relative">
                            <label htmlFor="station_search" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                Puesto *
                            </label>
                            <div className="relative">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                                <input
                                    id="station_search"
                                    type="text"
                                    value={stationSearch}
                                    onChange={(e) => {
                                        setStationSearch(e.target.value);
                                        setStationDropdownOpen(true);
                                        if (formData.station_code) {
                                            setFormData(prev => ({ ...prev, station_code: '' }));
                                        }
                                    }}
                                    onFocus={() => setStationDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setStationDropdownOpen(false), 150)}
                                    placeholder="Buscar puesto por código..."
                                    autoComplete="off"
                                    className={`w-full border rounded-md pl-9 pr-3 py-3 sm:py-2 focus:outline-none focus:ring-2 text-base sm:text-sm ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                />
                            </div>
                            {stationDropdownOpen && (
                                <div className={`absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-md border shadow-lg ${isIronManTheme ? 'bg-[#0B0F14] border-cyan-500/30' : 'bg-white border-gray-200'}`}>
                                    {loadingStations && (
                                        <div className={`px-3 py-2 text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Cargando puestos...</div>
                                    )}
                                    {!loadingStations && filteredStations.length === 0 && (
                                        <div className={`px-3 py-2 text-sm ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>No se encontraron puestos</div>
                                    )}
                                    {!loadingStations && filteredStations.map((station) => (
                                        <button
                                            type="button"
                                            key={station.id}
                                            onMouseDown={() => selectStation(station)}
                                            className={`w-full text-left px-3 py-2 text-sm ${isIronManTheme ? 'text-[#E5E7EB] hover:bg-cyan-500/10' : 'text-gray-900 hover:bg-gray-100'}`}
                                        >
                                            {station.station_code}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {formData.station_code && (
                                <p className={`mt-1 text-sm ${isIronManTheme ? 'text-[#00E5FF]' : 'text-green-700'}`}>
                                    Puesto seleccionado: {formData.station_code}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Campos de teletrabajo (Bogotá) */}
                    {isTeletrabajo && (
                        <div className={`rounded-lg p-4 space-y-4 ${isIronManTheme ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                            <h4 className={`text-sm font-semibold flex items-center ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-900'}`}>
                                <Monitor className="h-4 w-4 mr-2" />
                                Información de Teletrabajo
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="anydesk_address" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Usuario de AnyDesk *
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
                                    <label htmlFor="anydesk_password" className={`block text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>
                                        Contraseña *
                                    </label>
                                    <input
                                        id="anydesk_password"
                                        name="anydesk_password"
                                        type="text"
                                        required
                                        value={formData.anydesk_password}
                                        onChange={handleChange}
                                        placeholder="Contraseña de la sesión AnyDesk"
                                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                    />
                                </div>
                            </div>
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
                    {isBarranquilla && (
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
