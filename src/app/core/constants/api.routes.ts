import { environment } from '../../../environments/environment';

const BASE = environment.URL_BACKEND;

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${BASE}/security/login`,
    LOGOUT: `${BASE}/security/logout`,
    PROFILE: `${BASE}/security/me`,
  },

  SECURITY: {
    USERS: `${BASE}/security/users`,
    ROLES: `${BASE}/security/roles`,
    PERMISSIONS: `${BASE}/security/permissions`,
  },

  CRM: {
    CLIENTS: `${BASE}/crm/clients`,
    SPOUSES: `${BASE}/crm/clients/spouses`,
    ADDRESSES: `${BASE}/crm/clients/addresses`,
    INTERACTIONS: `${BASE}/crm/interactions`
  },

  INVENTORY: {
    LOTS: `${BASE}/inventory/lots`,
    PROJECTS: `${BASE}/inventory/projects`,
    MEDIA: `${BASE}/inventory/lot-media`,
  },

  SALES: {
    RESERVATIONS: `${BASE}/sales/reservations`,
    CONTRACTS: `${BASE}/sales/contracts`,
  },

  ACCOUNTING: {
    PAYMENTS: `${BASE}/accounting/payments`,
    RECEIPTS: `${BASE}/accounting/receipts`,
  },

  INTEGRATIONS: {
    WEBHOOKS: `${BASE}/integrations/webhooks`,
    SYNC: `${BASE}/integrations/sync`,
  },

  SERVICEDESK: {
    TICKETS: `${BASE}/tickets`,
    RESPONSES: `${BASE}/tickets/responses`,
  },

  AUDIT: {
    LOGS: `${BASE}/audit/logs`,
    ACTIONS: `${BASE}/audit/actions`,
  },
};
