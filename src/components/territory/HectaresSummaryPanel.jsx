import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, BarChart3, Sprout } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CROP_CONFIG = {
    soy: { label: 'Soja', icon: '🌱', color: '#22c55e', bgClass: 'bg-green-500' },
    corn: { label: 'Maíz', icon: '🌽', color: '#eab308', bgClass: 'bg-yellow-400' },
    wheat: { label: 'Trigo', icon: '🌾', color: '#f97316', bgClass: 'bg-orange-400' },
    sunflower: { label: 'Girasol', icon: '🌻', color: '#fbbf24', bgClass: 'bg-amber-400' },
    other: { label: 'Otro', icon: '📦', color: '#6b7280', bgClass: 'bg-slate-400' },
};

const CROP_ORDER = ['soy', 'corn', 'wheat', 'sunflower', 'other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Aggregates lots into a summary map keyed by comercial.
 * Shape: Map<comercialId, { name: string, totalHa: number, byCrop: Record<string, number> }>
 */
const buildComercialSummary = (lots) => {
    const map = new Map();

    lots.forEach((lot) => {
        const comercial = lot.establishment?.company?.comercial;
        if (!comercial) return;

        const { id, name } = comercial;
        const ha = parseFloat(lot.hectares) || 0;
        const crop = lot.crop_type || 'other';

        if (!map.has(id)) {
            map.set(id, { id, name, totalHa: 0, byCrop: {} });
        }

        const entry = map.get(id);
        entry.totalHa += ha;
        entry.byCrop[crop] = (entry.byCrop[crop] || 0) + ha;
    });

    // Sort by total hectares descending
    return Array.from(map.values()).sort((a, b) => b.totalHa - a.totalHa);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Horizontal stacked mini-bar showing crop distribution for one comercial */
const CropDistributionBar = ({ byCrop, totalHa }) => {
    if (totalHa === 0) return null;

    const crops = CROP_ORDER.filter((c) => byCrop[c]);

    return (
        <div className="flex h-2 w-full rounded-full overflow-hidden gap-px mt-1.5">
            {crops.map((crop) => {
                const pct = (byCrop[crop] / totalHa) * 100;
                return (
                    <div
                        key={crop}
                        className="h-full rounded-sm transition-all"
                        style={{ width: `${pct}%`, backgroundColor: CROP_CONFIG[crop]?.color || CROP_CONFIG.other.color }}
                        title={`${CROP_CONFIG[crop]?.label}: ${byCrop[crop].toFixed(1)} ha`}
                    />
                );
            })}
        </div>
    );
};

/** Row showing one crop type's hectares for a comercial */
const CropRow = ({ cropKey, hectares, totalHa }) => {
    const cfg = CROP_CONFIG[cropKey] || CROP_CONFIG.other;
    const pct = totalHa > 0 ? (hectares / totalHa) * 100 : 0;

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm w-5 text-center">{cfg.icon}</span>
            <div className="flex-1">
                <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                    <span className="font-medium">{cfg.label}</span>
                    <span className="font-semibold">{hectares.toFixed(1)} ha</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                    />
                </div>
            </div>
        </div>
    );
};

/** Card for a single comercial with expandable crop breakdown */
const ComercialCard = ({ comercial }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const crops = CROP_ORDER.filter((c) => comercial.byCrop[c]);

    return (
        <div className="rounded-xl border border-gray-200 bg-white/80 overflow-hidden">
            {/* Header row */}
            <button
                onClick={() => setIsExpanded((p) => !p)}
                className="w-full flex items-start gap-2 p-3 hover:bg-gray-50 transition-colors text-left"
            >
                {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{comercial.name}</p>
                        <span className="text-sm font-bold text-green-700 whitespace-nowrap">
                            {comercial.totalHa.toFixed(1)} ha
                        </span>
                    </div>
                    {/* Mini distribution bar (always visible) */}
                    <CropDistributionBar byCrop={comercial.byCrop} totalHa={comercial.totalHa} />
                    {/* Crop icon pills (collapsed summary) */}
                    {!isExpanded && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {crops.map((c) => (
                                <span key={c} className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                    {CROP_CONFIG[c].icon} {comercial.byCrop[c].toFixed(0)} ha
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </button>

            {/* Expanded: per-crop breakdown */}
            {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                    {crops.map((c) => (
                        <CropRow
                            key={c}
                            cropKey={c}
                            hectares={comercial.byCrop[c]}
                            totalHa={comercial.totalHa}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * HectaresSummaryPanel
 *
 * Displays a collapsible panel in the Territory Sidebar showing total hectares
 * by crop type, grouped per comercial. Aggregates data purely on the frontend
 * using the `lots` array passed from useLots (which now includes comercial info).
 *
 * @param {Object[]} lots - Array of lots from useLots hook
 */
const HectaresSummaryPanel = ({ lots = [] }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const summary = useMemo(() => buildComercialSummary(lots), [lots]);

    const grandTotalHa = useMemo(
        () => summary.reduce((acc, c) => acc + c.totalHa, 0),
        [summary]
    );

    if (summary.length === 0) return null;

    return (
        <div className="border-b border-gray-200/60">
            {/* Panel toggle header */}
            <button
                onClick={() => setIsPanelOpen((p) => !p)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-green-50 transition-colors text-left"
            >
                <div className="p-1.5 bg-green-100 rounded-md shrink-0">
                    <BarChart3 className="w-3.5 h-3.5 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Resumen por Comercial
                    </p>
                    <p className="text-[11px] text-gray-500">
                        {grandTotalHa.toFixed(1)} ha totales · {summary.length} comercial{summary.length !== 1 ? 'es' : ''}
                    </p>
                </div>
                {isPanelOpen
                    ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                }
            </button>

            {/* Panel body */}
            {isPanelOpen && (
                <div className="px-3 pb-3 space-y-2 max-h-72 overflow-y-auto">
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 py-1.5">
                        {CROP_ORDER.map((c) => (
                            <span key={c} className="flex items-center gap-1 text-[10px] text-gray-500">
                                <span
                                    className="inline-block w-2 h-2 rounded-full"
                                    style={{ backgroundColor: CROP_CONFIG[c].color }}
                                />
                                {CROP_CONFIG[c].label}
                            </span>
                        ))}
                    </div>

                    {/* Comercial cards */}
                    {summary.map((comercial) => (
                        <ComercialCard key={comercial.id} comercial={comercial} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HectaresSummaryPanel;
