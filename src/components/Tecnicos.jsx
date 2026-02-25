import React, { useState, useEffect, useCallback } from 'react';
import { analyticsService, incidentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
    Trophy,
    Users,
    CheckCircle,
    Clock,
    Star,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import StarRating from './StarRating';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

const toDateString = (year, month, day) =>
    `${year}-${pad(month + 1)}-${pad(day)}`;

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const firstWeekdayOfMonth = (year, month) => {
    // 0=Sun … 6=Sat → convert to Mon-first (0=Mon … 6=Sun)
    const d = new Date(year, month, 1).getDay();
    return (d + 6) % 7;
};

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const getPeriodDates = (period) => {
    const today = new Date();
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    switch (period) {
        case 'today': return { start: fmt(today), end: fmt(today) };
        case 'week': {
            const mon = new Date(today);
            mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
            return { start: fmt(mon), end: fmt(today) };
        }
        case 'month': {
            const first = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: fmt(first), end: fmt(today) };
        }
        default: return { start: null, end: null };
    }
};

// ─── Main component ───────────────────────────────────────────────────────────

const Tecnicos = () => {
    const { user } = useAuth();
    const isIronManTheme = user?.username === 'davidlopez10';

    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [technicianPerformance, setTechnicianPerformance] = useState([]);
    const [perfPeriod, setPerfPeriod] = useState('all'); // 'all' | 'week' | 'custom'
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // ── Individual tab state ──────────────────────────────────────────────────
    const [selectedTechId, setSelectedTechId] = useState('');
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [dailyStats, setDailyStats] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null); // { date, assigned, resolved, returned }
    const [dayIncidents, setDayIncidents] = useState([]);
    const [dayIncidentsLoading, setDayIncidentsLoading] = useState(false);
    const [expandedIncidentId, setExpandedIncidentId] = useState(null);
    const [expandedIncidentDetails, setExpandedIncidentDetails] = useState({});

    // ── Theme helpers ─────────────────────────────────────────────────────────
    const cardClass = isIronManTheme
        ? 'rounded-lg p-4 border border-cyan-500/20'
        : 'bg-white rounded-lg shadow p-4';
    const cardStyle = isIronManTheme ? { backgroundColor: '#0F172A' } : {};

    const textPrimaryClass = isIronManTheme ? 'text-cyan-400' : 'text-gray-900';
    const textSecondaryClass = isIronManTheme ? 'text-gray-400' : 'text-gray-500';

    const chartColors = isIronManTheme
        ? {
              primary: ['#00E5FF', '#00B4D8', '#E10600', '#FF6A00'],
              gradient: {
                  blue: 'rgba(0,229,255,0.6)',
                  green: 'rgba(0,180,216,0.6)',
                  yellow: 'rgba(255,106,0,0.6)',
                  red: 'rgba(225,6,0,0.6)'
              }
          }
        : {
              primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
              gradient: {
                  blue: 'rgba(59,130,246,0.6)',
                  green: 'rgba(16,185,129,0.6)',
                  yellow: 'rgba(245,158,11,0.6)',
                  red: 'rgba(239,68,68,0.6)'
              }
          };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: isIronManTheme ? '#94A3B8' : '#374151' } },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            x: {
                ticks: { color: isIronManTheme ? '#94A3B8' : '#374151' },
                grid: { color: isIronManTheme ? 'rgba(0,229,255,0.1)' : 'rgba(0,0,0,0.05)' }
            },
            y: {
                ticks: { color: isIronManTheme ? '#94A3B8' : '#374151' },
                grid: { color: isIronManTheme ? 'rgba(0,229,255,0.1)' : 'rgba(0,0,0,0.05)' },
                beginAtZero: true
            }
        }
    };

    // ── Load general data ─────────────────────────────────────────────────────
    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            let start = null, end = null;
            if (perfPeriod === 'week') {
                const dates = getPeriodDates('week');
                start = dates.start; end = dates.end;
            } else if (perfPeriod === 'custom' && customStart && customEnd) {
                start = customStart; end = customEnd;
            }
            const res = await analyticsService.getTechnicianPerformance(start, end);
            setTechnicianPerformance(res.data);
            if (res.data.length > 0 && !selectedTechId) {
                setSelectedTechId(String(res.data[0].id));
            }
        } catch {
            setError('Error al cargar los datos de técnicos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (perfPeriod === 'custom' && (!customStart || !customEnd)) return;
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [perfPeriod, customStart, customEnd]);

    // ── Load daily stats when tech / month changes ────────────────────────────
    const loadDailyStats = useCallback(async () => {
        if (!selectedTechId) return;
        try {
            setDailyLoading(true);
            setSelectedDay(null);
            const firstDay = toDateString(calendarYear, calendarMonth, 1);
            const lastDay = toDateString(
                calendarYear,
                calendarMonth,
                daysInMonth(calendarYear, calendarMonth)
            );
            const res = await analyticsService.getTechnicianDailyStats(
                selectedTechId,
                firstDay,
                lastDay
            );
            setDailyStats(res.data);
        } catch {
            setDailyStats([]);
        } finally {
            setDailyLoading(false);
        }
    }, [selectedTechId, calendarYear, calendarMonth]);

    useEffect(() => {
        if (activeTab === 'individual') loadDailyStats();
    }, [activeTab, loadDailyStats]);

    // ── Load incidents when a day is selected ─────────────────────────────────
    useEffect(() => {
        if (!selectedDay) {
            setDayIncidents([]);
            setExpandedIncidentId(null);
            return;
        }
        const fetchIncidents = async () => {
            try {
                setDayIncidentsLoading(true);
                setExpandedIncidentId(null);
                const res = await analyticsService.getTechnicianDailyIncidents(
                    selectedTechId,
                    selectedDay.date
                );
                setDayIncidents(res.data);
            } catch {
                setDayIncidents([]);
            } finally {
                setDayIncidentsLoading(false);
            }
        };
        fetchIncidents();
    }, [selectedDay, selectedTechId]);

    // ── Toggle incident expanded detail ───────────────────────────────────────
    const toggleIncident = async (incidentId) => {
        if (expandedIncidentId === incidentId) {
            setExpandedIncidentId(null);
            return;
        }
        setExpandedIncidentId(incidentId);
        if (!expandedIncidentDetails[incidentId]) {
            try {
                const res = await incidentService.getById(incidentId);
                setExpandedIncidentDetails((prev) => ({ ...prev, [incidentId]: res.data }));
            } catch {
                // ignore fetch errors for expansion
            }
        }
    };

    // ── Derived data ──────────────────────────────────────────────────────────
    const totalActive = technicianPerformance.length;
    const totalResolved = technicianPerformance.reduce((s, t) => s + Number(t.total_resolved), 0);
    const avgResolutionTime =
        totalActive > 0
            ? (
                  technicianPerformance.reduce(
                      (s, t) => s + Number(t.avg_resolution_time_hours),
                      0
                  ) / totalActive
              ).toFixed(1)
            : 0;
    const avgRating =
        totalActive > 0
            ? (
                  technicianPerformance.reduce((s, t) => s + Number(t.avg_rating), 0) /
                  totalActive
              ).toFixed(1)
            : 0;

    const selectedTech = technicianPerformance.find(
        (t) => String(t.id) === selectedTechId
    );

    // Map dailyStats → keyed by date string
    const dailyMap = {};
    dailyStats.forEach((d) => {
        const dateKey = typeof d.date === 'string' ? d.date.split('T')[0] : '';
        dailyMap[dateKey] = d;
    });

    // Bar chart: all technicians
    const techBarData = {
        labels: technicianPerformance.map((t) => t.full_name.split(' ')[0]),
        datasets: [
            {
                label: 'Asignadas',
                data: technicianPerformance.map((t) => t.total_assigned),
                backgroundColor: chartColors.gradient.blue,
                borderColor: chartColors.primary[0],
                borderWidth: 1
            },
            {
                label: 'Resueltas',
                data: technicianPerformance.map((t) => t.total_resolved),
                backgroundColor: chartColors.gradient.green,
                borderColor: chartColors.primary[1],
                borderWidth: 1
            },
            {
                label: 'En Proceso',
                data: technicianPerformance.map((t) => t.currently_working),
                backgroundColor: chartColors.gradient.yellow,
                borderColor: chartColors.primary[2],
                borderWidth: 1
            }
        ]
    };

    const ratingBarData = {
        labels: technicianPerformance.map((t) => t.full_name.split(' ')[0]),
        datasets: [
            {
                label: 'Calificación promedio',
                data: technicianPerformance.map((t) => Number(t.avg_rating).toFixed(2)),
                backgroundColor: chartColors.gradient.yellow,
                borderColor: chartColors.primary[2],
                borderWidth: 1
            }
        ]
    };

    const ratingChartOptions = {
        ...chartOptions,
        indexAxis: 'y',
        scales: {
            ...chartOptions.scales,
            x: { ...chartOptions.scales.x, max: 5 }
        }
    };

    // ── Calendar helpers ──────────────────────────────────────────────────────
    const prevMonth = () => {
        if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear((y) => y - 1);
        } else {
            setCalendarMonth((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear((y) => y + 1);
        } else {
            setCalendarMonth((m) => m + 1);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 gap-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Trophy className={`h-7 w-7 ${isIronManTheme ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <h1 className={`text-2xl font-bold ${textPrimaryClass}`}>Técnicos</h1>
                </div>
                <button
                    onClick={loadData}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isIronManTheme
                            ? 'border border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/20'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                </button>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${isIronManTheme ? 'border-cyan-500/20' : 'border-gray-200'}`}>
                {['general', 'individual'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors ${
                            activeTab === tab
                                ? isIronManTheme
                                    ? 'border-b-2 border-cyan-400 text-cyan-400'
                                    : 'border-b-2 border-blue-600 text-blue-600'
                                : isIronManTheme
                                ? 'text-gray-400 hover:text-cyan-400'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab === 'general' ? 'General' : 'Individual'}
                    </button>
                ))}
            </div>

            {/* ── TAB GENERAL ─────────────────────────────────────────────── */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Period filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Todo */}
                        <button
                            onClick={() => { setPerfPeriod('all'); setCustomStart(''); setCustomEnd(''); }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                perfPeriod === 'all'
                                    ? isIronManTheme
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                        : 'bg-blue-600 text-white'
                                    : isIronManTheme
                                    ? 'text-gray-400 hover:text-cyan-400 border border-cyan-500/10'
                                    : 'text-gray-500 hover:text-gray-700 border border-gray-200'
                            }`}
                        >
                            Todo
                        </button>

                        {/* Esta semana */}
                        <button
                            onClick={() => { setPerfPeriod('week'); setCustomStart(''); setCustomEnd(''); }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                perfPeriod === 'week'
                                    ? isIronManTheme
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                        : 'bg-blue-600 text-white'
                                    : isIronManTheme
                                    ? 'text-gray-400 hover:text-cyan-400 border border-cyan-500/10'
                                    : 'text-gray-500 hover:text-gray-700 border border-gray-200'
                            }`}
                        >
                            Esta semana
                        </button>

                        {/* Custom date range */}
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors ${
                            perfPeriod === 'custom'
                                ? isIronManTheme
                                    ? 'border-cyan-500/40 bg-cyan-500/10'
                                    : 'border-blue-400 bg-blue-50'
                                : isIronManTheme
                                ? 'border-cyan-500/10'
                                : 'border-gray-200'
                        }`}>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => { setCustomStart(e.target.value); setPerfPeriod('custom'); }}
                                className={`text-xs bg-transparent outline-none ${
                                    isIronManTheme ? 'text-cyan-300' : 'text-gray-700'
                                }`}
                            />
                            <span className={`text-xs ${isIronManTheme ? 'text-gray-500' : 'text-gray-400'}`}>–</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => { setCustomEnd(e.target.value); setPerfPeriod('custom'); }}
                                className={`text-xs bg-transparent outline-none ${
                                    isIronManTheme ? 'text-cyan-300' : 'text-gray-700'
                                }`}
                            />
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                icon: Users,
                                label: 'Técnicos Activos',
                                value: totalActive,
                                color: isIronManTheme ? 'text-cyan-400' : 'text-blue-600'
                            },
                            {
                                icon: CheckCircle,
                                label: 'Total Resueltas',
                                value: totalResolved,
                                color: isIronManTheme ? 'text-green-400' : 'text-green-600'
                            },
                            {
                                icon: Clock,
                                label: 'Tiempo Prom. (h)',
                                value: perfPeriod !== 'all' ? '—' : avgResolutionTime,
                                color: isIronManTheme ? 'text-yellow-400' : 'text-yellow-600'
                            },
                            {
                                icon: Star,
                                label: 'Calificación Prom.',
                                value: `${avgRating} ★`,
                                color: isIronManTheme ? 'text-orange-400' : 'text-orange-500'
                            }
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className={cardClass} style={cardStyle}>
                                <div className="flex items-center gap-3">
                                    <Icon className={`h-6 w-6 ${color}`} />
                                    <div>
                                        <p className={`text-xs ${textSecondaryClass}`}>{label}</p>
                                        <p className={`text-xl font-bold ${color}`}>{value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bar chart: Asignadas / Resueltas / En Proceso */}
                    <div className={cardClass} style={cardStyle}>
                        <h2 className={`text-base font-semibold mb-3 ${textPrimaryClass}`}>
                            Rendimiento comparativo
                        </h2>
                        <div style={{ height: 280 }}>
                            <Bar data={techBarData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Horizontal bar: rating */}
                    <div className={cardClass} style={cardStyle}>
                        <h2 className={`text-base font-semibold mb-3 ${textPrimaryClass}`}>
                            Calificación promedio ⭐
                        </h2>
                        <div style={{ height: Math.max(120, technicianPerformance.length * 36) }}>
                            <Bar data={ratingBarData} options={ratingChartOptions} />
                        </div>
                    </div>

                    {/* Detail table */}
                    <div className={cardClass} style={cardStyle}>
                        <h2 className={`text-base font-semibold mb-3 ${textPrimaryClass}`}>
                            Detalle por técnico
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className={`${isIronManTheme ? 'border-b border-cyan-500/20' : 'border-b border-gray-200'}`}>
                                        {['Técnico', 'Sede', 'Asignadas', 'Resueltas', 'En Trabajo', 'Tiempo Prom.', 'Calificación'].map(
                                            (h) => (
                                                <th
                                                    key={h}
                                                    className={`py-2 px-3 text-left font-semibold ${textSecondaryClass}`}
                                                >
                                                    {h}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {technicianPerformance.map((t) => (
                                        <tr
                                            key={t.id}
                                            className={`border-b ${
                                                isIronManTheme
                                                    ? 'border-cyan-500/10 hover:bg-cyan-900/10'
                                                    : 'border-gray-100 hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className={`py-2 px-3 font-medium ${textPrimaryClass}`}>
                                                {t.full_name}
                                            </td>
                                            <td className={`py-2 px-3 capitalize ${textSecondaryClass}`}>
                                                {t.sede || '—'}
                                            </td>
                                            <td className={`py-2 px-3 ${textPrimaryClass}`}>
                                                {t.total_assigned}
                                            </td>
                                            <td className="py-2 px-3 text-green-500 font-medium">
                                                {t.total_resolved}
                                            </td>
                                            <td className="py-2 px-3 text-yellow-500">
                                                {t.currently_working}
                                            </td>
                                            <td className={`py-2 px-3 ${textSecondaryClass}`}>
                                                {t.avg_resolution_time_hours
                                                    ? `${Number(t.avg_resolution_time_hours).toFixed(1)} h`
                                                    : '—'}
                                            </td>
                                            <td className="py-2 px-3">
                                                {Number(t.avg_rating) > 0 ? (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                                                        <span className={textPrimaryClass}>
                                                            {Number(t.avg_rating).toFixed(1)}
                                                        </span>
                                                        <span className={`text-xs ${textSecondaryClass}`}>
                                                            ({t.total_ratings})
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className={textSecondaryClass}>Sin calificación</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB INDIVIDUAL ──────────────────────────────────────────── */}
            {activeTab === 'individual' && (
                <div className="space-y-6">
                    {/* Tech selector */}
                    <div className={cardClass} style={cardStyle}>
                        <label className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>
                            Seleccionar técnico
                        </label>
                        <select
                            value={selectedTechId}
                            onChange={(e) => {
                                setSelectedTechId(e.target.value);
                                setSelectedDay(null);
                            }}
                            className={`w-full sm:w-72 rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 ${
                                isIronManTheme
                                    ? 'bg-gray-900 border-cyan-500/40 text-cyan-300 focus:ring-cyan-500/40'
                                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                            }`}
                        >
                            {technicianPerformance.map((t) => (
                                <option key={t.id} value={String(t.id)}>
                                    {t.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* KPI cards for selected tech */}
                    {selectedTech && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    label: 'Asignadas',
                                    value: selectedTech.total_assigned,
                                    color: isIronManTheme ? 'text-cyan-400' : 'text-blue-600'
                                },
                                {
                                    label: 'Resueltas',
                                    value: selectedTech.total_resolved,
                                    color: 'text-green-500'
                                },
                                {
                                    label: 'En Proceso',
                                    value: selectedTech.currently_working,
                                    color: 'text-yellow-500'
                                },
                                {
                                    label: 'Calificación',
                                    value: Number(selectedTech.avg_rating) > 0
                                        ? `${Number(selectedTech.avg_rating).toFixed(1)} ★`
                                        : '—',
                                    color: 'text-orange-400'
                                }
                            ].map(({ label, value, color }) => (
                                <div key={label} className={cardClass} style={cardStyle}>
                                    <p className={`text-xs ${textSecondaryClass}`}>{label}</p>
                                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Calendar */}
                    <div className={cardClass} style={cardStyle}>
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={prevMonth}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    isIronManTheme
                                        ? 'text-cyan-400 hover:bg-cyan-900/20'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h2 className={`text-base font-semibold ${textPrimaryClass}`}>
                                {MONTH_NAMES[calendarMonth]} {calendarYear}
                            </h2>
                            <button
                                onClick={nextMonth}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    isIronManTheme
                                        ? 'text-cyan-400 hover:bg-cyan-900/20'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        {dailyLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : (
                            <>
                                {/* Day name headers */}
                                <div className="grid grid-cols-7 mb-1">
                                    {DAY_NAMES.map((d) => (
                                        <div
                                            key={d}
                                            className={`text-center text-xs font-semibold py-1 ${textSecondaryClass}`}
                                        >
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Empty cells before first day */}
                                    {Array.from({
                                        length: firstWeekdayOfMonth(calendarYear, calendarMonth)
                                    }).map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}

                                    {/* Day cells */}
                                    {Array.from({
                                        length: daysInMonth(calendarYear, calendarMonth)
                                    }).map((_, i) => {
                                        const day = i + 1;
                                        const dateKey = toDateString(calendarYear, calendarMonth, day);
                                        const stats = dailyMap[dateKey];
                                        const hasActivity = stats && (
                                            Number(stats.assigned) > 0 ||
                                            Number(stats.resolved) > 0 ||
                                            Number(stats.returned) > 0
                                        );
                                        const isSelected = selectedDay?.date === dateKey;

                                        return (
                                            <button
                                                key={day}
                                                onClick={() =>
                                                    setSelectedDay(
                                                        isSelected ? null : { ...stats, date: dateKey }
                                                    )
                                                }
                                                className={`rounded-lg p-1.5 min-h-[60px] text-left transition-all ${
                                                    isSelected
                                                        ? isIronManTheme
                                                            ? 'ring-2 ring-cyan-400 bg-cyan-900/30'
                                                            : 'ring-2 ring-blue-500 bg-blue-50'
                                                        : hasActivity
                                                        ? isIronManTheme
                                                            ? 'bg-gray-800/60 hover:bg-cyan-900/20 cursor-pointer'
                                                            : 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
                                                        : isIronManTheme
                                                        ? 'bg-gray-800/20 hover:bg-gray-800/40'
                                                        : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            >
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        isSelected
                                                            ? isIronManTheme
                                                                ? 'text-cyan-300'
                                                                : 'text-blue-700'
                                                            : textPrimaryClass
                                                    }`}
                                                >
                                                    {day}
                                                </span>
                                                {hasActivity && (
                                                    <div className="mt-0.5 flex flex-col gap-0.5">
                                                        {Number(stats.assigned) > 0 && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-blue-500 text-white rounded px-1 leading-tight">
                                                                +{stats.assigned}
                                                            </span>
                                                        )}
                                                        {Number(stats.resolved) > 0 && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-green-500 text-white rounded px-1 leading-tight">
                                                                ✓{stats.resolved}
                                                            </span>
                                                        )}
                                                        {Number(stats.returned) > 0 && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-red-500 text-white rounded px-1 leading-tight">
                                                                ↩{stats.returned}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex gap-4 mt-3 flex-wrap">
                                    {[
                                        { color: 'bg-blue-500', label: 'Asignaciones' },
                                        { color: 'bg-green-500', label: 'Resoluciones' },
                                        { color: 'bg-red-500', label: 'Devoluciones' }
                                    ].map(({ color, label }) => (
                                        <span key={label} className="flex items-center gap-1.5 text-xs">
                                            <span className={`inline-block w-3 h-3 rounded ${color}`} />
                                            <span className={textSecondaryClass}>{label}</span>
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Day detail panel */}
                    {selectedDay && (
                        <div className={cardClass} style={cardStyle}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-sm font-semibold ${textPrimaryClass}`}>
                                    Detalle del {selectedDay.date}
                                </h3>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className={`text-xs px-2 py-1 rounded ${
                                        isIronManTheme
                                            ? 'text-cyan-400 hover:bg-cyan-900/20'
                                            : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    Cerrar
                                </button>
                            </div>

                            {/* Count cards */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[
                                    {
                                        label: 'Asignaciones',
                                        value: selectedDay.assigned ?? 0,
                                        color: 'text-blue-500',
                                        bg: isIronManTheme ? 'bg-blue-900/20' : 'bg-blue-50'
                                    },
                                    {
                                        label: 'Resoluciones',
                                        value: selectedDay.resolved ?? 0,
                                        color: 'text-green-500',
                                        bg: isIronManTheme ? 'bg-green-900/20' : 'bg-green-50'
                                    },
                                    {
                                        label: 'Devoluciones',
                                        value: selectedDay.returned ?? 0,
                                        color: 'text-red-500',
                                        bg: isIronManTheme ? 'bg-red-900/20' : 'bg-red-50'
                                    }
                                ].map(({ label, value, color, bg }) => (
                                    <div key={label} className={`rounded-lg p-3 ${bg}`}>
                                        <p className={`text-xs ${textSecondaryClass}`}>{label}</p>
                                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Incidents list */}
                            <div>
                                <h4 className={`text-sm font-semibold mb-2 ${textPrimaryClass}`}>
                                    Incidencias ({dayIncidents.length})
                                </h4>
                                {dayIncidentsLoading ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                                    </div>
                                ) : dayIncidents.length === 0 ? (
                                    <p className={`text-xs ${textSecondaryClass}`}>
                                        No hay incidencias registradas para este día.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {dayIncidents.map((inc, idx) => {
                                            const ACTION_STYLES = {
                                                'Asignación de técnico': { bg: 'bg-blue-500', label: 'Asig.' },
                                                'Marcado como resuelto': { bg: 'bg-green-500', label: 'Resuelto' },
                                                'Devuelto por técnico': { bg: 'bg-red-500', label: 'Devuelto' }
                                            };
                                            const actionStyle = ACTION_STYLES[inc.action] || {
                                                bg: 'bg-gray-500',
                                                label: inc.action
                                            };
                                            const isExpanded = expandedIncidentId === inc.incident_id;
                                            const details = expandedIncidentDetails[inc.incident_id];

                                            return (
                                                <div
                                                    key={`${inc.incident_id}-${idx}`}
                                                    className={`rounded-lg border p-3 ${
                                                        isIronManTheme
                                                            ? 'border-cyan-500/20 bg-gray-800/40'
                                                            : 'border-gray-200 bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span
                                                                className={`text-[10px] font-bold text-white rounded px-1.5 py-0.5 shrink-0 ${actionStyle.bg}`}
                                                            >
                                                                {actionStyle.label}
                                                            </span>
                                                            <span className={`text-xs font-semibold shrink-0 ${textPrimaryClass}`}>
                                                                #{inc.incident_id}
                                                            </span>
                                                            <span className={`text-xs truncate ${textSecondaryClass}`}>
                                                                {inc.failure_type}
                                                            </span>
                                                            <span className={`text-xs shrink-0 ${textSecondaryClass}`}>
                                                                {inc.status}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleIncident(inc.incident_id)}
                                                            className={`text-xs px-2 py-1 rounded shrink-0 transition-colors ${
                                                                isIronManTheme
                                                                    ? 'text-cyan-400 hover:bg-cyan-900/20'
                                                                    : 'text-blue-600 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            Ver caso {isExpanded ? '▲' : '▼'}
                                                        </button>
                                                    </div>

                                                    {isExpanded && (
                                                        <div
                                                            className={`mt-2 pt-2 border-t text-xs space-y-1 ${
                                                                isIronManTheme
                                                                    ? 'border-cyan-500/20'
                                                                    : 'border-gray-200'
                                                            }`}
                                                        >
                                                            {details ? (
                                                                <>
                                                                    <p>
                                                                        <span className={`font-semibold ${textSecondaryClass}`}>
                                                                            Descripción:{' '}
                                                                        </span>
                                                                        <span className={textPrimaryClass}>
                                                                            {details.description || '—'}
                                                                        </span>
                                                                    </p>
                                                                    <p>
                                                                        <span className={`font-semibold ${textSecondaryClass}`}>
                                                                            Sede:{' '}
                                                                        </span>
                                                                        <span className={`${textPrimaryClass} capitalize`}>
                                                                            {details.workstation?.sede ||
                                                                                details.sede ||
                                                                                '—'}
                                                                        </span>
                                                                    </p>
                                                                    <p>
                                                                        <span className={`font-semibold ${textSecondaryClass}`}>
                                                                            Estación:{' '}
                                                                        </span>
                                                                        <span className={textPrimaryClass}>
                                                                            {details.workstation?.station_code ||
                                                                                details.station_code ||
                                                                                '—'}
                                                                        </span>
                                                                    </p>
                                                                    <p>
                                                                        <span className={`font-semibold ${textSecondaryClass}`}>
                                                                            Reportado por:{' '}
                                                                        </span>
                                                                        <span className={textPrimaryClass}>
                                                                            {details.reported_by?.full_name ||
                                                                                details.reporter_name ||
                                                                                '—'}
                                                                        </span>
                                                                    </p>
                                                                    <p>
                                                                        <span className={`font-semibold ${textSecondaryClass}`}>
                                                                            Notas de la acción:{' '}
                                                                        </span>
                                                                        <span className={textPrimaryClass}>
                                                                            {inc.details || '—'}
                                                                        </span>
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <div className="flex justify-center py-2">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Tecnicos;
