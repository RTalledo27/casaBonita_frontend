import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Home, User, ShieldCheck, Package, Layers, DollarSign, HelpCircle, Settings, ChevronDown, Users, TrendingUp, CreditCard } from 'lucide-angular';

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
  navItems = [
    { label: 'dashboard', icon: Home, route: '/dashboard' },
    {
      label: 'crm',
      icon: User,
      route: '/crm',
      expanded: false,
      children: [{ label: 'clients', route: '/crm/clients' }],
    },
    {
      label: 'security',
      icon: ShieldCheck,
      expanded: false,
      children: [
        { label: 'users', route: '/security/users' },
        { label: 'roles', route: '/security/roles' },
        { label: 'permissions', route: '/security/permissions' },
      ],
    },
    { label: 'inventory', icon: Package, route: '/inventory' },
    {
      label: 'sales',
      icon: Layers,
      route: '/sales',
      expanded: false,
      children: [
        { label: 'reservations', route: '/sales/reservations' },
        { label: 'contracts', route: '/sales/contracts' },
        { label: 'invoices', route: '/sales/invoices' },
        { label: 'payments', route: '/sales/payments' },
      ],
    },
    {
      label: 'finance',
      icon: TrendingUp,
      route: '/finance',
      expanded: false,
      children: [
        { label: 'budgets', route: '/finance/budgets' },
        { label: 'cash-flows', route: '/finance/cash-flows' },
        { label: 'cost-centers', route: '/finance/cost-centers' },
      ],
    },
    {
      label: 'collections',
      icon: CreditCard,
      route: '/collections',
      expanded: false,
      children: [
        {
          label: 'accounts-receivable',
          route: '/collections/accounts-receivable',
        },
        { label: 'payments', route: '/collections/payments' },
        { label: 'reports', route: '/collections/reports' },
      ],
    },
    {
      label: 'hr',
      icon: Users,
      route: '/hr',
      expanded: false,
      children: [
        { label: 'adminDashboard', route: '/hr/admin-dashboard' },
        { label: 'dashboard', route: '/hr/employees/dashboard/:id' },
        { label: 'employees', route: '/hr/employees' },
        { label: 'teams', route: '/hr/teams' },
        { label: 'bonuses', route: '/hr/bonuses' },
        { label: 'bonus-types', route: '/hr/bonus-types' },
        { label: 'bonus-goals', route: '/hr/bonus-goals' },
        { label: 'commissions', route: '/hr/commissions' },
        { label: 'payroll', route: '/hr/payroll' },
        { label: 'attendance', route: '/hr/attendance' },    
      ],
    },
    { label: 'accounting', icon: DollarSign, route: '/accounting' },
    {
      label: 'service-desk',
      icon: HelpCircle,
      route: '/service-desk',
      expanded: false,
      children: [
        { label: 'dashboard', route: '/service-desk/dashboard' },
        { label: 'tickets', route: '/service-desk/tickets' },
        { label: 'reportes', route: '/service-desk/reportes' },
      ],
    },
    { label: 'audit', icon: ShieldCheck, route: '/audit' },
    { label: 'settings', icon: Settings, route: '/settings' },
  ];

  chevronDown = [{ label: 'Chevron Down', icon: ChevronDown }];

  toggle(item: any) {
    item.expanded = !item.expanded;
  }
}
