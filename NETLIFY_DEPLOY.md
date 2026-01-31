# SAILO CRM Lite - Despliegue en Netlify

## 🚀 Pasos para Desplegar en Netlify

### Opción 1: Despliegue Manual (Drag & Drop)

1. **Construir el proyecto localmente:**
   ```bash
   npm run build
   ```
   Esto creará una carpeta `dist/` con los archivos de producción.

2. **Ir a Netlify:**
   - Visita [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Arrastra la carpeta `dist/` a la zona de drop
   - ¡Listo! Tu sitio estará en línea en segundos

### Opción 2: Despliegue desde Git (Recomendado)

1. **Subir el código a GitHub/GitLab:**
   ```bash
   git add .
   git commit -m "Preparado para Netlify"
   git push origin main
   ```

2. **Conectar con Netlify:**
   - Ve a [https://app.netlify.com](https://app.netlify.com)
   - Click en "Add new site" → "Import an existing project"
   - Selecciona tu repositorio
   - Netlify detectará automáticamente la configuración de `netlify.toml`
   - Click en "Deploy site"

### Opción 3: Netlify CLI

1. **Instalar Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login en Netlify:**
   ```bash
   netlify login
   ```

3. **Desplegar:**
   ```bash
   netlify deploy --prod
   ```

## ⚙️ Configuración

El archivo `netlify.toml` ya está configurado con:
- ✅ Comando de build: `npm run build`
- ✅ Directorio de publicación: `dist`
- ✅ Redirecciones para SPA (Single Page Application)
- ✅ Soporte para React Router

## 🔧 Variables de Entorno

Este proyecto no requiere variables de entorno para funcionar en modo demo.

Si necesitas configurar variables de entorno en el futuro:
1. Ve a Site settings → Build & deploy → Environment
2. Agrega las variables necesarias con el prefijo `VITE_`

## 📦 Requisitos

- Node.js 18+ 
- npm 9+

## 🎨 Características del Proyecto

- ✨ Dark Mode completo
- 📱 Diseño responsive
- 🎯 React Router para navegación
- 🎨 Tailwind CSS v4
- ⚡ Vite para build ultra-rápido
- 🌈 Framer Motion para animaciones

## 🐛 Troubleshooting

### Error: "Page not found" al refrescar
- Verifica que `netlify.toml` tenga las reglas de redirect
- Las redirecciones ya están configuradas en este proyecto

### Build falla
- Verifica que todas las dependencias estén instaladas: `npm install`
- Limpia la caché: `rm -rf node_modules dist && npm install`

### Estilos no se aplican
- Verifica que Tailwind CSS esté correctamente configurado
- El proyecto ya tiene la configuración correcta

## 📞 Soporte

Para más información sobre Netlify:
- [Documentación de Netlify](https://docs.netlify.com)
- [Netlify Community](https://answers.netlify.com)
