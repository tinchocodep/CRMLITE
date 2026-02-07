import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog - Modern confirmation dialog component
 * Replaces window.confirm with a styled modal that matches the app design system
 * 
 * @param {boolean} isOpen - Controls dialog visibility
 * @param {function} onClose - Called when dialog is closed without confirming
 * @param {function} onConfirm - Called when user confirms the action
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Confirmar")
 * @param {string} cancelText - Text for cancel button (default: "Cancelar")
 * @param {string} variant - Visual variant: "danger" or "warning" (default: "danger")
 */
export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar acción",
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger"
}) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const iconColor = variant === "danger" ? "text-red-500" : "text-amber-500";
    const iconBg = variant === "danger" ? "bg-red-100 dark:bg-red-900/20" : "bg-amber-100 dark:bg-amber-900/20";

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
                        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
                            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
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
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-gradient-to-r from-[#87a330] to-green-600 hover:from-[#6a8532] hover:to-green-700 text-white rounded-lg transition-all font-bold shadow-lg shadow-red-500/30"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
