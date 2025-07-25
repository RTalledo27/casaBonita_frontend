import { User } from "../../Secutiry/users/models/user"
import { Attendance } from "./attendance";
import { Bonus } from "./bonus";
import { Commission } from "./commission";
import { EmployeeStatistics } from "./employee-statistics"
import { Payroll } from "./payroll";
import { Team } from "./team"

export interface Employee {
  employee_id: number;
  user_id: number;
  employee_code: string;
  employee_type:
    | 'asesor_inmobiliario'
    | 'vendedor'
    | 'administrativo'
    | 'gerente'
    | 'supervisor';
  base_salary: number;
  variable_salary?: number;
  commission_percentage?: number;
  individual_goal?: number;
  is_commission_eligible: boolean;
  is_bonus_eligible: boolean;
  bank_account?: string;
  bank_name?: string;
  bank_cci?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  team_id?: number;
  supervisor_id?: number;
  
  hire_date: string;
  termination_date?: string;
  employment_status: 'activo' | 'inactivo' | 'suspendido';
  contract_type: 'indefinido' | 'temporal' | 'practicas' | 'freelance';
  work_schedule?: string;
  social_security_number?: string;
  afp_code?: string;
  cuspp?: string;
  health_insurance?: string;
  notes?: string;
  status:string;

  // Propiedades que vienen directamente de la API
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;

  // Relaciones
  user?: User;
  team?: Team;
  supervisor?: Employee;
  subordinates?: Employee[];
  commissions?: Commission[];
  bonuses?: Bonus[];
  attendances?: Attendance[];
  payrolls?: Payroll[];



  // Campos calculados
  employee_type_label?: string;
  status_label?: string;
  statistics?: EmployeeStatistics;
}
