import React, { useState, useEffect } from 'react';
import { Search, Building2, X, Users, User } from 'lucide-react';

/**
 * BusinessUnitPicker - Dropdown component for selecting clients or prospects
 * @param {Object} props
 * @param {string} props.value - Selected entity ID
 * @param {string} props.entityType - Type of selected entity ('client' or 'prospect')
 * @param {Function} props.onChange - Callback when selection changes (entityId, entityType, entity)
 * @param {Array} props.clients - Array of client objects
 * @param {Array} props.prospects - Array of prospect objects
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.label - Label for the field
 */
const BusinessUnitPicker = ({
    value,
    entityType,
    onChange,
    clients = [],
    prospects = [],
    required = false,
    label = "Unidad de Negocio"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'clients', 'prospects'

    // Get selected entity details
    const selectedEntity = value && entityType
        ? entityType === 'client'
            ? clients.find(c => c.id === parseInt(value))
            : prospects.find(p => p.id === parseInt(value))
        : null;

    // Combine and filter entities
    const allEntities = [
        ...clients.map(c => ({
            ...c,
            type: 'client',
            displayName: c.trade_name || c.legal_name
        })),
        ...prospects.map(p => ({
            ...p,
            type: 'prospect',
            displayName: p.trade_name || p.legal_name
        }))
    ];

    const filteredEntities = allEntities.filter(entity => {
        // Filter by tab
        if (activeTab === 'clients' && entity.type !== 'client') return false;
        if (activeTab === 'prospects' && entity.type !== 'prospect') return false;

        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = entity.displayName?.toLowerCase().includes(searchLower);
            const cuitMatch = entity.cuit?.toLowerCase().includes(searchLower);
            return nameMatch || cuitMatch;
        }

        return true;
    });

    const handleSelect = (entity) => {
        onChange(entity.id.toString(), entity.type, entity);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('', '', null);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && !e.target.closest('.business-unit-picker')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="business-unit-picker relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <Building2 size={14} className="inline mr-1.5" />
                {label} {required && '*'}
            </label>

            {/* Selected Display / Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2.5 text-sm rounded-xl border ${selectedEntity
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-300 bg-white'
                    } focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none text-left flex items-center justify-between gap-2 transition-all`}
            >
                {selectedEntity ? (
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={`w-7 h-7 rounded-lg ${entityType === 'client' ? 'bg-emerald-100' : 'bg-purple-100'
                            } flex items-center justify-center flex-shrink-0`}>
                            {entityType === 'client'
                                ? <Users size={14} className="text-emerald-600" />
                                : <User size={14} className="text-purple-600" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 capitalize">
                                {entityType === 'client' ? 'Cliente' : 'Prospecto'}
                            </p>
                            <p className="font-semibold text-sm text-slate-800 truncate">
                                {selectedEntity.displayName || selectedEntity.trade_name || selectedEntity.legal_name}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0"
                        >
                            <X size={14} className="text-slate-500" />
                        </button>
                    </div>
                ) : (
                    <span className="text-slate-400">Seleccionar cliente o prospecto...</span>
                )}
                <Search size={16} className="text-slate-400 flex-shrink-0" />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o CUIT..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-brand-red outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'all'
                                    ? 'text-brand-red border-b-2 border-brand-red bg-white'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Todos ({allEntities.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('clients')}
                            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'clients'
                                    ? 'text-brand-red border-b-2 border-brand-red bg-white'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Clientes ({clients.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('prospects')}
                            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'prospects'
                                    ? 'text-brand-red border-b-2 border-brand-red bg-white'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Prospectos ({prospects.length})
                        </button>
                    </div>

                    {/* Results List */}
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {filteredEntities.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No se encontraron resultados
                            </div>
                        ) : (
                            filteredEntities.map(entity => (
                                <button
                                    key={`${entity.type}-${entity.id}`}
                                    type="button"
                                    onClick={() => handleSelect(entity)}
                                    className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 border-b border-slate-100 last:border-0 transition-colors group"
                                >
                                    <div className={`w-8 h-8 rounded-lg ${entity.type === 'client' ? 'bg-emerald-100' : 'bg-purple-100'
                                        } flex items-center justify-center flex-shrink-0`}>
                                        {entity.type === 'client'
                                            ? <Users size={16} className="text-emerald-600" />
                                            : <User size={16} className="text-purple-600" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 truncate group-hover:text-brand-red transition-colors">
                                            {entity.displayName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-500 capitalize">
                                                {entity.type === 'client' ? 'Cliente' : 'Prospecto'}
                                            </p>
                                            {entity.cuit && (
                                                <>
                                                    <span className="text-xs text-slate-300">•</span>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        CUIT: {entity.cuit}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessUnitPicker;
