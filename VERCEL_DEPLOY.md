# 🚀 Guía de Despliegue en Vercel

## Paso 1: Completar el Push a GitHub

El repositorio está inicializado pero necesitas completar el push. Abre una terminal y ejecuta:

```bash
cd "/Users/martin/Documents/NEURACALL/CRM LITE/blazing-star"
git push -u origin main
```

Si te pide autenticación:
1. Usa tu usuario de GitHub: `tinchocodep`
2. Para la contraseña, usa un **Personal Access Token** (no tu contraseña de GitHub)

### Crear Personal Access Token (si no tienes uno)

1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token" → "Generate new token (classic)"
3. Dale un nombre: `CRMLITE Deploy`
4. Selecciona permisos: `repo` (todos los sub-permisos)
5. Click en "Generate token"
6. **Copia el token** (solo se muestra una vez)
7. Úsalo como contraseña cuando hagas `git push`

## Paso 2: Conectar con Vercel

### Opción A: Desde la Web (Más Fácil)

1. Ve a: https://vercel.com
2. Click en "Sign Up" o "Log In"
3. Selecciona "Continue with GitHub"
4. Autoriza a Vercel
5. Click en "Add New..." → "Project"
6. Busca `CRMLITE` en la lista de repositorios
7. Click en "Import"
8. Vercel detectará automáticamente:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
9. Click en "Deploy"
10. ¡Espera 1-2 minutos y listo!

### Opción B: Desde la Terminal (Avanzado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Hacer login
vercel login

# Deploy
cd "/Users/martin/Documents/NEURACALL/CRM LITE/blazing-star"
vercel

# Seguir las instrucciones:
# - Set up and deploy? Yes
# - Which scope? Tu cuenta
# - Link to existing project? No
# - Project name? CRMLITE
# - Directory? ./
# - Override settings? No
```

## Paso 3: Configuración Automática

Vercel detectará automáticamente la configuración de Vite. No necesitas hacer nada más.

### Configuración Detectada:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## Paso 4: Variables de Entorno (Opcional)

Si en el futuro necesitas configurar variables:

1. En Vercel Dashboard → Tu proyecto
2. Settings → Environment Variables
3. Agregar variables con prefijo `VITE_`:
   ```
   VITE_API_URL=https://api.tudominio.com
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

## Paso 5: Dominio Personalizado (Opcional)

1. En Vercel Dashboard → Tu proyecto
2. Settings → Domains
3. Agregar tu dominio: `crm.tudominio.com`
4. Seguir instrucciones para configurar DNS

## 🎉 ¡Listo!

Tu aplicación estará disponible en:
- URL de Vercel: `https://crmlite-[random].vercel.app`
- O tu dominio personalizado

### Características de Vercel:

✅ **Deploy automático** en cada push a `main`  
✅ **Preview deployments** en cada PR  
✅ **SSL gratis** con certificado automático  
✅ **CDN global** ultra-rápido  
✅ **Analytics** incluido  
✅ **Zero config** para Vite/React  

## 🔄 Actualizar la App

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción de cambios"
git push
```

Vercel automáticamente:
1. Detecta el push
2. Hace build
3. Despliega la nueva versión
4. ¡En 1-2 minutos está live!

## 🐛 Troubleshooting

### Build falla en Vercel

1. Verifica que `package.json` tenga todas las dependencias
2. Asegúrate que el build local funcione: `npm run build`
3. Revisa los logs en Vercel Dashboard

### Rutas no funcionan (404)

Vercel ya está configurado para SPA en `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Si no existe, créalo en la raíz del proyecto.

---

**¿Problemas?** Revisa los logs en: https://vercel.com/dashboard
