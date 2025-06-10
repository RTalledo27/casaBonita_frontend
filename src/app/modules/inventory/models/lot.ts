import { LotMedia } from "./lot-media";
import { Manzana } from "./manzana";
import { StreetType } from "./street-type";

export interface Lot {
  lot_id: number,
  manzana_id: number,
  street_type_id: number,
num_lot: string,
  area_m2: number,
  area_construction_m2: number,
  total_price: number,
  funding: boolean,
  BPP: boolean,
  BFH: boolean,
  initial_quota: number,
  currency: string,
  status: 'disponible' | 'reservado' | 'vendido',
  media?: LotMedia[],
  manzana?: Manzana,
  streetType?: StreetType
}

