import { useState } from 'react';
import { Plus, X, Calendar, UserCheck, Users, Briefcase, Package, Building2, FileText, Receipt, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingActionButton({ onCreateEvent, onCreateProspect, onConvertProspect, onCreateClient, currentContext = 'crm' }) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // CRM Actions
    const crmActions = [
        {
            icon: Briefcase,
            label: 'Nueva Oportunidad',
            onClick: () => {
                navigate('/oportunidades');
                setIsOpen(false);
            },
            color: 'from-blue-500 to-blue-600'
        },
        {
            icon: UserCheck,
            label: 'Nuevo Prospecto',
            onClick: () => {
                onCreateProspect?.();
                setIsOpen(false);
            },
            color: 'from-purple-500 to-purple-600'
        },
        {
            icon: Building2,
            label: 'Nueva Empresa',
            onClick: () => {
                onCreateClient?.();
                setIsOpen(false);
            },
            color: 'from-green-500 to-green-600'
        },
        {
            icon: Calendar,
            label: 'Crear Actividad',
            onClick: () => {
                onCreateEvent?.();
                setIsOpen(false);
            },
            color: 'from-pink-500 to-pink-600'
        }
    ];

    // Cotizador Actions
    const cotizadorActions = [
        {
            icon: FileText,
            label: 'Nueva Cotización',
            onClick: () => {
                navigate('/cotizaciones');
                setIsOpen(false);
            },
            color: 'from-blue-500 to-blue-600'
        },
        {
            icon: Package,
            label: 'Nuevo Pedido',
            onClick: () => {
                navigate('/pedidos');
                setIsOpen(false);
            },
            color: 'from-amber-500 to-amber-600'
        },
        {
            icon: Receipt,
            label: 'Nuevo Comprobante',
            onClick: () => {
                navigate('/comprobantes');
                setIsOpen(false);
            },
            color: 'from-green-500 to-green-600'
        },
        {
            icon: TrendingUp,
            label: 'Sumar Stock',
            onClick: () => {
                navigate('/stock');
                setIsOpen(false);
            },
            color: 'from-purple-500 to-purple-600'
        }
    ];

    // Select actions based on context
    const actions = currentContext === 'cotizador' ? cotizadorActions : crmActions;

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    />
                )}
            </AnimatePresence>

            {/* FAB Container */}
            <div className="fixed bottom-20 right-4 z-50 xl:bottom-6 xl:right-6">
                {/* Action Buttons */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            className="flex flex-col gap-3 mb-3"
                        >
                            {actions.map((action, index) => (
                                <motion.button
                                    key={action.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={action.onClick}
                                    className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${action.color} text-white rounded-full shadow-lg hover:shadow-xl transition-all xl:justify-end`}
                                >
                                    <span className="font-semibold text-sm whitespace-nowrap">
                                        {action.label}
                                    </span>
                                    <action.icon className="w-5 h-5" />
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main FAB */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 xl:w-16 xl:h-16 rounded-full bg-gradient-to-r from-advanta-green to-green-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${isOpen ? 'rotate-45' : ''
                        }`}
                >
                    {isOpen ? <X className="w-6 h-6 xl:w-8 xl:h-8" /> : <Plus className="w-6 h-6 xl:w-8 xl:h-8" />}
                </motion.button>
            </div>
        </>
    );
}
