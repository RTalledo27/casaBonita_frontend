import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Edit, Users, Crown, Mail, Phone, Calendar, TrendingUp, Award, Building2, Target, UserCheck, Briefcase, Hash, ChevronRight } from 'lucide-angular';
import { TeamService } from '../../services/team.service';
import { EmployeeService } from '../../services/employee.service';
import { Team } from '../../models/team';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss'
})
export class TeamDetailComponent implements OnInit {
  private teamService = inject(TeamService);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Edit = Edit;
  readonly Users = Users;
  readonly Crown = Crown;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Calendar = Calendar;
  readonly TrendingUp = TrendingUp;
  readonly Award = Award;
  readonly Building2 = Building2;
  readonly Target = Target;
  readonly UserCheck = UserCheck;
  readonly Briefcase = Briefcase;
  readonly Hash = Hash;
  readonly ChevronRight = ChevronRight;

  // Signals
  team = signal<Team | null>(null);
  teamMembers = signal<Employee[]>([]);
  leader = signal<Employee | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    const teamId = this.route.snapshot.paramMap.get('id');
    if (teamId) {
      this.loadTeamDetails(+teamId);
    }
  }

  loadTeamDetails(teamId: number) {
    this.loading.set(true);
    this.error.set(null);

    // Load team info
    this.teamService.getTeam(teamId).subscribe({
      next: (response) => {
        console.log('🔍 Respuesta de la API:', response);
        this.team.set(response.data);
        
        // Usar los empleados que vienen directamente de la API
        if (response.data.employees) {
          console.log('👥 Empleados del equipo:', response.data.employees);
          this.teamMembers.set(response.data.employees);
        }
        
        // Cargar líder si existe
        if (response.data.team_leader_id) {
          this.loadLeader(response.data.team_leader_id);
        } else if (response.data.leader) {
          this.leader.set(response.data.leader);
        }
        
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar la información del equipo');
        this.loading.set(false);
        console.error('Error loading team:', err);
      }
    });
  }

  loadLeader(leaderId: number) {
    this.employeeService.getEmployee(leaderId).subscribe({
      next: (employee) => {
        this.leader.set(employee);
      },
      error: (err) => {
        console.error('Error loading team leader:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/hr/teams']);
  }

  editTeam() {
    if (this.team()) {
      this.router.navigate(['/hr/teams/edit', this.team()!.team_id]);
    }
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }

  getEmployeeTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'asesor_inmobiliario': 'Asesor Inmobiliario',
      'vendedor': 'Vendedor',
      'administrativo': 'Administrativo',
      'gerente': 'Gerente',
      'supervisor': 'Supervisor'
    };
    return labels[type] || type;
  }

  getEmployeeStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'activo': 'text-green-600',
      'active': 'text-green-600',
      'inactivo': 'text-red-600',
      'inactive': 'text-red-600',
      'suspendido': 'text-yellow-600',
      'suspended': 'text-yellow-600'
    };
    return classes[status] || 'text-gray-600';
  }

  getEmployeeStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'activo': 'Activo',
      'active': 'Activo',
      'inactivo': 'Inactivo',
      'inactive': 'Inactivo',
      'suspendido': 'Suspendido',
      'suspended': 'Suspendido'
    };
    return labels[status] || status;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTeamStats() {
    const members = this.teamMembers();
    console.log('📊 Calculando estadísticas para miembros:', members);
    
    // Usar 'active' en lugar de 'activo' según la respuesta de la API
    const activeMembers = members.filter(m => m.status === 'activo' || m.status === 'active').length;
    const advisors = members.filter(m => m.employee_type === 'asesor_inmobiliario').length;
    const sellers = members.filter(m => m.employee_type === 'vendedor').length;
    
    const stats = {
      total: members.length,
      active: activeMembers,
      advisors,
      sellers,
      others: members.length - advisors - sellers
    };
    
    console.log('📈 Estadísticas calculadas:', stats);
    return stats;
  }
}