import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination component for server-side paginated lists.
 * @param {number}   page         - Current page (0-indexed)
 * @param {number}   totalCount   - Total records matching the current filter
 * @param {number}   pageSize     - Records per page
 * @param {Function} onPageChange - Called with new page index (0-indexed)
 */
export function Pagination({ page, totalCount, pageSize, onPageChange }) {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return null;

    const firstItem = page * pageSize + 1;
    const lastItem = Math.min((page + 1) * pageSize, totalCount);

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {/* Info text */}
            <span className="text-sm text-slate-500 dark:text-slate-400">
                Mostrando <span className="font-medium text-slate-700 dark:text-slate-300">{firstItem}–{lastItem}</span> de{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">{totalCount}</span>
            </span>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={15} /> Anterior
                </button>

                <span className="text-sm text-slate-600 dark:text-slate-400 px-1">
                    Página <span className="font-semibold">{page + 1}</span> de <span className="font-semibold">{totalPages}</span>
                </span>

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Siguiente <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
}
