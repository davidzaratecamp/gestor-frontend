import React, { useState, useEffect, useMemo } from 'react';
import { workstationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Monitor,
    Search,
    MapPin,
    AlertTriangle,
    TrendingUp,
    BarChart3,
    Calendar,
    Download,
    X,
    Clock,
    User,
    Wrench,
    CheckCircle,
    XCircle,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    History,
    FileText,
} from 'lucide-react';

const SEDES = [
    { value: 'bogota',         label: 'Bogotá' },
    { value: 'barranquilla',   label: 'Barranquilla' },
];

const DEPARTAMENTOS = [
    { value: 'claro',            label: 'Claro' },
    { value: 'obama',            label: 'Obama' },
    { value: 'vital',            label: 'Vital' },
    { value: 'tecnologia',       label: 'Tecnología' },
    { value: 'reclutamiento',    label: 'Reclutamiento' },
    { value: 'rrhh',             label: 'Recursos Humanos' },
    { value: 'formacion_claro',  label: 'Sala Formación Claro' },
    { value: 'formacion_obama',  label: 'Sala Formación Obama' },
    { value: 'recepcion',        label: 'Recepción' },
    { value: 'area_financiera',  label: 'Área Financiera' },
];

const FAILURE_LABELS = {
    pantalla:    'Pantalla',
    perifericos: 'Periféricos',
    internet:    'Internet',
    software:    'Software',
    otro:        'Otro',
};

const FAILURE_COLORS = {
    pantalla:    'bg-blue-100 text-blue-800',
    perifericos: 'bg-purple-100 text-purple-800',
    internet:    'bg-red-100 text-red-800',
    software:    'bg-green-100 text-green-800',
    otro:        'bg-gray-100 text-gray-700',
};

