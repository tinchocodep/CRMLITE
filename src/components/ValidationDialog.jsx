import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

/**
 * ValidationDialog - Modern validation error dialog
 * Similar to ConfirmDialog but for validation errors (single button)
 */
export function ValidationDialog({
    isOpen,
    onClose,
    message,
    title = "Validación",
}) {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-[#E76E53] to-red-600 hover:from-[#D55E43] hover:to-red-700 text-white rounded-lg transition-all font-bold shadow-lg shadow-red-500/30"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
