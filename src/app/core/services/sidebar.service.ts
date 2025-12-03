import { Injectable, computed, signal, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { MenuItem, ModuleConfig, SidebarConfig, PERMISSIONS } from '../../../types/permissions';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  
  private sidebarConfigSignal = signal<SidebarConfig>(this.getDefaultSidebarConfig());
  public userPermissionsSignal = signal<string[]>([]); // Público para que el component pueda acceder
  public userRoleSignal = signal<string>(''); // Signal reactivo para el rol del usuario
  
  constructor(private authService: AuthService) {
    // Inicializar permisos y rol del usuario SOLO al crear el servicio
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('🎯 SidebarService: Initializing with', currentUser.permissions.length, 'permissions');
      this.userPermissionsSignal.set(currentUser.permissions);
      this.userRoleSignal.set(currentUser.role);
    }

    // DESACTIVADO: No escuchar cambios automáticos del AuthService
    // Esto causaba que el sidebar se actualizara incorrectamente
    // Solo se actualizará manualmente con refreshSidebar()
    
    // Escuchar eventos MANUALES de actualización de permisos
    window.addEventListener('permissions-updated', () => {
      console.log('🔄 Manual permission update event received, refreshing sidebar');
      this.refreshSidebar();
    });
  }

  /**
   * Refrescar la configuración del sidebar
   */
  refreshSidebar(): void {
    console.log('🔄 SidebarService: Refreshing sidebar...');
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('👤 SidebarService: Current user:', {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        permissionCount: currentUser.permissions.length
      });
      
      // Actualizar AMBOS signals para forzar la detección de cambios
      const newPermissions = [...currentUser.permissions];
      this.userPermissionsSignal.set(newPermissions);
      this.userRoleSignal.set(currentUser.role);
      
      console.log('✅ SidebarService: Sidebar refreshed with', newPermissions.length, 'permissions and role:', currentUser.role);
    } else {
      console.warn('⚠️ SidebarService: No current user found');
    }
  }

  // Configuración por defecto del sidebar con todos los módulos
  private getDefaultSidebarConfig(): SidebarConfig {
    return {
      modules: [
        {
          name: 'crm',
          label: 'sidebar.crm.title',
          icon: 'users',
          baseRoute: '/crm',
          requiredPermissions: [PERMISSIONS.CRM_CLIENTS_LIST],
          menuItems: [
            {
              id: 'crm-clients',
              label: 'sidebar.crm.clients.title',
              icon: 'user',
              route: '/crm/clients',
              requiredPermissions: [PERMISSIONS.CRM_CLIENTS_LIST],
              module: 'crm',
              order: 1
            },
            /*{
              id: 'crm-interactions',
              label: 'Interacciones',
              icon: 'message-circle',
              route: '/crm/interactions',
              requiredPermissions: [PERMISSIONS.CRM_CLIENTS_VIEW],
              module: 'crm',
              order: 2
            }*/
          ]
        },
        {
          name: 'sales',
          label: 'sidebar.sales.title',
          icon: 'shopping-cart',
          baseRoute: '/sales',
          requiredPermissions: [PERMISSIONS.SALES_CONTRACTS_LIST],
          menuItems: [
            {
              id: 'sales-contracts',
              label: 'sidebar.sales.contracts.title',
              icon: 'file-text',
              route: '/sales/contracts',
              requiredPermissions: [PERMISSIONS.SALES_CONTRACTS_LIST],
              module: 'sales',
              order: 1
            },
            {
              id: 'sales-lots',
              label: 'Lotes',
              icon: 'map',
              route: '/sales/lots',
              requiredPermissions: [PERMISSIONS.SALES_LOTS_LIST],
              module: 'sales',
              order: 2
            }
          ]
        },
        {
          name: 'finance',
          label: 'sidebar.finance.title',
          icon: 'dollar-sign',
          baseRoute: '/finance',
          requiredPermissions: [PERMISSIONS.FINANCE_PAYMENTS_LIST],
          menuItems: [
            {
              id: 'finance-payments',
              label: 'sidebar.sales.payments.title',
              icon: 'credit-card',
              route: '/finance/payments',
              requiredPermissions: [PERMISSIONS.FINANCE_PAYMENTS_LIST],
              module: 'finance',
              order: 1
            },
            {
              id: 'finance-commissions',
              label: 'Comisiones',
              icon: 'percent',
              route: '/finance/commissions',
              requiredPermissions: [PERMISSIONS.FINANCE_COMMISSIONS_LIST],
              module: 'finance',
              order: 2
            }
          ]
        },
        {
          name: 'collections',
          label: 'sidebar.collections.title',
          icon: 'calendar',
          baseRoute: '/collections',
          requiredPermissions: [PERMISSIONS.COLLECTIONS_SCHEDULES_LIST],
          menuItems: [
            {
              id: 'collections-schedules',
              label: 'Cronogramas',
              icon: 'calendar-days',
              route: '/collections/schedules',
              requiredPermissions: [PERMISSIONS.COLLECTIONS_SCHEDULES_LIST],
              module: 'collections',
              order: 1
            },
            {
              id: 'collections-followups',
              label: 'sidebar.collections.followups.title',
              icon: 'file-text',
              route: '/collections/client-followups',
              requiredPermissions: [PERMISSIONS.COLLECTIONS_SCHEDULES_LIST],
              module: 'collections',
              order: 2
            }
            ,{
              id: 'collections-preventive',
              label: 'sidebar.collections.preventive.title',
              icon: 'alert-circle',
              route: '/collections/preventive',
              requiredPermissions: [PERMISSIONS.COLLECTIONS_SCHEDULES_LIST],
              module: 'collections',
              order: 3
            }
            ,{
              id: 'collections-mora',
              label: 'sidebar.collections.mora.title',
              icon: 'clock',
              route: '/collections/mora',
              requiredPermissions: [PERMISSIONS.COLLECTIONS_SCHEDULES_LIST],
              module: 'collections',
              order: 4
            }
            ,{
              id: 'collections-kpis',
              label: 'sidebar.collections.kpis.title',
              icon: 'bar-chart-3',
              route: '/collections/kpis',
              requiredPermissions: [PERMISSIONS.COLLECTIONS_SCHEDULES_LIST],
              module: 'collections',
              order: 5
            }
          ]
        },
        {
          name: 'inventory',
          label: 'sidebar.inventory.title',
          icon: 'package',
          baseRoute: '/inventory',
          requiredPermissions: [PERMISSIONS.INVENTORY_LOTS_LIST],
          menuItems: [
            {
              id: 'inventory-lots',
              label: 'Lotes',
              icon: 'map-pin',
              route: '/inventory/lots',
              requiredPermissions: [PERMISSIONS.INVENTORY_LOTS_LIST],
              module: 'inventory',
              order: 1
            }
          ]
        },
        {
          name: 'accounting',
          label: 'sidebar.accounting.title',
          icon: 'calculator',
          baseRoute: '/accounting',
          requiredPermissions: [PERMISSIONS.ACCOUNTING_REPORTS_VIEW],
          menuItems: [
            {
              id: 'accounting-reports',
              label: 'Reportes',
              icon: 'bar-chart',
              route: '/accounting/reports',
              requiredPermissions: [PERMISSIONS.ACCOUNTING_REPORTS_VIEW],
              module: 'accounting',
              order: 1
            },
            {
              id: 'accounting-transactions',
              label: 'Transacciones',
              icon: 'receipt',
              route: '/accounting/transactions',
              requiredPermissions: [PERMISSIONS.ACCOUNTING_TRANSACTIONS_LIST],
              module: 'accounting',
              order: 2
            }
          ]
        },
        {
          name: 'service desk',
          label: 'sidebar.service desk.title',
          icon: 'headphones',
          baseRoute: '/servicedesk',
          requiredPermissions: [PERMISSIONS.SERVICEDESK_TICKETS_LIST],
          menuItems: [
            {
              id: 'servicedesk-tickets',
              label: 'Tickets',
              icon: 'ticket',
              route: '/servicedesk/tickets',
              requiredPermissions: [PERMISSIONS.SERVICEDESK_TICKETS_LIST],
              module: 'service desk',
              order: 1
            }
          ]
        },
        {
          name: 'reports',
          label: 'sidebar.reports.title',
          icon: 'bar-chart-3',
          baseRoute: '/reports',
          requiredPermissions: [PERMISSIONS.REPORTS_VIEW],
          menuItems: [
            {
              id: 'reports-dashboard',
              label: 'Dashboard',
              icon: 'layout-dashboard',
              route: '/reports/dashboard',
              requiredPermissions: [PERMISSIONS.REPORTS_VIEW_DASHBOARD],
              module: 'reports',
              order: 1
            },
            {
              id: 'reports-sales',
              label: 'Reportes de Ventas',
              icon: 'trending-up',
              route: '/reports/sales',
              requiredPermissions: [PERMISSIONS.REPORTS_VIEW_SALES],
              module: 'reports',
              order: 2
            },
            {
              id: 'reports-payments',
              label: 'Cronogramas de Pagos',
              icon: 'calendar-clock',
              route: '/reports/payment-schedule',
              requiredPermissions: [PERMISSIONS.REPORTS_VIEW_PAYMENTS],
              module: 'reports',
              order: 3
            },
            {
              id: 'reports-projections',
              label: 'Reportes Proyectados',
              icon: 'line-chart',
              route: '/reports/projected',
              requiredPermissions: [PERMISSIONS.REPORTS_VIEW_PROJECTIONS],
              module: 'reports',
              order: 4
            }
          ]
        },
        {
          name: 'audit',
          label: 'sidebar.audit.title',
          icon: 'shield',
          baseRoute: '/audit',
          requiredPermissions: [PERMISSIONS.AUDIT_LOGS_VIEW],
          menuItems: [
            {
              id: 'audit-logs',
              label: 'Logs',
              icon: 'file-search',
              route: '/audit/logs',
              requiredPermissions: [PERMISSIONS.AUDIT_LOGS_VIEW],
              module: 'audit',
              order: 1
            }
          ]
        },
        {
          name: 'security',
          label: 'sidebar.security.title',
          icon: 'lock',
          baseRoute: '/security',
          requiredPermissions: [PERMISSIONS.SECURITY_USERS_LIST],
          menuItems: [
            {
              id: 'security-users',
              label: 'sidebar.security.users.title',
              icon: 'users',
              route: '/security/users',
              requiredPermissions: [PERMISSIONS.SECURITY_USERS_LIST],
              module: 'security',
              order: 1
            },
            {
              id: 'security-roles',
              label: 'Roles',
              icon: 'user-check',
              route: '/security/roles',
              requiredPermissions: [PERMISSIONS.SECURITY_ROLES_LIST],
              module: 'security',
              order: 2
            }
          ]
        }
      ]
    };
  }

  // Computed signal que filtra los módulos basado en permisos del usuario
    visibleModules = computed(() => {
    const config = this.sidebarConfigSignal();
    const userPermissions = this.userPermissionsSignal(); // Reactivo!
    
    console.log('🔍 Computing visible modules with permissions:', userPermissions.length);
    
    return config.modules.filter((module: ModuleConfig) => {
      // Verificar si el usuario tiene acceso al módulo
      const hasModulePermission = this.authService.hasModuleAccess(module.name);
      const hasRequiredPermissions = this.authService.hasAnyPermission(module.requiredPermissions);
      
      return hasModulePermission || hasRequiredPermissions;
    }).map((module: ModuleConfig) => ({
      ...module,
      menuItems: this.filterMenuItems(module.menuItems)
    }));
  });

  // Computed signal para obtener todos los elementos de menú visibles
  visibleMenuItems = computed(() => {
    return this.visibleModules().reduce((items: MenuItem[], module: ModuleConfig) => {
      return [...items, ...module.menuItems];
    }, []);
  });

  // Método para filtrar elementos de menú basado en permisos
  private filterMenuItems(menuItems: MenuItem[]): MenuItem[] {
    return menuItems.filter((item: MenuItem) => {
      const hasPermission = this.authService.hasAnyPermission(item.requiredPermissions);
      
      // Si tiene elementos hijos, filtrarlos recursivamente
      if (item.children) {
        item.children = this.filterMenuItems(item.children);
        // Mostrar el item padre si tiene hijos visibles o permisos propios
        return hasPermission || item.children.length > 0;
      }
      
      return hasPermission;
    }).map((item: MenuItem) => ({
      ...item,
      isVisible: true
    })).sort((a: MenuItem, b: MenuItem) => a.order - b.order);
  }

  // Método para verificar si un módulo específico es visible
  isModuleVisible = computed(() => {
    return (moduleName: string): boolean => {
      return this.visibleModules().some((module: ModuleConfig) => module.name === moduleName);
    };
  });

  // Método para verificar si un elemento de menú específico es visible
  isMenuItemVisible = computed(() => {
    return (itemId: string): boolean => {
      return this.visibleMenuItems().some((item: MenuItem) => item.id === itemId);
    };
  });

  // Método para obtener la configuración de un módulo específico
  getModuleConfig = computed(() => {
    return (moduleName: string): ModuleConfig | undefined => {
      return this.visibleModules().find((module: ModuleConfig) => module.name === moduleName);
    };
  });

  // Método para actualizar la configuración del sidebar
  updateSidebarConfig(config: SidebarConfig): void {
    this.sidebarConfigSignal.set(config);
  }

  // Método para agregar un nuevo módulo
  addModule(module: ModuleConfig): void {
    const currentConfig = this.sidebarConfigSignal();
    const updatedConfig = {
      ...currentConfig,
      modules: [...currentConfig.modules, module]
    };
    this.sidebarConfigSignal.set(updatedConfig);
  }

  // Método para remover un módulo
  removeModule(moduleName: string): void {
    const currentConfig = this.sidebarConfigSignal();
    const updatedConfig = {
      ...currentConfig,
      modules: currentConfig.modules.filter((module: ModuleConfig) => module.name !== moduleName)
    };
    this.sidebarConfigSignal.set(updatedConfig);
  }

  // Método para agregar un elemento de menú a un módulo existente
  addMenuItem(moduleName: string, menuItem: MenuItem): void {
    const currentConfig = this.sidebarConfigSignal();
    const updatedModules = currentConfig.modules.map((module: ModuleConfig) => {
      if (module.name === moduleName) {
        return {
          ...module,
          menuItems: [...module.menuItems, menuItem].sort((a: MenuItem, b: MenuItem) => a.order - b.order)
        };
      }
      return module;
    });
    
    this.sidebarConfigSignal.set({
      ...currentConfig,
      modules: updatedModules
    });
  }

  // Método para obtener estadísticas del sidebar
  getSidebarStats = computed(() => {
    const visibleModules = this.visibleModules();
    const totalMenuItems = visibleModules.reduce((count: number, module: ModuleConfig) => count + module.menuItems.length, 0);
    
    return {
      totalModules: visibleModules.length,
      totalMenuItems,
      moduleNames: visibleModules.map((module: ModuleConfig) => module.name)
    };
  });
}
