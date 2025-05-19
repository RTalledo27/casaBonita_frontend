import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import {User, UserCheck,FileWarning} from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,  // <--- Componente standalone
  imports: [LucideAngularModule,    BaseChartDirective,CommonModule  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // KPI DATA
  kpis = [
    { label: 'Total Clients', value: 120, icon: User },
    { label: 'Total Users', value: 8, icon: UserCheck },
    { label: 'Active Contracts', value: 45, icon: FileWarning },
    { label: 'Pending Payments', value: 20, icon: UserCheck },
  ];

  // CHART DATA
  salesChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        data: [10, 25, 18, 40, 30, 50, 45],
        label: 'Sales',
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        fill: false,
        tension: 0.3,
      },
    ]
  };

  salesChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: 'rgba(255,255,255,0.7)' },
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.6)' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: 'rgba(255,255,255,0.6)' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  lotsChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [
      {
        label: 'Lots Sold',
        data: [2, 3, 2, 4, 5, 3, 4, 2, 5],
        backgroundColor: '#3b82f6',
      }
    ]
  };

  activity = [
    { label: 'GitHub Integration setup', icon: '✅' },
    { label: 'Payment recorded by Admin', icon: '💰' },
    { label: 'Role assigned to Cardi White', icon: '🔐' },
  ];

  events = [
    { label: 'Marketing Meeting', date: 'April 20', icon: '📅' },
    { label: 'System Maintenance', date: 'April 28', icon: '⚙️' },
    { label: 'Financial Report', date: 'May 3', icon: '📊' },
  ];
}
