import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Database, Edit, Eye, LucideAngularModule, Trash2 } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { SharedDeleteComponent } from "../shared-delete/shared-delete.component";



export interface ColumnDef {
  field?: string; // clave del dato
  value?: (row: any) => any;
  header: string; // texto o i18n key
  width?: string;
  align?: 'left' | 'center' | 'right';
  tpl?: string; // id de plantilla de celda custom
  translate?: boolean;
  translateContent?: boolean; // Nueva propiedad para contenido
}


@Component({
  selector: 'app-shared-table',
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    TranslateModule,
    LucideAngularModule,
  ],
  templateUrl: './shared-table.component.html',
  styleUrl: './shared-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedTableComponent {
  @Input({ required: true }) columns: ColumnDef[] = [];
  @Input({ required: true }) set data(value: any[]) {
    this._data = value;
    this.cdr.markForCheck();
  }
  get data(): any[] {
    return this._data;
  }
  private _data: any[] = [];
  @Input() loading: boolean = false;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef, private router: Router) {}

  //ICONOS LUCIDE:
  eye = Eye;
  trash = Trash2;
  edit = Edit;
  database = Database;
  /** Rutas con :id como placeholder (opcional).  Ej.: '../:id' */
  @Input() viewRoute = '';
  @Input() editRoute = '';
  showDeleteModal = false;

  /** Emite el id del registro a eliminar */
  @Output() delete = new EventEmitter<number>();

  @Output() onEdit = new EventEmitter<number>();

  @Output() onViewDetails = new EventEmitter<number>();

  /** Plantillas de celdas personalizadas */
  @Input() templates: Record<string, TemplateRef<any>> = {};

  @Input() componentName: string = '';

  @Input() permissionPrefix = 'security';
  @Input() showActions: boolean = true;
  /** Field that contains the id for each row */
  @Input() idField?: string;

  //----------------------------------

  getId(row: any): number {
    if (this.idField) {
      return row[this.idField];
    }
    return row.id ?? row.role_id;
  }

  /** Devuelve el value de la celda (evita error de TS en template) */
  cell(row: any, col: ColumnDef) {
    return col.value ? col.value(row) : row[col.field!];
  }

  track = (_: number, row: any) => this.getId(row);

  //emitir onEdit:
  onEditClick(id: number): void {
    console.log(id);
    this.onEdit.emit(id); // Emite el ID al padre
  }

  onViewClick(id: number) {
    console.log('onViewClick called with id:', id);
    if (this.viewRoute) {
      this.router.navigate([this.viewRoute, id]);
    } else {
      this.onViewDetails.emit(id);
    }
  }

  onDelete(id: number) {
    this.delete.emit(id);
  }

  canEdit() {
    return this.authService.hasPermission(
      `${this.permissionPrefix}.${this.componentName}.update`
    );
  }

  canViewDetails() {
    const hasPermission = this.authService.hasPermission(
      `${this.permissionPrefix}.${this.componentName}.view`
    );
    console.log('canViewDetails() called:', {
      permissionPrefix: this.permissionPrefix,
      componentName: this.componentName,
      fullPermission: `${this.permissionPrefix}.${this.componentName}.view`,
      hasPermission: hasPermission
    });
    return hasPermission;
  }

  canDelete(): boolean {
    const base = `${this.permissionPrefix}.${this.componentName}`;
    return (
      this.authService.hasPermission(`${base}.destroy`) ||
      this.authService.hasPermission(`${base}.delete`)
    );
  }
}
