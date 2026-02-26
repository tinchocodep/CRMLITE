import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentTenant } from '../hooks/useCurrentTenant';

/**
 * TenantBrandingContext — DB-driven
 *
 * Estrategia de resolución de branding (por orden de prioridad):
 *  1. Pre-login: detecta el hostname → busca tenant por domain en la tabla tenants
 *  2. Post-login: usa tenantId del usuario autenticado
 *  3. Fallback: branding por defecto (SAILO)
 *
 * CSS custom properties aplicadas al :root:
 *  --color-brand-primary
 *  --color-brand-primary-hover
 *  --color-brand-accent
 *  --color-brand-text-on-primary
 */

// Branding de emergencia (si la DB no responde antes del primer render)
const FALLBACK_BRANDING = {
  companyName: 'CRM',
  primaryColor: '12 76% 61%',
  primaryHover: '12 76% 50%',
  accentColor: '12 76% 45%',
  textOnPrimary: '0 0% 100%',
  logoUrl: null,
  logoWidth: 120,
  logoHeight: 40,
};

// ── Branding cache via localStorage ──────────────────────────────────────────
// Clave versionada para invalidar caches viejos en deploys futuros.
const CACHE_KEY_PREFIX = 'crm_branding_v2_';

const readBrandingCache = (tenantId) => {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${tenantId}`);
    if (raw) return JSON.parse(raw);
  } catch { }
  return null;
};

const writeBrandingCache = (tenantId, branding) => {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${tenantId}`, JSON.stringify(branding));
  } catch { }
};

