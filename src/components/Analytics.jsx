import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Users,
    Monitor,
    Clock,
    AlertTriangle,
    Award,
    Calendar,
    Activity,
    MapPin,
    Building,
    Zap,
    Star,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const Analytics = () => {
    const { user } = useAuth();
    const isIronManTheme = user?.username === 'davidlopez10';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState(30);
    
    // Estados para todos los datos
    const [overview, setOverview] = useState({});
    const [incidentsBySede, setIncidentsBySede] = useState([]);
    const [incidentsByDepartment, setIncidentsByDepartment] = useState([]);
    const [incidentsByFailureType, setIncidentsByFailureType] = useState([]);
    const [temporalTrend, setTemporalTrend] = useState([]);
    const [topFailingStations, setTopFailingStations] = useState([]);
    const [technicianPerformance, setTechnicianPerformance] = useState([]);
    const [reportsByUser, setReportsByUser] = useState([]);
    const [hourlyDistribution, setHourlyDistribution] = useState([]);
    const [weekdayDistribution, setWeekdayDistribution] = useState([]);
    const [resolutionTimeAnalysis, setResolutionTimeAnalysis] = useState([]);
    const [qualityMetrics, setQualityMetrics] = useState({});

    useEffect(() => {
        loadAllAnalytics();
    }, [selectedPeriod]);

    const loadAllAnalytics = async () => {
        try {
            setLoading(true);
            setError('');

            // Cargar datos uno por uno para identificar errores específicos
            console.log('Cargando overview...');
            try {
                const overviewRes = await analyticsService.getOverview();
                setOverview(overviewRes.data);
                console.log('Overview cargado exitosamente');
            } catch (err) {
                console.error('Error cargando overview:', err);
            }

            console.log('Cargando incidencias por sede...');
            try {
                const sedeRes = await analyticsService.getIncidentsBySede();
                setIncidentsBySede(sedeRes.data);
                console.log('Incidencias por sede cargadas exitosamente');
            } catch (err) {
                console.error('Error cargando incidencias por sede:', err);
            }

            console.log('Cargando incidencias por departamento...');
            try {
                const departmentRes = await analyticsService.getIncidentsByDepartment();
                setIncidentsByDepartment(departmentRes.data);
                console.log('Incidencias por departamento cargadas exitosamente');
            } catch (err) {
                console.error('Error cargando incidencias por departamento:', err);
            }

            console.log('Cargando incidencias por tipo de falla...');
            try {
                const failureTypeRes = await analyticsService.getIncidentsByFailureType();
                setIncidentsByFailureType(failureTypeRes.data);
                console.log('Incidencias por tipo de falla cargadas exitosamente');
            } catch (err) {
                console.error('Error cargando incidencias por tipo de falla:', err);
            }

            console.log('Cargando tendencia temporal...');
            try {
                const temporalRes = await analyticsService.getTemporalTrend(selectedPeriod);
                setTemporalTrend(temporalRes.data);
                console.log('Tendencia temporal cargada exitosamente');
            } catch (err) {
                console.error('Error cargando tendencia temporal:', err);
            }

            console.log('Cargando estaciones que más fallan...');
            try {
                const stationsRes = await analyticsService.getTopFailingStations(10);
                setTopFailingStations(stationsRes.data);
                console.log('Estaciones que más fallan cargadas exitosamente');
            } catch (err) {
                console.error('Error cargando estaciones que más fallan:', err);
            }

            console.log('Cargando rendimiento de técnicos...');
            try {
                const technicianRes = await analyticsService.getTechnicianPerformance();
                setTechnicianPerformance(technicianRes.data);
                console.log('Rendimiento de técnicos cargado exitosamente');
            } catch (err) {
                console.error('Error cargando rendimiento de técnicos:', err);
            }

            console.log('Cargando reportes por usuario...');
            try {
                const userReportsRes = await analyticsService.getReportsByUser();
                setReportsByUser(userReportsRes.data);
                console.log('Reportes por usuario cargados exitosamente');
            } catch (err) {
                console.error('Error cargando reportes por usuario:', err);
            }

            console.log('Cargando distribución por hora...');
            try {
                const hourlyRes = await analyticsService.getHourlyDistribution();
                setHourlyDistribution(hourlyRes.data);
                console.log('Distribución por hora cargada exitosamente');
            } catch (err) {
                console.error('Error cargando distribución por hora:', err);
            }

            console.log('Cargando distribución por día de semana...');
            try {
                const weekdayRes = await analyticsService.getWeekdayDistribution();
                setWeekdayDistribution(weekdayRes.data);
                console.log('Distribución por día de semana cargada exitosamente');
            } catch (err) {
                console.error('Error cargando distribución por día de semana:', err);
            }

            console.log('Cargando análisis de tiempo de resolución...');
            try {
                const resolutionRes = await analyticsService.getResolutionTimeAnalysis();
                setResolutionTimeAnalysis(resolutionRes.data);
                console.log('Análisis de tiempo de resolución cargado exitosamente');
            } catch (err) {
                console.error('Error cargando análisis de tiempo de resolución:', err);
            }

            console.log('Cargando métricas de calidad...');
            try {
                const qualityRes = await analyticsService.getQualityMetrics();
                setQualityMetrics(qualityRes.data);
                console.log('Métricas de calidad cargadas exitosamente');
            } catch (err) {
                console.error('Error cargando métricas de calidad:', err);
            }

        } catch (error) {
            console.error('Error general cargando analíticas:', error);
            setError('Error al cargar los datos analíticos');
        } finally {
            setLoading(false);
        }
    };

    // Configuraciones de colores para gráficos
    // Colores Iron Man: Cyan #00E5FF, Cyan Dark #00B4D8, Red #E10600, Orange #FF6A00
    const chartColors = isIronManTheme ? {
        primary: ['#00E5FF', '#00B4D8', '#E10600', '#FF6A00', '#00E5FF', '#00B4D8', '#E10600', '#FF6A00'],
        pastel: ['rgba(0, 229, 255, 0.3)', 'rgba(0, 180, 216, 0.3)', 'rgba(225, 6, 0, 0.3)', 'rgba(255, 106, 0, 0.3)', 'rgba(0, 229, 255, 0.3)', 'rgba(0, 180, 216, 0.3)', 'rgba(225, 6, 0, 0.3)', 'rgba(255, 106, 0, 0.3)'],
        gradient: {
            blue: 'rgba(0, 229, 255, 0.6)',
            green: 'rgba(0, 180, 216, 0.6)',
            yellow: 'rgba(255, 106, 0, 0.6)',
            red: 'rgba(225, 6, 0, 0.6)'
        }
    } : {
        primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
        pastel: ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FEE2E2', '#EDE9FE', '#CFFAFE', '#ECFCCB', '#FED7AA'],
        gradient: {
            blue: 'rgba(59, 130, 246, 0.6)',
            green: 'rgba(16, 185, 129, 0.6)',
            yellow: 'rgba(245, 158, 11, 0.6)',
            red: 'rgba(239, 68, 68, 0.6)'
        }
    };

    // Configuración para gráfico de incidencias por sede
    const sedeChartData = {
        labels: incidentsBySede.map(item => {
            const labels = {
                'bogota': 'Bogotá',
                'barranquilla': 'Barranquilla',
                'villavicencio': 'Villavicencio'
            };
            return labels[item.sede] || item.sede;
        }),
        datasets: [
            {
                label: 'Pendientes',
                data: incidentsBySede.map(item => item.pendiente),
                backgroundColor: chartColors.gradient.yellow,
                borderColor: isIronManTheme ? '#FF6A00' : '#F59E0B',
                borderWidth: 2
            },
            {
                label: 'En Proceso',
                data: incidentsBySede.map(item => item.en_proceso),
                backgroundColor: chartColors.gradient.blue,
                borderColor: isIronManTheme ? '#00E5FF' : '#3B82F6',
                borderWidth: 2
            },
            {
                label: 'En Supervisión',
                data: incidentsBySede.map(item => item.en_supervision),
                backgroundColor: isIronManTheme ? 'rgba(0, 180, 216, 0.6)' : '#8B5CF6',
                borderColor: isIronManTheme ? '#00B4D8' : '#7C3AED',
                borderWidth: 2
            },
            {
                label: 'Aprobadas',
                data: incidentsBySede.map(item => item.aprobado),
                backgroundColor: chartColors.gradient.green,
                borderColor: isIronManTheme ? '#00B4D8' : '#10B981',
                borderWidth: 2
            }
        ]
    };

    // Configuración para gráfico de tipos de falla
    const failureTypeChartData = {
        labels: incidentsByFailureType.map(item => {
            const labels = {
                'pantalla': 'Pantalla',
                'perifericos': 'Periféricos',
                'internet': 'Internet',
                'software': 'Software',
                'otro': 'Otro'
            };
            return labels[item.failure_type] || item.failure_type;
        }),
        datasets: [{
            data: incidentsByFailureType.map(item => item.total),
            backgroundColor: chartColors.primary,
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverBackgroundColor: chartColors.primary.map(color => color + '80'),
        }]
    };

    // Configuración para gráfico temporal
    const temporalChartData = {
        labels: temporalTrend.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Incidencias Creadas',
                data: temporalTrend.map(item => item.total),
                borderColor: isIronManTheme ? '#00E5FF' : '#3B82F6',
                backgroundColor: isIronManTheme ? 'rgba(0, 229, 255, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: isIronManTheme ? '#00E5FF' : '#3B82F6',
                pointBorderColor: isIronManTheme ? '#0B0F14' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            },
            {
                label: 'Incidencias Resueltas',
                data: temporalTrend.map(item => item.resolved),
                borderColor: isIronManTheme ? '#FF6A00' : '#10B981',
                backgroundColor: isIronManTheme ? 'rgba(255, 106, 0, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: isIronManTheme ? '#FF6A00' : '#10B981',
                pointBorderColor: isIronManTheme ? '#0B0F14' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            }
        ]
    };

    // Configuración para gráfico de distribución por hora
    const hourlyChartData = {
        labels: hourlyDistribution.map(item => `${item.hour}:00`),
        datasets: [{
            label: 'Incidencias por Hora',
            data: hourlyDistribution.map(item => item.total_incidents),
            backgroundColor: chartColors.gradient.blue,
            borderColor: isIronManTheme ? '#00E5FF' : '#3B82F6',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
        }]
    };

    // Configuración para gráfico de días de la semana
    const weekdayChartData = {
        labels: weekdayDistribution.map(item => {
            const days = {
                'Sunday': 'Domingo',
                'Monday': 'Lunes',
                'Tuesday': 'Martes',
                'Wednesday': 'Miércoles',
                'Thursday': 'Jueves',
                'Friday': 'Viernes',
                'Saturday': 'Sábado'
            };
            return days[item.day_name] || item.day_name;
        }),
        datasets: [{
            data: weekdayDistribution.map(item => item.total_incidents),
            backgroundColor: chartColors.primary.slice(0, 7),
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        size: 12
                    },
                    color: isIronManTheme ? '#E5E7EB' : undefined
                }
            },
            tooltip: {
                backgroundColor: isIronManTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(0, 0, 0, 0.8)',
                titleColor: isIronManTheme ? '#00E5FF' : '#ffffff',
                bodyColor: '#ffffff',
                borderColor: isIronManTheme ? '#00E5FF' : '#ffffff',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                intersect: false,
                mode: 'index'
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    color: isIronManTheme ? 'rgba(0, 229, 255, 0.1)' : undefined
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    color: isIronManTheme ? '#94A3B8' : undefined
                }
            },
            y: {
                grid: {
                    color: isIronManTheme ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    color: isIronManTheme ? '#94A3B8' : undefined
                }
            }
        }
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        size: 12
                    },
                    color: isIronManTheme ? '#E5E7EB' : undefined
                }
            },
            tooltip: {
                backgroundColor: isIronManTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(0, 0, 0, 0.8)',
                titleColor: isIronManTheme ? '#00E5FF' : '#ffffff',
                bodyColor: '#ffffff',
                borderColor: isIronManTheme ? '#00E5FF' : undefined,
                borderWidth: isIronManTheme ? 1 : 0,
                callbacks: {
                    label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed * 100) / total).toFixed(1);
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-64 ${isIronManTheme ? 'bg-[#0B0F14] rounded-xl' : ''}`}>
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isIronManTheme ? 'border-[#00E5FF]' : 'border-blue-600'}`}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`border rounded-md p-4 ${isIronManTheme ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                    <AlertTriangle className={`h-5 w-5 mr-2 ${isIronManTheme ? 'text-[#E10600]' : 'text-red-400'}`} />
                    <p className={isIronManTheme ? 'text-[#E10600]' : 'text-red-700'}>{error}</p>
                </div>
            </div>
        );
    }

    // Clases condicionales para Iron Man theme
    const cardClass = isIronManTheme
        ? 'bg-[#0F172A] rounded-lg shadow-lg shadow-cyan-500/10 p-6 border border-cyan-500/20'
        : 'bg-white rounded-lg shadow p-6';
    const textPrimaryClass = isIronManTheme ? 'text-[#E5E7EB]' : 'text-gray-900';
    const textSecondaryClass = isIronManTheme ? 'text-[#94A3B8]' : 'text-gray-600';
    const iconContainerClass = (colorBase) => isIronManTheme
        ? `p-2 bg-[#0B0F14] rounded-lg border border-cyan-500/30`
        : `p-2 ${colorBase} rounded-lg`;

    return (
        <div className={`space-y-6 ${isIronManTheme ? 'bg-[#0B0F14] p-6 rounded-xl' : ''}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                    <h1 className={`text-2xl font-bold ${textPrimaryClass} ${isIronManTheme ? 'ironman-glow' : ''}`}>
                        {isIronManTheme ? 'J.A.R.V.I.S. Analytics' : 'Analíticas del Sistema'}
                    </h1>
                    <p className={`${textSecondaryClass} mt-1`}>
                        Análisis completo de incidencias, rendimiento y métricas de calidad
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                        className={`border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                            isIronManTheme
                                ? 'border-cyan-500/30 bg-[#0F172A] text-[#E5E7EB] focus:ring-cyan-500/50 focus:border-cyan-500'
                                : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                        }`}
                    >
                        <option value={7}>Últimos 7 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={90}>Últimos 90 días</option>
                        <option value={365}>Último año</option>
                    </select>
                    <button
                        onClick={loadAllAnalytics}
                        className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isIronManTheme
                                ? 'border-cyan-500/30 text-[#00E5FF] bg-[#0F172A] hover:bg-[#0B0F14] focus:ring-cyan-500/50'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
                        }`}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isIronManTheme ? 'text-[#00E5FF]' : ''}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={cardClass}>
                    <div className="flex items-center">
                        <div className={iconContainerClass('bg-blue-100')}>
                            <Monitor className={`h-6 w-6 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'}`} />
                        </div>
                        <div className="ml-4">
                            <p className={`text-sm font-medium ${textSecondaryClass}`}>Total Incidencias</p>
                            <p className={`text-2xl font-bold ${textPrimaryClass}`}>{overview.total_incidents || 0}</p>
                        </div>
                    </div>
                </div>

                <div className={cardClass}>
                    <div className="flex items-center">
                        <div className={iconContainerClass('bg-green-100')}>
                            <Award className={`h-6 w-6 ${isIronManTheme ? 'text-[#00B4D8]' : 'text-green-600'}`} />
                        </div>
                        <div className="ml-4">
                            <p className={`text-sm font-medium ${textSecondaryClass}`}>Tasa de Resolución</p>
                            <p className={`text-2xl font-bold ${textPrimaryClass}`}>
                                {overview.total_incidents ?
                                    Math.round((overview.approved_incidents / overview.total_incidents) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className={cardClass}>
                    <div className="flex items-center">
                        <div className={iconContainerClass('bg-yellow-100')}>
                            <Clock className={`h-6 w-6 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-yellow-600'}`} />
                        </div>
                        <div className="ml-4">
                            <p className={`text-sm font-medium ${textSecondaryClass}`}>Tiempo Promedio</p>
                            <p className={`text-2xl font-bold ${textPrimaryClass}`}>
                                {Math.round(overview.avg_resolution_time_hours || 0)}h
                            </p>
                        </div>
                    </div>
                </div>

                <div className={cardClass}>
                    <div className="flex items-center">
                        <div className={iconContainerClass('bg-purple-100')}>
                            <Users className={`h-6 w-6 ${isIronManTheme ? 'text-[#E10600]' : 'text-purple-600'}`} />
                        </div>
                        <div className="ml-4">
                            <p className={`text-sm font-medium ${textSecondaryClass}`}>Técnicos Activos</p>
                            <p className={`text-2xl font-bold ${textPrimaryClass}`}>{overview.total_technicians || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos Principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incidencias por Sede */}
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
                            <MapPin className={`h-5 w-5 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-blue-600'} mr-2`} />
                            Incidencias por Sede
                        </h3>
                    </div>
                    <div className="h-80">
                        <Bar data={sedeChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Tipos de Falla */}
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
                            <PieChart className={`h-5 w-5 ${isIronManTheme ? 'text-[#00B4D8]' : 'text-green-600'} mr-2`} />
                            Distribución por Tipo de Falla
                        </h3>
                    </div>
                    <div className="h-80">
                        <Pie data={failureTypeChartData} options={pieChartOptions} />
                    </div>
                </div>
            </div>

            {/* Tendencia Temporal */}
            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
                        <TrendingUp className={`h-5 w-5 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-purple-600'} mr-2`} />
                        Tendencia Temporal ({selectedPeriod} días)
                    </h3>
                </div>
                <div className="h-80">
                    <Line data={temporalChartData} options={chartOptions} />
                </div>
            </div>

            {/* Distribución por Hora y Día */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución por Hora */}
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
                            <Clock className={`h-5 w-5 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-orange-600'} mr-2`} />
                            Distribución por Hora del Día
                        </h3>
                    </div>
                    <div className="h-80">
                        <Bar data={hourlyChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Distribución por Día de la Semana */}
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
                            <Calendar className={`h-5 w-5 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-indigo-600'} mr-2`} />
                            Distribución por Día de la Semana
                        </h3>
                    </div>
                    <div className="h-80">
                        <Doughnut data={weekdayChartData} options={pieChartOptions} />
                    </div>
                </div>
            </div>

            {/* Estaciones que Más Fallan */}
            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
                        <AlertTriangle className={`h-5 w-5 ${isIronManTheme ? 'text-[#E10600]' : 'text-red-600'} mr-2`} />
                        Top 10 Estaciones con Más Fallas
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${isIronManTheme ? 'divide-cyan-500/20' : 'divide-gray-200'}`}>
                        <thead className={isIronManTheme ? 'bg-[#0B0F14]' : 'bg-gray-50'}>
                            <tr>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Estación
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Sede
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Departamento
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Total Incidencias
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Pendientes
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Resueltas
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Tiempo Promedio
                                </th>
                            </tr>
                        </thead>
                        <tbody className={`${isIronManTheme ? 'bg-[#0F172A]' : 'bg-white'} divide-y ${isIronManTheme ? 'divide-cyan-500/10' : 'divide-gray-200'}`}>
                            {topFailingStations.map((station, index) => (
                                <tr key={station.station_code} className={isIronManTheme ? '' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold text-white ${
                                                    isIronManTheme
                                                        ? (index < 3 ? 'bg-[#E10600]' : index < 6 ? 'bg-[#FF6A00]' : 'bg-[#00B4D8]')
                                                        : (index < 3 ? 'bg-red-500' : index < 6 ? 'bg-yellow-500' : 'bg-gray-500')
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className={`text-sm font-medium ${textPrimaryClass}`}>
                                                    {station.station_code}
                                                </div>
                                                <div className={`text-sm ${textSecondaryClass}`}>
                                                    {station.location_details}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textPrimaryClass} capitalize`}>
                                        {station.sede}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textPrimaryClass} capitalize`}>
                                        {station.departamento}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isIronManTheme ? 'bg-cyan-500/20 text-[#00E5FF]' : 'bg-blue-100 text-blue-800'}`}>
                                            {station.total_incidents}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isIronManTheme ? 'bg-orange-500/20 text-[#FF6A00]' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {station.pending}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isIronManTheme ? 'bg-cyan-500/20 text-[#00B4D8]' : 'bg-green-100 text-green-800'}`}>
                                            {station.resolved}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textPrimaryClass}`}>
                                        {Math.round(station.avg_resolution_time_hours || 0)}h
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rendimiento de Técnicos */}
            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
                        <Users className={`h-5 w-5 ${isIronManTheme ? 'text-[#00B4D8]' : 'text-green-600'} mr-2`} />
                        Rendimiento de Técnicos
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${isIronManTheme ? 'divide-cyan-500/20' : 'divide-gray-200'}`}>
                        <thead className={isIronManTheme ? 'bg-[#0B0F14]' : 'bg-gray-50'}>
                            <tr>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Técnico
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Sede
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Asignadas
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Resueltas
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    En Trabajo
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Tiempo Promedio
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Calificación
                                </th>
                            </tr>
                        </thead>
                        <tbody className={`${isIronManTheme ? 'bg-[#0F172A]' : 'bg-white'} divide-y ${isIronManTheme ? 'divide-cyan-500/10' : 'divide-gray-200'}`}>
                            {technicianPerformance.map((tech, index) => (
                                <tr key={tech.id} className={isIronManTheme ? '' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${textPrimaryClass}`}>
                                            {tech.full_name}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textPrimaryClass} capitalize`}>
                                        {tech.sede}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textPrimaryClass}`}>
                                        {tech.total_assigned || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isIronManTheme ? 'bg-cyan-500/20 text-[#00B4D8]' : 'bg-green-100 text-green-800'}`}>
                                            {tech.total_resolved || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isIronManTheme ? 'bg-cyan-500/20 text-[#00E5FF]' : 'bg-blue-100 text-blue-800'}`}>
                                            {tech.currently_working || 0}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textPrimaryClass}`}>
                                        {Math.round(tech.avg_resolution_time_hours || 0)}h
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Star className={`h-4 w-4 ${isIronManTheme ? 'text-[#FF6A00]' : 'text-yellow-400'} mr-1`} />
                                            <span className={`text-sm font-medium ${textPrimaryClass}`}>
                                                {parseFloat(tech.avg_rating || 0).toFixed(1)}
                                            </span>
                                            <span className={`text-xs ${textSecondaryClass} ml-1`}>
                                                ({tech.total_ratings || 0})
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Usuarios que Más Reportan */}
            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${textPrimaryClass} flex items-center`}>
                        <Activity className={`h-5 w-5 ${isIronManTheme ? 'text-[#00E5FF]' : 'text-purple-600'} mr-2`} />
                        Top Usuarios que Más Reportan
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${isIronManTheme ? 'divide-cyan-500/20' : 'divide-gray-200'}`}>
                        <thead className={isIronManTheme ? 'bg-[#0B0F14]' : 'bg-gray-50'}>
                            <tr>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Usuario
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Rol
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Sede
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Total Reportes
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Pendientes
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondaryClass} uppercase tracking-wider`}>
                                    Resueltos
                                </th>
                            </tr>
                        </thead>
                        <tbody className={`${isIronManTheme ? 'bg-[#0F172A]' : 'bg-white'} divide-y ${isIronManTheme ? 'divide-cyan-500/10' : 'divide-gray-200'}`}>
                            {reportsByUser.slice(0, 10).map((reportUser, index) => (
                                <tr key={reportUser.full_name} className={isIronManTheme ? '' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${textPrimaryClass}`}>
                                            {reportUser.full_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${isIronManTheme ? 'bg-[#0B0F14] text-[#94A3B8] border border-cyan-500/20' : 'bg-gray-100 text-gray-800'}`}>
                                            {reportUser.role}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textPrimaryClass} capitalize`}>
                                        {reportUser.sede}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isIronManTheme ? 'bg-cyan-500/20 text-[#00E5FF]' : 'bg-blue-100 text-blue-800'}`}>
                                            {reportUser.total_reports}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isIronManTheme ? 'bg-orange-500/20 text-[#FF6A00]' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {reportUser.pending_reports}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isIronManTheme ? 'bg-cyan-500/20 text-[#00B4D8]' : 'bg-green-100 text-green-800'}`}>
                                            {reportUser.resolved_reports}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;