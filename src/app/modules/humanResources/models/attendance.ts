import { Employee } from "./employee";

export interface Attendance {
  attendance_id: number;
  employee_id: number;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  total_hours?: number;
  regular_hours?: number;
  overtime_hours?: number;
  status: 'presente' | 'ausente' | 'tardanza' | 'permiso';
  notes?: string;
  approved_by?: number;
  approved_at?: string;

  // Relaciones
  employee?: Employee;
}
