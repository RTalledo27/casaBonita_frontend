import { LotMedia } from "./lot-media";
import { Manzana } from "./manzana";
import { StreetType } from "./street-type";

export interface Lot {
  lot_id: number;
  manzana_id: number;
  street_type_id: number;
  num_lot: number;
  area_m2: number;
  area_construction_m2?: number;
  total_price: number;
  funding?: number;
  BPP?: number;
  BFH?: number;
  initial_quota?: number;
  currency: string;
  status: 'disponible' | 'reservado' | 'vendido';
  manzana?: Manzana;
  street_type?: StreetType;
  media?: LotMedia[];
}

