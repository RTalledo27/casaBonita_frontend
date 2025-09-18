import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, Search, Filter, ToggleLeft, ToggleRight, Users, Crown } from 'lucide-angular';
import { TeamService } from '../../services/team.service';
import { EmployeeService } from '../../services/employee.service';
import { Team } from '../../models/team';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss'
})
export class TeamListComponent implements OnInit {
  private teamService = inject(TeamService);
  private employeeService = inject(EmployeeService);

  // Icons
  readonly Plus = Plus;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly ToggleLeft = ToggleLeft;
  readonly ToggleRight = ToggleRight;
  readonly Users = Users;
  readonly Crown = Crown;

  // Signals
  teams = signal<Team[]>([]);
  filteredTeams = signal<Team[]>([]);
  employees = signal<Employee[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  dataLoaded = signal(false); // Nuevo signal para controlar cuando todos los datos están cargados

  // Filters
  searchTerm = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  ngOnInit() {
    // Cargar empleados primero, luego equipos para asegurar que los datos estén disponibles para el conteo
    this.loadEmployees();
  }

  loadTeams() {
    console.log('🔄 Iniciando carga de equipos...');
    this.loading.set(true);
    this.error.set(null);

    this.teamService.getTeams().subscribe({
      next: (response) => {
        const safeData = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Equipos cargados:', safeData.length);
        this.teams.set(safeData);
        this.applyFilters();
        this.loading.set(false);
        this.dataLoaded.set(true); // Marcar datos como completamente cargados
        
        // Verificar conteo después de cargar equipos
        console.log('🔍 Verificando conteos después de cargar equipos:');
        safeData.forEach(team => {
          const count = this.getTeamMemberCount(team.team_id);
          console.log(`Team ${team.team_name} (ID: ${team.team_id}): ${count} miembros`);
        });
      },
      error: (err) => {
        this.error.set('Error al cargar los equipos');
        this.loading.set(false);
        console.error('Error loading teams:', err);
      }
    });
  }

  loadEmployees() {
    console.log('🔄 Iniciando carga de empleados...');
    // Cargar todos los empleados sin paginación para el conteo correcto
    this.employeeService.getAllEmployees().subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa de empleados:', response);
        const safeData = Array.isArray(response.data) ? response.data : [];
        console.log('📊 Empleados cargados:', safeData.length);
        console.log('🏢 Empleados con team_id:', safeData.filter(emp => emp.team_id).length);
        console.log('📋 Primeros 3 empleados:', safeData.slice(0, 3));
        
        // Verificar estructura de datos
        if (safeData.length > 0) {
          const firstEmployee = safeData[0];
          console.log('🔍 Estructura del primer empleado:', {
            employee_id: firstEmployee.employee_id,
            team_id: firstEmployee.team_id,
            user: firstEmployee.user,
            hasUser: !!firstEmployee.user
          });
        }
        
        this.employees.set(safeData);
        console.log('💾 Empleados guardados en signal:', this.employees().length);
        
        // Cargar equipos después de que los empleados estén listos
        console.log('🔄 Empleados cargados exitosamente, ahora cargando equipos...');
        this.loadTeams();
      },
      error: (err) => {
        console.error('❌ Error loading employees:', err);
      }
    });
  }

  applyFilters() {
    let filtered = this.teams();

    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(team => 
        team.team_name.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.statusFilter() !== 'all') {
      const isActive = this.statusFilter() === 'active';
      filtered = filtered.filter(team => team.status === (isActive ? 'active' : 'inactive'));
    }

    this.filteredTeams.set(filtered);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  onStatusFilterChange(status: string | null) {
    const validStatus = status as 'all' | 'active' | 'inactive';
    this.statusFilter.set(validStatus || 'all');
    this.applyFilters();
  }

  toggleStatus(team: Team) {
    this.teamService.toggleStatus(team.team_id).subscribe({
      next: (response) => {
        const teams = this.teams();
        const index = teams.findIndex(t => t.team_id === team.team_id);
        if (index !== -1) {
          teams[index] = response.data;
          this.teams.set([...teams]);
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error toggling status:', err);
        this.error.set('Error al cambiar el estado del equipo');
      }
    });
  }

  deleteTeam(team: Team) {
    if (confirm(`¿Está seguro de eliminar el equipo "${team.team_name}"?`)) {
      this.teamService.deleteTeam(team.team_id).subscribe({
        next: () => {
          const teams = this.teams().filter(t => t.team_id !== team.team_id);
          this.teams.set(teams);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting team:', err);
          this.error.set('Error al eliminar el equipo');
        }
      });
    }
  }

  getLeaderName(leaderId?: number): string {
    if (!leaderId) return 'Sin líder asignado';
    const leader = this.employees().find(emp => emp.employee_id === leaderId);
    return leader?.user ? `${leader.user.first_name} ${leader.user.last_name}` : 'Líder no encontrado';
  }

  getTeamMemberCount(teamId: number): number {
    // Verificar que los datos estén completamente cargados
    if (!this.dataLoaded()) {
      console.log(`⏳ Datos aún no cargados para team ${teamId}, retornando 0`);
      return 0;
    }

    const employees = this.employees();
    console.log(`🔍 Calculando miembros para team ${teamId} (tipo: ${typeof teamId}):`);
    console.log(`📊 Total empleados disponibles: ${employees.length}`);
    
    const teamMembers = employees.filter(emp => {
      console.log(`🔍 Comparando empleado ${emp.user?.first_name} ${emp.user?.last_name}: team_id=${emp.team_id} (tipo: ${typeof emp.team_id}) vs teamId=${teamId} (tipo: ${typeof teamId})`);
      
      // Usar comparación flexible para manejar diferencias de tipos
      const hasTeamId = emp.team_id == teamId;
      
      if (hasTeamId) {
        console.log(`✅ Empleado ${emp.user?.first_name} ${emp.user?.last_name} pertenece al team ${teamId}`);
      }
      return hasTeamId;
    });
    
    console.log(`👥 Team ${teamId} tiene ${teamMembers.length} miembros:`, teamMembers.map(emp => `${emp.user?.first_name} ${emp.user?.last_name}`));
    return teamMembers.length;
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'text-green-600' : 'text-red-600';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }
}