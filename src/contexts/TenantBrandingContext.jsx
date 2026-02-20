import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDomainBranding } from '../hooks/useDomainBranding';

/**
 * TenantBrandingContext — v2
 *
 * Resuelve el branding POR HOSTNAME (window.location.host),
 * sin requerir que el usuario esté autenticado.
 *
 * ✅ El Login screen ya muestra los colores correctos del tenant.
 * ✅ No depende de AuthContext — puede wrapearlo.
 *
 * Principio: la UI es "tonta" — solo consume `useTenantBranding()`
 * y no sabe nada sobre qué tenant está activo.
 */

const TenantBrandingContext = createContext(null);

/** @returns {{ branding: import('../hooks/useDomainBranding').DomainBranding, isLoading: boolean }} */
export const useTenantBranding = () => {
  const context = useContext(TenantBrandingContext);
  if (!context) {
    throw new Error('useTenantBranding must be used within TenantBrandingProvider');
  }
  return context;
};

/**
 * Convierte colores HEX de la DB a CSS custom properties en el :root.
 * Tailwind v4 y cualquier CSS los consume sin re-renderizar componentes.
 *
 * @param {import('../hooks/useDomainBranding').DomainBranding} branding
 */
const applyBrandingToDom = (branding) => {
  const root = document.documentElement;
  root.style.setProperty('--color-brand-primary', branding.primaryColor);
  root.style.setProperty('--color-brand-secondary', branding.secondaryColor);
  root.style.setProperty('--color-brand-accent', branding.accentColor);
  root.style.setProperty('--color-brand-text-on-primary', branding.textOnPrimary);

  // Actualizar favicon dinámicamente si está configurado
  if (branding.faviconUrl) {
    const link = document.querySelector("link[rel~='icon']");
    if (link) link.href = branding.faviconUrl;
  }

  // Actualizar el title del browser tab
  if (branding.appName) {
    document.title = `${branding.appName} | CRM`;
  }
};

export const TenantBrandingProvider = ({ children }) => {
  const { branding, isLoading } = useDomainBranding();

  useEffect(() => {
    // Aplicar branding al DOM cada vez que cambie (incluye el primer load)
    applyBrandingToDom(branding);
  }, [branding]);

  const value = {
    branding,
    isLoading,
  };

  return (
    <TenantBrandingContext.Provider value={value}>
      {children}
    </TenantBrandingContext.Provider>
  );
};
