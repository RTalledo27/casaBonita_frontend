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
    { label: 'dashboard', icon: Home, route: '/dashboard', active: false },
    {
      label: 'crm',
      icon: User,
      route: '/crm',
      expanded: false,
      active: false,
      children: [{ label: 'clients', route: '/crm/clients', active: false }],
    },
    {
      label: 'security',
      icon: ShieldCheck,
      expanded: false,
      active: false,
      children: [
        { label: 'users', route: '/security/users', active: false },
        { label: 'roles', route: '/security/roles', active: false },
        { label: 'permissions', route: '/security/permissions', active: false },
      ],
    },
    { label: 'inventory', icon: Package, route: '/inventory', active: false },
    {
      label: 'sales',
      icon: Layers,
      route: '/sales',
      expanded: false,
      active: false,
      children: [
        { label: 'reservations', route: '/sales/reservations', active: false },
        { label: 'contracts', route: '/sales/contracts', active: false },
        { label: 'invoices', route: '/sales/invoices', active: false },
        { label: 'payments', route: '/sales/payments', active: false },
      ],
    },
    {
      label: 'finance',
      icon: TrendingUp,
      route: '/finance',
      expanded: false,
      active: false,
      children: [
        { label: 'budgets', route: '/finance/budgets', active: false },
        { label: 'cash-flows', route: '/finance/cash-flows', active: false },
        { label: 'cost-centers', route: '/finance/cost-centers', active: false },
      ],
    },
    // {
    //   label: 'collections',
    //   icon: CreditCard,
    //   route: '/collections',
    //   expanded: false,
    //   children: [
    //     {
    //       label: 'dashboard',
    //       route: '/collections/dashboard',
    //     },
    //     {
    //       label: 'accounts-receivable',
    //       route: '/collections/accounts-receivable',
    //     },
    //     {
    //       label: 'payment-management',
    //       route: '/collections/payment-management',
    //     },
    //     {
    //       label: 'collectors',
    //       route: '/collections/collectors',
    //     },
    //     {
    //       label: 'aging-reports',
    //       route: '/collections/aging-reports',
    //     },
    //     {
    //       label: 'alerts',
    //       route: '/collections/alerts',
    //     },
    //     {
    //       label: 'verification-dashboard',
    //       route: '/collections/verification-dashboard',
    //     },
    //     {
    //       label: 'payment-verification',
    //       route: '/collections/payment-verification',
    //     },
    //     {
    //       label: 'hr-integration',
    //       route: '/collections/hr-integration',
    //     },
    //   ],
    // },
    {
      label: 'collections-simplified',
      icon: CreditCard,
      route: '/collections-simplified',
      expanded: false,
      active: false,
      children: [
        {
          label: 'dashboard',
          route: '/collections-simplified/dashboard',
          active: false,
        },
        {
          label: 'schedule-generator',
          route: '/collections-simplified/schedule-generator',
          active: false,
        },
        {
          label: 'installment-management',
          route: '/collections-simplified/installment-management',
          active: false,
        },
        {
          label: 'reports',
          route: '/collections-simplified/reports',
          active: false,
        },
      ],
    },
    {
      label: 'hr',
      icon: Users,
      route: '/hr',
      expanded: false,
      active: false,
      children: [
        { label: 'adminDashboard', route: '/hr/admin-dashboard', active: false },
        { label: 'dashboard', route: '/hr/employees/dashboard/:id', active: false },
        { label: 'employees', route: '/hr/employees', active: false },
        { label: 'teams', route: '/hr/teams', active: false },
        { label: 'bonuses', route: '/hr/bonuses', active: false },
        { label: 'bonus-types', route: '/hr/bonus-types', active: false },
        { label: 'bonus-goals', route: '/hr/bonus-goals', active: false },
        { label: 'commissions', route: '/hr/commissions', active: false },
        { label: 'payroll', route: '/hr/payroll', active: false },
        { label: 'attendance', route: '/hr/attendance', active: false },    
      ],
    },
    { label: 'accounting', icon: DollarSign, route: '/accounting', active: false },
    {
      label: 'service-desk',
      icon: HelpCircle,
      route: '/service-desk',
      expanded: false,
      active: false,
      children: [
        { label: 'dashboard', route: '/service-desk/dashboard', active: false },
        { label: 'tickets', route: '/service-desk/tickets', active: false },
        { label: 'reportes', route: '/service-desk/reportes', active: false },
      ],
    },
    { label: 'audit', icon: ShieldCheck, route: '/audit', active: false },
    { label: 'settings', icon: Settings, route: '/settings', active: false },
  ];

  chevronDown = [{ label: 'Chevron Down', icon: ChevronDown }];

  toggle(item: any) {
    item.expanded = !item.expanded;
  }
}
