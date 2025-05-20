export interface User {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'blocked';
    roles: string[];
}
