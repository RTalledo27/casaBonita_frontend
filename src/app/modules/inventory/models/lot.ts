import { LotMedia } from "./lot-media";
import { Manzana } from "./manzana";
import { StreetType } from "./street-type";

export interface LotFinancialTemplate {
  precio_lista?: number;
  descuento?: number;
  precio_venta?: number;
  precio_contado?: number;
  cuota_inicial?: number;
  ci_fraccionamiento?: number;
  cuota_balon?: number;
  bono_bpp?: number;
  installments_24?: number;
  installments_40?: number;
  installments_44?: number;
  installments_55?: number;
}

export interface LotExternalInfo {
  source?: string;
  frontage?: number | string;
  depth?: number | string;
  dimensions?: any;
  orientation?: string;
  is_corner?: boolean;
  price_per_sqm?: number | string;
  remarks?: string;
  unit?: any;
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
  status: 'disponible' | 'reservado' | 'vendido';
  external_id?: string | null;
  external_code?: string | null;
  external_sync_at?: string | null;
  external?: LotExternalInfo | null;
  financial_template?: LotFinancialTemplate | null;
  manzana?: Manzana;
  street_type?: StreetType;
  media?: LotMedia[];
}

