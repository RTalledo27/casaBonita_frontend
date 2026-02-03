import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { ServiceDeskTicketsService } from '../services/servicedesk.service';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-service-desk-reports',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BaseChartDirective,
        LucideAngularModule,
        RouterModule,
    ],
    templateUrl: './service-desk-reports.component.html',
    styleUrl: './service-desk-reports.component.scss',
})
export class ServiceDeskReportsComponent implements OnInit {
    loading = false;
    period = 'month';
    customStart = '';
    customEnd = '';

    // Report data
    reportData: any = {};

    // Chart configurations
    ticketVolumeData: ChartData<'line'> = { labels: [], datasets: [] };
    resolutionTimeData: ChartData<'bar'> = { labels: [], datasets: [] };
    slaComplianceData: ChartData<'doughnut'> = { labels: [], datasets: [] };
    priorityDistributionData: ChartData<'pie'> = { labels: [], datasets: [] };

    lineChartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#cbd5e1',
                    font: { size: 12 },
                    usePointStyle: true,
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
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 },
                grid: { color: 'rgba(51, 65, 85, 0.4)' },
                border: { display: false },
            },
            x: {
                ticks: { color: '#94a3b8', font: { size: 11 } },
                grid: { display: false },
                border: { display: false },
            },
        },
    };

    barChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
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
                ticks: { color: '#94a3b8', font: { size: 11 } },
                grid: { color: 'rgba(51, 65, 85, 0.4)' },
                border: { display: false },
            },
            x: {
                ticks: { color: '#94a3b8', font: { size: 11 } },
                grid: { display: false },
                border: { display: false },
            },
        },
    };

    doughnutChartOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#cbd5e1',
                    font: { size: 12 },
                    usePointStyle: true,
                    padding: 16,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                cornerRadius: 8,
                padding: 12,
            },
        },
    };

    pieChartOptions: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#cbd5e1',
                    font: { size: 12 },
                    usePointStyle: true,
                    padding: 16,
                },
            },
        },
    };

    constructor(private service: ServiceDeskTicketsService) { }

    ngOnInit(): void {
        this.loadReports();
    }

    onPeriodChange(): void {
        this.loadReports();
    }

    loadReports(): void {
        let params: any = { period: this.period };
        if (this.period === 'custom' && this.customStart && this.customEnd) {
            params.start = this.customStart;
            params.end = this.customEnd;
        }
        if (this.period === 'custom' && (!this.customStart || !this.customEnd)) {
            return;
        }

        this.loading = true;

        // Load from dashboard stats (we can enhance the API later for report-specific data)
        this.service.getDashboardStats(params).subscribe({
            next: (data) => {
                this.reportData = data;
                this.buildCharts(data);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            },
        });
    }

    buildCharts(data: any): void {
        // Ticket Volume - Line Chart (mock weekly data)
        const now = new Date();
        const weekLabels = this.getLastNDaysLabels(7);

        this.ticketVolumeData = {
            labels: weekLabels,
            datasets: [
                {
                    label: 'Tickets Creados',
                    data: this.generateMockData(7, data.total_tickets || 0),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                },
                {
                    label: 'Tickets Cerrados',
                    data: this.generateMockData(7, Math.floor((data.total_tickets || 0) * 0.7)),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                },
            ],
        };

        // Resolution Time - Bar Chart
        this.resolutionTimeData = {
            labels: ['Baja', 'Media', 'Alta', 'Crítica'],
            datasets: [
                {
                    label: 'Tiempo Promedio (horas)',
                    data: [2.5, 4, 1.5, 0.5],
                    backgroundColor: ['#06b6d4', '#eab308', '#ef4444', '#ec4899'],
                    borderRadius: 8,
                },
            ],
        };

        // SLA Compliance - Doughnut
        const slaRate = parseFloat(data.sla_rate) || 0;
        this.slaComplianceData = {
            labels: ['Cumplido', 'No Cumplido'],
            datasets: [
                {
                    data: [slaRate, 100 - slaRate],
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderWidth: 0,
                },
            ],
        };

        // Priority Distribution - Pie
        const priorityData = data.priorityChartData?.datasets?.[0]?.data || [0, 0, 0, 0];
        this.priorityDistributionData = {
            labels: ['Baja', 'Media', 'Alta', 'Crítica'],
            datasets: [
                {
                    data: priorityData,
                    backgroundColor: ['#06b6d4', '#eab308', '#ef4444', '#ec4899'],
                    borderWidth: 0,
                },
            ],
        };
    }

    private getLastNDaysLabels(n: number): string[] {
        const labels: string[] = [];
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }));
        }
        return labels;
    }

    private generateMockData(length: number, total: number): number[] {
        const data: number[] = [];
        const avg = Math.max(1, Math.floor(total / length));
        for (let i = 0; i < length; i++) {
            data.push(Math.max(0, avg + Math.floor((Math.random() - 0.5) * avg)));
        }
        return data;
    }

    exportReport(): void {
        // TODO: Implement PDF/Excel export
        alert('Funcionalidad de exportación próximamente');
    }

    getPerformancePercent(tech: any, allTechs: any[]): number {
        if (!allTechs?.length) return 0;
        const max = Math.max(...allTechs.map((t: any) => t.assigned_tickets_count || 0));
        if (max === 0) return 0;
        return ((tech.assigned_tickets_count || 0) / max) * 100;
    }
}
