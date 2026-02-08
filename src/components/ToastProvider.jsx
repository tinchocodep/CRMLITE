import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

const toastIcons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
};

const toastColors = {
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-red-600',
    warning: 'from-amber-500 to-orange-600',
    info: 'from-blue-500 to-indigo-600'
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration)
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(({ id, message, type }) => {
                        const Icon = toastIcons[type];
                        const colorClass = toastColors[type];

                        return (
                            <motion.div
                                key={id}
                                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="pointer-events-auto"
                            >
                                <div className={`bg-gradient-to-r ${colorClass} text-white rounded-xl shadow-2xl p-4 pr-12 min-w-[300px] max-w-md relative`}>
                                    <div className="flex items-start gap-3">
                                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-relaxed whitespace-pre-line">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeToast(id)}
                                        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
