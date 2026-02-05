import React from 'react';
import ToastNotification from './ToastNotification';
import { useToast } from '../../contexts/ToastContext';

const ToastContainer = () => {
    const { toasts, dismissToast } = useToast();

    console.log('[ToastContainer] Rendering with toasts:', toasts.length);

    // Limit to 3 visible toasts at a time
    const visibleToasts = toasts.slice(0, 3);

    return (
        <div
            className="
                fixed z-[9999] pointer-events-none
                bottom-20 left-0 right-0 px-4
                md:bottom-auto md:top-20 md:right-6 md:left-auto
                flex flex-col items-center md:items-end
            "
        >
            <div className="w-full md:w-96 pointer-events-auto space-y-0">
                {visibleToasts.map((notification) => (
                    <ToastNotification
                        key={notification.id}
                        notification={notification}
                        onDismiss={dismissToast}
                    />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
