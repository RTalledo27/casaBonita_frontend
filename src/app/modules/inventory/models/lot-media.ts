import { Lot } from "./lot";

export interface LotMedia {
  media_id: number,
  lot_id: number,
  url: string,
  type: 'foto' | 'plano' | 'video' | 'doc',
  position: number,
  uploaded_at: string,
  //lot?: Lot
  
}
