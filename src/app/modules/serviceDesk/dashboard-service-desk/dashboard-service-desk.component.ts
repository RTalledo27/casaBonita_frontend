import { Component, OnInit } from '@angular/core';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { ChartData, ChartOptions } from 'chart.js';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  AlertCircleIcon,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BellOff,
  Calendar,
  CheckCircle,
  Clock,
  Inbox,
  Info,
  LucideAngularModule,
  Minus,
  PieChart,
  Ticket,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-service-desk',
  standalone: true,
  imports: [
    LucideAngularModule,
    CommonModule,
    BaseChartDirective,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './dashboard-service-desk.component.html',
  styleUrl: './dashboard-service-desk.component.scss',
})
export class DashboardServiceDeskComponent implements OnInit {
  data: any = {};
  recentTickets: any[] = [];
  alerts: any[] = [];
  topTechs: any[] = [];
  period = 'month';
  loading = false;

  customStart?: string;
  customEnd?: string;

  // Icons
  alert = AlertCircleIcon;
  ticket = Ticket;
  alert_triangle = AlertTriangle;
  check_circle = CheckCircle;
  clock = Clock;
  info = Info;
  calendar = Calendar;
  trendingUp = TrendingUp;
  trendingDown = TrendingDown;
  arrowUp = ArrowUp;
  arrowDown = ArrowDown;
  minus = Minus;

  // Chart data
  statusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  priorityChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  // Chart options
  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { size: 12, family: 'Inter, Roboto, sans-serif' },
          boxWidth: 16,
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          precision: 0,
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.4)',
        },
        border: {
          display: false,
        },
      },
      x: {
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  constructor(
    private service: ServiceDeskTicketsService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadDashboard();
  }

  onPeriodChange() {
    this.loadDashboard();
  }

  loadDashboard() {
    let params: any = { period: this.period };
    if (this.period === 'custom' && this.customStart && this.customEnd) {
      params.start = this.customStart;
      params.end = this.customEnd;
    }
    if (this.period === 'custom' && (!this.customStart || !this.customEnd)) {
      return;
    }

    this.loading = true;
    this.service.getDashboardStats(params).subscribe({
      next: (data) => {
        this.data = data;
        this.recentTickets = data.recent_incidents || [];
        this.alerts = data.alerts || [];
        this.topTechs = data.top_techs || [];
        this.statusChartData = data.statusChartData || {
          labels: [],
          datasets: [],
        };
        this.priorityChartData = data.priorityChartData || {
          labels: [],
          datasets: [],
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  setPeriod(p: string) {
    this.period = p;
    this.loadDashboard();
  }

  // Helper methods
  getTrendDirection(value: string | undefined): 'up' | 'down' | 'neutral' {
    if (!value) return 'neutral';
    if (value.includes('+') && !value.includes('+0')) return 'up';
    if (value.includes('-')) return 'down';
    return 'neutral';
  }

  getTrendIcon(value: string | undefined): string {
    const direction = this.getTrendDirection(value);
    switch (direction) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'minus';
    }
  }

  hasChartData(chartData: ChartData<any>): boolean {
    if (!chartData?.datasets?.length) return false;
    const data = chartData.datasets[0]?.data;
    if (!data || !Array.isArray(data)) return false;
    return data.some((val) => (val as number) > 0);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      abierto: 'Abierto',
      en_proceso: 'En Proceso',
      cerrado: 'Cerrado',
    };
    return labels[status] || status;
  }

  getInitials(firstName: string | undefined, lastName: string | undefined): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  }

  navigateToTicket(ticketId: number) {
    this.router.navigate(['/service-desk/tickets', ticketId]);
  }
}
