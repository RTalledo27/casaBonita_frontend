import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown, RefreshCw, Download, AlertCircle, DollarSign, TrendingUp, Award, Users, BarChart, PieChart, Trophy, Filter, TrendingDown, AlertTriangle } from 'lucide-angular';
import { EmployeeService } from '../../services/employee.service';

// Interfaces para tipado
interface CommissionsSummary {
  total_amount: number;
  count: number;
  paid: number;
  pending: number;
  processing: number;
  paid_amount?: number;
  pending_amount?: number;
  processing_amount?: number;
}

interface BonusesSummary {
  total_amount: number;
  total_bonuses: number;
  performance_bonuses: number;
  sales_bonuses: number;
  other_bonuses: number;
}

interface TopPerformer {
  employee_id: number;
  employee_name: string;
  employee_code: string;
  total_commissions: number;
  total_bonuses: number;
  total_earnings: number;
}

interface AdminDashboardData {
  period: {
    month: number;
    year: number;
    label: string;
  };
  commissions_summary: CommissionsSummary;
  bonuses_summary: BonusesSummary;
  top_performers: TopPerformer[];
  employees: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private employeeService = inject(EmployeeService);

  // Señales para el estado del componente
  dashboardData = signal<AdminDashboardData | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  selectedEmployeeType = signal<string>('all');
  topPerformersViewMode = signal<'cards' | 'table'>('cards');
  showComparisonModal = signal<boolean>(false);
  comparisonData = signal<any>(null);
  currentFilter = signal<string>('all');
  selectedEmployeeFilter = signal<string>('all');

  // Iconos de Lucide
  ChevronDown = ChevronDown;
  RefreshCw = RefreshCw;
  Download = Download;
  AlertCircle = AlertCircle;
  DollarSign = DollarSign;
  TrendingUp = TrendingUp;
  Award = Award;
  Users = Users;
  BarChart = BarChart;
  PieChart = PieChart;
  Trophy = Trophy;
  Filter = Filter;
  TrendingDown = TrendingDown;
  AlertTriangle = AlertTriangle;

  // Computed values
  totalRevenue = computed(() => {
    const data = this.dashboardData();
    if (!data) return 0;
    return (data.commissions_summary.total_amount || 0) + (data.bonuses_summary.total_amount || 0);
  });

  activeEmployees = computed(() => {
    const employees = this.dashboardData()?.employees || [];
    return employees.filter(emp => emp.employment_status === 'active').length;
  });

  // Computed para empleados filtrados
  filteredEmployees = computed(() => {
    const employees = this.dashboardData()?.employees || [];
    const filter = this.selectedEmployeeFilter();
    const typeFilter = this.selectedEmployeeType();
    // Primero filtrar por tipo de empleado
    let filteredByType = employees;
    if (typeFilter !== 'all') {
      filteredByType = employees.filter(emp => emp.employee_type === typeFilter);
    }
    
    // Luego aplicar filtro de rendimiento
    switch (filter) {
      case 'top':
        return filteredByType
          .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
          .slice(0, 10);
      case 'low':
        return filteredByType
          .filter(emp => (emp.totalEarnings || 0) > 0)
          .sort((a, b) => (a.totalEarnings || 0) - (b.totalEarnings || 0))
          .slice(0, 10);
      case 'no-sales':
        return filteredByType.filter(emp => (emp.totalEarnings || 0) === 0);
      default:
        return filteredByType;
    }
  });

