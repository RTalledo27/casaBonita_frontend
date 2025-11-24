import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Home, User, ShieldCheck, Package, Layers, DollarSign, HelpCircle, Settings, ChevronDown, Users, TrendingUp, CreditCard, MessageCircle, FileText, Map as MapIcon, Calendar, CalendarDays, MapPin, BarChart, BarChart3, Receipt, Headphones, Ticket, FileSearch, UserCheck, Calculator, Percent, Shield, Lock, ShoppingCart } from 'lucide-angular';
import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true, // <--- Componente standalone
})
export class SidebarComponent implements OnInit, OnDestroy {
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private navigationService = inject(NavigationService);
  private expandSubscription?: Subscription;

  ngOnInit() {
    // Suscribirse al servicio de navegación para expandir módulos
    this.expandSubscription = this.navigationService.expandModule$.subscribe((moduleName: string) => {
      this.expandModuleByName(moduleName);
    });
  }

  ngOnDestroy() {
    // Limpiar la suscripción
    if (this.expandSubscription) {
      this.expandSubscription.unsubscribe();
    }
  }

  private expandModuleByName(moduleName: string) {
    const item = this.navItems().find(item => item.name === moduleName);
    if (item && item.children && item.children.length > 0) {
      // Cerrar todos los demás módulos primero (opcional)
      this.navItems().forEach(navItem => {
        if (navItem.name !== moduleName && navItem.children) {
          navItem.expanded = false;
        }
      });
      
      // Expandir el módulo solicitado
      item.expanded = true;
    }
  }

  // Mapeo de iconos para los módulos y elementos de menú
  private iconMap: { [key: string]: any } = {
    // Iconos principales
    'users': Users,
    'shopping-cart': ShoppingCart,
    'dollar-sign': DollarSign,
    'calendar': Calendar,
    'package': Package,
    'calculator': Calculator,
    'headphones': Headphones,
    'shield': Shield,
    'lock': Lock,
    // Iconos de menú
    'user': User,
    'message-circle': MessageCircle,
    'file-text': FileText,
    'map': MapIcon,
    'credit-card': CreditCard,
    'percent': Percent,
    'calendar-days': CalendarDays,
    'map-pin': MapPin,
    'bar-chart': BarChart,
    'receipt': Receipt,
    'ticket': Ticket,
    'file-search': FileSearch,
    'user-check': UserCheck,
    // Iconos por defecto
    'home': Home,
    'settings': Settings,
    'help-circle': HelpCircle
  };