const clearBrandingCache = (tenantId) => {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${tenantId}`);
  } catch { }
};

/**
 * Retorna el mejor branding disponible ANTES del primer render:
 *  1. Cache de localStorage del tenant actual (si existe)
 *  2. Cualquier cache reciente (primer valor encontrado)
 *  3. FALLBACK
 */
const getInitialBranding = () => {
  try {
    // Buscar cualquier cache existente (se usa antes de conocer el tenantId)
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = JSON.parse(localStorage.getItem(key));
        if (cached) {
          // Aplicar inmediatamente al DOM para el primer frame
          return cached;
        }
      }
    }
  } catch { }
  return FALLBACK_BRANDING;
};

const TenantBrandingContext = createContext(null);

export const useTenantBranding = () => {
  const context = useContext(TenantBrandingContext);
  if (!context) {
    throw new Error('useTenantBranding must be used within TenantBrandingProvider');
  }
  return context;
};

/**
 * Aplica las CSS variables de color al :root.
 * Permite que Tailwind y cualquier CSS las consuma sin re-renderizar.
 */
const applyBrandingToDom = (branding) => {
  // ── CSS variables de color ────────────────────────────────────────────────
  const root = document.documentElement;
  root.style.setProperty('--color-brand-primary', `hsl(${branding.primaryColor})`);
  root.style.setProperty('--color-brand-primary-hover', `hsl(${branding.primaryHover})`);
  root.style.setProperty('--color-brand-accent', `hsl(${branding.accentColor})`);
  root.style.setProperty('--color-brand-text-on-primary', `hsl(${branding.textOnPrimary})`);

  // ── Title de la pestaña ───────────────────────────────────────────────────
  if (branding.companyName && branding.companyName !== 'CRM') {
    document.title = `${branding.companyName} | CRM`;
  }

  // ── Favicon dinámico ──────────────────────────────────────────────────────
  if (branding.logoUrl) {
    let favicon = document.querySelector("link[rel~='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = branding.logoUrl;
  }
};

/**
 * Normaliza una fila de la tabla tenants al formato de branding del contexto.
 */
const normalizeTenantRow = (row) => ({
  companyName: row.name || 'CRM',
  primaryColor: row.primary_color || FALLBACK_BRANDING.primaryColor,
  primaryHover: row.primary_hover || FALLBACK_BRANDING.primaryHover,
  accentColor: row.accent_color || FALLBACK_BRANDING.accentColor,
  textOnPrimary: '0 0% 100%',
  logoUrl: row.logo_url || null,
  logoWidth: row.logo_width || 120,
  logoHeight: row.logo_height || 40,
  tenantId: row.id,
});

export const TenantBrandingProvider = ({ children }) => {
  const { tenantId, loading: tenantLoading } = useCurrentTenant();
  // Usa el cache de localStorage como estado inicial → no hay flash en el primer render
  const [branding, setBranding] = useState(() => {
    const cached = getInitialBranding();
    applyBrandingToDom(cached); // aplica CSS vars SINCRÓNICAMENTE antes del primer paint
    return cached;
  });
  const [isLoading, setIsLoading] = useState(true);

  // ─── PASO 1: Detección por dominio (pre-login) ────────────────────────────
  // Se ejecuta una sola vez al montar, sin necesitar auth.
  useEffect(() => {
    const detectBrandingByDomain = async () => {
      const hostname = window.location.hostname;

      // En desarrollo local, skip la detección por dominio
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, primary_color, primary_hover, accent_color, logo_url, logo_width, logo_height')
          .eq('domain', hostname)
          .maybeSingle();

        if (!error && data) {
          const resolved = normalizeTenantRow(data);
          setBranding(resolved);
          applyBrandingToDom(resolved);
        }
      } catch (err) {
        console.error('[TenantBranding] Error detecting branding by domain:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Aplica el cache inmediatamente (ya ocurrió en useState, aquí es no-op si ya existe)
    const initial = getInitialBranding();
    applyBrandingToDom(initial);
    detectBrandingByDomain();
  }, []);

  // ─── PASO 2: Actualizar con tenant del usuario autenticado (post-login) ───
  useEffect(() => {
    if (tenantLoading || !tenantId) return;

    const fetchBrandingByTenantId = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, primary_color, primary_hover, accent_color, logo_url, logo_width, logo_height')
          .eq('id', tenantId)
          .maybeSingle();

        if (!error && data) {
          const resolved = normalizeTenantRow(data);
          setBranding(resolved);
          applyBrandingToDom(resolved);
          // Guardar en cache para el próximo render (elimina flash)
          writeBrandingCache(resolved.tenantId, resolved);
        }
      } catch (err) {
        console.error('[TenantBranding] Error fetching branding by tenant_id:', err);
      }
    };

    fetchBrandingByTenantId();
  }, [tenantId, tenantLoading]);

  /**
   * Actualiza el branding en la DB y en el estado local inmediatamente.
   * Usado desde el panel de Settings del admin.
   *
   * @param {Object} updates - { primary_color?, logo_url?, logo_width?, logo_height? }
   */
  const updateBranding = async (updates) => {
    if (!tenantId) return { success: false, error: 'No tenant activo' };

    try {
      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId);

      if (error) throw error;

      const updatedBranding = {
        ...branding,
        companyName: updates.name ?? branding.companyName,
        primaryColor: updates.primary_color ?? branding.primaryColor,
        primaryHover: updates.primary_hover ?? branding.primaryHover,
        accentColor: updates.accent_color ?? branding.accentColor,
        logoUrl: updates.logo_url ?? branding.logoUrl,
        logoWidth: updates.logo_width ?? branding.logoWidth,
        logoHeight: updates.logo_height ?? branding.logoHeight,
      };

      setBranding(updatedBranding);
      applyBrandingToDom(updatedBranding);
      // Actualizar cache para que el próximo render ya tenga el nuevo branding
      writeBrandingCache(tenantId, updatedBranding);
      return { success: true };
    } catch (err) {
      console.error('[TenantBranding] Error updating branding:', err);
      return { success: false, error: err.message };
    }
  };

  const value = {
    branding,
    isLoading,
    updateBranding,
  };

  return (
    <TenantBrandingContext.Provider value={value}>
      {children}
    </TenantBrandingContext.Provider>
  );
};
