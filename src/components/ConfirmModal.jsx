import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, LogOut, X } from 'lucide-react';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Guardar", cancelText = "Cancelar", type = "danger" }) => {
    const typeStyles = {
        danger: {
            icon: LogOut,
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            confirmBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
            confirmText: 'text-white'
        },
        warning: {
            icon: AlertCircle,
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            confirmBg: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800',
            confirmText: 'text-white'
        }
    };

    const style = typeStyles[type] || typeStyles.danger;
    const Icon = style.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    >
                        {/* Modal Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </button>

                            {/* Icon */}
                            <div className="flex justify-center pt-8 pb-4">
                                <div className={`w-16 h-16 rounded-full ${style.iconBg} flex items-center justify-center`}>
                                    <Icon className={`w-8 h-8 ${style.iconColor}`} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-6 text-center">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                                    {title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 px-6 pb-6">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold transition-colors"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 px-4 py-3 rounded-xl ${style.confirmBg} ${style.confirmText} font-semibold transition-colors shadow-lg`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