  // Estructura estática completa de navegación con permisos requeridos
  private staticNavItems = [
    { 
      name: 'dashboard', 
      label: 'sidebar.dashboard.title', 
      icon: Home, 
      route: '/dashboard', 
      active: false,
      permission: null // Dashboard siempre visible
    },
    {
      name: 'crm',
      label: 'sidebar.crm.title',
      icon: User,
      route: '/crm',
      expanded: false,
      active: false,
      permission: 'crm.access',
      children: [
        { name: 'clients', label: 'sidebar.crm.clients.title', route: '/crm/clients', active: false, permission: 'crm.clients.view' }
      ],
    },
    {
      name: 'security',
      label: 'sidebar.security.title',
      icon: ShieldCheck,
      expanded: false,
      active: false,
      permission: 'security.access',
      children: [
        { name: 'users', label: 'sidebar.security.users.title', route: '/security/users', active: false, permission: 'security.users.index' },
        { name: 'roles', label: 'sidebar.security.roles.title', route: '/security/roles', active: false, permission: 'security.roles.view' },
        { name: 'permissions', label: 'sidebar.security.permissions.title', route: '/security/permissions', active: false, permission: 'security.permissions.view' },
      ],
    },
    { 
      name: 'inventory', 
      label: 'sidebar.inventory.title', 
      icon: Package, 
      route: '/inventory', 
      active: false,
      permission: 'inventory.access'
    },
    {
      name: 'sales',
      label: 'sidebar.sales.title',
      icon: Layers,
      route: '/sales',
      expanded: false,
      active: false,
      permission: 'sales.access',
      children: [
        { name: 'reservations', label: 'sidebar.sales.reservations.title', route: '/sales/reservations', active: false, permission: 'sales.reservations.access' },
        { name: 'contracts', label: 'sidebar.sales.contracts.title', route: '/sales/contracts', active: false, permission: 'sales.contracts.view' },
        { name: 'invoices', label: 'sidebar.sales.invoices.title', route: '/sales/invoices', active: false, permission: 'sales.access' },
        { name: 'payments', label: 'sidebar.sales.payments.title', route: '/sales/payments', active: false, permission: 'sales.access' },
      ],
    },
    {
      name: 'finance',
      label: 'sidebar.finance.title',
      icon: TrendingUp,
      route: '/finance',
      expanded: false,
      active: false,
      permission: 'finance.access', // Agregar al seeder si no existe
      children: [
        { name: 'budgets', label: 'sidebar.finance.budgets.title', route: '/finance/budgets', active: false, permission: 'finance.access' },
        { name: 'cash-flows', label: 'sidebar.finance.cash-flows.title', route: '/finance/cash-flows', active: false, permission: 'finance.access' },
        { name: 'cost-centers', label: 'sidebar.finance.cost-centers.title', route: '/finance/cost-centers', active: false, permission: 'finance.access' },
      ],
    },
    {
      name: 'collections',
      label: 'sidebar.collections-simplified.title',
      icon: CreditCard,
      route: '/collections-simplified',
      expanded: false,
      active: false,
      permission: 'collections.access',
      children: [
        {
          name: 'dashboard',
          label: 'sidebar.collections-simplified.dashboard.title',
          route: '/collections-simplified/dashboard',
          active: false,
          permission: 'collections.view'
        },
        {
          name: 'schedule-generator',
          label: 'sidebar.collections-simplified.schedule-generator.title',
          route: '/collections-simplified/generator',
          active: false,
          permission: 'collections.create'
        },
        {
          name: 'installment-management',
          label: 'sidebar.collections-simplified.installment-management.title',
          route: '/collections-simplified/installments',
          active: false,
          permission: 'collections.view'
        },
        {
          name: 'reports',
          label: 'sidebar.collections-simplified.reports.title',
          route: '/collections-simplified/reports',
          active: false,
          permission: 'collections.reports'
        },
      ],
    },
    {
      name: 'hr',
      label: 'sidebar.hr.title',
      icon: Users,
      route: '/hr',
      expanded: false,
      active: false,
      permission: 'hr.access',
      children: [
        { name: 'adminDashboard', label: 'sidebar.hr.adminDashboard.title', route: '/hr/admin-dashboard', active: false, permission: 'hr.access' },
        { name: 'dashboard', label: 'sidebar.hr.dashboard.title', route: '/hr/employees/dashboard/:id', active: false, permission: 'hr.employees.dashboard' },
        { name: 'employees', label: 'sidebar.hr.employees.title', route: '/hr/employees', active: false, permission: 'hr.employees.view' },
        { name: 'teams', label: 'sidebar.hr.teams.title', route: '/hr/teams', active: false, permission: 'hr.teams.view' },
        { name: 'bonuses', label: 'sidebar.hr.bonuses.title', route: '/hr/bonuses', active: false, permission: 'hr.bonuses.view' },
        { name: 'bonus-types', label: 'sidebar.hr.bonus-types.title', route: '/hr/bonus-types', active: false, permission: 'hr.bonus-types.view' },
        { name: 'bonus-goals', label: 'sidebar.hr.bonus-goals.title', route: '/hr/bonus-goals', active: false, permission: 'hr.bonus-goals.view' },
        { name: 'commissions', label: 'sidebar.hr.commissions.title', route: '/hr/commissions', active: false, permission: 'hr.commissions.view' },
        { name: 'commission-schemes', label: 'sidebar.hr.commissionSchemes.title', route: '/hr/commission-schemes', active: false, permission: 'hr.commissions.view' },
        { name: 'payroll', label: 'sidebar.hr.payroll.title', route: '/hr/payroll', active: false, permission: 'hr.payroll.view' },
        { name: 'tax-parameters', label: 'sidebar.hr.tax-parameters.title', route: '/hr/tax-parameters', active: false, permission: 'hr.access' },
        { name: 'attendance', label: 'sidebar.hr.attendance.title', route: '/hr/attendance', active: false, permission: 'hr.access' },
      ],
    },
    { 
      name: 'accounting', 
      label: 'sidebar.accounting.title', 
      icon: DollarSign, 
      route: '/accounting', 
      active: false,
      permission: 'accounting.access' // Agregar al seeder si no existe
    },
    {
      name: 'reports',
      label: 'sidebar.reports.title',
      icon: BarChart3,
      route: '/reports',
      expanded: false,
      active: false,
      permission: 'reports.access',
      children: [
        { name: 'dashboard', label: 'sidebar.reports.dashboard.title', route: '/reports/dashboard', active: false, permission: 'reports.view_dashboard' },
        { name: 'sales', label: 'sidebar.reports.sales.title', route: '/reports/sales', active: false, permission: 'reports.view_sales' },
        { name: 'payments', label: 'sidebar.reports.payments.title', route: '/reports/payment-schedule', active: false, permission: 'reports.view_payments' },
        { name: 'projections', label: 'sidebar.reports.projections.title', route: '/reports/projected', active: false, permission: 'reports.view_projections' },
      ],
    },
    {
      name: 'service-desk',
      label: 'sidebar.service-desk.title',
      icon: HelpCircle,
      route: '/service-desk',
      expanded: false,
      active: false,
      permission: 'service-desk.access', // Agregar al seeder si no existe
      children: [
        { name: 'dashboard', label: 'sidebar.service-desk.dashboard.title', route: '/service-desk/dashboard', active: false, permission: 'service-desk.tickets.view' },
        { name: 'tickets', label: 'sidebar.service-desk.tickets.title', route: '/service-desk/tickets', active: false, permission: 'service-desk.tickets.view' },
        { name: 'reportes', label: 'sidebar.service-desk.reportes.title', route: '/service-desk/reportes', active: false, permission: 'service-desk.tickets.view' },
      ],
    },
    { 
      name: 'audit', 
      label: 'sidebar.audit.title', 
      icon: ShieldCheck, 
      route: '/audit', 
      active: false,
      permission: 'audit.access' // Agregar al seeder si no existe
    },
    { 
      name: 'settings', 
      label: 'sidebar.settings.title', 
      icon: Settings, 
      route: '/settings', 
      active: false,
      permission: null // Settings siempre visible
    },
  ];

