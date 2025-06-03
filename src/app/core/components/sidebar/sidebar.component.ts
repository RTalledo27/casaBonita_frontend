import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Home, User, ShieldCheck, Package, Layers, DollarSign, HelpCircle, Settings, ChevronDown } from 'lucide-angular';
import { expand } from 'rxjs';

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
      label: 'crm', icon: User, route: '/crm', expanded: false,
      children: [
        { label: 'clients', route: 'crm/clients' },
      ]
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
    { label: 'sales', icon: Layers, route: '/sales' },
    { label: 'accounting', icon: DollarSign, route: '/accounting' },
    { label: 'service desk', icon: HelpCircle, route: '/service-desk' },
    { label: 'audit', icon: ShieldCheck, route: '/audit' },
    { label: 'settings', icon: Settings, route: '/settings' },
  ];

  chevronDown = [{ label: 'Chevron Down', icon: ChevronDown }];

  chevronUp = [{ label: 'Chevron Down', icon: ChevronDown }];

  toggle(item: any) {
    item.expanded = !item.expanded;
  }
}
