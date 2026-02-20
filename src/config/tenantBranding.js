/**
 * Configuración de marca por tenant.
 * Los colores se expresan como valores HSL sin la función hsl() para
 * poder usarlos con opacidad en Tailwind v4.
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
 * @property {string} sidebarLogoUrl - Logo para el sidebar (barra lateral)
 * @property {string} loginLogoUrl   - Logo para la pantalla de login
 */

/** @type {Record<number, TenantBranding>} */
export const TENANT_BRANDING = {
  1: {
    // SAILO — brand rojo/coral original
    companyName: 'SAILO',
    primaryColor: '12 76% 61%',      // #E76E53
    primaryHover: '12 76% 50%',
    accentColor: '12 76% 45%',
    textOnPrimary: '0 0% 100%',
    sidebarLogoUrl: '/logo.png',
    loginLogoUrl: '/logo.png',
  },
  2: {
    // OG / GR — mismo branding que SAILO (main)
    companyName: 'GR',
    primaryColor: '12 76% 61%',
    primaryHover: '12 76% 50%',
    accentColor: '12 76% 45%',
    textOnPrimary: '0 0% 100%',
    sidebarLogoUrl: '/logo.png',
    loginLogoUrl: '/logo.png',
  },
  3: {
    // Lartirigoyen — verde corporativo #006F54 / #73BD78
    companyName: 'Lartirigoyen',
    primaryColor: '160 100% 22%',    // #006F54
    primaryHover: '160 100% 17%',   // más oscuro para hover
    accentColor: '123 33% 59%',     // #73BD78
    textOnPrimary: '0 0% 100%',     // blanco
    sidebarLogoUrl: '/logo.png',            // logo cuadrado (ya existe)
    loginLogoUrl: '/logo_lartirigoyen_login.png',  // logo horizontal (pendiente)
  },
};

/**
 * Branding por defecto — en branch lartirigoyen el default es tenant 3.
 */
export const DEFAULT_BRANDING = TENANT_BRANDING[3];
