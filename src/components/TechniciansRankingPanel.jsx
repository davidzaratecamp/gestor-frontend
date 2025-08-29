import React, { useState, useEffect } from 'react';
import { Trophy, TrendingDown, Star, Users, Award, MapPin } from 'lucide-react';
import { incidentService } from '../services/api';
import StarRating from './StarRating';

const TechniciansRankingPanel = () => {
    const [rankingData, setRankingData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRankingData();
    }, []);

    const loadRankingData = async () => {
        try {
            setLoading(true);
            const response = await incidentService.getTechniciansRanking();
            setRankingData(response.data);
        } catch (err) {
            console.error('Error cargando ranking:', err);
            setError('No se pudo cargar el ranking de técnicos');
        } finally {
            setLoading(false);
        }
    };

    const getRankPosition = (index) => {
        const positions = ['🥇', '🥈', '🥉'];
        return positions[index] || `${index + 1}º`;
    };

    const TechnicianCard = ({ technician, rank, isWorst = false }) => (
        <div className={`p-3 rounded-lg border ${
            isWorst ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        } transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold">
                        {getRankPosition(rank)}
                    </span>
                    <div>
                        <p className="font-medium text-gray-900 text-sm">
                            {technician.full_name}
                        </p>
                        <p className="text-xs text-gray-600">
                            {technician.departamento?.toUpperCase()}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center space-x-1">
                        <StarRating 
                            rating={parseFloat(technician.average_rating)} 
                            readonly={true} 
                            size="sm" 
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {technician.total_ratings} calificacion{technician.total_ratings !== 1 ? 'es' : ''}
                    </p>
                </div>
            </div>
        </div>
    );

    const CityRankingSection = ({ cityKey, cityData }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            {cityData.city}
                        </h3>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{cityData.totalTechnicians} técnicos calificados</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Mejores técnicos */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <Trophy className="h-5 w-5 text-green-600" />
                            <h4 className="font-medium text-gray-900">
                                Mejores Calificados
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {cityData.topTechnicians.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    Sin datos suficientes
                                </div>
                            ) : (
                                cityData.topTechnicians.map((tech, index) => (
                                    <TechnicianCard 
                                        key={tech.id} 
                                        technician={tech} 
                                        rank={index}
                                        isWorst={false}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Peores técnicos */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <h4 className="font-medium text-gray-900">
                                Requieren Mejorar
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {cityData.worstTechnicians.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    Sin datos suficientes
                                </div>
                            ) : (
                                cityData.worstTechnicians.map((tech, index) => (
                                    <TechnicianCard 
                                        key={tech.id} 
                                        technician={tech} 
                                        rank={index}
                                        isWorst={true}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-500">Cargando ranking...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                    <div className="text-center py-8 text-red-600">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <div className="flex items-center">
                        <Award className="h-6 w-6 text-yellow-600 mr-3" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Ranking de Técnicos por Ciudad
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Evaluación del desempeño basada en calificaciones de coordinadores
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rankings por ciudad */}
            {Object.keys(rankingData).length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                        <div className="text-center py-8">
                            <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Sin calificaciones disponibles
                            </h3>
                            <p className="text-gray-500">
                                Los técnicos aún no han recibido calificaciones de coordinadores.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                Object.entries(rankingData).map(([cityKey, cityData]) => (
                    <CityRankingSection 
                        key={cityKey} 
                        cityKey={cityKey} 
                        cityData={cityData} 
                    />
                ))
            )}
        </div>
    );
};

export default TechniciansRankingPanel;