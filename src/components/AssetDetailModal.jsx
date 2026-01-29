import React, { useState, useEffect } from 'react';
import {
    X,
    Package,
    Building,
    User,
    Calendar,
    FileText,
    Shield,
    Tag,
    MapPin,
    Hash,
    Truck,
    CreditCard,
    Download,
    Eye,
    Cpu,
    HardDrive,
    Monitor,
    Globe,
    DollarSign,
    ClipboardList,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { assetHistoryService } from '../services/api';
import AssetHistoryPanel from './AssetHistoryPanel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const AssetDetailModal = ({ isOpen, onClose, activo }) => {
    const { canViewAssetHistory } = useAuth();
    const [observaciones, setObservaciones] = useState([]);
    const [showObservaciones, setShowObservaciones] = useState(false);
    const [loadingObservaciones, setLoadingObservaciones] = useState(false);

    useEffect(() => {
        if (isOpen && activo?.id) {
            fetchObservaciones(activo.id);
        }
        if (!isOpen) {
            setObservaciones([]);
            setShowObservaciones(false);
        }
    }, [isOpen, activo?.id]);

    const fetchObservaciones = async (activoId) => {
        try {
            setLoadingObservaciones(true);
            const response = await assetHistoryService.getObservaciones(activoId);
            setObservaciones(response.data.data || []);
        } catch (error) {
            console.error('Error al cargar observaciones:', error);
        } finally {
            setLoadingObservaciones(false);
        }
    };

    const formatFechaObservacion = (fecha) => {
        return new Date(fecha).toLocaleString('es-CR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen || !activo) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'No especificada';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    };

    const formatValue = (value) => {
        if (!value || value === 0) return 'No especificado';
        return `$${Math.floor(value)}`;
    };

    // Función para detectar el tipo de activo
    const detectAssetType = (numeroPlaca) => {
        if (!numeroPlaca) return '';
        const placa = numeroPlaca.toUpperCase();
        
        // Detectar patrones con guión o comilla simple y consecutivo
        if (placa.match(/^ECC[-']CPU[-']\d+$/)) return 'ECC-CPU';
        if (placa.match(/^ECC[-']SER[-']\d+$/)) return 'ECC-SER';
        if (placa.match(/^ECC[-']MON[-']\d+$/)) return 'ECC-MON';
        if (placa.match(/^ECC[-']IMP[-']\d+$/)) return 'ECC-IMP';
        if (placa.match(/^ECC[-']POR[-']\d+$/)) return 'ECC-POR';
        if (placa.match(/^ECC[-']TV[-']\d+$/)) return 'ECC-TV';
        
        // También detectar mientras se está escribiendo (solo el prefijo)
        if (placa.startsWith('ECC-CPU') || placa.startsWith("ECC'CPU")) return 'ECC-CPU';
        if (placa.startsWith('ECC-SER') || placa.startsWith("ECC'SER")) return 'ECC-SER';
        if (placa.startsWith('ECC-MON') || placa.startsWith("ECC'MON")) return 'ECC-MON';
        if (placa.startsWith('ECC-IMP') || placa.startsWith("ECC'IMP")) return 'ECC-IMP';
        if (placa.startsWith('ECC-POR') || placa.startsWith("ECC'POR")) return 'ECC-POR';
        if (placa.startsWith('ECC-TV') || placa.startsWith("ECC'TV")) return 'ECC-TV';
        
        return 'OTHER';
    };

    const assetType = detectAssetType(activo?.numero_placa);

    // Función para obtener el nombre amigable del tipo
    const getAssetTypeName = (type) => {
        const names = {
            'ECC-CPU': 'Computadora',
            'ECC-SER': 'Servidor',
            'ECC-MON': 'Monitor',
            'ECC-IMP': 'Impresora',
            'ECC-POR': 'Portátil',
            'ECC-TV': 'Televisor',
            'OTHER': 'Otro'
        };
        return names[type] || 'Otro';
    };

    const handleDownloadFile = () => {
        if (activo.adjunto_archivo) {
            const fileUrl = `${API_BASE_URL}/files/activos/${activo.adjunto_archivo}`;
            window.open(fileUrl, '_blank');
        }
    };

    const getFileType = (filename) => {
        if (!filename) return null;
        const extension = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return 'image';
        } else if (extension === 'pdf') {
            return 'pdf';
        }
        return 'other';
    };

    const DetailRow = ({ icon: Icon, label, value, fullWidth = false }) => (
        <div className={`${fullWidth ? 'col-span-2' : ''} bg-gray-50 p-4 rounded-lg`}>
            <div className="flex items-center mb-2">
                <Icon className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
            <p className="text-gray-900 font-semibold">
                {value || 'No especificado'}
            </p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Detalles del Activo
                            </h2>
                            <p className="text-blue-600 font-medium">
                                {activo.numero_placa}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            activo.clasificacion === 'Activo productivo' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                        }`}>
                            <Tag className="h-4 w-4 mr-1" />
                            {activo.clasificacion}
                        </span>
                        
                        {assetType !== 'OTHER' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                <Package className="h-4 w-4 mr-1" />
                                {getAssetTypeName(assetType)}
                            </span>
                        )}

                        {activo.estado && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                activo.estado === 'funcional' ? 'bg-green-100 text-green-800' :
                                activo.estado === 'en_reparacion' ? 'bg-yellow-100 text-yellow-800' :
                                activo.estado === 'dado_de_baja' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                <Shield className="h-4 w-4 mr-1" />
                                {activo.estado.replace('_', ' ').charAt(0).toUpperCase() + activo.estado.replace('_', ' ').slice(1)}
                            </span>
                        )}
                        
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            activo.garantia === 'Si' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            <Shield className="h-4 w-4 mr-1" />
                            Garantía: {activo.garantia}
                        </span>

                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <MapPin className="h-4 w-4 mr-1" />
                            {activo.ubicacion}
                        </span>

                        {activo.site && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                <Globe className="h-4 w-4 mr-1" />
                                {activo.site}
                            </span>
                        )}
                    </div>

                    {/* Main Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <DetailRow 
                            icon={Hash}
                            label="Número de Placa"
                            value={activo.numero_placa}
                        />
                        
                        <DetailRow 
                            icon={Hash}
                            label="Centro de Costes"
                            value={activo.centro_costes}
                        />

                        <DetailRow 
                            icon={Building}
                            label="Empresa"
                            value={activo.empresa || 'Asiste'}
                        />

                        <DetailRow 
                            icon={MapPin}
                            label="Ubicación"
                            value={activo.ubicacion}
                        />

                        <DetailRow 
                            icon={Globe}
                            label="Site"
                            value={activo.site}
                        />

                        <DetailRow 
                            icon={User}
                            label="Responsable"
                            value={activo.responsable}
                        />

                        <DetailRow 
                            icon={User}
                            label="Asignado"
                            value={activo.asignado || 'No asignado'}
                        />

                        <DetailRow 
                            icon={MapPin}
                            label="Puesto"
                            value={activo.puesto || 'No especificado'}
                        />

                        <DetailRow 
                            icon={Truck}
                            label="Proveedor"
                            value={activo.proveedor}
                        />

                        <DetailRow 
                            icon={DollarSign}
                            label="Valor del Activo"
                            value={formatValue(activo.valor)}
                        />

                        <DetailRow 
                            icon={Calendar}
                            label="Fecha de Compra"
                            value={formatDate(activo.fecha_compra)}
                        />

                        <DetailRow 
                            icon={Hash}
                            label="Número de Serie"
                            value={activo.numero_social}
                        />

                        <DetailRow 
                            icon={FileText}
                            label="Póliza"
                            value={activo.poliza}
                        />

                        <DetailRow 
                            icon={Building}
                            label="Aseguradora"
                            value={activo.aseguradora}
                        />

                        <DetailRow 
                            icon={Shield}
                            label="Garantía"
                            value={activo.garantia}
                        />

                        {activo.garantia === 'Si' && (
                            <DetailRow 
                                icon={Calendar}
                                label="Vencimiento de Garantía"
                                value={formatDate(activo.fecha_vencimiento_garantia)}
                            />
                        )}

                        <DetailRow 
                            icon={CreditCard}
                            label="Orden de Compra"
                            value={activo.orden_compra}
                        />

                        <DetailRow 
                            icon={Tag}
                            label="Clasificación"
                            value={activo.clasificacion}
                        />
                    </div>

                    {/* Full width fields */}
                    {activo.clasificacion_activo_fijo && (
                        <div className="mb-6">
                            <DetailRow 
                                icon={Tag}
                                label="Clasificación de Activo Fijo"
                                value={activo.clasificacion_activo_fijo}
                                fullWidth={true}
                            />
                        </div>
                    )}

                    {/* File Attachment */}
                    {activo.adjunto_archivo && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Archivo Adjunto
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                            {getFileType(activo.adjunto_archivo) === 'image' ? (
                                                <Eye className="h-6 w-6 text-blue-600" />
                                            ) : (
                                                <FileText className="h-6 w-6 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {activo.adjunto_archivo}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {getFileType(activo.adjunto_archivo) === 'image' ? 'Imagen' : 
                                                 getFileType(activo.adjunto_archivo) === 'pdf' ? 'Documento PDF' : 'Archivo'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDownloadFile}
                                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        <Download className="h-4 w-4 mr-1" />
                                        Ver/Descargar
                                    </button>
                                </div>

                                {/* Image Preview */}
                                {getFileType(activo.adjunto_archivo) === 'image' && (
                                    <div className="mt-4">
                                        <img
                                            src={`${API_BASE_URL}/files/activos/${activo.adjunto_archivo}`}
                                            alt="Preview del activo"
                                            className="max-w-xs h-auto rounded-lg border border-gray-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Campos Dinámicos Específicos del Tipo de Activo */}
                    {assetType && assetType !== 'OTHER' && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Información Técnica ({getAssetTypeName(assetType)})
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Campos comunes para todos los tipos */}
                                {activo.marca_modelo && (
                                    <DetailRow 
                                        icon={Tag}
                                        label="Marca y Modelo"
                                        value={activo.marca_modelo}
                                    />
                                )}

                                {activo.numero_serie_fabricante && (
                                    <DetailRow 
                                        icon={Hash}
                                        label="Número de Serie del Fabricante"
                                        value={activo.numero_serie_fabricante}
                                    />
                                )}

                                {/* Campos específicos para equipos de cómputo */}
                                {['ECC-CPU', 'ECC-SER', 'ECC-POR'].includes(assetType) && (
                                    <>
                                        {activo.cpu_procesador && (
                                            <DetailRow 
                                                icon={Cpu}
                                                label="CPU / Procesador"
                                                value={activo.cpu_procesador}
                                            />
                                        )}

                                        {activo.memoria_ram && (
                                            <DetailRow 
                                                icon={HardDrive}
                                                label="Memoria RAM"
                                                value={activo.memoria_ram}
                                            />
                                        )}

                                        {activo.almacenamiento && (
                                            <DetailRow 
                                                icon={HardDrive}
                                                label="Almacenamiento"
                                                value={activo.almacenamiento}
                                            />
                                        )}

                                        {activo.sistema_operativo && (
                                            <DetailRow 
                                                icon={Monitor}
                                                label="Sistema Operativo"
                                                value={activo.sistema_operativo}
                                            />
                                        )}
                                    </>
                                )}

                                {/* Campos específicos para monitores y TV */}
                                {['ECC-MON', 'ECC-TV'].includes(assetType) && activo.pulgadas && (
                                    <DetailRow 
                                        icon={Monitor}
                                        label="Pulgadas"
                                        value={activo.pulgadas}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                            Información del Sistema
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailRow
                                icon={Calendar}
                                label="Fecha de Creación"
                                value={formatDate(activo.created_at)}
                            />

                            <DetailRow
                                icon={Calendar}
                                label="Última Actualización"
                                value={formatDate(activo.updated_at)}
                            />

                            {activo.created_by_name && (
                                <DetailRow
                                    icon={User}
                                    label="Creado por"
                                    value={activo.created_by_name}
                                />
                            )}
                        </div>
                    </div>

                    {/* Observaciones de Mantenimiento */}
                    {observaciones.length > 0 && (
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <button
                                onClick={() => setShowObservaciones(!showObservaciones)}
                                className="w-full flex items-center justify-between mb-3"
                            >
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <ClipboardList className="h-5 w-5 mr-2 text-emerald-600" />
                                    Observaciones de Mantenimiento ({observaciones.length})
                                </h3>
                                {showObservaciones ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                            </button>
                            {showObservaciones && (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {loadingObservaciones ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                                        </div>
                                    ) : (
                                        observaciones.map((obs) => (
                                            <div key={obs.id} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center text-xs text-gray-500 mb-2 space-x-3">
                                                    <span className="flex items-center">
                                                        <User className="h-3 w-3 mr-1" />
                                                        {obs.realizadoPor}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        {formatFechaObservacion(obs.fecha)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{obs.observaciones}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Panel de Historial de Cambios (solo para admin/gestorActivos) */}
                    <AssetHistoryPanel
                        activoId={activo.id}
                        canViewHistory={canViewAssetHistory}
                    />

                    {/* Close Button */}
                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetDetailModal;