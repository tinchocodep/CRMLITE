import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ToastNotification = ({ notification, onDismiss }) => {
    const navigate = useNavigate();
    const [isExiting, setIsExiting] = useState(false);

    // Auto-dismiss logic based on priority
    useEffect(() => {
        if (notification.priority === 'critical') {
            // Critical notifications don't auto-dismiss
            return;
        }

        const dismissTime = {
            high: 2000,      // 2 segundos
            medium: 2000,    // 2 segundos
            low: 2000,       // 2 segundos
            info: 2000       // 2 segundos
        }[notification.priority] || 2000;

        const timer = setTimeout(() => {
            handleDismiss();
        }, dismissTime);

        return () => clearTimeout(timer);
    }, [notification.priority]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(notification.id);
        }, 300); // Match animation duration
    };

    const handleClick = () => {
        if (notification.action) {
            navigate(notification.action);
            handleDismiss();
        }
    };

    // Color schemes based on priority
    const colorSchemes = {
        critical: {
            bg: 'bg-red-50',
            border: 'border-red-500',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            text: 'text-red-900'
        },
        high: {
            bg: 'bg-orange-50',
            border: 'border-orange-500',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            text: 'text-orange-900'
        },
        medium: {
            bg: 'bg-amber-50',
            border: 'border-amber-500',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            text: 'text-amber-900'
        },
        low: {
            bg: 'bg-blue-50',
            border: 'border-blue-500',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            text: 'text-blue-900'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-500',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            text: 'text-blue-900'
        }
    };

    const colors = colorSchemes[notification.priority] || colorSchemes.info;
    const IconComponent = notification.icon;

    return (
        <div
            className={`
                ${colors.bg} ${colors.border} ${colors.text}
                border-l-4 rounded-lg shadow-lg p-4 mb-3
                cursor-pointer transition-all duration-300
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
                hover:shadow-xl hover:scale-[1.02]
                animate-in slide-in-from-right-10 fade-in duration-300
            `}
            onClick={handleClick}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                {IconComponent && (
                    <div className={`${colors.iconBg} ${colors.iconColor} p-2 rounded-lg flex-shrink-0`}>
                        <IconComponent size={20} strokeWidth={2.5} />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm mb-1">{notification.title}</p>
                    <p className="text-xs opacity-90 line-clamp-2">{notification.description}</p>
                    <span className="text-xs font-medium opacity-75 mt-1 inline-block">
                        {notification.timeAgo}
                    </span>
                </div>

                {/* Dismiss Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss();
                    }}
                    className={`${colors.iconColor} hover:opacity-100 opacity-80 transition-all flex-shrink-0 p-1.5 hover:bg-white/70 rounded-md hover:scale-110 relative z-10`}
                    aria-label="Cerrar notificación"
                >
                    <X size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export default ToastNotification;
