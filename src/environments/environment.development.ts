export const environment = {
  production: false,
  URL_BACKEND: 'http://localhost:8000/api',
  URL_FRONTEND: 'http://localhost:4200',
  BACKEND_BASE_URL: 'http://localhost:8000',
  apiUrl: 'http://localhost:8000/api', // Agregado para compatibilidad
  pusher: {
    key: '3caa2ab27c5f3a7cd282',
    cluster: 'us2',
  },
  reverb: {
    key: 'qycranehfycpswjvlj7o',
    wsHost: '127.0.0.1',
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
    enabled: false, // ⚠️ Cambiar a true si tienes Reverb corriendo localmente
  },
};
