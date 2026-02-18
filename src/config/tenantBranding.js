/**
 * Configuración de marca por tenant.
 * Cada tenant tiene su propio logo, colores y nombre de empresa.
 * Los colores se expresan como valores HSL sin la función hsl() para
 * poder usarlos con opacidad en Tailwind v4: hsl(var(--color-primary) / 0.5)
 *
 * Tenant IDs (Supabase CRM-GR):
 *  1 = SAILO
 *  2 = OG / GR
 *  3 = Lartirigoyen
 */

/** @typedef {Object} TenantBranding
 * @property {string} companyName
 * @property {string} primaryColor   - HSL sin función, ej: '160 100% 22%'
 * @property {string} primaryHover   - Versión más oscura del primary
 * @property {string} accentColor    - HSL sin función
 * @property {string} textOnPrimary  - Color de texto sobre fondo primary
 * @property {string} logoUrl        - Ruta al logo en /public
 * @property {string} faviconUrl     - Ruta al favicon en /public
 */

/** @type {Record<number, TenantBranding>} */
export const TENANT_BRANDING = {
  1: {
    // SAILO — brand rojo/coral original
    companyName: 'SAILO',
    primaryColor: '12 76% 61%',      // #E76E53
    primaryHover: '12 76% 50%',
    accentColor: '12 76% 45%',
    textOnPrimary: '0 0% 100%',      // blanco
    logoUrl: '/logo.png',
    faviconUrl: '/vite.svg',
  },
  2: {
    // OG / GR — mismo branding que SAILO por ahora (main)
    companyName: 'GR',
    primaryColor: '12 76% 61%',
    primaryHover: '12 76% 50%',
    accentColor: '12 76% 45%',
    textOnPrimary: '0 0% 100%',
    logoUrl: '/logo.png',
    faviconUrl: '/vite.svg',
  },
  3: {
    // Lartirigoyen — verde corporativo
    companyName: 'Lartirigoyen',
    primaryColor: '160 100% 22%',    // #006F54
    primaryHover: '160 100% 17%',   // más oscuro para hover
    accentColor: '123 33% 59%',     // #73BD78
    textOnPrimary: '0 0% 100%',     // blanco
    logoUrl: '/logo_lartirigoyen.png',
    faviconUrl: '/vite.svg',
  },
};

/**
 * Branding por defecto cuando el tenant_id no está disponible aún.
 * En la branch lartirigoyen el default es el tenant 3.
 */
export const DEFAULT_BRANDING = TENANT_BRANDING[3];
