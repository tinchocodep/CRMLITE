import { useState } from 'react';
import { Plus, X, Calendar, UserCheck, UserPlus, Users, Map, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FloatingActionButton({ onCreateEvent, onCreateProspect, onConvertProspect, onCreateClient }) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const actions = [
        {
            icon: Calendar,
            label: 'Crear Actividad',
            onClick: () => {
                onCreateEvent?.();
                setIsOpen(false);
            },
            color: 'from-white to-brand-red'
        },
        {
            icon: UserCheck,
            label: 'Nuevo Prospecto',
            onClick: () => {
                onCreateProspect?.();
                setIsOpen(false);
            },
            color: 'from-white to-brand-red'
        },
        {
            icon: UserPlus,
            label: 'Convertir Prospecto',
            onClick: () => {
                onConvertProspect?.();
                setIsOpen(false);
            },
            color: 'from-white to-brand-red'
        },
        {
            icon: Users,
            label: 'Nuevo Cliente',
            onClick: () => {
                onCreateClient?.();
                setIsOpen(false);
            },
            color: 'from-white to-brand-red'
        },
        {
            icon: Map,
            label: 'Registrar Visita',
            onClick: () => {
                navigate('/visitas');
                setIsOpen(false);
            },
            color: 'from-white to-brand-red'
        },
        {
            icon: Briefcase,
            label: 'Nueva Oportunidad',
            onClick: () => {
                navigate('/oportunidades');
                setIsOpen(false);
            },
            color: 'from-white to-brand-red'
        }
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Action Menu */}
            <div className={`absolute bottom-20 right-0 flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                {actions.map((action, index) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        className={`group flex items-center gap-3 transition-all duration-300`}
                        style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
                    >
                        {/* Label */}
                        <span className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {action.label}
                        </span>

                        {/* Icon Button */}
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${action.color} shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}>
                            <action.icon className="w-6 h-6 text-white" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full bg-gradient-to-r from-brand-red to-red-600 shadow-2xl shadow-red-500/50 flex items-center justify-center hover:scale-110 transition-all duration-300`}
            >
                {isOpen ? (
                    <X className="w-8 h-8 text-white" />
                ) : (
                    <Plus className="w-8 h-8 text-white" />
                )}
            </button>
        </div>
    );
}
