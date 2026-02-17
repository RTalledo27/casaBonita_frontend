export interface Office {
    office_id: number;
    name: string;
    name_normalized?: string;
    code?: string;
    address?: string;
    city?: string;
    monthly_goal?: number;
    status: 'active' | 'inactive';
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    employees_count?: number;
    teams?: any[];
    teams_count?: number;
}
