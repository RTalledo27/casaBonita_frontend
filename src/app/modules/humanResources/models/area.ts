export interface Area {
    area_id: number;
    name: string;
    name_normalized?: string;
    code?: string;
    description?: string;
    status: 'active' | 'inactive';
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    employees_count?: number;
}
