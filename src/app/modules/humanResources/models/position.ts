export interface Position {
    position_id: number;
    name: string;
    name_normalized?: string;
    category: 'ventas' | 'admin' | 'tech' | 'gerencia' | 'operaciones';
    is_commission_eligible: boolean;
    is_bonus_eligible: boolean;
    is_active: boolean;
    status: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
    employees_count?: number;
}
