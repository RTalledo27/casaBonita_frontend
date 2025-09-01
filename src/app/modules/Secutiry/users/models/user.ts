export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  name: string; // full name, tal como tu recurso lo arma
  email: string;
  status: 'active' | 'blocked';
  roles: string[]; // array de nombres de rol
  permissions?: string[]; // si en algún momento lo necesitas
  dni?: string;
  phone?: string;
  address?: string;
  position?: string;
  department?: string;
  hire_date?: string; // ISO date string
  birth_date?: string; // ISO date string
  photo_url?: string | null; // URL de la foto de perfil
  cv_url?: string | null;
  created_by?: number;
}
