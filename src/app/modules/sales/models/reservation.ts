export interface Reservation {
  reservation_id: number;
  client_name: string;
  lot_name: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}
