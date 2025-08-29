import React, { useState, useEffect } from 'react';
import { Star, Award, MessageSquare, Calendar, Monitor } from 'lucide-react';
import { incidentService } from '../services/api';
import StarRating from './StarRating';

const TechnicianRatings = ({ technicianId, isOwnRatings = false }) => {
    const [ratingsData, setRatingsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRatings();
    }, [technicianId, isOwnRatings]);

    const loadRatings = async () => {
        try {
            setLoading(true);
            let response;
            
            if (isOwnRatings) {
                response = await incidentService.getMyRatings();
            } else {
                response = await incidentService.getTechnicianRatings(technicianId);
            }
            
            setRatingsData(response.data);
        } catch (err) {
            console.error('Error cargando calificaciones:', err);
            setError('No se pudieron cargar las calificaciones');
        } finally {
            setLoading(false);
        }
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

    if (loading) {
        return (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-500">Cargando calificaciones...</span>
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

    const { ratings = [], average_rating, total_ratings } = ratingsData || {};

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {/* Header */}
            <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Award className="h-6 w-6 text-yellow-600 mr-3" />
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {isOwnRatings ? 'Mis Calificaciones' : 'Calificaciones del Técnico'}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Evaluaciones de rendimiento en incidencias resueltas
                            </p>
                        </div>
                    </div>
                    
                    {total_ratings > 0 && (
                        <div className="text-right">
                            <div className="flex items-center justify-end mb-1">
                                <StarRating rating={parseFloat(average_rating)} readonly={true} size="md" />
                            </div>
                            <p className="text-sm text-gray-500">
                                {total_ratings} calificación{total_ratings !== 1 ? 'es' : ''}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-200">
                {ratings.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                        <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Sin calificaciones aún
                        </h3>
                        <p className="text-gray-500">
                            {isOwnRatings 
                                ? 'Tus incidencias aún no han sido calificadas.' 
                                : 'Este técnico aún no tiene calificaciones.'
                            }
                        </p>
                    </div>
                ) : (
                    ratings.map((rating) => (
                        <div key={rating.id} className="px-4 py-5 sm:px-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Info de la incidencia */}
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Monitor className="h-5 w-5 text-gray-400" />
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-900">
                                                {rating.station_code}
                                            </span>
                                            <span 
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFailureTypeColor(rating.failure_type)}`}
                                            >
                                                {getFailureTypeLabel(rating.failure_type)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Descripción de la incidencia */}
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {rating.incident_description}
                                    </p>
                                    
                                    {/* Calificación */}
                                    <div className="flex items-center space-x-3 mb-3">
                                        <StarRating rating={rating.rating} readonly={true} size="sm" />
                                        <span className="text-sm font-medium text-gray-900">
                                            Calificado por: {rating.rated_by_name}
                                        </span>
                                    </div>
                                    
                                    {/* Feedback */}
                                    {rating.feedback && (
                                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Comentarios:
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 pl-6">
                                                {rating.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Fecha */}
                                <div className="text-right ml-4 flex-shrink-0">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {new Date(rating.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TechnicianRatings;