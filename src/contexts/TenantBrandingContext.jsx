import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCurrentTenant } from '../hooks/useCurrentTenant';
import { TENANT_BRANDING, DEFAULT_BRANDING } from '../config/tenantBranding';

/**
 * TenantBrandingContext
 * Aplica el logo y los colores de marca del tenant activo
 * mediante CSS custom properties en el :root del documento.
 *
 * Principio: la UI es "tonta" — solo consume `useTenantBranding()`
 * y no sabe nada sobre qué tenant está activo.
 */

const TenantBrandingContext = createContext(null);

/**
 * Hook para consumir el branding del tenant activo.
 * @returns {{ branding: import('../config/tenantBranding').TenantBranding, isLoading: boolean }}
 */
export const useTenantBranding = () => {
  const context = useContext(TenantBrandingContext);
  if (!context) {
    throw new Error('useTenantBranding must be used within TenantBrandingProvider');
  }
  return context;
};

/**
 * Aplica las CSS variables de color al :root del documento.
 * Esto permite que Tailwind v4 y cualquier CSS las consuma
 * sin necesidad de re-renderizar componentes individuales.
 *
 * @param {import('../config/tenantBranding').TenantBranding} branding
 */
const applyBrandingToDom = (branding) => {
  const root = document.documentElement;
  root.style.setProperty('--color-brand-primary', `hsl(${branding.primaryColor})`);
  root.style.setProperty('--color-brand-primary-hover', `hsl(${branding.primaryHover})`);
  root.style.setProperty('--color-brand-accent', `hsl(${branding.accentColor})`);
  root.style.setProperty('--color-brand-text-on-primary', `hsl(${branding.textOnPrimary})`);
};

export const TenantBrandingProvider = ({ children }) => {
  const { tenantId, loading: tenantLoading } = useCurrentTenant();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    if (tenantLoading) return;

    // Resolver el branding del tenant activo, con fallback al default
    const resolvedBranding = TENANT_BRANDING[tenantId] ?? DEFAULT_BRANDING;
    setBranding(resolvedBranding);
    applyBrandingToDom(resolvedBranding);
  }, [tenantId, tenantLoading]);

  // Aplicar branding por defecto inmediatamente para evitar flash
  useEffect(() => {
    applyBrandingToDom(DEFAULT_BRANDING);
  }, []);

  const value = {
    branding,
    isLoading: tenantLoading,
  };

  return (
    <TenantBrandingContext.Provider value={value}>
      {children}
    </TenantBrandingContext.Provider>
  );
};
