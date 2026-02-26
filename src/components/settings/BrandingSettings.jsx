import React, { useState, useRef, useEffect } from 'react';
import { Upload, Check, AlertCircle, Loader2, Image, Palette, RefreshCw, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';
import { useCurrentTenant } from '../../hooks/useCurrentTenant';

/**
 * Convierte un color HEX (#RRGGBB) a formato HSL string "H S% L%"
 * que es el formato que usan las CSS vars del sistema de branding.
 */
const hexToHsl = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/**
 * Convierte HSL string "H S% L%" a HEX #RRGGBB
 */
const hslToHex = (hsl) => {
    try {
        const parts = hsl.replace(/%/g, '').split(' ').map(Number);
        if (parts.length !== 3) return '#E76E53';
        let [h, s, l] = parts;
        h /= 360; s /= 100; l /= 100;

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
        const g = Math.round(hue2rgb(p, q, h) * 255);
        const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch {
        return '#E76E53';
    }
};

// Genera un hover más oscuro (reduce lightness un 11%)
const generateHoverHsl = (hsl) => {
    const parts = hsl.replace(/%/g, '').split(' ').map(Number);
    if (parts.length !== 3) return hsl;
    const newL = Math.max(0, parts[2] - 11);
    return `${parts[0]} ${parts[1]}% ${newL}%`;
};

const BrandingSettings = () => {
    const { branding, updateBranding } = useTenantBranding();
    const { tenantId } = useCurrentTenant();

    const [hexColor, setHexColor] = useState(hslToHex(branding.primaryColor));
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const [companyName, setCompanyName] = useState(branding.companyName || '');
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }
    const [previewLogo, setPreviewLogo] = useState(branding.logoUrl);
    const fileInputRef = useRef(null);

    const showFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 3500);
    };

    // Sincroniza con el contexto cuando branding llega del fetch async (post-login)
    useEffect(() => {
        setCompanyName(branding.companyName || '');
        setHexColor(hslToHex(branding.primaryColor));
        setPreviewLogo(branding.logoUrl);
    }, [branding.companyName, branding.primaryColor, branding.logoUrl]);

    // ── Guardar nombre de empresa ─────────────────────────────────────────────
    const saveCompanyName = async () => {
        const trimmed = companyName.trim();
        if (!trimmed) { showFeedback('error', 'El nombre no puede estar vacío'); return; }
        setSavingName(true);
        const result = await updateBranding({ name: trimmed });
        setSavingName(false);
        if (result.success) {
            showFeedback('success', 'Nombre de empresa actualizado');
        } else {
            showFeedback('error', result.error || 'Error al guardar el nombre');
        }
    };

    // ── Color picker ─────────────────────────────────────────────────────────
    const handleColorChange = (e) => {
        setHexColor(e.target.value);
    };

    const handleHexInput = (e) => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = '#' + val;
        setHexColor(val.slice(0, 7));
    };

    const saveColor = async () => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
            showFeedback('error', 'Color inválido. Usá el formato #RRGGBB');
            return;
        }

        setSaving(true);
        const hsl = hexToHsl(hexColor);
        const hover = generateHoverHsl(hsl);

        const result = await updateBranding({
            primary_color: hsl,
            primary_hover: hover,
            accent_color: hover,
        });

        setSaving(false);
        if (result.success) {
            showFeedback('success', 'Color de marca actualizado');
        } else {
            showFeedback('error', result.error || 'Error al guardar el color');
        }
    };

    // ── Logo upload ───────────────────────────────────────────────────────────
    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo y tamaño
        if (!file.type.startsWith('image/')) {
            showFeedback('error', 'Solo se permiten imágenes (PNG, JPG, SVG)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showFeedback('error', 'El archivo no puede superar 2MB');
            return;
        }

        setUploading(true);

        // Preview local inmediato
        const localUrl = URL.createObjectURL(file);
        setPreviewLogo(localUrl);

        try {
            const ext = file.name.split('.').pop();
            const path = `tenant-${tenantId}/logo.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('tenant-logos')
                .upload(path, file, { upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('tenant-logos')
                .getPublicUrl(path);

            // Guardar URL en DB + caché-busting
            const urlWithCache = `${publicUrl}?t=${Date.now()}`;
            const result = await updateBranding({ logo_url: urlWithCache });

            if (result.success) {
                setPreviewLogo(urlWithCache);
                showFeedback('success', 'Logo actualizado correctamente');
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error('[BrandingSettings] Error uploading logo:', err);
            setPreviewLogo(branding.logoUrl);
            showFeedback('error', err.message || 'Error al subir el logo');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-[var(--color-brand-primary)]" />
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Marca de la empresa</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Los cambios se aplican en tiempo real</p>
                </div>
            </div>

            {/* Feedback banner */}
            {feedback && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${feedback.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                    {feedback.type === 'success'
                        ? <Check className="w-4 h-4 flex-shrink-0" />
                        : <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    }
                    {feedback.message}
                </div>
            )}

            {/* ── Sección Nombre de empresa ── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[var(--color-brand-primary)]" />
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Nombre de la empresa
                    </label>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Se mostrará en la barra superior del CRM.
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveCompanyName()}
                        placeholder="Ej: OG CRM"
                        className="flex-1 px-4 py-3 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-slate-800 dark:text-white"
                    />
                    <button
                        onClick={saveCompanyName}
                        disabled={savingName}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                    >
                        {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* ── Sección Logo ── */}
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Logo de la empresa
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Se mostrará en la barra lateral y en la pantalla de login. PNG, JPG o SVG, máx. 2MB.
                </p>

                <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="w-32 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden flex-shrink-0">
                        {previewLogo ? (
                            <img
                                src={previewLogo}
                                alt="Logo preview"
                                className="max-w-full max-h-full object-contain p-1"
                            />
                        ) : (
                            <Image className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        )}
                    </div>

                    {/* Upload button */}
                    <div className="flex-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold text-sm hover:bg-[var(--color-brand-primary)]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                            ) : (
                                <><Upload className="w-4 h-4" /> Subir logo</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* ── Sección Color ── */}
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Color principal de marca
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Afecta botones, íconos activos y acentos en toda la aplicación.
                </p>

                <div className="flex items-center gap-3">
                    {/* Color picker nativo */}
                    <div className="relative flex-shrink-0">
                        <input
                            type="color"
                            value={hexColor}
                            onChange={handleColorChange}
                            className="w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 cursor-pointer p-0.5 bg-transparent"
                        />
                    </div>

                    {/* Input hex manual */}
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">#</span>
                        <input
                            type="text"
                            value={hexColor.replace('#', '')}
                            onChange={(e) => handleHexInput(e)}
                            maxLength={6}
                            placeholder="E76E53"
                            className="w-full pl-7 pr-4 py-3 font-mono text-sm uppercase bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Preview del color */}
                    <div
                        className="w-12 h-12 rounded-xl flex-shrink-0 shadow-md"
                        style={{ backgroundColor: hexColor }}
                    />
                </div>

                {/* Botón guardar color */}
                <button
                    onClick={saveColor}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    ) : (
                        <><RefreshCw className="w-4 h-4" /> Aplicar color</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BrandingSettings;
