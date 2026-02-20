import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Branding tipado para autocompletado de consumidores.
 * @typedef {Object} DomainBranding
 * @property {number}      tenantId
 * @property {string}      appName
 * @property {string|null} logoUrl
 * @property {string|null} faviconUrl
 * @property {string}      logoWidth
 * @property {string}      logoMaxHeight
 * @property {string}      primaryColor    - HEX, ej: '#16a34a'
 * @property {string}      secondaryColor  - HEX
 * @property {string}      accentColor     - HEX
 * @property {string}      textOnPrimary   - HEX
 */

/** Branding de fallback cuando la DB no responde o el hostname no está registrado. */
const FALLBACK_BRANDING = {
  tenantId: null,
  appName: 'CRM',
  logoUrl: '/logo.png',
  faviconUrl: null,
  logoWidth: '300px',
  logoMaxHeight: '120px',
  primaryColor: '#16a34a',
  secondaryColor: '#15803d',
  accentColor: '#bbf7d0',
  textOnPrimary: '#ffffff',
};

/**
 * Mapea una fila de `tenant_branding` al tipo `DomainBranding` (camelCase).
 * Principio: un único punto de transformación de nombres de columna.
 *
 * @param {Object} row - Fila de Supabase
 * @returns {DomainBranding}
 */
const mapRowToBranding = (row) => ({
  tenantId:       row.tenant_id,
  appName:        row.app_name,
  logoUrl:        row.logo_url,
  faviconUrl:     row.favicon_url,
  logoWidth:      row.logo_width,
  logoMaxHeight:  row.logo_max_height,
  primaryColor:   row.primary_color,
  secondaryColor: row.secondary_color,
  accentColor:    row.accent_color,
  textOnPrimary:  row.text_on_primary,
});

/**
 * Resuelve el branding del tenant activo leyendo `tenant_branding`
 * por el HOSTNAME del navegador (`window.location.host`).
 *
 * ✅ Funciona ANTES del login — usa el cliente anon de Supabase.
 * ✅ Cachea el resultado en módulo para evitar re-fetches entre renders.
 *
 * @returns {{ branding: DomainBranding, isLoading: boolean, error: string|null }}
 */

// Cache a nivel de módulo — persiste durante la sesión de la SPA.
let _cachedBranding = null;

export function useDomainBranding() {
  const [branding, setBranding] = useState(_cachedBranding ?? FALLBACK_BRANDING);
  const [isLoading, setIsLoading] = useState(!_cachedBranding);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si ya tenemos un resultado cacheado, no volver a consultar.
    if (_cachedBranding) {
      setBranding(_cachedBranding);
      setIsLoading(false);
      return;
    }

    const resolveByHostname = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // window.location.host incluye el puerto si no es 80/443 (ej: 'localhost:8000')
        const hostname = window.location.host;

        const { data, error: dbError } = await supabase
          .from('tenant_branding')
          .select('*')
          .eq('domain', hostname)
          .maybeSingle(); // No falla si no hay fila, retorna null

        if (dbError) throw dbError;

        const resolved = data ? mapRowToBranding(data) : FALLBACK_BRANDING;

        // Guardar en cache de módulo
        _cachedBranding = resolved;
        setBranding(resolved);
      } catch (err) {
        console.error('[useDomainBranding] Error fetching branding:', err);
        setError(err.message);
        // Fallback silencioso — la app sigue funcionando con colores default
        setBranding(FALLBACK_BRANDING);
      } finally {
        setIsLoading(false);
      }
    };

    resolveByHostname();
  }, []); // Solo ejecuta una vez al montar

  return { branding, isLoading, error };
}
