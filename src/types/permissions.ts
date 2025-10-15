// Tipos y interfaces para el sistema de permisos y sidebar dinámico

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  module: string;
  action: string;
  resource: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  requiredPermissions: string[];
  module: string;
  order: number;
  isVisible?: boolean;
}

export interface ModuleConfig {
  name: string;
  label: string;
  icon: string;
  baseRoute: string;
  requiredPermissions: string[];
  menuItems: MenuItem[];
}

export interface SidebarConfig {
  modules: ModuleConfig[];
}

// Tipos de utilidad para permisos
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'list' | 'view' | 'manage';
export type ModuleName = 'crm' | 'sales' | 'finance' | 'collections' | 'inventory' | 'accounting' | 'servicedesk' | 'audit' | 'security';

// Helper para construir nombres de permisos
export const buildPermissionName = (module: ModuleName, resource: string, action: PermissionAction): string => {
  return `${module}.${resource}.${action}`;
};

// Constantes de permisos comunes
export const PERMISSIONS = {
  // CRM
  CRM_CLIENTS_LIST: 'crm.clients.list',
  CRM_CLIENTS_CREATE: 'crm.clients.create',
  CRM_CLIENTS_UPDATE: 'crm.clients.update',
  CRM_CLIENTS_DELETE: 'crm.clients.delete',
  CRM_CLIENTS_VIEW: 'crm.clients.view',
  
  // Sales
  SALES_CONTRACTS_LIST: 'sales.contracts.list',
  SALES_CONTRACTS_CREATE: 'sales.contracts.create',
  SALES_CONTRACTS_UPDATE: 'sales.contracts.update',
  SALES_CONTRACTS_DELETE: 'sales.contracts.delete',
  SALES_CONTRACTS_VIEW: 'sales.contracts.view',
  SALES_LOTS_LIST: 'sales.lots.list',
  SALES_LOTS_MANAGE: 'sales.lots.manage',
  
  // Finance
  FINANCE_PAYMENTS_LIST: 'finance.payments.list',
  FINANCE_PAYMENTS_CREATE: 'finance.payments.create',
  FINANCE_PAYMENTS_UPDATE: 'finance.payments.update',
  FINANCE_COMMISSIONS_LIST: 'finance.commissions.list',
  FINANCE_COMMISSIONS_MANAGE: 'finance.commissions.manage',
  
  // Collections
  COLLECTIONS_SCHEDULES_LIST: 'collections.schedules.list',
  COLLECTIONS_SCHEDULES_MANAGE: 'collections.schedules.manage',
  
  // Inventory
  INVENTORY_LOTS_LIST: 'inventory.lots.list',
  INVENTORY_LOTS_MANAGE: 'inventory.lots.manage',
  
  // Accounting
  ACCOUNTING_REPORTS_VIEW: 'accounting.reports.view',
  ACCOUNTING_TRANSACTIONS_LIST: 'accounting.transactions.list',
  
  // Service Desk
  SERVICEDESK_TICKETS_LIST: 'servicedesk.tickets.list',
  SERVICEDESK_TICKETS_CREATE: 'servicedesk.tickets.create',
  SERVICEDESK_TICKETS_UPDATE: 'servicedesk.tickets.update',
  
  // Audit
  AUDIT_LOGS_VIEW: 'audit.logs.view',
  
  // Security
  SECURITY_USERS_LIST: 'security.users.list',
  SECURITY_USERS_MANAGE: 'security.users.manage',
  SECURITY_ROLES_LIST: 'security.roles.list',
  SECURITY_ROLES_MANAGE: 'security.roles.manage',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = typeof PERMISSIONS[PermissionKey];