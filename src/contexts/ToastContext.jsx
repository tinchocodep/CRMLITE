import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((notification) => {
        console.log('[ToastContext] showToast called with:', notification);

        // Add unique timestamp to ensure unique IDs
        const toastWithId = {
            ...notification,
            toastId: `${notification.id}-${Date.now()}`
        };

        setToasts((prev) => {
            // Check if this notification is already showing
            const exists = prev.some(t => t.id === notification.id);
            if (exists) {
                console.log('[ToastContext] Toast already exists, skipping');
                return prev;
            }

            console.log('[ToastContext] Adding toast to state');
            // Add new toast to the beginning
            return [toastWithId, ...prev];
        });
    }, []);

    const dismissToast = useCallback((toastId) => {
        setToasts((prev) => prev.filter((t) => t.toastId !== toastId && t.id !== toastId));
    }, []);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, dismissToast, clearAllToasts }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
