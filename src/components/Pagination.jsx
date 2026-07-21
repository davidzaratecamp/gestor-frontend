import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, totalPages, totalItems, pageSize, onPageChange }) => {
    if (totalItems === 0) return null;

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white">
            <p className="text-sm text-gray-600">
                Mostrando <span className="font-medium">{start}-{end}</span> de <span className="font-medium">{totalItems}</span>
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Página anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 px-2">Página {page} de {totalPages}</span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Página siguiente"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