  // Computed signal que filtra los elementos según los permisos del usuario
  navItems = computed(() => {
    // IMPORTANTE: Usar SOLO signals reactivos - NO getCurrentUser()
    const userPermissions = this.sidebarService.userPermissionsSignal();
    const userRole = this.sidebarService.userRoleSignal();
    
    console.log('🔄 SidebarComponent: Re-computing navItems');
    console.log('  📊 Signal permissions:', userPermissions.length);
    console.log('  👤 Signal role:', userRole);
    
    // Si no hay permisos, mostrar solo dashboard y settings
    if (userPermissions.length === 0) {
      console.log('  ⚠️ No permissions in signal, showing only public modules');
      return this.staticNavItems.filter(item => item.permission === null);
    }
    
    console.log('  🔐 Using ONLY real permissions (no admin bypass). Role:', userRole);
    
    const filteredItems = this.staticNavItems.filter(item => {
      // Si no requiere permiso (null), siempre mostrar (dashboard, settings)
      if (item.permission === null) {
        console.log('    ✅', item.name, '- No permission required');
        return true;
      }
      
      // USAR PERMISOS DEL SIGNAL - Sin bypass de admin
      // Si tiene el permiso específico del módulo, mostrar
      if (item.permission && userPermissions.includes(item.permission)) {
        console.log('    ✅', item.name, '- Has permission:', item.permission);
        return true;
      }
      
      // Si no tiene el permiso .access pero tiene algún permiso del módulo, mostrar también
      const modulePrefix = item.name.toLowerCase();
      const hasAnyModulePermission = userPermissions.some(p => 
        p.startsWith(`${modulePrefix}.`)
      );
      
      if (hasAnyModulePermission) {
        console.log('    ✅', item.name, '- Has module permission');
      } else {
        console.log('    ❌', item.name, '- No permission');
      }
      
      return hasAnyModulePermission;
    });
    
    console.log('  📋 Total visible modules:', filteredItems.length);
    
    return filteredItems.map(item => {
      // Si el item tiene children, filtrarlos también por permisos
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter(child => {
          // Si no requiere permiso, mostrar
          if (!child.permission) {
            return true;
          }
          
          // USAR PERMISOS DEL SIGNAL - Sin bypass de admin
          return userPermissions.includes(child.permission);
        });
        
        return { ...item, children: filteredChildren };
      }
      
      return item;
    });
  });

  // Estadísticas del sidebar para debugging
  sidebarStats = this.sidebarService.getSidebarStats;

  // Verificar si el usuario está autenticado
  isAuthenticated = this.authService.isAuthenticated;

  chevronDown = [{ label: 'Chevron Down', icon: ChevronDown }];

  toggle(item: any) {
    item.expanded = !item.expanded;
  }
}
