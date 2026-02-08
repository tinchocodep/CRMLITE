import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Package, Receipt, CreditCard, Box } from 'lucide-react';
import { motion } from 'framer-motion';

const CotizadorIndex = () => {
    const navigate = useNavigate();

    const modules = [
        {
            name: 'Cotizaciones',
            description: 'Oportunidades ganadas convertidas en cotizaciones',
            icon: FileText,
            path: '/cotizaciones',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'from-blue-50 to-blue-100'
        },
        {
            name: 'Pedidos',
            description: 'Cotizaciones cerradas listas para facturar y remitir',
            icon: Package,
            path: '/pedidos',
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'from-indigo-50 to-indigo-100'
        },
        {
            name: 'Comprobantes',
            description: 'Facturas, notas de crédito y débito',
            icon: Receipt,
            path: '/comprobantes',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'from-purple-50 to-purple-100'
        },
        {
            name: 'Cuenta Corriente',
            description: 'Saldos y movimientos de clientes',
            icon: CreditCard,
            path: '/cuenta-corriente',
            color: 'from-green-500 to-green-600',
            bgColor: 'from-green-50 to-green-100'
        },
        {
            name: 'Stock',
            description: 'Inventario y gestión de productos',
            icon: Box,
            path: '/stock',
            color: 'from-amber-500 to-amber-600',
            bgColor: 'from-amber-50 to-amber-100'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-advanta-green to-green-600 flex items-center justify-center shadow-lg">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cotizador</h1>
                            <p className="text-slate-600 dark:text-slate-400">Gestión completa de cotizaciones, pedidos y facturación</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module, index) => (
                        <motion.button
                            key={module.path}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => navigate(module.path)}
                            className="group relative bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-8 hover:border-advanta-green hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
                        >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${module.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            {/* Content */}
                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <module.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-advanta-green transition-colors">
                                    {module.name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {module.description}
                                </p>
                            </div>

                            {/* Arrow indicator */}
                            <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                <svg className="w-4 h-4 text-advanta-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CotizadorIndex;
