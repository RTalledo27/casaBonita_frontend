import { Component } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Role } from '../users/models/role';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { PermissionsService } from '../services/permissions.service';
import { ToastService } from '../../../core/services/toast.service';
import { Permission } from '../users/models/permission';

@Component({
  selector: 'app-permissions',
  imports: [
    CommonModule,
    LucideAngularModule,
    TranslateModule,
    SharedTableComponent,
  ],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent {
  columns: ColumnDef[] = [
    { field: 'name', header: 'security.permissions.codName',translateContent:false },
    { field: 'name', header: 'security.permissions.name', translateContent:true },
    {
      field: 'created_at',
      header: 'common.created',
      align: 'right',
      width: '160px',
      tpl: 'date', // Nueva plantilla para fechas
    },
  ];

  permissions$: Observable<Permission[]> = of([]);

  constructor(
    private permissionService: PermissionsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.

    this.getPermissions();
  }

  getPermissions() {
    this.permissions$ = this.permissionService.list().pipe(
      catchError(() => {
        this.toast.show('common.errorLoad', 'error');
        return of([]);
      })
    );
  }
}
