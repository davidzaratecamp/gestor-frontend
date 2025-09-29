import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
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
    const chartColors = {
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
                borderColor: '#F59E0B',
                borderWidth: 2
            },
            {
                label: 'En Proceso',
                data: incidentsBySede.map(item => item.en_proceso),
                backgroundColor: chartColors.gradient.blue,
                borderColor: '#3B82F6',
                borderWidth: 2
            },
            {
                label: 'En Supervisión',
                data: incidentsBySede.map(item => item.en_supervision),
                backgroundColor: '#8B5CF6',
                borderColor: '#7C3AED',
                borderWidth: 2
            },
            {
                label: 'Aprobadas',
                data: incidentsBySede.map(item => item.aprobado),
                backgroundColor: chartColors.gradient.green,
                borderColor: '#10B981',
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
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            },
            {
                label: 'Incidencias Resueltas',
                data: temporalTrend.map(item => item.resolved),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#ffffff',
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
            borderColor: '#3B82F6',
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
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#ffffff',
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
                    display: false
                },
                ticks: {
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 11
                    }
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
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
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
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analíticas del Sistema</h1>
                    <p className="text-gray-600 mt-1">
                        Análisis completo de incidencias, rendimiento y métricas de calidad
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                        className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={7}>Últimos 7 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={90}>Últimos 90 días</option>
                        <option value={365}>Último año</option>
                    </select>
                    <button
                        onClick={loadAllAnalytics}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Monitor className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Incidencias</p>
                            <p className="text-2xl font-bold text-gray-900">{overview.total_incidents || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Award className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Tasa de Resolución</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {overview.total_incidents ? 
                                    Math.round((overview.approved_incidents / overview.total_incidents) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Math.round(overview.avg_resolution_time_hours || 0)}h
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Técnicos Activos</p>
                            <p className="text-2xl font-bold text-gray-900">{overview.total_technicians || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos Principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incidencias por Sede */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                            Incidencias por Sede
                        </h3>
                    </div>
                    <div className="h-80">
                        <Bar data={sedeChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Tipos de Falla */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <PieChart className="h-5 w-5 text-green-600 mr-2" />
                            Distribución por Tipo de Falla
                        </h3>
                    </div>
                    <div className="h-80">
                        <Pie data={failureTypeChartData} options={pieChartOptions} />
                    </div>
                </div>
            </div>

            {/* Tendencia Temporal */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
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
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Clock className="h-5 w-5 text-orange-600 mr-2" />
                            Distribución por Hora del Día
                        </h3>
                    </div>
                    <div className="h-80">
                        <Bar data={hourlyChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Distribución por Día de la Semana */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
                            Distribución por Día de la Semana
                        </h3>
                    </div>
                    <div className="h-80">
                        <Doughnut data={weekdayChartData} options={pieChartOptions} />
                    </div>
                </div>
            </div>

            {/* Estaciones que Más Fallan */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        Top 10 Estaciones con Más Fallas
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sede
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Departamento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Incidencias
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pendientes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Resueltas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tiempo Promedio
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {topFailingStations.map((station, index) => (
                                <tr key={station.station_code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold text-white ${
                                                    index < 3 ? 'bg-red-500' : 
                                                    index < 6 ? 'bg-yellow-500' : 'bg-gray-500'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {station.station_code}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {station.location_details}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                        {station.sede}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                        {station.departamento}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {station.total_incidents}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {station.pending}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {station.resolved}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {Math.round(station.avg_resolution_time_hours || 0)}h
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rendimiento de Técnicos */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        Rendimiento de Técnicos
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Técnico
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sede
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Asignadas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Resueltas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    En Trabajo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tiempo Promedio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Calificación
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {technicianPerformance.map((tech, index) => (
                                <tr key={tech.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {tech.full_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                        {tech.sede}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {tech.total_assigned || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {tech.total_resolved || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {tech.currently_working || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {Math.round(tech.avg_resolution_time_hours || 0)}h
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                            <span className="text-sm font-medium text-gray-900">
                                                {parseFloat(tech.avg_rating || 0).toFixed(1)}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-1">
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
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Activity className="h-5 w-5 text-purple-600 mr-2" />
                        Top Usuarios que Más Reportan
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sede
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Reportes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pendientes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Resueltos
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reportsByUser.slice(0, 10).map((user, index) => (
                                <tr key={user.full_name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.full_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                        {user.sede}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {user.total_reports}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {user.pending_reports}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {user.resolved_reports}
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