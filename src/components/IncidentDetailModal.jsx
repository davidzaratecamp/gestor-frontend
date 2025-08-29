import React, { useState, useEffect } from 'react';
import { 
    X, 
    Monitor, 
    User, 
    Calendar, 
    Clock, 
    AlertTriangle, 
    FileText,
    UserPlus,
    Settings,
    MapPin,
    Building,
    Paperclip,
    Eye,
    FileImage
} from 'lucide-react';
import { 
    getAlertLevel, 
    formatElapsedTime, 
    getAlertMessage 
} from '../utils/incidentAlerts';
import { incidentService } from '../services/api';

const IncidentDetailModal = ({ 
    incident, 
    isOpen, 
    onClose, 
    onAssign, 
    onSelfAssign,
    isAdmin,
    isTechnician,
    technicians = [],
    selectedTechnician,
    setSelectedTechnician,
    assignLoading
}) => {
    const [attachments, setAttachments] = useState([]);
    const [loadingAttachments, setLoadingAttachments] = useState(false);

    // Cargar archivos adjuntos cuando se abre el modal
    useEffect(() => {
        if (isOpen && incident?.id) {
            loadAttachments(incident.id);
        }
    }, [isOpen, incident?.id]);

    const loadAttachments = async (incidentId) => {
        try {
            setLoadingAttachments(true);
            const response = await incidentService.getAttachments(incidentId);
            setAttachments(response.data);
        } catch (error) {
            console.error('Error cargando archivos adjuntos:', error);
            setAttachments([]);
        } finally {
            setLoadingAttachments(false);
        }
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) {
            return <FileImage className="h-5 w-5 text-blue-500" />;
        } else if (fileType === 'application/pdf') {
            return <FileText className="h-5 w-5 text-red-500" />;
        }
        return <FileText className="h-5 w-5 text-gray-500" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    const handleViewFile = (attachment) => {
        const baseURL = 'http://31.97.138.23:5001';
        const fileUrl = `${baseURL}${attachment.file_url}`;
        window.open(fileUrl, '_blank');
    };

    if (!isOpen || !incident) return null;

    const alertInfo = getAlertLevel(incident.created_at, incident.failure_type);
    const timeElapsed = formatElapsedTime(incident.created_at);
    const alertMessage = getAlertMessage(incident.created_at, incident.failure_type);

    const getFailureTypeLabel = (type) => {
        const labels = {
            'pantalla': 'Pantalla',
            'perifericos': 'Periféricos', 
            'internet': 'Internet',
            'software': 'Software',
            'otro': 'Otro'
        };
        return labels[type] || type;
    };

    const getFailureTypeColor = (type) => {
        const colors = {
            'pantalla': 'bg-blue-100 text-blue-800',
            'perifericos': 'bg-purple-100 text-purple-800',
            'internet': 'bg-red-100 text-red-800',
            'software': 'bg-green-100 text-green-800',
            'otro': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || colors.otro;
    };

    const getPriorityIcon = (type) => {
        if (type === 'internet' || type === 'software') {
            return <AlertTriangle className="h-4 w-4 text-red-500" />;
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
            <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Monitor className="h-6 w-6 text-blue-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Detalles de Incidencia
                            </h3>
                            <p className="text-sm text-gray-500">
                                Información completa de la incidencia reportada
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Alerta de tiempo crítico */}
                {alertMessage && (
                    <div className={`mb-4 p-3 rounded-md ${alertInfo.bgColor} border-l-4 ${alertInfo.borderColor}`}>
                        <div className="flex items-center">
                            <AlertTriangle className={`h-5 w-5 mr-2 ${alertInfo.textColor}`} />
                            <span className={`text-sm font-medium ${alertInfo.textColor}`}>
                                {alertMessage}
                            </span>
                        </div>
                    </div>
                )}

                {/* Información principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Estación */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                            <Monitor className="h-5 w-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Estación de Trabajo</span>
                        </div>
                        <p className="text-lg font-mono text-blue-600">{incident.station_code}</p>
                    </div>

                    {/* Ubicación */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="h-5 w-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Ubicación</span>
                        </div>
                        <div className="space-y-1">
                            <p className="flex items-center text-gray-800">
                                <Building className="h-4 w-4 mr-2" />
                                {incident.sede?.toUpperCase()} - {incident.departamento?.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    {/* Tipo de Falla */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                            <Settings className="h-5 w-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Tipo de Falla</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {getPriorityIcon(incident.failure_type)}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFailureTypeColor(incident.failure_type)}`}>
                                {getFailureTypeLabel(incident.failure_type)}
                            </span>
                            {(incident.failure_type === 'internet' || incident.failure_type === 'software') && (
                                <span className="text-xs text-red-600 font-medium">PRIORIDAD ALTA</span>
                            )}
                        </div>
                    </div>

                    {/* Tiempo */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-5 w-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Tiempo</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                                <strong>Creado:</strong> {new Date(incident.created_at).toLocaleDateString()} a las {new Date(incident.created_at).toLocaleTimeString()}
                            </p>
                            <p className={`text-sm font-medium ${alertInfo ? alertInfo.textColor : 'text-gray-900'}`}>
                                <strong>Sin asignar:</strong> {timeElapsed}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reportado por */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <User className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Reportado por</span>
                    </div>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{incident.reported_by_name}</p>
                </div>

                {/* Descripción completa */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Descripción del Problema</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {incident.description}
                        </p>
                    </div>
                </div>

                {/* Estado actual */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Estado Actual</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            alertInfo ? 
                                `${alertInfo.bgColor} ${alertInfo.textColor}` : 
                                'bg-yellow-100 text-yellow-800'
                        }`}>
                            {alertInfo ? 
                                (alertInfo.level === 'urgent' ? '🚨 URGENTE - SIN ASIGNAR' :
                                 alertInfo.level === 'critical' ? '⚠️ CRÍTICO - SIN ASIGNAR' : 
                                 '⚡ ATENCIÓN - SIN ASIGNAR') : 
                                'PENDIENTE DE ASIGNACIÓN'
                            }
                        </span>
                    </div>
                </div>

                {/* Archivos adjuntos */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <Paperclip className="h-5 w-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Archivos Adjuntos</span>
                        </div>
                        {attachments.length > 0 && (
                            <span className="text-sm text-gray-500">
                                {attachments.length} archivo{attachments.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {loadingAttachments ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-500">Cargando archivos...</span>
                        </div>
                    ) : attachments.length === 0 ? (
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                            <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No hay archivos adjuntos</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        {getFileIcon(attachment.file_type)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {attachment.original_name}
                                            </p>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>{formatFileSize(attachment.file_size)}</span>
                                                <span>•</span>
                                                <span>
                                                    {new Date(attachment.uploaded_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-3">
                                        <button
                                            onClick={() => handleViewFile(attachment)}
                                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                            title="Ver archivo"
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ver
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            ID de Incidencia: #{incident.id}
                        </p>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cerrar
                            </button>
                            
                            {isAdmin ? (
                                <button
                                    onClick={() => onAssign(incident)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Asignar Técnico
                                </button>
                            ) : isTechnician ? (
                                <button
                                    onClick={() => onSelfAssign(incident)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Tomar Incidencia
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncidentDetailModal;