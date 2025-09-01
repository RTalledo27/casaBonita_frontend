import { Component } from '@angular/core';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { ChartData } from 'chart.js';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { AlertCircleIcon, AlertTriangle, Calendar, Calendar1, CheckCircle, Clock, Info, LucideAngularModule, Ticket } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-service-desk',
  imports: [LucideAngularModule, CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './dashboard-service-desk.component.html',
  styleUrl: './dashboard-service-desk.component.scss',
})
export class DashboardServiceDeskComponent {
  data: any = {};
  recentTickets: any[] = [];
  alerts: any[] = [];
  topTechs: any[] = [];
  period = 'month';

  customStart?: string;
  customEnd?: string;

  alert = AlertCircleIcon;
  ticket = Ticket;
  alert_triangle = AlertTriangle;
  check_circle = CheckCircle;
  clock = Clock;
  info = Info;
  calendar = Calendar;

  // Datos para ng2-charts
  statusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  priorityChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  constructor(private service: ServiceDeskTicketsService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  onPeriodChange() {
    this.loadDashboard();
    
  }

  loadDashboard() {
    let params: any = { period: this.period };
    console.log('Cargando dashboard con params:', params);
    if (this.period === 'custom' && this.customStart && this.customEnd) {
      params.start = this.customStart;
      params.end = this.customEnd;
    }
    // Puedes bloquear la consulta si falta algún campo en personalizado
    if (this.period === 'custom' && (!this.customStart || !this.customEnd))
      return;

    this.service.getDashboardStats(params).subscribe((data) => {
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
    });
  }

  setPeriod(p: string) {
    this.period = p;
    this.loadDashboard();
  }
}
