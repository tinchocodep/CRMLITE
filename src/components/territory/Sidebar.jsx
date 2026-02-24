import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, MapPin, Sprout, Plus, ChevronLeft, Building2, Landmark, Trash2, Edit2, Search } from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../contexts/AuthContext';
import HectaresSummaryPanel from './HectaresSummaryPanel';

const CROP_COLORS = {
    soy: '#22c55e',
    corn: '#eab308',
    wheat: '#f97316',
    sunflower: '#fbbf24',
    other: '#6b7280'
};

const CROP_ICONS = {
    soy: '🌱',
    corn: '🌽',
    wheat: '🌾',
    sunflower: '🌻',
    other: '📦'
};

const Sidebar = ({
    establishments = [],
    lots = [],
    onLotClick,
    onLotHover,
    onLotHoverEnd,
    onCreateEstablishment,
    onEditEstablishment,
    onDeleteEstablishment,
    onDeleteLot,
    initialClientId = null
}) => {
    const [expandedClients, setExpandedClients] = useState(
        initialClientId ? new Set([String(initialClientId)]) : new Set()
    );
    const [expandedEstablishments, setExpandedEstablishments] = useState(new Set());
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { confirm } = useConfirm();
    const { userProfile } = useAuth();
    const canViewSummary = userProfile?.role === 'admin' || userProfile?.role === 'supervisor' || userProfile?.role === 'superadmin';

    // If user arrives from a client link, auto-expand that client AND all its establishments
    useEffect(() => {
        if (!initialClientId || !establishments.length) return;

        const clientIdStr = String(initialClientId);

        // Expand the client row
        setExpandedClients(prev => {
            const next = new Set(prev);
            next.add(clientIdStr);
            return next;
        });

        // Expand every establishment belonging to this client so lots are visible
        const clientEstIds = establishments
            .filter(est => String(est.company_id) === clientIdStr)
            .map(est => est.id);

        if (clientEstIds.length) {
            setExpandedEstablishments(prev => {
                const next = new Set(prev);
                clientEstIds.forEach(id => next.add(id));
                return next;
            });
        }
    }, [initialClientId, establishments]);

    // ── Toggle helpers ────────────────────────────────────────────────────────
    const toggleClient = (clientId) => {
        setExpandedClients(prev => {
            const next = new Set(prev);
            next.has(clientId) ? next.delete(clientId) : next.add(clientId);
            return next;
        });
    };

    const toggleEstablishment = (estId) => {
        setExpandedEstablishments(prev => {
            const next = new Set(prev);
            next.has(estId) ? next.delete(estId) : next.add(estId);
            return next;
        });
    };

    // ── Build hierarchy: Group establishments by client ───────────────────────
    const clientGroups = useMemo(() => {
        // Filter establishments by search query
        const filtered = establishments.filter(est => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            const co = est.company;
            const cuitClean = co?.cuit?.replace(/-/g, '').toLowerCase() || '';
            return (
                cuitClean.includes(q.replace(/-/g, '')) ||
                co?.legal_name?.toLowerCase().includes(q) ||
                co?.trade_name?.toLowerCase().includes(q) ||
                est.name?.toLowerCase().includes(q)
            );
        });

        // Group by company_id — always use String key to match URL query param
        const map = new Map();
        filtered.forEach(est => {
            const key = est.company_id ? String(est.company_id) : 'sin_empresa';
            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    label: est.company?.legal_name || est.company?.trade_name || 'Sin empresa',
                    establishments: []
                });
            }
            map.get(key).establishments.push(est);
        });

        // Sort clients alphabetically
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [establishments, searchQuery]);

    // Index lots by establishment_id for fast lookup
    const lotsByEstablishment = useMemo(() => {
        return lots.reduce((acc, lot) => {
            const estId = lot.establishment_id;
            if (!acc[estId]) acc[estId] = [];
            acc[estId].push(lot);
            return acc;
        }, {});
    }, [lots]);

    const totalLots = lots.length;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleDeleteLot = async (e, lotId, lotName) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: 'Eliminar Lote',
            message: `¿Estás seguro de que deseas eliminar el lote "${lotName}"?\n\nEsta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'danger',
        });
        if (confirmed) onDeleteLot?.(lotId);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div
            className={`absolute left-4 top-4 bottom-4 z-[1000] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}
            onWheel={(e) => e.stopPropagation()}
        >
            <div className="h-full backdrop-blur-md bg-white/80 rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col relative">

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-6 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    title={isCollapsed ? 'Expandir' : 'Colapsar'}
                >
                    <ChevronLeft className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>

                {/* ── Collapsed View ── */}
                {isCollapsed ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 gap-6">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <MapPin className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{clientGroups.length}</div>
                            <div className="text-xs text-gray-500 mt-1">Clientes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{establishments.length}</div>
                            <div className="text-xs text-gray-500 mt-1">Est.</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{totalLots}</div>
                            <div className="text-xs text-gray-500 mt-1">Lotes</div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Header ── */}
                        <div className="sticky top-0 z-10 p-5 border-b border-gray-200/50 backdrop-blur-md bg-white/90 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Territorio</h2>
                                    <p className="text-xs text-gray-500">
                                        {clientGroups.length} clientes · {establishments.length} establecimientos · {totalLots} lotes
                                    </p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente, establecimiento..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* New Establishment Button */}
                            <button
                                onClick={onCreateEstablishment}
                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Establecimiento
                            </button>
                        </div>

                        {/* ── Hectares Summary Panel (admin/supervisor only) ── */}
                        {canViewSummary && (
                            <HectaresSummaryPanel lots={lots} />
                        )}

                        {/* ── Client → Establishment → Lots List ── */}
                        <div
                            className="sidebar-scroll flex-1 overflow-y-auto p-3 space-y-2"
                            onWheel={(e) => e.stopPropagation()}
                        >
                            {clientGroups.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Sprout className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm font-medium">{searchQuery ? 'Sin resultados' : 'Sin establecimientos'}</p>
                                    <p className="text-xs mt-1 text-gray-400">{searchQuery ? 'Probá con otra búsqueda' : 'Creá uno para empezar'}</p>
                                </div>
                            ) : (
                                clientGroups.map((client) => {
                                    const isClientExpanded = expandedClients.has(client.id);

                                    return (
                                        /* ── NIVEL 1: CLIENTE ── */
                                        <div key={client.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white/70 backdrop-blur-sm">
                                            <button
                                                onClick={() => toggleClient(client.id)}
                                                className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                {isClientExpanded
                                                    ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                                                    : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                                                }
                                                <div className="p-1.5 bg-green-100 rounded-md shrink-0">
                                                    <Building2 className="w-3.5 h-3.5 text-green-700" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-900 truncate">{client.label}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {client.establishments.length} establecimiento{client.establishments.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </button>

                                            {/* ── NIVEL 2: ESTABLECIMIENTOS ── */}
                                            {isClientExpanded && (
                                                <div className="border-t border-gray-100 divide-y divide-gray-100">
                                                    {client.establishments.map((est) => {
                                                        const isEstExpanded = expandedEstablishments.has(est.id);
                                                        const estLots = lotsByEstablishment[est.id] || [];

                                                        return (
                                                            <div key={est.id} className="bg-white/60">
                                                                {/* Establishment row */}
                                                                <div className="flex items-center gap-1 pl-6 pr-2 py-2 hover:bg-slate-50 transition-colors">
                                                                    <button
                                                                        onClick={() => toggleEstablishment(est.id)}
                                                                        className="flex items-center gap-2 flex-1 text-left"
                                                                    >
                                                                        {isEstExpanded
                                                                            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                            : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                        }
                                                                        <Landmark className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium text-gray-800 truncate">{est.name}</p>
                                                                            {est.location && (
                                                                                <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                                                                                    <MapPin className="w-2.5 h-2.5" /> {est.location}
                                                                                </p>
                                                                            )}
                                                                            {estLots.length > 0 && (() => {
                                                                                const totalHa = estLots.reduce((sum, l) => sum + (parseFloat(l.hectares) || 0), 0);
                                                                                const byCrop = estLots.reduce((acc, l) => {
                                                                                    const key = l.crop_type || 'other';
                                                                                    acc[key] = (acc[key] || 0) + (parseFloat(l.hectares) || 0);
                                                                                    return acc;
                                                                                }, {});
                                                                                return (
                                                                                    <div className="mt-1 space-y-0.5">
                                                                                        <p className="text-xs font-semibold text-green-700">
                                                                                            {totalHa.toFixed(1)} ha totales
                                                                                        </p>
                                                                                        {Object.entries(byCrop).map(([crop, ha]) => (
                                                                                            <p key={crop} className="text-xs text-gray-500 flex items-center gap-1">
                                                                                                <span>{CROP_ICONS[crop] || CROP_ICONS.other}</span>
                                                                                                <span>{ha.toFixed(1)} ha</span>
                                                                                            </p>
                                                                                        ))}
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                        <span className="text-xs text-gray-400 mr-1 shrink-0">
                                                                            {estLots.length} lote{estLots.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </button>
                                                                    {/* Establishment actions */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onEditEstablishment?.(est); }}
                                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                        title="Editar"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onDeleteEstablishment?.(est); }}
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>

                                                                {/* ── NIVEL 3: LOTES ── */}
                                                                {isEstExpanded && (
                                                                    <div className="pl-10 pr-3 pb-3 space-y-1.5">
                                                                        {estLots.length === 0 ? (
                                                                            <p className="text-xs text-gray-400 italic py-2 px-2">Sin lotes en este establecimiento</p>
                                                                        ) : (
                                                                            estLots.map((lot) => (
                                                                                <div
                                                                                    key={lot.id}
                                                                                    onClick={() => onLotClick?.(lot)}
                                                                                    onMouseEnter={() => onLotHover?.(lot.id)}
                                                                                    onMouseLeave={() => onLotHoverEnd?.()}
                                                                                    className="group flex items-start gap-2 p-2.5 bg-white rounded-lg border border-gray-200 hover:border-green-400 hover:shadow-sm cursor-pointer transition-all"
                                                                                >
                                                                                    <span className="text-base shrink-0 mt-0.5">
                                                                                        {CROP_ICONS[lot.crop_type] || CROP_ICONS.other}
                                                                                    </span>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm font-medium text-gray-900 truncate">{lot.name}</p>
                                                                                        <p className="text-xs text-gray-500">{lot.hectares} ha{lot.campaign ? ` · ${lot.campaign}` : ''}</p>
                                                                                        <div
                                                                                            className="mt-1.5 h-1 rounded-full"
                                                                                            style={{ backgroundColor: lot.color || CROP_COLORS[lot.crop_type] || CROP_COLORS.other }}
                                                                                        />
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => handleDeleteLot(e, lot.id, lot.name)}
                                                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all shrink-0"
                                                                                        title="Eliminar lote"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                                                    </button>
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
