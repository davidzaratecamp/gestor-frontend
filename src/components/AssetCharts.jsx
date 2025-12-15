import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Pie, Doughnut, Line, PolarArea } from 'react-chartjs-2';
import {
    AlertCircle,
    BarChart3,
    PieChart,
    TrendingUp,
    RefreshCw,
    Download,
    Calendar,
    Package,
    Building,
    Shield,
    Tag
} from 'lucide-react';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const AssetCharts = () => {
    const { user, isGestorActivos } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [refreshing, setRefreshing] = useState(false);

    // Si no es gestor de activos, mostrar mensaje de acceso denegado
    if (!isGestorActivos) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
                    <p className="text-gray-600">Solo los gestores de activos pueden acceder a esta sección.</p>
                </div>
            </div>
        );
    }

    // Datos de muestra para los gráficos
    const sampleData = {
        // Gráfico de barras - Activos por ubicación
        assetsByLocation: {
            labels: ['Claro', 'Obama', 'IT', 'Contratación', 'Reclutamiento', 'Selección', 'Finanzas'],
            datasets: [
                {
                    label: 'Activos Productivos',
                    data: [45, 38, 52, 28, 31, 24, 19],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Activos No Productivos',
                    data: [12, 8, 15, 7, 9, 6, 4],
                    backgroundColor: 'rgba(251, 146, 60, 0.8)',
                    borderColor: 'rgba(251, 146, 60, 1)',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        },

        // Gráfico circular - Distribución por clasificación
        assetsByClassification: {
            labels: ['Activos Productivos', 'Activos No Productivos'],
            datasets: [
                {
                    data: [237, 61],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 146, 60, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 146, 60, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 4
                }
            ]
        },

        // Gráfico de dona - Estado de garantías
        warrantyStatus: {
            labels: ['Con Garantía Vigente', 'Sin Garantía', 'Garantía Vencida'],
            datasets: [
                {
                    data: [156, 98, 44],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(156, 163, 175, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(156, 163, 175, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2,
                    cutout: '60%'
                }
            ]
        },

        // Gráfico de línea - Tendencia de adquisiciones
        acquisitionTrend: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [
                {
                    label: 'Activos Adquiridos',
                    data: [12, 8, 15, 22, 18, 25, 19, 32, 28, 24, 16, 21],
                    borderColor: 'rgba(147, 51, 234, 1)',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(147, 51, 234, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },

        // Gráfico polar - Distribución por proveedor
        assetsByProvider: {
            labels: ['HP Inc.', 'Lenovo', 'Dell Technologies', 'Apple', 'Samsung', 'Otros'],
            datasets: [
                {
                    data: [67, 52, 43, 28, 19, 89],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(34, 197, 94, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(251, 146, 60, 0.7)',
                        'rgba(147, 51, 234, 0.7)',
                        'rgba(156, 163, 175, 0.7)'
                    ],
                    borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(147, 51, 234, 1)',
                        'rgba(156, 163, 175, 1)'
                    ],
                    borderWidth: 2
                }
            ]
        }
    };

    // Opciones globales para los gráficos
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true
            }
        }
    };

    const barOptions = {
        ...chartOptions,
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
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    const lineOptions = {
        ...chartOptions,
        scales: {
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simular carga de datos
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    const handleExport = () => {
        // Función para exportar gráficos (implementar según necesidades)
        alert('Funcionalidad de exportación en desarrollo');
    };

    // Estadísticas de resumen
    const summaryStats = [
        {
            title: 'Total de Activos',
            value: '298',
            icon: Package,
            color: 'blue',
            change: '+12%',
            changeType: 'increase'
        },
        {
            title: 'Valor Total',
            value: '$2.4M',
            icon: TrendingUp,
            color: 'green',
            change: '+8%',
            changeType: 'increase'
        },
        {
            title: 'Con Garantía',
            value: '156',
            icon: Shield,
            color: 'purple',
            change: '-3%',
            changeType: 'decrease'
        },
        {
            title: 'Ubicaciones',
            value: '7',
            icon: Building,
            color: 'orange',
            change: '0%',
            changeType: 'neutral'
        }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Análisis de Activos
                        </h1>
                        <p className="text-gray-600">
                            Visualización y análisis estadístico del inventario de activos
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                            <option value="week">Esta Semana</option>
                            <option value="month">Este Mes</option>
                            <option value="quarter">Este Trimestre</option>
                            <option value="year">Este Año</option>
                        </select>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </button>
                    </div>
                </div>
            </div>

            {/* Estadísticas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {summaryStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-lg bg-${stat.color}-100 flex-shrink-0`}>
                                        <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                                    </div>
                                    <div className="ml-4 min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                        <p className="font-bold text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl overflow-hidden whitespace-nowrap">{stat.value}</p>
                                    </div>
                                </div>
                                <div className={`text-sm font-medium ${
                                    stat.changeType === 'increase' ? 'text-green-600' :
                                    stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                    {stat.change}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Gráficos Principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Gráfico de Barras - Activos por Ubicación */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Activos por Ubicación
                            </h3>
                        </div>
                        <Tag className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="h-80">
                        <Bar data={sampleData.assetsByLocation} options={barOptions} />
                    </div>
                </div>

                {/* Gráfico Circular - Clasificación */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <PieChart className="h-5 w-5 text-green-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Distribución por Clasificación
                            </h3>
                        </div>
                    </div>
                    <div className="h-80">
                        <Pie data={sampleData.assetsByClassification} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Gráficos Secundarios */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Gráfico de Dona - Estado de Garantías */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Shield className="h-5 w-5 text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Estado de Garantías
                            </h3>
                        </div>
                    </div>
                    <div className="h-64">
                        <Doughnut data={sampleData.warrantyStatus} options={chartOptions} />
                    </div>
                </div>

                {/* Gráfico Polar - Distribución por Proveedor */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Building className="h-5 w-5 text-purple-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Por Proveedor
                            </h3>
                        </div>
                    </div>
                    <div className="h-64">
                        <PolarArea data={sampleData.assetsByProvider} options={chartOptions} />
                    </div>
                </div>

                {/* Tarjeta de Resumen */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Resumen del Período
                            </h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Activos Nuevos</span>
                            <span className="text-sm font-semibold text-green-600">+24</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Garantías Vencidas</span>
                            <span className="text-sm font-semibold text-red-600">8</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Valor Promedio</span>
                            <span className="text-sm font-semibold text-gray-900">$8,053</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Depreciación</span>
                            <span className="text-sm font-semibold text-orange-600">-2.4%</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 flex-shrink-0">Valor Total Actual</span>
                                <span className="font-bold text-indigo-600 text-xs sm:text-sm md:text-base lg:text-lg overflow-hidden whitespace-nowrap">$2,399,784</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráfico de Tendencia - Ancho Completo */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Tendencia de Adquisiciones
                        </h3>
                    </div>
                    <div className="text-sm text-gray-500">
                        Datos del año actual
                    </div>
                </div>
                <div className="h-80">
                    <Line data={sampleData.acquisitionTrend} options={lineOptions} />
                </div>
            </div>
        </div>
    );
};

export default AssetCharts;