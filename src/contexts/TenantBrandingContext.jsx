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
  const [branding, setBranding] = useState(FALLBACK_BRANDING);
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

    // Aplicar fallback inmediatamente para evitar flash
    applyBrandingToDom(FALLBACK_BRANDING);
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

      // Actualizar estado local sin refetch
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
