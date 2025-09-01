import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { Edit, Eye, LucideAngularModule, Plus, Trash2, Upload } from 'lucide-angular';
import { BehaviorSubject, take } from 'rxjs';
import { Lot } from '../models/lot';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LotService } from '../services/lot.service';
import { InventoryFilterPipe } from '../pipe/inventory-filter.pipe';
import { SharedDeleteComponent } from '../../../shared/components/shared-delete/shared-delete.component';
import { LotImportComponent } from '../components/lot-import/lot-import.component';

@Component({
  selector: 'app-lots',
  imports: [
    SharedTableComponent,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
    FormsModule,
    InventoryFilterPipe,
    SharedDeleteComponent,
    LotImportComponent,
  ],
  templateUrl: './lots.component.html',
  styleUrl: './lots.component.scss',
})
export class LotsComponent {
  private lotsSubject = new BehaviorSubject<Lot[]>([]);
  lots$ = this.lotsSubject.asObservable();

  lots: Lot[] = [];
  filterText = '';
  statusFilter = '';
  manzanaFilter?: number;
  idField = 'lot_id';

  showDeleteModal = false;
  selectedItemId: number | null = null;
  selectedItemName = '';
  
  // Import modal state
  isImportModalOpen = false;

  columns: ColumnDef[] = [
    /*
      "street_type": {
                "street_type_id": 1,
                "name": "Av."
            },
  */
    { value: (r) => r.manzana?.name, header: 'inventory.lots.manzana' },
    { value: (r) => r.street_type?.name, header: 'inventory.lots.streetType' },
    { field: 'num_lot', header: 'inventory.lots.numLot' },
    { field: 'area_m2', header: 'inventory.lots.areaM2', align: 'right' },
    {
      field: 'total_price',
      header: 'inventory.lots.totalPrice',
      align: 'right',
    },
    { field: 'status', header: 'inventory.lots.status.label' },
  ];
  plus = Plus;
  eye = Eye;
  edit = Edit;
  trash = Trash2;
  upload = Upload;

  constructor(
    private lotService: LotService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadLots();
  }

  canEdit() {
    return this.authService.hasPermission('inventory.lots.update');
  }

  loadLots(): void {
    this.lotService.list().subscribe({
      next: (list) => this.lotsSubject.next(list),
      error: () => this.toast.show('Error al cargar clientes', 'error'),
    });
  }

  onCreate() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  onEdit(id: number) {
    this.router.navigate([id, 'edit'], { relativeTo: this.route });
  }

  onView(id: number): void {
    this.router.navigate(['inventory/lots', id]);
  }

  /* onDelete(id: number) {
    if (!confirm('Delete?')) return;
    this.lotService.delete(id).subscribe(() => {
      this.toast.show('common.deleted', 'success');
      this.lotService
        .list()
        .subscribe((list: any) => this.lotsSubject.next(list));
    });
  }*/

  onDelete(id: number) {
    this.onAskDelete(id);
  }

  onAskDelete(id: number) {
    this.lots$.pipe(take(1)).subscribe((lots) => {
      const item = lots.find((l) => l.lot_id === id);
      this.selectedItemId = id;
      this.selectedItemName = item ? `Lote ${item.num_lot}` : 'este registro';
      this.showDeleteModal = true;
    });
  }

  deleteConfirmed() {
    if (this.selectedItemId !== null) {
      this.lotService.delete(this.selectedItemId).subscribe(() => {
        this.toast.show('common.deleted', 'success');
        this.loadLots();
        this.showDeleteModal = false;
      });
    }
  }

  canCreate() {
    return this.authService.hasPermission('inventory.lots.store');
  }

  canImport() {
    return this.authService.hasPermission('inventory.lots.store');
  }

  openImportModal() {
    this.isImportModalOpen = true;
  }

  closeImportModal() {
    this.isImportModalOpen = false;
  }

  onImportCompleted() {
    this.loadLots();
    this.closeImportModal();
    this.toast.show('Lotes importados exitosamente', 'success');
  }
}
