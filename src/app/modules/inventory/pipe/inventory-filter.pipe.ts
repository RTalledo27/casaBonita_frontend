import { Pipe, PipeTransform } from '@angular/core';
import { Lot } from '../models/lot';

@Pipe({
  name: 'inventoryFilter',
})
export class InventoryFilterPipe implements PipeTransform {
  transform(
    lots: Lot[] | null,
    search = '',
    status = '',
    manzanaId?: number
  ): Lot[] {
    if (!lots) return [];
    return lots.filter((lot) => {
      const matchesSearch =
        search === '' ||
        lot.num_lot.toString().includes(search) ||
        lot.manzana?.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === '' || lot.status === status;
      const matchesManzana = manzanaId == null || lot.manzana_id === manzanaId;
      return matchesSearch && matchesStatus && matchesManzana;
    });
  }
}
