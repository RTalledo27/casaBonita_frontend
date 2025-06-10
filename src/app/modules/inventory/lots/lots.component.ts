import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { BehaviorSubject } from 'rxjs';
import { Lot } from '../models/lot';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LotService } from '../services/lot.service';

@Component({
  selector: 'app-lots',
  imports: [
    SharedTableComponent,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
  ],
  templateUrl: './lots.component.html',
  styleUrl: './lots.component.scss',
})
export class LotsComponent {
  private lotsSubject = new BehaviorSubject<Lot[]>([]);
  lots$ = this.lotsSubject.asObservable();

  plus = Plus;
  idField = 'lot_id';

  columns: ColumnDef[] = [
    { field: 'name', header: 'inventory.lots.name' },
    { field: 'status', header: 'inventory.lots.status' },
  ];

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

  loadLots(): void {
    this.lotService.list().subscribe({
      next: (list: any) => this.lotsSubject.next(list),
      error: () => this.toast.show('Error al cargar clientes', 'error'),
    });
  }

  onCreate() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  onEdit(id: number) {
    this.router.navigate([id, 'edit'], { relativeTo: this.route });
  }

  onDelete(id: number) {
    if (!confirm('Delete?')) return;
    this.lotService.delete(id).subscribe(() => {
      this.toast.show('common.deleted', 'success');
      this.lotService
        .list()
        .subscribe((list:any) => this.lotsSubject.next(list));
    });
  }

  canCreate() {
    return this.authService.hasPermission('inventory.lots.store');
  }
}
