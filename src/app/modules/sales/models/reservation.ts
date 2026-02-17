export interface Reservation {
  reservation_id: number;
  lot_id: number;
  client_id: number;
  advisor_id: number;
  lot: {
    lot_id: number;
    num_lot: string;
    area_m2: number;
    price: number;
    status: string;
    manzana?: { manzana_id: number; name: string };
  };
  client: {
    client_id: number;
    first_name: string;
    last_name: string;
    doc_number?: string;
    email?: string;
    primary_phone?: string;
  };
  advisor?: {
    employee_id: number;
    first_name: string;
    last_name: string;
  };
  reservation_date: string;
  expiration_date: string;
  deposit_amount: number;
  deposit_method: string | null;
  deposit_reference: string | null;
  deposit_paid_at: string | null;
  status: 'pendiente_pago' | 'completada' | 'cancelada' | 'convertida';
  created_at: string | null;
  updated_at: string | null;
  contract?: any;
}
