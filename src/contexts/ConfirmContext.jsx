import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * ConfirmContext — Provides a reusable confirm dialog system.
 * 
 * Usage:
 *   const { confirm } = useConfirm();
 *   const confirmed = await confirm({ title, message, confirmText, cancelText, variant });
 *   if (confirmed) { ...do something... }
 */

const ConfirmContext = createContext(null);

export const useConfirm = () => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
    return ctx;
};

export const ConfirmProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: 'danger', // 'danger' | 'warning' | 'info'
        resolve: null,
    });

    const confirm = useCallback(({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger' }) => {
        return new Promise((resolve) => {
            setState({ isOpen: true, title, message, confirmText, cancelText, variant, resolve });
        });
    }, []);

    const handleConfirm = () => {
        state.resolve?.(true);
        setState(s => ({ ...s, isOpen: false, resolve: null }));
    };

    const handleCancel = () => {
        state.resolve?.(false);
        setState(s => ({ ...s, isOpen: false, resolve: null }));
    };

    const variantStyles = {
        danger: {
            icon: '🗑️',
            confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
            titleColor: 'text-red-700',
        },
        warning: {
            icon: '⚠️',
            confirmBtn: 'bg-yellow-500 hover:bg-yellow-600 text-white',
            titleColor: 'text-yellow-700',
        },
        info: {
            icon: 'ℹ️',
            confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
            titleColor: 'text-blue-700',
        },
    };

    const styles = variantStyles[state.variant] || variantStyles.danger;

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Global confirm dialog */}
            {state.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleCancel}
                    />
                    {/* Dialog */}
                    <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <span className="text-3xl">{styles.icon}</span>
                                <div>
                                    <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
                                        {state.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                                        {state.message}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    {state.cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${styles.confirmBtn}`}
                                >
                                    {state.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
