import React from 'react';
import { Briefcase, User, Calendar, DollarSign, TrendingUp, Clock, ChevronRight } from 'lucide-react';

const statusConfig = {
    iniciado: { label: 'Iniciado', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🚀' },
    presupuestado: { label: 'Presupuestado', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '📋' },
    negociado: { label: 'Negociado', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🤝' },
    ganado: { label: 'Ganado', color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
    perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700 border-red-200', icon: '❌' }
};

export default function OpportunityCard({ opportunity, onClick }) {
    const status = statusConfig[opportunity.status];
    const formattedAmount = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(opportunity.amount);

    const closeDate = new Date(opportunity.closeDate);
    const daysUntilClose = Math.ceil((closeDate - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilClose < 0;
    const isUrgent = daysUntilClose >= 0 && daysUntilClose <= 7;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 active:scale-[0.98]"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-2">
                        {opportunity.opportunityName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User size={12} />
                        <span>{opportunity.comercial.name}</span>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color} flex items-center gap-1 whitespace-nowrap ml-2`}>
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                </span>
            </div>

            {/* Linked Entity */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg">
                <div className={`w-8 h-8 rounded-lg ${opportunity.linkedEntity.type === 'client' ? 'bg-emerald-100' : 'bg-purple-100'} flex items-center justify-center`}>
                    <span className="text-sm">{opportunity.linkedEntity.type === 'client' ? '👥' : '👤'}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 capitalize">{opportunity.linkedEntity.type === 'client' ? 'Cliente' : 'Prospecto'}</p>
                    <p className="font-semibold text-sm text-slate-800 truncate">{opportunity.linkedEntity.name}</p>
                    {opportunity.linkedEntity.cuit && (
                        <p className="text-xs text-slate-500">CUIT: {opportunity.linkedEntity.cuit}</p>
                    )}
                </div>
            </div>

            {/* Contact Info */}
            {opportunity.contact && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 mb-1.5">Cliente/Contacto</p>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800">{opportunity.contact.name}</p>
                        {opportunity.contact.email && (
                            <p className="text-xs text-slate-600">📧 {opportunity.contact.email}</p>
                        )}
                        {opportunity.contact.phone && (
                            <p className="text-xs text-slate-600">📱 {opportunity.contact.phone}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Amount & Probability */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={14} className="text-green-600" />
                        <span className="text-xs text-green-700 font-medium">Monto</span>
                    </div>
                    <p className="font-bold text-green-800 text-sm">{formattedAmount}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-blue-600" />
                        <span className="text-xs text-blue-700 font-medium">Probabilidad</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-blue-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                                style={{ width: `${opportunity.probability}%` }}
                            />
                        </div>
                        <span className="font-bold text-blue-800 text-xs">{opportunity.probability}%</span>
                    </div>
                </div>
            </div>

            {/* Product & Close Date */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-xs text-slate-500 mb-1">Producto</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{opportunity.productType}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 mb-1">Cierre</p>
                    <div className="flex items-center gap-1">
                        <Calendar size={12} className={isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-slate-500'} />
                        <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-slate-700'}`}>
                            {closeDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Next Action */}
            {opportunity.nextAction && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={12} className="text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700">Próxima Acción</span>
                    </div>
                    <p className="text-xs text-amber-900 line-clamp-2 mb-1">{opportunity.nextAction}</p>
                    <p className="text-xs text-amber-600 font-medium">
                        {new Date(opportunity.nextActionDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                </div>
            )}

            {/* Footer - Click indicator */}
            <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100">
                <ChevronRight size={16} className="text-slate-400" />
            </div>
        </div>
    );
}
