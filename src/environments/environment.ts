export const environment = {
  production: true,
  URL_BACKEND: 'https://api.casabonita.pe/api',
  URL_FRONTEND: 'http://app.casabonita.pe',
  BACKEND_BASE_URL: 'https://api.casabonita.pe',
  apiUrl: 'https://api.casabonita.pe/api', // Agregado para compatibilidad
  pusher: {
    key: '3caa2ab27c5f3a7cd282',
    cluster: 'us2',
  },
  reverb: {
    key: 'g9ojeyfgriywz9fnm40o', // ✅ Debe coincidir con REVERB_APP_KEY del backend
    wsHost: 'api.casabonita.pe',
    wsPort: 443, // Puerto HTTPS
    wssPort: 443,
    forceTLS: true,
    enabled: true, // ✅ Habilitado para notificaciones en tiempo real
  },
};
  