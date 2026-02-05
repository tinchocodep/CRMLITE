import { useToast } from '../contexts/ToastContext';

/**
 * Hook for showing system message toasts
 * Provides simple methods for success, error, warning, and info messages
 */
export const useSystemToast = () => {
    const { showToast } = useToast();

    const showSuccess = (message) => {
        showToast({
            id: `success-${Date.now()}`,
            type: 'system_success',
            priority: 'info',
            title: message,
            description: '',
            timestamp: new Date(),
            timeAgo: 'Ahora',
            icon: null,
            color: 'bg-green-100 text-green-600',
            action: null
        });
    };

    const showError = (message) => {
        showToast({
            id: `error-${Date.now()}`,
            type: 'system_error',
            priority: 'high',
            title: message,
            description: '',
            timestamp: new Date(),
            timeAgo: 'Ahora',
            icon: null,
            color: 'bg-red-100 text-red-600',
            action: null
        });
    };

    const showWarning = (message) => {
        showToast({
            id: `warning-${Date.now()}`,
            type: 'system_warning',
            priority: 'medium',
            title: message,
            description: '',
            timestamp: new Date(),
            timeAgo: 'Ahora',
            icon: null,
            color: 'bg-yellow-100 text-yellow-600',
            action: null
        });
    };

    const showInfo = (message) => {
        showToast({
            id: `info-${Date.now()}`,
            type: 'system_info',
            priority: 'low',
            title: message,
            description: '',
            timestamp: new Date(),
            timeAgo: 'Ahora',
            icon: null,
            color: 'bg-blue-100 text-blue-600',
            action: null
        });
    };

    return {
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
};