const STATUS_INFO = {
    pendiente:      { label: 'Pendiente',      color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    en_proceso:     { label: 'En Proceso',     color: 'bg-blue-100 text-blue-800',     icon: Wrench },
    en_supervision: { label: 'En Supervisión', color: 'bg-purple-100 text-purple-800', icon: Clock },
    aprobado:       { label: 'Aprobado',       color: 'bg-green-100 text-green-800',   icon: CheckCircle },
    rechazado:      { label: 'Rechazado',      color: 'bg-red-100 text-red-800',       icon: XCircle },
    devuelto:       { label: 'Devuelto',       color: 'bg-orange-100 text-orange-800', icon: RotateCcw },
};

const SORT_OPTIONS = [
    { value: 'failures_desc', label: 'Más fallas primero' },
    { value: 'failures_asc',  label: 'Menos fallas primero' },
    { value: 'station_code',  label: 'Código de estación' },
    { value: 'created_date',  label: 'Fecha de creación' },
];

function getRiskLevel(riskScore) {
    if (riskScore >= 70) return { level: 'Alto',      color: 'bg-red-100 text-red-800 border-red-200',          cardBorder: 'border-red-200 bg-red-50',      icon: '🔴' };
    if (riskScore >= 40) return { level: 'Medio',     color: 'bg-yellow-100 text-yellow-800 border-yellow-200', cardBorder: 'border-yellow-200 bg-yellow-50', icon: '🟡' };
    if (riskScore  >  0) return { level: 'Bajo',      color: 'bg-green-100 text-green-800 border-green-200',    cardBorder: 'border-green-200 bg-green-50',  icon: '🟢' };
    return                       { level: 'Sin datos', color: 'bg-gray-100 text-gray-600 border-gray-200',      cardBorder: 'border-gray-200',               icon: '⚪' };
}

// ─── Modal de historial ───────────────────────────────────────────────────────
const WorkstationHistoryModal = ({ station, isIronManTheme, onClose }) => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [expanded, setExpanded]   = useState({});   // { [incidentId]: bool }

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await workstationService.getHistory(station.workstation_id);
                setIncidents(res.data);
            } catch {
                setError('No se pudo cargar el historial');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [station.workstation_id]);

    const toggleExpand = (id) =>
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const base   = isIronManTheme ? 'bg-[#0F172A] border-cyan-500/30 text-[#E5E7EB]' : 'bg-white text-gray-900';
    const sub    = isIronManTheme ? 'bg-[#0B0F14] border-cyan-500/20'                : 'bg-gray-50 border-gray-200';
    const muted  = isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500';
    const divider = isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-start justify-center pt-10 pb-10 px-4">
            <div className={`relative w-full max-w-3xl rounded-xl shadow-2xl border ${base} ${isIronManTheme ? 'shadow-cyan-500/10' : ''}`}>

                {/* Header */}
                <div className={`flex items-start justify-between p-5 border-b ${divider}`}>
                    <div className="flex items-center space-x-3">
                        <History className={`h-6 w-6 flex-shrink-0 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`} />
                        <div>
                            <h2 className="text-lg font-bold">{station.station_code}</h2>
                            <p className={`text-sm ${muted}`}>
                                {SEDES.find(s => s.value === station.sede)?.label || station.sede}
                                {station.departamento && ` · ${DEPARTAMENTOS.find(d => d.value === station.departamento)?.label || station.departamento}`}
                                {station.location_details && ` · ${station.location_details}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`ml-4 p-1 rounded-full transition-colors ${isIronManTheme ? 'hover:bg-[#0B0F14] text-[#94A3B8] hover:text-[#00E5FF]' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Resumen rápido */}
                {!loading && !error && (
                    <div className={`grid grid-cols-3 divide-x ${isIronManTheme ? 'divide-cyan-500/20 bg-[#0B0F14]' : 'divide-gray-200 bg-gray-50'} px-0 py-0`}>
                        <div className="py-3 text-center">
                            <p className={`text-2xl font-bold ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`}>{incidents.length}</p>
                            <p className={`text-xs ${muted}`}>Total incidencias</p>
                        </div>
                        <div className="py-3 text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {incidents.filter(i => i.status === 'aprobado').length}
                            </p>
                            <p className={`text-xs ${muted}`}>Resueltas</p>
                        </div>
                        <div className="py-3 text-center">
                            <p className="text-2xl font-bold text-orange-500">
                                {incidents.filter(i => !['aprobado','rechazado'].includes(i.status)).length}
                            </p>
                            <p className={`text-xs ${muted}`}>Activas</p>
                        </div>
                    </div>
                )}

                {/* Cuerpo */}
                <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${isIronManTheme ? 'border-[#00E5FF]' : 'border-blue-600'}`} />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {!loading && !error && incidents.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className={`h-10 w-10 mx-auto mb-3 ${muted}`} />
                            <p className={muted}>Este equipo no tiene incidencias registradas</p>
                        </div>
                    )}

                    {!loading && !error && incidents.map((inc, idx) => {
                        const statusInfo = STATUS_INFO[inc.status] || STATUS_INFO.pendiente;
                        const StatusIcon = statusInfo.icon;
                        const isOpen     = expanded[inc.id];
                        const failureColor = FAILURE_COLORS[inc.failure_type] || 'bg-gray-100 text-gray-700';

                        return (
                            <div key={inc.id} className={`border rounded-lg overflow-hidden ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                                {/* Fila principal — siempre visible */}
                                <div
                                    className={`flex items-start justify-between p-3 cursor-pointer transition-colors
                                        ${isIronManTheme ? 'hover:bg-[#0B0F14]' : 'hover:bg-gray-50'}`}
                                    onClick={() => toggleExpand(inc.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            {/* Número de orden */}
                                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isIronManTheme ? 'bg-[#0B0F14] text-[#94A3B8]' : 'bg-gray-100 text-gray-500'}`}>
                                                #{idx + 1}
                                            </span>
                                            {/* Badge estado */}
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                                <StatusIcon className="h-3 w-3" />
                                                {statusInfo.label}
                                            </span>
                                            {/* Badge tipo falla */}
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${failureColor}`}>
                                                {FAILURE_LABELS[inc.failure_type] || inc.failure_type}
                                            </span>
                                            {inc.return_count > 0 && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                                                    {inc.return_count} devolución(es)
                                                </span>
                                            )}
                                        </div>

                                        <p className={`text-sm truncate ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-800'}`}>
                                            {inc.description}
                                        </p>

                                        <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs ${muted}`}>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(inc.created_at).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}
                                                {' · '}
                                                {new Date(inc.created_at).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}
                                            </span>
                                            {inc.technician_name && (
                                                <span className="flex items-center gap-1">
                                                    <Wrench className="h-3 w-3" />
                                                    {inc.technician_name}
                                                </span>
                                            )}
                                            {inc.reported_by_name && (
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {inc.reported_by_name}
                                                </span>
                                            )}
                                            {inc.status === 'aprobado' && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <Clock className="h-3 w-3" />
                                                    Resuelto en {inc.hours_open}h
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`ml-3 flex-shrink-0 ${muted}`}>
                                        {isOpen
                                            ? <ChevronUp className="h-4 w-4" />
                                            : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                </div>

                                {/* Historial de acciones — expandible */}
                                {isOpen && (
                                    <div className={`border-t px-4 py-3 space-y-2 ${isIronManTheme ? 'border-cyan-500/20 bg-[#0B0F14]' : 'border-gray-100 bg-gray-50'}`}>
                                        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`}>
                                            Línea de tiempo
                                        </p>
                                        {inc.history.length === 0 && (
                                            <p className={`text-xs ${muted}`}>Sin acciones registradas</p>
                                        )}
                                        {inc.history.map((h, hIdx) => {
                                            const isApproved = h.action.includes('Aprobado');
                                            const isRejected = h.action.includes('Rechazado');
                                            const isReturned = h.action.includes('Devuelto');
                                            const dotColor   = isApproved ? 'bg-green-500'
                                                             : isRejected ? 'bg-red-500'
                                                             : isReturned ? 'bg-orange-500'
                                                             : (isIronManTheme ? 'bg-[#00E5FF]' : 'bg-blue-500');

                                            return (
                                                <div key={hIdx} className="flex gap-3">
                                                    {/* Línea vertical + punto */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                                                        {hIdx < inc.history.length - 1 && (
                                                            <div className={`flex-1 w-px mt-1 ${isIronManTheme ? 'bg-cyan-500/20' : 'bg-gray-300'}`} style={{ minHeight: '12px' }} />
                                                        )}
                                                    </div>

                                                    <div className="pb-3 min-w-0">
                                                        <div className="flex flex-wrap items-baseline gap-x-2">
                                                            <span className={`text-xs font-semibold ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-800'}`}>
                                                                {h.action}
                                                            </span>
                                                            <span className={`text-xs ${muted}`}>
                                                                por {h.user_name}
                                                            </span>
                                                            <span className={`text-xs ${muted}`}>
                                                                · {new Date(h.timestamp).toLocaleDateString('es-CO', { day:'2-digit', month:'short' })}
                                                                {' '}
                                                                {new Date(h.timestamp).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}
                                                            </span>
                                                        </div>
                                                        {h.details && (
                                                            <p className={`text-xs mt-0.5 break-words ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                                                {h.details}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className={`flex justify-end p-4 border-t ${divider}`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                            ${isIronManTheme
                                ? 'bg-[#0B0F14] border border-cyan-500/30 text-[#94A3B8] hover:text-[#00E5FF]'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const WorkstationManagement = () => {
    const { user } = useAuth();
    const isIronManTheme = user?.username === 'davidlopez10';

    const [stations, setStations]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');
    const [searchTerm, setSearchTerm]       = useState('');
    const [sedeFilter, setSedeFilter]       = useState('all');
    const [deptFilter, setDeptFilter]       = useState('all');
    const [sortBy, setSortBy]               = useState('failures_desc');
    const [riskFilter, setRiskFilter]       = useState('all');
    const [selectedStation, setSelectedStation] = useState(null);   // para el modal

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await workstationService.getStats();
            setStations(response.data);
        } catch (err) {
            console.error('Error cargando estadísticas:', err);
            setError('Error al cargar los datos de las estaciones');
        } finally {
            setLoading(false);
        }
    };

    const totalIncidents = useMemo(
        () => stations.reduce((sum, s) => sum + Number(s.total_incidents), 0),
        [stations]
    );
    const highRiskCount  = useMemo(() => stations.filter(s => s.risk_score >= 70).length, [stations]);
    const mediumRiskCount = useMemo(() => stations.filter(s => s.risk_score >= 40 && s.risk_score < 70).length, [stations]);

    const filteredStations = useMemo(() => {
        let list = stations;

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter(s =>
                s.station_code.toLowerCase().includes(q) ||
                (s.location_details && s.location_details.toLowerCase().includes(q))
            );
        }
        if (sedeFilter !== 'all') list = list.filter(s => s.sede === sedeFilter);
        if (deptFilter !== 'all') list = list.filter(s => s.departamento === deptFilter);
        if (riskFilter === 'high')   list = list.filter(s => s.risk_score >= 70);
        if (riskFilter === 'medium') list = list.filter(s => s.risk_score >= 40 && s.risk_score < 70);
        if (riskFilter === 'low')    list = list.filter(s => s.risk_score > 0 && s.risk_score < 40);

        return [...list].sort((a, b) => {
            switch (sortBy) {
                case 'failures_desc':  return Number(b.total_incidents) - Number(a.total_incidents);
                case 'failures_asc':   return Number(a.total_incidents) - Number(b.total_incidents);
                case 'station_code':   return a.station_code.localeCompare(b.station_code);
                case 'created_date':   return new Date(b.created_at) - new Date(a.created_at);
                default:               return 0;
            }
        });
    }, [stations, searchTerm, sedeFilter, deptFilter, sortBy, riskFilter]);

    const exportToCSV = () => {
        const rows = filteredStations.map(s => {
            const risk = getRiskLevel(s.risk_score);
            return {
                'Código':                       s.station_code,
                'Sede':                         SEDES.find(x => x.value === s.sede)?.label || s.sede,
                'Departamento':                 DEPARTAMENTOS.find(x => x.value === s.departamento)?.label || s.departamento,
                'Ubicación':                    s.location_details || 'N/A',
                'AnyDesk':                      s.sede === 'barranquilla' ? (s.anydesk_address || 'N/A') : 'N/A',
                'Cédula Asesor':                s.sede === 'barranquilla' ? (s.advisor_cedula  || 'N/A') : 'N/A',
                'Total Incidencias':            s.total_incidents,
                'Activas':                      s.pending_incidents,
                'Resueltas':                    s.resolved_incidents,
                'Nivel de Riesgo':              risk.level,
                'Puntuación de Riesgo':         Math.round(s.risk_score),
                'Tiempo Prom. Resolución (h)':  s.avg_resolution_hours,
                'Última Incidencia':            s.last_incident_date
                    ? new Date(s.last_incident_date).toLocaleDateString()
                    : 'Nunca',
            };
        });

        const csv = [
            Object.keys(rows[0] || {}).join(','),
            ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `estaciones_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isIronManTheme ? 'bg-[#0B0F14] p-6 rounded-xl' : ''}`}>

            {/* Modal historial */}
            {selectedStation && (
                <WorkstationHistoryModal
                    station={selectedStation}
                    isIronManTheme={isIronManTheme}
                    onClose={() => setSelectedStation(null)}
                />
            )}

            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                    <h1 className={`text-xl sm:text-2xl font-bold ${isIronManTheme ? 'text-[#E5E7EB] ironman-glow' : 'text-gray-900'}`}>
                        Gestión de Estaciones
                    </h1>
                    <p className={`text-sm sm:text-base mt-1 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                        Monitoreo de estaciones de trabajo y análisis de fallas
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className={`px-3 py-2 rounded-lg ${isIronManTheme ? 'bg-cyan-500/10' : 'bg-blue-50'}`}>
                        <span className={`font-medium text-sm ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-700'}`}>
                            {filteredStations.length} de {stations.length} estación(es)
                        </span>
                    </div>
                    {filteredStations.length > 0 && (
                        <button
                            onClick={exportToCSV}
                            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none
                                ${isIronManTheme
                                    ? 'border-cyan-500/30 text-[#94A3B8] bg-[#0F172A] hover:bg-[#0B0F14]'
                                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Exportar CSV
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg shadow border ${isIronManTheme ? 'bg-[#0F172A] border-cyan-500/20' : 'bg-white'}`}>
                    <div className="flex items-center">
                        <Monitor className={`h-8 w-8 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`} />
                        <div className="ml-3">
                            <p className={`text-sm font-medium ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Total Estaciones</p>
                            <p className={`text-2xl font-bold ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>{stations.length}</p>
                        </div>
                    </div>
                </div>

                <div
                    className={`p-4 rounded-lg shadow border cursor-pointer transition-all hover:shadow-md
                        ${riskFilter === 'high' ? 'ring-2 ring-red-500 bg-red-50' : (isIronManTheme ? 'bg-[#0F172A] border-cyan-500/20 hover:bg-[#0B0F14]' : 'bg-white hover:bg-red-50')}`}
                    onClick={() => setRiskFilter(riskFilter === 'high' ? 'all' : 'high')}
                >
                    <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        <div className="ml-3">
                            <p className={`text-sm font-medium ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Alto Riesgo</p>
                            <p className={`text-2xl font-bold ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>{highRiskCount}</p>
                        </div>
                    </div>
                </div>

                <div
                    className={`p-4 rounded-lg shadow border cursor-pointer transition-all hover:shadow-md
                        ${riskFilter === 'medium' ? 'ring-2 ring-yellow-500 bg-yellow-50' : (isIronManTheme ? 'bg-[#0F172A] border-cyan-500/20 hover:bg-[#0B0F14]' : 'bg-white hover:bg-yellow-50')}`}
                    onClick={() => setRiskFilter(riskFilter === 'medium' ? 'all' : 'medium')}
                >
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-yellow-600" />
                        <div className="ml-3">
                            <p className={`text-sm font-medium ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Riesgo Medio</p>
                            <p className={`text-2xl font-bold ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>{mediumRiskCount}</p>
                        </div>
                    </div>
                </div>

                <div className={`p-4 rounded-lg shadow border ${isIronManTheme ? 'bg-[#0F172A] border-cyan-500/20' : 'bg-white'}`}>
                    <div className="flex items-center">
                        <BarChart3 className={`h-8 w-8 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-green-600'}`} />
                        <div className="ml-3">
                            <p className={`text-sm font-medium ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>Total Incidencias</p>
                            <p className={`text-2xl font-bold ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>{totalIncidents.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className={`shadow rounded-lg p-4 ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white'}`}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className={`h-5 w-5 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por código o ubicación..."
                            className={`block w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1
                                ${isIronManTheme
                                    ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] placeholder-[#94A3B8] focus:ring-cyan-500/50'
                                    : 'border-gray-300 bg-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'}`}
                        />
                    </div>
                    <select value={sedeFilter} onChange={e => setSedeFilter(e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1
                            ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'}`}>
                        <option value="all">Todas las sedes</option>
                        {SEDES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1
                            ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'}`}>
                        <option value="all">Todos los departamentos</option>
                        {DEPARTAMENTOS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1
                            ${isIronManTheme ? 'border-cyan-500/30 bg-[#0B0F14] text-[#E5E7EB] focus:ring-cyan-500/50' : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'}`}>
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Lista de estaciones */}
            {filteredStations.length === 0 ? (
                <div className={`text-center py-12 rounded-lg shadow ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white'}`}>
                    <Monitor className={`h-12 w-12 mx-auto mb-4 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                        {stations.length === 0 ? 'No hay estaciones registradas' : 'No se encontraron estaciones'}
                    </h3>
                    <p className={isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}>
                        {stations.length === 0
                            ? 'Las estaciones se crean automáticamente al reportar incidencias'
                            : 'Intenta ajustar los filtros de búsqueda'}
                    </p>
                </div>
            ) : (
                <div className={`shadow overflow-hidden sm:rounded-lg ${isIronManTheme ? 'bg-[#0F172A] border border-cyan-500/20' : 'bg-white'}`}>
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-4">
                            {filteredStations.map(station => {
                                const risk = getRiskLevel(station.risk_score);

                                const failureTypes = {};
                                if (station.pantalla_count    > 0) failureTypes.pantalla    = station.pantalla_count;
                                if (station.perifericos_count > 0) failureTypes.perifericos = station.perifericos_count;
                                if (station.internet_count    > 0) failureTypes.internet    = station.internet_count;
                                if (station.software_count    > 0) failureTypes.software    = station.software_count;
                                if (station.otro_count        > 0) failureTypes.otro        = station.otro_count;

                                const topFailures = Object.entries(failureTypes)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3);

                                return (
                                    <div
                                        key={station.workstation_id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                                            ${isIronManTheme
                                                ? 'border-cyan-500/20 bg-[#0B0F14] hover:border-cyan-500/50'
                                                : `${risk.cardBorder} hover:shadow-md`}`}
                                        onClick={() => setSelectedStation(station)}
                                        title="Clic para ver historial completo"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
                                            <div className="flex-1">
                                                {/* Línea 1: código + riesgo + hint */}
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    <div className="flex items-center">
                                                        <Monitor className={`h-5 w-5 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-gray-600'}`} />
                                                        <span className={`text-lg font-bold ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                                                            {station.station_code}
                                                        </span>
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${risk.color}`}>
                                                        {risk.icon} {risk.level} Riesgo ({Math.round(station.risk_score)})
                                                    </span>
                                                    <span className={`text-xs flex items-center gap-1 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-400'}`}>
                                                        <History className="h-3 w-3" />
                                                        Ver historial
                                                    </span>
                                                </div>

                                                {/* Línea 2: ubicación */}
                                                <div className={`flex flex-wrap items-center gap-4 text-sm mb-3 ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                                                    <div className="flex items-center">
                                                        <MapPin className="h-4 w-4 mr-1" />
                                                        <span>
                                                            {SEDES.find(s => s.value === station.sede)?.label || station.sede}
                                                            {station.departamento && ` - ${DEPARTAMENTOS.find(d => d.value === station.departamento)?.label || station.departamento}`}
                                                        </span>
                                                    </div>
                                                    {station.location_details && <span>{station.location_details}</span>}
                                                </div>

                                                {/* Info remota Barranquilla */}
                                                {station.sede === 'barranquilla' && (station.anydesk_address || station.advisor_cedula) && (
                                                    <div className={`rounded-lg p-3 mb-3 ${isIronManTheme ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                                                        <h4 className={`text-sm font-semibold mb-2 flex items-center ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-900'}`}>
                                                            <Monitor className="h-4 w-4 mr-2" />
                                                            Trabajo Remoto
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                            {station.anydesk_address && (
                                                                <div>
                                                                    <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>AnyDesk:</span>
                                                                    <span className={`ml-2 font-mono px-2 py-0.5 rounded ${isIronManTheme ? 'bg-[#0B0F14] text-[#00E5FF]' : 'bg-gray-100 text-blue-800'}`}>
                                                                        {station.anydesk_address}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {station.advisor_cedula && (
                                                                <div>
                                                                    <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-700'}`}>Cédula Asesor:</span>
                                                                    <span className={`ml-2 font-mono px-2 py-0.5 rounded ${isIronManTheme ? 'bg-[#0B0F14] text-[#00E5FF]' : 'bg-gray-100 text-blue-800'}`}>
                                                                        {station.advisor_cedula}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Estadísticas */}
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>Total Incidencias:</span>
                                                        <span className={`ml-1 font-bold ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`}>{station.total_incidents}</span>
                                                    </div>
                                                    <div>
                                                        <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>Activas:</span>
                                                        <span className={`ml-1 font-bold ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'}`}>{station.pending_incidents}</span>
                                                    </div>
                                                    <div>
                                                        <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>Resueltas:</span>
                                                        <span className="ml-1 font-bold text-green-600">{station.resolved_incidents}</span>
                                                    </div>
                                                    <div>
                                                        <span className={`font-medium ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>Tiempo Promedio:</span>
                                                        <span className={`ml-1 font-bold ${isIronManTheme ? 'text-[#94A3B8]' : 'text-purple-600'}`}>{station.avg_resolution_hours}h</span>
                                                    </div>
                                                </div>

                                                {/* Fallas más comunes */}
                                                {topFailures.length > 0 && (
                                                    <div className={`mt-3 pt-3 border-t ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                                                        <p className={`text-sm font-medium mb-2 ${isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900'}`}>
                                                            Fallas más comunes:
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {topFailures.map(([type, count]) => (
                                                                <span key={type} className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${isIronManTheme ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-gray-100 text-gray-800'}`}>
                                                                    {FAILURE_LABELS[type] || type}: {count}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {station.last_incident_date && (
                                                    <div className={`mt-2 text-xs ${isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                                                        <Calendar className="h-3 w-3 inline mr-1" />
                                                        Última incidencia: {new Date(station.last_incident_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkstationManagement;
