import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, onRatingChange, readonly = false, size = 'md' }) => {
    const [hoveredRating, setHoveredRating] = useState(0);
    
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    };
    
    const handleStarClick = (starRating) => {
        if (!readonly && onRatingChange) {
            onRatingChange(starRating);
        }
    };
    
    const handleStarHover = (starRating) => {
        if (!readonly) {
            setHoveredRating(starRating);
        }
    };
    
    const handleMouseLeave = () => {
        if (!readonly) {
            setHoveredRating(0);
        }
    };
    
    const displayRating = hoveredRating || rating;
    
    return (
        <div className="flex items-center space-x-1" onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    disabled={readonly}
                    className={`
                        ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                        transition-all duration-150
                        ${readonly ? '' : 'focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 rounded'}
                    `}
                >
                    <Star
                        className={`
                            ${sizeClasses[size]}
                            ${star <= displayRating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }
                            transition-colors duration-150
                        `}
                    />
                </button>
            ))}
            {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                    ({rating}/5)
                </span>
            )}
        </div>
    );
};

export default StarRating;