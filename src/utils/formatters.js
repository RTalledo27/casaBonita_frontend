/**
 * Utilidades para formatear datos en la aplicación
 */

/**
 * Formatea un número como moneda en soles peruanos
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (default: 'PEN')
 * @returns {string} - Cantidad formateada
 */
export const formatCurrency = (amount, currency = 'PEN') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'S/0.00';
  }

  const formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return formatter.format(amount);
};

/**
 * Formatea un número con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} - Número formateado
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('es-PE').format(number);
};

/**
 * Formatea una fecha en formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {string} format - Formato de fecha ('short', 'medium', 'long', 'full')
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  const options = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
  };

  return new Intl.DateTimeFormat('es-DO', options[format] || options.medium)
    .format(dateObj);
};

/**
 * Formatea una fecha y hora
 * @param {string|Date} datetime - Fecha y hora a formatear
 * @returns {string} - Fecha y hora formateada
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return 'N/A';

  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
};

/**
 * Formatea un porcentaje
 * @param {number} value - Valor a formatear (0-100)
 * @param {number} decimals - Número de decimales (default: 1)
 * @returns {string} - Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatea el estado de un cronograma de pagos
 * @param {string} status - Estado del cronograma
 * @returns {object} - Objeto con texto y variante para el badge
 */
export const formatScheduleStatus = (status) => {
  const statusMap = {
    pending: { text: 'Pendiente', variant: 'secondary' },
    paid: { text: 'Pagado', variant: 'success' },
    overdue: { text: 'Vencido', variant: 'destructive' },
    cancelled: { text: 'Cancelado', variant: 'outline' },
    partial: { text: 'Parcial', variant: 'warning' }
  };

  return statusMap[status] || { text: status, variant: 'outline' };
};

/**
 * Formatea el tipo de pago
 * @param {string} paymentType - Tipo de pago
 * @returns {string} - Tipo de pago formateado
 */
export const formatPaymentType = (paymentType) => {
  const typeMap = {
    cash: 'Contado',
    installments: 'Cuotas',
    financing: 'Financiamiento',
    credit: 'Crédito'
  };

  return typeMap[paymentType] || paymentType;
};

/**
 * Formatea el nombre completo de una persona
 * @param {object} person - Objeto con nombres y apellidos
 * @returns {string} - Nombre completo formateado
 */
export const formatFullName = (person) => {
  if (!person) return 'N/A';

  const { first_name, last_name, middle_name } = person;
  const names = [first_name, middle_name, last_name].filter(Boolean);
  
  return names.length > 0 ? names.join(' ') : 'N/A';
};

/**
 * Formatea un número de teléfono
 * @param {string} phone - Número de teléfono
 * @returns {string} - Teléfono formateado
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';

  // Remover caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Formatear según la longitud
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone; // Devolver original si no coincide con formatos conocidos
};

/**
 * Formatea el tiempo transcurrido desde una fecha
 * @param {string|Date} date - Fecha de referencia
 * @returns {string} - Tiempo transcurrido formateado
 */
export const formatTimeAgo = (date) => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace menos de un minuto';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  } else {
    return formatDate(dateObj, 'short');
  }
};

/**
 * Trunca un texto a una longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  return text.substring(0, maxLength) + '...';
};

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export const capitalizeWords = (text) => {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatPercentage,
  formatScheduleStatus,
  formatPaymentType,
  formatFullName,
  formatPhone,
  formatTimeAgo,
  truncateText,
  capitalizeWords
};