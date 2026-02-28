import { LotMedia } from "./lot-media";
import { Manzana } from "./manzana";
import { StreetType } from "./street-type";

export interface LotFinancialTemplate {
  id: number;
  lot_id: number;
  precio_lista: number;
  descuento: number;
  precio_venta: number;
  precio_contado: number;
  cuota_balon: number;
  bono_bpp: number;
  bono_techo_propio: number;
  precio_total_real: number;
  cuota_inicial: number;
  ci_fraccionamiento: number;
  installments_24: number;
  installments_40: number;
  installments_44: number;
  installments_55: number;
}

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
  status: 'disponible' | 'reservado' | 'vendido' | 'bloqueado';
  external_id?: string;
  external_code?: string;
  manzana?: Manzana;
  street_type?: StreetType;
  media?: LotMedia[];
  financial_template?: LotFinancialTemplate;
}

