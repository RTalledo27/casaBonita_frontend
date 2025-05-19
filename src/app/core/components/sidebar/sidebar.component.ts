import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { LucideAngularModule, Home, User, ShieldCheck, Package, Layers, DollarSign, HelpCircle, Settings, ChevronDown } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    LucideAngularModule
   
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true,  // <--- Componente standalone

})
export class SidebarComponent {
  navItems = [
    { label: 'Dashboard', icon: Home, route: '/dashboard' },
    { label: 'CRM', icon: User, route: '/crm' },
    { label: 'Security', icon: ShieldCheck, expanded:false, children: [
      { label: 'Users', route: '/security/users' },
      { label: 'Roles', route: '/security/roles' },
      { label: 'Permissions', route: '/security/permissions' },
    ] },
    { label: 'Inventory', icon: Package, route: '/inventory' },
    { label: 'Sales', icon: Layers, route: '/sales' },
    { label: 'Accounting', icon: DollarSign, route: '/accounting' },
    { label: 'Service Desk', icon: HelpCircle, route: '/service-desk' },
    { label: 'Audit', icon: ShieldCheck, route: '/audit' },
    { label: 'Settings', icon: Settings, route: '/settings' },
  ];

  chevronDown = [
    { label: 'Chevron Down', icon: ChevronDown,  },
  ]

   toggle(item: any) {
    item.expanded = !item.expanded;
  }
}