  // Opciones para selectores
  months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);
    
    this.dashboardData.set(null);

    try {
      const data = await this.employeeService.getAdminDashboard(
        this.selectedMonth(),
        this.selectedYear()
      ).toPromise();
      
      if (!data) {
        this.error.set('No se recibieron datos del servidor');
        return;
      }

      const transformedData = this.transformDashboardData(data);
      this.dashboardData.set(transformedData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
      this.error.set('Error al cargar los datos del dashboard: ' + 
        (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      this.loading.set(false);
    }
  }

  // Nuevo método para transformar los datos de la API
  private transformDashboardData(apiData: any): AdminDashboardData {
    if (!apiData) {
      return this.getEmptyDashboardData();
    }
    
    const hasValidData = apiData.commissions_summary || apiData.bonuses_summary || 
                        apiData.top_performers || apiData.employees ||
                        Object.keys(apiData).length > 0;
    
    if (!hasValidData) {
      return this.getEmptyDashboardData();
    }

    // Extraer datos de comisiones
    const commissionsData = apiData.commissions_summary || {};
    const totalCommissions = parseFloat(commissionsData.total_amount || 0);
    const commissionsCount = parseInt(commissionsData.total_commissions || commissionsData.count || 0);

    // Extraer datos de bonos - usar la estructura correcta del backend
    const bonusesData = apiData.bonuses_summary || {};
    const totalBonuses = parseFloat(bonusesData.total_amount || 0);
    const bonusesCount = parseInt(bonusesData.total_bonuses || 0);

    // Procesar empleados top performers
    let topPerformersData = apiData.top_performers;
    if (!topPerformersData || (Array.isArray(topPerformersData) && topPerformersData.length === 0)) {
      if (apiData.employees && Array.isArray(apiData.employees) && apiData.employees.length > 0) {
        // Tomar los primeros 5 empleados como top performers
        topPerformersData = apiData.employees.slice(0, 5);
      }
    }
    
    const topPerformers = this.transformTopPerformers(topPerformersData || []);
    
    // Procesar todos los empleados
    const employees = apiData.employees || [];

    // Procesar datos de bonos con la estructura correcta del backend
    let bonusesSummary = {
      total_amount: totalBonuses,
      total_bonuses: bonusesCount,
      performance_bonuses: 0,
      sales_bonuses: 0,
      other_bonuses: 0
    };

    // Manejar distribución por tipo de bono usando la estructura real del backend
    if (bonusesData.by_type) {
      const byType = bonusesData.by_type;
      Object.keys(byType).forEach(typeName => {
        const typeData = byType[typeName];
        const count = parseInt(typeData.count || 0);
        
        // Clasificar por nombre del tipo
        if (typeName.toLowerCase().includes('productividad') || 
            typeName.toLowerCase().includes('rendimiento') ||
            typeName.toLowerCase().includes('performance')) {
          bonusesSummary.performance_bonuses += count;
        } else if (typeName.toLowerCase().includes('ventas') || 
                   typeName.toLowerCase().includes('sales')) {
          bonusesSummary.sales_bonuses += count;
        } else {
          bonusesSummary.other_bonuses += count;
        }
      });
    }

    // Procesar datos de comisiones con la estructura correcta
    const commissionsStatus = commissionsData.by_status || {};
    
    // Calcular montos por estado (no solo contar)
    const paidAmount = parseFloat(commissionsStatus.pagado?.total_amount || commissionsStatus.paid?.total_amount || 0);
    const pendingAmount = parseFloat(commissionsStatus.pendiente?.total_amount || commissionsStatus.pending?.total_amount || 0);
    const processingAmount = parseFloat(commissionsStatus.procesando?.total_amount || commissionsStatus.processing?.total_amount || 0);
    
    const transformedData: AdminDashboardData = {
      period: apiData?.period || {
        month: this.selectedMonth(),
        year: this.selectedYear(),
        label: `${this.getMonthLabel(this.selectedMonth())} ${this.selectedYear()}`
      },
      commissions_summary: {
        total_amount: totalCommissions,
        count: commissionsCount,
        paid: parseInt(commissionsStatus.pagado?.count || commissionsStatus.paid?.count || 0),
        pending: parseInt(commissionsStatus.pendiente?.count || commissionsStatus.pending?.count || 0),
        processing: parseInt(commissionsStatus.procesando?.count || commissionsStatus.processing?.count || 0),
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        processing_amount: processingAmount
      },
      bonuses_summary: bonusesSummary,
      top_performers: topPerformers,
      employees: Array.isArray(employees) ? employees.map((emp: any, index: number) => {
        // Calcular comisiones desde las relaciones
        let calculatedCommissions = 0;
        if (emp.commissions && Array.isArray(emp.commissions)) {
          calculatedCommissions = emp.commissions.reduce((sum: number, commission: any) => {
            const amount = parseFloat(commission.commission_amount || 0);
            return sum + amount;
          }, 0);
        } else if (emp.total_commissions) {
          calculatedCommissions = parseFloat(emp.total_commissions);
        }
        
        // Calcular bonos desde las relaciones
        let calculatedBonuses = 0;
        if (emp.bonuses && Array.isArray(emp.bonuses)) {
          calculatedBonuses = emp.bonuses.reduce((sum: number, bonus: any) => {
            const amount = parseFloat(bonus.bonus_amount || 0);
            return sum + amount;
          }, 0);
        } else if (emp.total_bonuses) {
          calculatedBonuses = parseFloat(emp.total_bonuses);
        }
        
        const totalEarnings = calculatedCommissions + calculatedBonuses;
        

        
        return {
          id: emp.employee_id || emp.id,
          name: emp.user?.first_name && emp.user?.last_name 
            ? `${emp.user.first_name} ${emp.user.last_name}`
            : emp.full_name || emp.name || 'N/A',
          code: emp.employee_code || emp.code || 'N/A',
          type: emp.employee_type || emp.type || 'N/A',
          team: emp.team?.team_name || emp.team_name || 'N/A',
          totalEarnings: totalEarnings,
          commissions: calculatedCommissions,
          bonuses: calculatedBonuses,
          status: emp.employment_status || emp.status || 'activo',
          employee_type: emp.employee_type || 'N/A',
          employment_status: emp.employment_status || 'activo'
        };
      }) : []
    };

    return transformedData;
  }

  private getEmptyDashboardData(): AdminDashboardData {
    return {
      period: {
        month: this.selectedMonth(),
        year: this.selectedYear(),
        label: `${this.getMonthLabel(this.selectedMonth())} ${this.selectedYear()}`
      },
      commissions_summary: {
        total_amount: 0,
        count: 0,
        paid: 0,
        pending: 0,
        processing: 0
      },
      bonuses_summary: {
        total_amount: 0,
        total_bonuses: 0,
        performance_bonuses: 0,
        sales_bonuses: 0,
        other_bonuses: 0
      },
      top_performers: [],
      employees: []
    };
  }

  // Método para transformar top performers
  private transformTopPerformers(performers: any): TopPerformer[] {
    let performersArray: any[] = [];
    
    // Manejar diferentes estructuras de datos
    if (Array.isArray(performers)) {
      performersArray = performers;
    } else if (performers && typeof performers === 'object') {
      // Si es un objeto con índices numéricos, convertir a array
      performersArray = Object.values(performers);
    } else {
      return [];
    }

    if (performersArray.length === 0) {
      return [];
    }

    return performersArray.map((performer, index) => {
      // El performer ya es el empleado completo según la estructura del backend
      const employee = performer;
      const user = employee.user || {};
      
      const employeeId = employee.employee_id || employee.id || index;
      const employeeName = user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : employee.employee_name || 
                            employee.full_name ||
                            employee.name ||
                            `${employee.first_name || ''} ${employee.last_name || ''}`.trim() ||
                            'Empleado sin nombre';
      
      const employeeCode = employee.employee_code || employee.code || `EMP${employeeId}`;
      
      // Calcular comisiones y bonos reales desde las relaciones del backend
      let totalCommissions = 0;
      let totalBonuses = 0;
      
      // El backend envía las comisiones y bonos como arrays de objetos en las relaciones
      if (employee.commissions && Array.isArray(employee.commissions)) {
        totalCommissions = employee.commissions.reduce((sum: number, commission: any) => {
          const amount = parseFloat(commission.commission_amount || 0);
          return sum + amount;
        }, 0);
      }
      
      if (employee.bonuses && Array.isArray(employee.bonuses)) {
        totalBonuses = employee.bonuses.reduce((sum: number, bonus: any) => {
          const amount = parseFloat(bonus.bonus_amount || 0);
          return sum + amount;
        }, 0);
      }
      
      return {
        employee_id: employeeId,
        employee_name: employeeName,
        employee_code: employeeCode,
        total_commissions: totalCommissions,
        total_bonuses: totalBonuses,
        total_earnings: totalCommissions + totalBonuses
      };
    });
  }

  toggleTopPerformersView() {
    const currentMode = this.topPerformersViewMode();
    this.topPerformersViewMode.set(currentMode === 'cards' ? 'table' : 'cards');
  }

  // Métodos de utilidad para formateo
  calculateEmployeeEarnings(employee: any): number {
    if (!employee) return 0;
    
    // Si ya tiene totalEarnings calculado, usarlo
    if (employee.totalEarnings !== undefined) {
      return parseFloat(employee.totalEarnings) || 0;
    }
    
    // Calcular desde comisiones y bonos
    const commissions = parseFloat(employee.commissions || employee.total_commissions || 0);
    const bonuses = parseFloat(employee.bonuses || employee.total_bonuses || 0);
    
    return commissions + bonuses;
  }

  // Método para cambio de período
  onPeriodChange(): void {
    this.loadDashboardData();
  }

  

  // Método para cambio de tipo de empleado
  onEmployeeTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedEmployeeType.set(target.value);
  }

  // Método para formatear moneda
  formatCurrency(amount: number | string): string {
    // Convertir a número de forma segura
    let numericAmount: number;
    
    if (typeof amount === 'string') {
      // Si es string, intentar extraer solo el primer número válido
      const cleanAmount = amount.toString().replace(/[^\d.-]/g, '');
      const firstNumber = cleanAmount.split('.')[0] + '.' + (cleanAmount.split('.')[1] || '0');
      numericAmount = parseFloat(firstNumber) || 0;
    } else {
      numericAmount = amount || 0;
    }
    
    // Validar que sea un número válido
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      numericAmount = 0;
    }
    
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(numericAmount);
  }

  getEmployeeTypeClass(employee: any): string {
    if (!employee) return 'bg-gray-100 text-gray-800';
    
    const type = (employee.employee_type || employee.type || '').toLowerCase();
    
    switch (type) {
      case 'asesor':
      case 'advisor':
      case 'asesor inmobiliario':
        return 'bg-blue-100 text-blue-800';
      case 'gerente':
      case 'manager':
      case 'gerente de ventas':
        return 'bg-green-100 text-green-800';
      case 'administrador':
      case 'admin':
      case 'administrator':
        return 'bg-purple-100 text-purple-800';
      case 'supervisor':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getEmployeeTypeLabel(type: string): string {
    const labels = {
        'advisor': 'Asesor',
      'manager': 'Gerente',
      'admin': 'Administrador'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getEmployeeStatusClass(status: string): string {
    const classes = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'suspended': 'bg-yellow-100 text-yellow-800'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  // Métodos para comparación de períodos
  async comparePeriods(): Promise<void> {
    if (this.loading()) return;
    
    this.loading.set(true);
    try {
      const currentData = this.dashboardData();
      if (!currentData) {
        throw new Error('No hay datos actuales para comparar');
      }

      // Calcular período anterior
      let prevMonth = this.selectedMonth() - 1;
      let prevYear = this.selectedYear();
      
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear--;
      }

      // Obtener datos del período anterior
      const previousData = await this.employeeService.getAdminDashboard(prevMonth, prevYear).toPromise();
      
      if (previousData) {
        const comparison = {
          revenue: {
            current: this.totalRevenue(),
            previous: (previousData.commissions_summary?.total_amount || 0) + (previousData.bonuses_summary?.total_amount || 0),
            change: 0,
            percentage: 0
          },
          commissions: {
            current: currentData.commissions_summary?.total_amount || 0,
            previous: previousData.commissions_summary?.total_amount || 0,
            change: 0
          },
          bonuses: {
            current: currentData.bonuses_summary?.total_amount || 0,
            previous: previousData.bonuses_summary?.total_amount || 0,
            change: 0
          }
        };

        // Calcular cambios
        comparison.revenue.change = comparison.revenue.current - comparison.revenue.previous;
        comparison.revenue.percentage = comparison.revenue.previous > 0 
          ? (comparison.revenue.change / comparison.revenue.previous) * 100 
          : 0;
        
        comparison.commissions.change = comparison.commissions.current - comparison.commissions.previous;
        comparison.bonuses.change = comparison.bonuses.current - comparison.bonuses.previous;

        this.comparisonData.set(comparison);
        this.showComparisonModal.set(true);
      }
    } catch (error) {
      console.error('Error comparing periods:', error);
      this.error.set('Error al comparar períodos: ' + (error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  closeComparisonModal(): void {
    this.showComparisonModal.set(false);
    this.comparisonData.set(null);
  }

  // Método para generar reportes
  generateReport(): void {
    const data = this.dashboardData();
    if (!data) {
      this.error.set('No hay datos disponibles para generar el reporte');
      return;
    }

    const report = {
      period: data.period,
      summary: {
        total_revenue: this.totalRevenue(),
        commissions: data.commissions_summary,
        bonuses: data.bonuses_summary,
        active_employees: this.activeEmployees()
      },
      top_performers: data.top_performers,
      employees: data.employees,
      generated_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hr-dashboard-${data.period?.label?.replace(/\s+/g, '-')}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Método para refrescar datos
  refreshData(): void {
    this.loadDashboardData();
  }

  // Método para obtener etiqueta del mes
  getMonthLabel(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || 'Mes';
  }

  getEmployeeStatusLabel(employee: any): string {
    if (!employee) return 'Desconocido';
    
    const status = (employee.employment_status || employee.status || '').toLowerCase();
    
    switch (status) {
      case 'activo':
      case 'active':
        return 'Activo';
      case 'inactivo':
      case 'inactive':
        return 'Inactivo';
      case 'suspendido':
      case 'suspended':
        return 'Suspendido';
      case 'terminado':
      case 'terminated':
        return 'Terminado';
      case 'licencia':
      case 'leave':
        return 'En Licencia';
      default:
        return 'Desconocido';
    }
  }

  // Método trackBy para optimizar el rendimiento de ngFor
  trackByEmployeeId(index: number, employee: any): any {
    return employee?.id || employee?.employee_id || index;
  }
}
