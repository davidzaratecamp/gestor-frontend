import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { incidentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    CheckCircle, 
    Monitor, 
    User, 
    Calendar, 
    FileText, 
    Search,
    Download,
    History,
    XCircle,
    MessageCircle,
    Settings,
    ArrowLeft,
    Star
} from 'lucide-react';
import StarRating from '../StarRating';

const ApprovedIncidents = () => {
    const { isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
    const [typeFilter, setTypeFilter] = useState('all');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [incidentHistory, setIncidentHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [urlFilters, setUrlFilters] = useState({
        departamento: '',
        sede: ''
    });
    const [fromDashboard, setFromDashboard] = useState(false);

    useEffect(() => {
        // Procesar parámetros de URL al cargar el componente
        const searchParams = new URLSearchParams(location.search);
        const sedeParam = searchParams.get('sede');
        const departamentoParam = searchParams.get('departamento');
        
        if (sedeParam || departamentoParam) {
            setFromDashboard(true);
            const filters = {
                sede: sedeParam || '',
                departamento: departamentoParam || ''
            };
            setUrlFilters(filters);
        }
        
        loadApprovedIncidents();
    }, [location.search]);

    useEffect(() => {
        filterIncidents();
    }, [incidents, searchTerm, dateFilter, typeFilter]);

    const loadApprovedIncidents = async () => {
        try {
            setLoading(true);
            
            // Construir filtros para la API
            const filterParams = {};
            if (urlFilters.departamento) filterParams.departamento = urlFilters.departamento;
            if (urlFilters.sede && isAdmin) filterParams.sede = urlFilters.sede;
            
            const response = await incidentService.getApproved(filterParams);
            setIncidents(response.data);
        } catch (error) {
            console.error('Error cargando incidencias aprobadas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const getFilterDisplayText = () => {
        if (!fromDashboard) return '';
        
        const parts = [];
        if (urlFilters.sede) {
            const sedeLabel = urlFilters.sede === 'bogota' ? 'Bogotá' : 
                             urlFilters.sede === 'barranquilla' ? 'Barranquilla' : 
                             urlFilters.sede === 'villavicencio' ? 'Villavicencio' : urlFilters.sede;
            parts.push(`Ciudad: ${sedeLabel}`);
        }
        if (urlFilters.departamento) {
            const deptLabel = urlFilters.departamento === 'obama' ? 'Obama' :
                             urlFilters.departamento === 'majority' ? 'Majority' :
                             urlFilters.departamento === 'claro' ? 'Claro' : urlFilters.departamento;
            parts.push(`Departamento: ${deptLabel}`);
        }
        
        return parts.length > 0 ? ` (Filtrado por: ${parts.join(', ')})` : '';
    };

    const filterIncidents = () => {
        let filtered = incidents;

        // Filtro por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(incident => 
                incident.station_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                incident.technician_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                incident.reported_by_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro por fecha
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            filtered = filtered.filter(incident => {
                const incidentDate = new Date(incident.updated_at);
                
                switch (dateFilter) {
                    case 'today':
                        return incidentDate >= today;
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return incidentDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return incidentDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        // Filtro por tipo
        if (typeFilter !== 'all') {
            filtered = filtered.filter(incident => incident.failure_type === typeFilter);
        }

        setFilteredIncidents(filtered);
    };

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

    const handleViewHistory = async (incident) => {
        setSelectedIncident(incident);
        setHistoryLoading(true);
        setShowHistoryModal(true);
        
        try {
            const response = await incidentService.getHistory(incident.id);
            setIncidentHistory(response.data);
        } catch (error) {
            console.error('Error cargando historial:', error);
            alert('Error al cargar el historial');
        } finally {
            setHistoryLoading(false);
        }
    };

    const exportToExcel = () => {
        // Modal para confirmar exportación
        const confirmExport = window.confirm(
            `¿Exportar ${filteredIncidents.length} incidencia(s) a Excel?\n\n` +
            `Filtros aplicados:\n` +
            `- Búsqueda: ${searchTerm || 'Ninguno'}\n` +
            `- Fecha: ${dateFilter === 'all' ? 'Todas' : 
                     dateFilter === 'today' ? 'Hoy' :
                     dateFilter === 'week' ? 'Última semana' : 'Último mes'}\n` +
            `- Tipo: ${typeFilter === 'all' ? 'Todos' : getFailureTypeLabel(typeFilter)}`
        );
        
        if (!confirmExport) return;

        generateExcelReport();
    };

    const generateExcelReport = () => {
        // Crear los datos del reporte con información completa
        const reportData = filteredIncidents.map((incident, index) => ({
            'ID': incident.id,
            'Número': index + 1,
            'Estación de Trabajo': incident.station_code,
            'Ubicación': incident.location_details || 'N/A',
            'Tipo de Falla': getFailureTypeLabel(incident.failure_type),
            'Descripción del Problema': incident.description,
            'Técnico Asignado': incident.technician_name,
            'Supervisor que Reportó': incident.reported_by_name,
            'Fecha de Creación': new Date(incident.created_at).toLocaleDateString('es-ES'),
            'Hora de Creación': new Date(incident.created_at).toLocaleTimeString('es-ES'),
            'Fecha de Resolución': new Date(incident.updated_at).toLocaleDateString('es-ES'),
            'Hora de Resolución': new Date(incident.updated_at).toLocaleTimeString('es-ES'),
            'Estado': 'APROBADO',
            'Días para Resolución': Math.ceil((new Date(incident.updated_at) - new Date(incident.created_at)) / (1000 * 60 * 60 * 24))
        }));

        // Crear estadísticas del reporte
        const stats = {
            'Total de Incidencias': filteredIncidents.length,
            'Incidencias de Pantalla': filteredIncidents.filter(i => i.failure_type === 'pantalla').length,
            'Incidencias de Periféricos': filteredIncidents.filter(i => i.failure_type === 'perifericos').length,
            'Incidencias de Internet': filteredIncidents.filter(i => i.failure_type === 'internet').length,
            'Incidencias de Software': filteredIncidents.filter(i => i.failure_type === 'software').length,
            'Otras Incidencias': filteredIncidents.filter(i => i.failure_type === 'otro').length,
        };

        // Crear workbook
        const wb = XLSX.utils.book_new();

        // Hoja 1: Información del reporte
        const infoData = [
            ['REPORTE DE INCIDENCIAS APROBADAS - CALL CENTER SUPPORT'],
            [''],
            ['Generado el:', new Date().toLocaleDateString('es-ES')],
            ['Hora de generación:', new Date().toLocaleTimeString('es-ES')],
            ['Total de registros:', filteredIncidents.length],
            [''],
            ['ESTADÍSTICAS POR TIPO DE FALLA:'],
            ['Pantalla:', stats['Incidencias de Pantalla']],
            ['Periféricos:', stats['Incidencias de Periféricos']],
            ['Internet:', stats['Incidencias de Internet']],
            ['Software:', stats['Incidencias de Software']],
            ['Otros:', stats['Otras Incidencias']],
            [''],
            ['FILTROS APLICADOS:'],
            ['Filtro de búsqueda:', searchTerm || 'Ninguno'],
            ['Filtro de fecha:', dateFilter === 'all' ? 'Todas las fechas' : 
                               dateFilter === 'today' ? 'Hoy' :
                               dateFilter === 'week' ? 'Última semana' : 'Último mes'],
            ['Filtro de tipo:', typeFilter === 'all' ? 'Todos los tipos' : getFailureTypeLabel(typeFilter)]
        ];

        const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
        
        // Ajustar ancho de columnas para la hoja de información
        wsInfo['!cols'] = [
            { wch: 40 }, // Columna A más ancha
            { wch: 20 }  // Columna B
        ];

        // Agregar estilos básicos (título en negrita)
        if (wsInfo['A1']) wsInfo['A1'].s = { font: { bold: true, sz: 14 } };

        XLSX.utils.book_append_sheet(wb, wsInfo, 'Información del Reporte');

        // Hoja 2: Datos detallados
        const wsData = XLSX.utils.json_to_sheet(reportData);
        
        // Ajustar ancho de columnas
        wsData['!cols'] = [
            { wch: 8 },   // ID
            { wch: 8 },   // Número
            { wch: 15 },  // Estación
            { wch: 25 },  // Ubicación
            { wch: 15 },  // Tipo
            { wch: 50 },  // Descripción
            { wch: 20 },  // Técnico
            { wch: 20 },  // Supervisor
            { wch: 15 },  // Fecha Creación
            { wch: 15 },  // Hora Creación
            { wch: 15 },  // Fecha Resolución
            { wch: 15 },  // Hora Resolución
            { wch: 12 },  // Estado
            { wch: 12 }   // Días
        ];

        XLSX.utils.book_append_sheet(wb, wsData, 'Incidencias Detalladas');

        // Hoja 3: Resumen por técnico
        const technicianSummary = {};
        filteredIncidents.forEach(incident => {
            const tech = incident.technician_name;
            if (!technicianSummary[tech]) {
                technicianSummary[tech] = {
                    'Técnico': tech,
                    'Total Incidencias': 0,
                    'Pantalla': 0,
                    'Periféricos': 0,
                    'Internet': 0,
                    'Software': 0,
                    'Otros': 0
                };
            }
            technicianSummary[tech]['Total Incidencias']++;
            technicianSummary[tech][getFailureTypeLabel(incident.failure_type)]++;
        });

        const techSummaryData = Object.values(technicianSummary);
        const wsTechSummary = XLSX.utils.json_to_sheet(techSummaryData);
        
        wsTechSummary['!cols'] = [
            { wch: 25 }, // Técnico
            { wch: 15 }, // Total
            { wch: 12 }, // Pantalla
            { wch: 15 }, // Periféricos
            { wch: 12 }, // Internet
            { wch: 12 }, // Software
            { wch: 10 }  // Otros
        ];

        XLSX.utils.book_append_sheet(wb, wsTechSummary, 'Resumen por Técnico');

        // Generar archivo
        const fileName = `Reporte_Incidencias_Aprobadas_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const exportIncidentToPDF = async (incident) => {
        const confirmExport = window.confirm(
            `¿Generar reporte PDF de la incidencia ${incident.id}?\n\n` +
            `Estación: ${incident.station_code}\n` +
            `Tipo: ${getFailureTypeLabel(incident.failure_type)}\n` +
            `Técnico: ${incident.technician_name}`
        );
        
        if (!confirmExport) return;

        try {
            await generateSingleIncidentPDF(incident);
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Error al generar el reporte PDF');
        }
    };

    const generateSingleIncidentPDF = async (incident) => {
        // Crear PDF en orientación vertical
        const doc = new jsPDF('portrait');
        
        // Configurar fuente
        doc.setFont('helvetica');
        
        // Título del reporte
        doc.setFontSize(16);
        doc.text('REPORTE DETALLADO DE INCIDENCIA', 20, 20);
        doc.text('CALL CENTER SUPPORT', 20, 28);
        
        // Información básica
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, 40);
        
        // Detalles de la incidencia
        doc.setFontSize(12);
        doc.text('DETALLES DE LA INCIDENCIA:', 20, 50);
        doc.setFontSize(10);
        doc.text(`ID: ${incident.id}`, 20, 57);
        doc.text(`Estación de Trabajo: ${incident.station_code}`, 20, 62);
        doc.text(`Tipo de Falla: ${getFailureTypeLabel(incident.failure_type)}`, 20, 67);
        doc.text(`Técnico Asignado: ${incident.technician_name}`, 20, 72);
        doc.text(`Supervisor que Reportó: ${incident.reported_by_name}`, 20, 77);
        doc.text(`Fecha de Creación: ${new Date(incident.created_at).toLocaleDateString('es-ES')}`, 20, 82);
        doc.text(`Fecha de Aprobación: ${new Date(incident.updated_at).toLocaleDateString('es-ES')}`, 20, 87);
        
        // Descripción del problema
        doc.setFontSize(12);
        doc.text('DESCRIPCIÓN DEL PROBLEMA:', 20, 97);
        doc.setFontSize(10);
        const description = doc.splitTextToSize(incident.description, 170);
        doc.text(description, 20, 104);
        
        // Obtener y mostrar historial
        let yPosition = 104 + (description.length * 5) + 10;
        
        try {
            const historyResponse = await incidentService.getHistory(incident.id);
            const history = historyResponse.data;
            
            doc.setFontSize(12);
            doc.text('HISTORIAL COMPLETO DE LA INCIDENCIA:', 20, yPosition);
            yPosition += 10;
            
            if (history && history.length > 0) {
                // Preparar datos para la tabla de historial
                const historyTableData = history.map(entry => [
                    new Date(entry.timestamp).toLocaleDateString('es-ES'),
                    new Date(entry.timestamp).toLocaleTimeString('es-ES'),
                    entry.action,
                    entry.user_name,
                    entry.details || 'Sin comentarios adicionales'
                ]);
                
                // Crear tabla de historial
                autoTable(doc, {
                    startY: yPosition,
                    head: [[
                        'Fecha',
                        'Hora', 
                        'Acción Realizada',
                        'Usuario',
                        'Detalles/Comentarios'
                    ]],
                    body: historyTableData,
                    styles: {
                        fontSize: 8,
                        cellPadding: 2,
                        overflow: 'linebreak',
                        halign: 'left'
                    },
                    headStyles: {
                        fillColor: [66, 139, 202],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 8
                    },
                    columnStyles: {
                        0: { cellWidth: 20 },  // Fecha
                        1: { cellWidth: 15 },  // Hora  
                        2: { cellWidth: 35 },  // Acción
                        3: { cellWidth: 25 },  // Usuario
                        4: { cellWidth: 45 }   // Detalles
                    },
                    tableWidth: 'auto',
                    margin: { top: 10, right: 10, bottom: 20, left: 10 },
                    didDrawPage: function (data) {
                        // Header en cada página
                        doc.setFontSize(10);
                        doc.text(`Reporte Detallado - Incidencia #${incident.id}`, 20, 10);
                        
                        // Footer en cada página
                        const pageCount = doc.internal.getNumberOfPages();
                        const currentPage = data.pageNumber;
                        doc.text(`Página ${currentPage} de ${pageCount}`, 20, doc.internal.pageSize.height - 10);
                    }
                });
            } else {
                doc.setFontSize(10);
                doc.text('No hay historial disponible para esta incidencia.', 20, yPosition);
            }
            
        } catch (error) {
            console.warn(`Error obteniendo historial para incidencia ${incident.id}:`, error);
            doc.setFontSize(10);
            doc.text('Error al cargar el historial de la incidencia.', 20, yPosition);
        }
        
        // Guardar PDF
        const fileName = `Incidencia_${incident.id}_${incident.station_code}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                    <div className="flex items-center space-x-3">
                        {fromDashboard && (
                            <button
                                onClick={handleBackToDashboard}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Volver al Dashboard
                            </button>
                        )}
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Historial de Incidencias Aprobadas{getFilterDisplayText()}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                                Registro completo de todas las incidencias resueltas y aprobadas
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="bg-green-50 px-3 sm:px-4 py-2 rounded-lg">
                        <span className="text-green-700 font-medium text-sm">
                            {filteredIncidents.length} de {incidents.length} incidencia(s)
                        </span>
                    </div>
                    {filteredIncidents.length > 0 && (
                        <button
                            onClick={exportToExcel}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto justify-center"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Excel ({filteredIncidents.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Búsqueda */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar incidencias..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filtro por fecha */}
                    <div>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todas las fechas</option>
                            <option value="today">Hoy</option>
                            <option value="week">Última semana</option>
                            <option value="month">Último mes</option>
                        </select>
                    </div>

                    {/* Filtro por tipo */}
                    <div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="pantalla">Pantalla</option>
                            <option value="perifericos">Periféricos</option>
                            <option value="internet">Internet</option>
                            <option value="software">Software</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de incidencias */}
            {filteredIncidents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    {incidents.length === 0 ? (
                        <>
                            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay incidencias aprobadas
                            </h3>
                            <p className="text-gray-500">
                                Las incidencias aprobadas aparecerán aquí.
                            </p>
                        </>
                    ) : (
                        <>
                            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No se encontraron resultados
                            </h3>
                            <p className="text-gray-500">
                                Intenta ajustar los filtros de búsqueda.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-4">
                            {filteredIncidents.map((incident) => (
                                <div key={incident.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Monitor className="h-4 w-4 mr-1" />
                                                    <span className="font-medium">{incident.station_code}</span>
                                                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {incident.sede?.toUpperCase()} - {incident.departamento?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${getFailureTypeColor(incident.failure_type)}`}>
                                                    {getFailureTypeLabel(incident.failure_type)}
                                                </span>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <User className="h-4 w-4 mr-1" />
                                                    <span className="text-xs sm:text-sm">Técnico: {incident.technician_name}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start space-x-2 mb-2">
                                                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-gray-900 font-medium">
                                                    {incident.description}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    <span className="text-xs sm:text-sm">
                                                        Aprobado: {new Date(incident.updated_at).toLocaleDateString()}
                                                        <span className="hidden sm:inline"> a las {new Date(incident.updated_at).toLocaleTimeString()}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-1" />
                                                    <span className="text-xs sm:text-sm">Supervisor: {incident.reported_by_name}</span>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Aprobado
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="ml-0 sm:ml-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3 sm:mt-0">
                                            <button
                                                onClick={() => handleViewHistory(incident)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 justify-center"
                                            >
                                                <History className="h-4 w-4 mr-1" />
                                                <span className="hidden sm:inline">Ver Historial</span>
                                                <span className="sm:hidden">Historial</span>
                                            </button>
                                            <button
                                                onClick={() => exportIncidentToPDF(incident)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 justify-center"
                                            >
                                                <FileText className="h-4 w-4 mr-1" />
                                                PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Estadísticas rápidas */}
            {incidents.length > 0 && (
                <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-green-600">{incidents.length}</div>
                            <div className="text-xs sm:text-sm text-gray-500">Total Aprobadas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">
                                {incidents.filter(i => i.failure_type === 'perifericos').length}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">Periféricos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-purple-600">
                                {incidents.filter(i => i.failure_type === 'pantalla').length}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">Pantalla</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-red-600">
                                {incidents.filter(i => i.failure_type === 'internet').length}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">Internet</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ver historial */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-4 sm:top-10 mx-auto p-4 sm:p-5 border max-w-2xl shadow-lg rounded-md bg-white m-4">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <History className="h-6 w-6 text-blue-600 mr-2" />
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Historial de Incidencia
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600">
                                    <strong>Estación:</strong> {selectedIncident?.station_code}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Tipo:</strong> {getFailureTypeLabel(selectedIncident?.failure_type)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Descripción:</strong> {selectedIncident?.description}
                                </p>
                                {selectedIncident?.anydesk_address && (
                                    <p className="text-sm text-gray-600">
                                        <strong>AnyDesk:</strong> <span className="font-mono text-blue-600">{selectedIncident.anydesk_address}</span>
                                    </p>
                                )}
                                {selectedIncident?.advisor_cedula && (
                                    <p className="text-sm text-gray-600">
                                        <strong>Cédula del Agente:</strong> <span className="font-mono">{selectedIncident.advisor_cedula}</span>
                                    </p>
                                )}
                                <p className="text-sm text-gray-600">
                                    <strong>Técnico Asignado:</strong> {selectedIncident?.technician_name}
                                </p>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-3">Historial de Acciones:</h4>
                                
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : incidentHistory.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No hay historial disponible
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                                        {incidentHistory.map((entry, index) => (
                                            <div key={entry.id || index} className="border-l-4 border-blue-200 pl-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            {entry.action.includes('Rechazado') ? (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            ) : entry.action.includes('Aprobado') ? (
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                            ) : entry.action.includes('resuelto') || entry.action.includes('Marcado') ? (
                                                                <Settings className="h-4 w-4 text-blue-500" />
                                                            ) : entry.action.includes('Asignación') ? (
                                                                <User className="h-4 w-4 text-purple-500" />
                                                            ) : (
                                                                <MessageCircle className="h-4 w-4 text-gray-500" />
                                                            )}
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {entry.action}
                                                            </span>
                                                        </div>
                                                        
                                                        <p className="text-sm text-gray-600 mb-1">
                                                            Por: <strong>{entry.user_name}</strong>
                                                        </p>
                                                        
                                                        {entry.details && (
                                                            <div className={`text-sm p-2 rounded mt-2 ${
                                                                entry.action.includes('Rechazado') 
                                                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                                                    : entry.action.includes('resuelto') || entry.action.includes('Marcado')
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                    : 'bg-gray-50 text-gray-700'
                                                            }`}>
                                                                <strong>
                                                                    {entry.action.includes('Rechazado') ? 'Motivo del rechazo: ' :
                                                                     entry.action.includes('resuelto') || entry.action.includes('Marcado') ? 'Notas del técnico: ' :
                                                                     'Detalles: '}
                                                                </strong>
                                                                {entry.details}
                                                            </div>
                                                        )}

                                                        {/* Mostrar calificación si existe (solo para admins para evitar conflictos) */}
                                                        {isAdmin && entry.action.includes('Aprobado') && entry.technician_rating && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <Star className="h-4 w-4 text-yellow-600" />
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        Calificación del Técnico
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <StarRating 
                                                                        rating={entry.technician_rating} 
                                                                        readonly={true} 
                                                                        size="sm" 
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-gray-600">
                                                                    Calificado por: <strong>{entry.rated_by_name}</strong>
                                                                </p>
                                                                {entry.rating_feedback && (
                                                                    <p className="text-sm text-gray-700 mt-2">
                                                                        <strong>Comentarios:</strong> {entry.rating_feedback}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <span className="text-xs text-gray-500 ml-2 text-right">
                                                        <span className="block">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                                        <span className="block sm:hidden">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                                        <span className="hidden sm:block">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovedIncidents;