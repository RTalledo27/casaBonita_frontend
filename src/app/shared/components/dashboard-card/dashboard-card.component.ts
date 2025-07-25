import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-card',
  imports: [TranslateModule, CommonModule, LucideAngularModule],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
})
export class DashboardCardComponent {
  @Input() title!: string;
  @Input() value!: string | number;
  @Input() subtitle?: string;
  @Input() icon!: LucideIconData;
  @Input() iconClass = 'text-blue-600 dark:text-blue-400';
  @Input() iconBgClass = 'bg-blue-100 dark:bg-blue-900';
  @Input() trend?: {
    percentage: number;
    isPositive: boolean;
    label: string;
  };
}
