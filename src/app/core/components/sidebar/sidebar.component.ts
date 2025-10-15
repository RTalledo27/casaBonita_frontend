import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Home, User, ShieldCheck, Package, Layers, DollarSign, HelpCircle, Settings, ChevronDown, Users, TrendingUp, CreditCard, MessageCircle, FileText, Map as MapIcon, Calendar, CalendarDays, MapPin, BarChart, Receipt, Headphones, Ticket, FileSearch, UserCheck, Calculator, Percent, ShoppingCart, Shield, Lock } from 'lucide-angular';
import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../services/auth.service';

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
export class SidebarComponent {
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);

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

  // Estructura estática completa de navegación
  private staticNavItems = [
    { name: 'dashboard', label: 'sidebar.dashboard.title', icon: Home, route: '/dashboard', active: false },
    {
      name: 'crm',
      label: 'sidebar.crm.title',
      icon: User,
      route: '/crm',
      expanded: false,
      active: false,
      children: [{ name: 'clients', label: 'sidebar.crm.clients.title', route: '/crm/clients', active: false }],
    },
    {
      name: 'security',
      label: 'sidebar.security.title',
      icon: ShieldCheck,
      expanded: false,
      active: false,
      children: [
        { name: 'users', label: 'sidebar.security.users.title', route: '/security/users', active: false },
        { name: 'roles', label: 'sidebar.security.roles.title', route: '/security/roles', active: false },
        { name: 'permissions', label: 'sidebar.security.permissions.title', route: '/security/permissions', active: false },
      ],
    },
    { name: 'inventory', label: 'sidebar.inventory.title', icon: Package, route: '/inventory', active: false },
    {
      name: 'sales',
      label: 'sidebar.sales.title',
      icon: Layers,
      route: '/sales',
      expanded: false,
      active: false,
      children: [
        { name: 'reservations', label: 'sidebar.sales.reservations.title', route: '/sales/reservations', active: false },
        { name: 'contracts', label: 'sidebar.sales.contracts.title', route: '/sales/contracts', active: false },
        { name: 'invoices', label: 'sidebar.sales.invoices.title', route: '/sales/invoices', active: false },
        { name: 'payments', label: 'sidebar.sales.payments.title', route: '/sales/payments', active: false },
      ],
    },
    {
      name: 'finance',
      label: 'sidebar.finance.title',
      icon: TrendingUp,
      route: '/finance',
      expanded: false,
      active: false,
      children: [
        { name: 'budgets', label: 'sidebar.finance.budgets.title', route: '/finance/budgets', active: false },
        { name: 'cash-flows', label: 'sidebar.finance.cash-flows.title', route: '/finance/cash-flows', active: false },
        { name: 'cost-centers', label: 'sidebar.finance.cost-centers.title', route: '/finance/cost-centers', active: false },
      ],
    },
    {
      name: 'collections-simplified',
      label: 'sidebar.collections-simplified.title',
      icon: CreditCard,
      route: '/collections-simplified',
      expanded: false,
      active: false,
      children: [
        {
          name: 'dashboard',
          label: 'sidebar.collections-simplified.dashboard.title',
          route: '/collections-simplified/dashboard',
          active: false,
        },
        {
          name: 'schedule-generator',
          label: 'sidebar.collections-simplified.schedule-generator.title',
          route: '/collections-simplified/generator',
          active: false,
        },
        {
          name: 'installment-management',
          label: 'sidebar.collections-simplified.installment-management.title',
          route: '/collections-simplified/installments',
          active: false,
        },
        {
          name: 'reports',
          label: 'sidebar.collections-simplified.reports.title',
          route: '/collections-simplified/reports',
          active: false,
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
      children: [
        { name: 'adminDashboard', label: 'sidebar.hr.adminDashboard.title', route: '/hr/admin-dashboard', active: false },
        { name: 'dashboard', label: 'sidebar.hr.dashboard.title', route: '/hr/employees/dashboard/:id', active: false },
        { name: 'employees', label: 'sidebar.hr.employees.title', route: '/hr/employees', active: false },
        { name: 'teams', label: 'sidebar.hr.teams.title', route: '/hr/teams', active: false },
        { name: 'bonuses', label: 'sidebar.hr.bonuses.title', route: '/hr/bonuses', active: false },
        { name: 'bonus-types', label: 'sidebar.hr.bonus-types.title', route: '/hr/bonus-types', active: false },
        { name: 'bonus-goals', label: 'sidebar.hr.bonus-goals.title', route: '/hr/bonus-goals', active: false },
        { name: 'commissions', label: 'sidebar.hr.commissions.title', route: '/hr/commissions', active: false },
        { name: 'payroll', label: 'sidebar.hr.payroll.title', route: '/hr/payroll', active: false },
        { name: 'attendance', label: 'sidebar.hr.attendance.title', route: '/hr/attendance', active: false },
      ],
    },
    { name: 'accounting', label: 'sidebar.accounting.title', icon: DollarSign, route: '/accounting', active: false },
    {
      name: 'service-desk',
      label: 'sidebar.service-desk.title',
      icon: HelpCircle,
      route: '/service-desk',
      expanded: false,
      active: false,
      children: [
        { name: 'dashboard', label: 'sidebar.service-desk.dashboard.title', route: '/service-desk/dashboard', active: false },
        { name: 'tickets', label: 'sidebar.service-desk.tickets.title', route: '/service-desk/tickets', active: false },
        { name: 'reportes', label: 'sidebar.service-desk.reportes.title', route: '/service-desk/reportes', active: false },
      ],
    },
    { name: 'audit', label: 'sidebar.audit.title', icon: ShieldCheck, route: '/audit', active: false },
    { name: 'settings', label: 'sidebar.settings.title', icon: Settings, route: '/settings', active: false },
  ];

  // Mapeo entre nombres de módulos del servicio y elementos del navItems
  private moduleMapping: { [key: string]: string } = {
    'crm': 'crm',
    'security': 'security',
    'sales': 'sales',
    'finance': 'finance',
    'collections': 'collections-simplified',
    'service-desk': 'service-desk',
    'accounting': 'accounting',
    'audit': 'audit',
    'hr': 'hr'
  };

  // Elementos que siempre son visibles (no dependen de permisos de módulos)
  private alwaysVisibleItems = ['dashboard', 'inventory', 'settings', 'collections-simplified', 'hr'];

  // Computed signal que filtra los elementos según los módulos visibles
  navItems = computed(() => {
    const visibleModules = this.sidebarService.visibleModules();
    
    // Crear un conjunto de nombres de módulos visibles, usando el mapeo cuando sea necesario
    const visibleModuleNames = new Set(
      visibleModules.map(module => {
        // Usar el mapeo si existe, de lo contrario usar el nombre del módulo directamente
        return this.moduleMapping[module.name] || module.name;
      })
    );
    
    return this.staticNavItems.filter(item => {
      // Siempre mostrar elementos que no dependen de permisos de módulos
      if (this.alwaysVisibleItems.includes(item.name)) {
        return true;
      }
      
      // Filtrar elementos basándose en los módulos visibles
      return visibleModuleNames.has(item.name);
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
