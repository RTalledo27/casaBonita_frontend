# Deploy Instructions - Casa Bonita Frontend

## Build de Producción

Para generar los archivos de producción:

```bash
npm run build
# o
npx ng build --configuration production
```

Los archivos se generarán en: `dist/casa-bonita-frontend/browser/`

## Deploy en Vercel

### Opción 1: Deploy Automático desde GitHub

1. Conecta tu repositorio de GitHub con Vercel
2. Vercel detectará automáticamente que es un proyecto Angular
3. Configuración automática:
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `dist/casa-bonita-frontend/browser`
   - **Install Command**: `npm install`

### Opción 2: Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Deploy
vercel --prod
```

### Opción 3: Deploy desde archivos locales

```bash
# Generar build
npm run build

# Deploy la carpeta dist
vercel --prod dist/casa-bonita-frontend/browser
```

## Deploy en Netlify

### Configuración:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/casa-bonita-frontend/browser`
- **Node Version**: 18 o superior

### Archivo netlify.toml (opcional):

```toml
[build]
  command = "npm run build"
  publish = "dist/casa-bonita-frontend/browser"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Deploy en Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init hosting

# Configurar:
# - Public directory: dist/casa-bonita-frontend/browser
# - Single-page app: Yes
# - Rewrite all URLs to index.html: Yes

# Deploy
firebase deploy
```

## Variables de Entorno

Asegúrate de configurar las variables de entorno necesarias en tu plataforma de hosting:

- `API_URL`: URL del backend API
- `ENVIRONMENT`: production

## Notas Importantes

- El proyecto está configurado para manejar rutas del lado del cliente (SPA)
- Todos los archivos estáticos se sirven desde la carpeta `browser`
- La aplicación requiere un backend API funcionando
- Asegúrate de que el CORS esté configurado correctamente en el backend