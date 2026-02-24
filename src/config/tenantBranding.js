/**
 * Configuración de marca por tenant.
 * Los colores se expresan como valores HSL sin la función hsl() para
 * poder usarlos con opacidad en Tailwind v4.
 *
 * Tenant IDs (Supabase CRM-Demo):
 *  1 = Advanta General - Sin Uso
 *  2 = Potenza
 *  3 = Soldo Hue
 *  4 = Misuri
 *  5 = Zanellato
 *  6 = Sailo (sistema — super admin)
 *  Domain: crmlite-sailohub.vercel.app
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
    // Advanta — brand rojo/coral
    companyName: 'Advanta',
    primaryColor: '12 76% 61%',      // #E76E53
    primaryHover: '12 76% 50%',
    accentColor: '12 76% 45%',
    textOnPrimary: '0 0% 100%',
    sidebarLogoUrl: '/logo.png',
    loginLogoUrl: '/logo.png',
  },
  2: {
    // Potenza
    companyName: 'Potenza',
    primaryColor: '110 28% 52%',
    primaryHover: '110 28% 41%',
    accentColor: '110 28% 41%',
    textOnPrimary: '0 0% 100%',
    sidebarLogoUrl: '/logo.png',
    loginLogoUrl: '/logo.png',
  },
  3: {
    // Soldo Hue — naranja dorado
    companyName: 'Soldo Hue',
    primaryColor: '38 92% 53%',
    primaryHover: '38 92% 42%',
    accentColor: '38 92% 42%',
    textOnPrimary: '0 0% 100%',
    sidebarLogoUrl: '/logo.png',
    loginLogoUrl: '/logo.png',
  },
  4: {
    // Misuri
    companyName: 'Misuri',
    primaryColor: '110 28% 52%',
    primaryHover: '110 28% 41%',
    accentColor: '110 28% 41%',
    textOnPrimary: '0 0% 100%',
    sidebarLogoUrl: '/logo.png',
    loginLogoUrl: '/logo.png',
  },
  5: {
    // Zanellato — verde oscuro #026454 / acento naranja #ff6c35
    companyName: 'Zanellato',
    primaryColor: '170 96% 20%',     // #026454
    primaryHover: '170 96% 14%',
    accentColor: '16 100% 60%',      // #ff6c35
    textOnPrimary: '0 0% 100%',
    sidebarLogoUrl: 'https://zydrtycqvhqleiuovfnu.supabase.co/storage/v1/object/public/tenant-logos/Render%203d%20Zanellato.png',
    loginLogoUrl: 'https://zydrtycqvhqleiuovfnu.supabase.co/storage/v1/object/public/tenant-logos/Render%203d%20Zanellato.png',
  },
  6: {
    // Sailo — sistema super admin
    companyName: 'Sailo',
    primaryColor: '221 83% 53%',
    primaryHover: '221 83% 42%',
    accentColor: '221 83% 42%',
    textOnPrimary: '0 0% 100%',
    sidebarLogoUrl: 'https://zydrtycqvhqleiuovfnu.supabase.co/storage/v1/object/public/tenant-logos/sailo-logo.png.png',
    loginLogoUrl: 'https://zydrtycqvhqleiuovfnu.supabase.co/storage/v1/object/public/tenant-logos/sailo-logo.png.png',
  },
};

/**
 * Branding por defecto — fallback al tenant 1 si el dominio no coincide.
 */
export const DEFAULT_BRANDING = TENANT_BRANDING[1];
