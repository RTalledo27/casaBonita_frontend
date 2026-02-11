export interface Office {
    office_id: number;
    name: string;
    name_normalized?: string;
    code?: string;
    address?: string;
    city?: string;
    status: 'active' | 'inactive';
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    employees_count?: number;
}
