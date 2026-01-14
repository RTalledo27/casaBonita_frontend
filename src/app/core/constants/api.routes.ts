import { environment } from '../../../environments/environment';

const BASE = environment.URL_BACKEND;

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${BASE}/v1/security/login`,
    LOGOUT: `${BASE}/v1/security/logout`,
    PROFILE: `${BASE}/v1/security/me`,
    ME: `${BASE}/v1/security/me`,
    CHANGE_PASSWORD: `${BASE}/v1/security/change-password`,
  },

  SECURITY: {
    USERS: `${BASE}/v1/security/users`,
    ROLES: `${BASE}/v1/security/roles`,
    PERMISSIONS: `${BASE}/v1/security/permissions`,
    NOTIFICATIONS: `${BASE}/v1/security/notifications`,
  },

  CRM: {
    CLIENTS: `${BASE}/v1/crm/clients`,
    SPOUSES: `${BASE}/v1/crm/clients/spouses`,
    ADDRESSES: `${BASE}/v1/crm/clients/addresses`,
    INTERACTIONS: `${BASE}/v1/crm/interactions`,
    FAMILY_MEMBERS: `${BASE}/v1/crm/family-members`,
  },

  INVENTORY: {
    LOTS: `${BASE}/v1/inventory/lots`,
    LOT_IMPORT: `${BASE}/v1/inventory/lot-import`,
    //MEDIA: `${BASE}/v1/inventory/lot-media`,
    MANZANAS: `${BASE}/v1/inventory/manzanas`,
    STREET_TYPES: `${BASE}/v1/inventory/street-types`,
    LOT_MEDIA: `${BASE}/v1/inventory/lot-media`,
  },

  SALES: {
    RESERVATIONS: `${BASE}/v1/sales/reservations`,
    CONTRACTS: `${BASE}/v1/sales/contracts`,
    CONTRACT_IMPORT: `${BASE}/v1/sales/import/contracts`,
    PAYMENTS: `${BASE}/v1/sales/payments`,
  },
  FINANCE: {
    BUDGETS: `${BASE}/v1/finance/budgets`,
    BUDGET_LINES: `${BASE}/v1/finance/budget-lines`,
    CASH_FLOWS: `${BASE}/v1/finance/cash-flows`,
    COST_CENTERS: `${BASE}/v1/finance/cost-centers`,
  },

  COLLECTIONS: {
    BASE: `${BASE}/v1/collections`,
    ACCOUNTS_RECEIVABLE: `${BASE}/v1/collections/accounts-receivable`,
    CUSTOMER_PAYMENTS: `${BASE}/v1/collections/customer-payments`,
    REPORTS: `${BASE}/v1/collections/reports`,
    HR_INTEGRATION: `${BASE}/v1/hr-integration`,
  },

  HR: {
    EMPLOYEES: `${BASE}/v1/hr/employees`,
    EMPLOYEES_ADVISORS: `${BASE}/v1/hr/employees/advisors`,
    EMPLOYEES_ADMIN_DASHBOARD: `${BASE}/v1/hr/employees/admin-dashboard`,
    EMPLOYEE_DASHBOARD: (id: number) => `${BASE}/v1/hr/employees/${id}/dashboard`,
    TEAMS: `${BASE}/v1/hr/teams`,
    COMMISSIONS: `${BASE}/v1/hr/commissions`,
    COMMISSIONS_PROCESS_PERIOD: `${BASE}/v1/hr/commissions/process-period`,
    COMMISSIONS_PAY: `${BASE}/v1/hr/commissions/pay`,
    COMMISSIONS_SALES_DETAIL: `${BASE}/v1/hr/commissions/sales-detail`,
    BONUSES: `${BASE}/v1/hr/bonuses`,
    BONUSES_DASHBOARD: `${BASE}/v1/hr/bonuses/dashboard`,
    BONUSES_PROCESS_AUTOMATIC: `${BASE}/v1/hr/bonuses/process-automatic`,
    BONUS_TYPES: `${BASE}/v1/hr/bonus-types`,
    BONUS_GOALS: `${BASE}/v1/hr/bonus-goals`,
    PAYROLL: `${BASE}/v1/hr/payroll`,
    PAYROLL_GENERATE: `${BASE}/v1/hr/payroll/generate`,
    PAYROLL_PROCESS_BULK: `${BASE}/v1/hr/payroll/process-bulk`,
    PAYROLL_PROCESS: (id: number) => `${BASE}/v1/hr/payroll/${id}/process`,
    PAYROLL_APPROVE: (id: number) => `${BASE}/v1/hr/payroll/${id}/approve`,
    ATTENDANCE: `${BASE}/v1/hr/attendance`,
  },

  ACCOUNTING: {
    CHART_OF_ACCOUNTS: `${BASE}/v1/accounting/chart-of-accounts`,
    JOURNAL_ENTRIES: `${BASE}/v1/accounting/journal-entries`,
    FINANCIAL_REPORTS: `${BASE}/v1/accounting/reports`,
    ACCOUNTING_PERIODS: `${BASE}/v1/accounting/periods`,
    PAYMENTS: `${BASE}/v1/accounting/payments`,
    RECEIPTS: `${BASE}/v1/accounting/receipts`,
  },

  INTEGRATIONS: {
    WEBHOOKS: `${BASE}/v1/integrations/webhooks`,
    SYNC: `${BASE}/v1/integrations/sync`,
  },

  SERVICEDESK: {
    DASHBOARD: `${BASE}/v1/servicedesk/dashboard`,
    TICKETS: `${BASE}/v1/servicedesk/requests`,
    RESPONSES: `${BASE}/v1/servicedesk/responses`,
    ACTIONS: (ticketId: number) => `/v1/servicedesk/requests/${ticketId}/actions`,
  },

  AUDIT: {
    LOGS: `${BASE}/v1/audit/logs`,
    ACTIONS: `${BASE}/v1/audit/actions`,
  },

  REPORTS: {
    BASE: `${BASE}/v1/reports`,
    TYPES: `${BASE}/v1/reports/types`,
    EXPORT: `${BASE}/v1/reports/export`,
    STATUS: (reportId: number) => `${BASE}/v1/reports/status/${reportId}`,
    DOWNLOAD: (reportId: number) => `${BASE}/v1/reports/download/${reportId}`,
    HISTORY: `${BASE}/v1/reports/history`,
    SALES: {
      ALL: `${BASE}/v1/reports/sales/all`,
      DASHBOARD: `${BASE}/v1/reports/sales/dashboard`,
      BY_PERIOD: `${BASE}/v1/reports/sales/by-period`,
      PERFORMANCE: `${BASE}/v1/reports/sales/performance`,
      CONVERSION_FUNNEL: `${BASE}/v1/reports/sales/conversion-funnel`,
      TOP_PRODUCTS: `${BASE}/v1/reports/sales/top-products`,
      EXPORT: `${BASE}/v1/reports/sales/export`,
    },
    PAYMENT_SCHEDULES: {
      OVERVIEW: `${BASE}/v1/reports/payment-schedules/overview`,
      BY_STATUS: `${BASE}/v1/reports/payment-schedules/by-status`,
      OVERDUE: `${BASE}/v1/reports/payment-schedules/overdue`,
      TRENDS: `${BASE}/v1/reports/payment-schedules/trends`,
      COLLECTION_EFFICIENCY: `${BASE}/v1/reports/payment-schedules/collection-efficiency`,
      UPCOMING: `${BASE}/v1/reports/payment-schedules/upcoming`,
    },
    PROJECTIONS: {
      SALES: `${BASE}/v1/reports/projections/sales`,
      CASH_FLOW: `${BASE}/v1/reports/projections/cash-flow`,
      INVENTORY: `${BASE}/v1/reports/projections/inventory`,
      MARKET_ANALYSIS: `${BASE}/v1/reports/projections/market-analysis`,
      ROI: `${BASE}/v1/reports/projections/roi`,
      SCENARIO_ANALYSIS: `${BASE}/v1/reports/projections/scenario-analysis`,
      REVENUE: `${BASE}/v1/reports/projections/revenue`,
      REVENUE_SUMMARY: `${BASE}/v1/reports/projections/revenue/summary`,
      REVENUE_COMPARE: `${BASE}/v1/reports/projections/revenue/compare`,
    },
  },

  LOGICWARE: {
    BASE: `${BASE}/logicware`,
    FULL_STOCK: `${BASE}/logicware/full-stock`,
    RENEW_TOKEN: `${BASE}/logicware/renew-token`,
    TOKEN_INFO: `${BASE}/logicware/token-info`,
    IMPORT_CONTRACTS: `${BASE}/logicware/import-contracts`,
    STATUS: `${BASE}/logicware/status`,
  },
};
