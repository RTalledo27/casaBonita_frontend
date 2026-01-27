import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnDef, SharedTableComponent } from '../../../shared/components/shared-table/shared-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { ActivityLog } from '../users/models/activity-log';
import { ActivityLogsService } from '../services/activity-logs.service';
import { User } from '../users/models/user';
import { UsersService } from '../services/users.service';
import { SearchSelectComponent } from '../../../shared/components/search-select/search-select.component';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

@Component({
  selector: 'app-security-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SharedTableComponent, PaginationComponent, SearchSelectComponent],
  templateUrl: './audit.component.html',
})
export class AuditComponent {
  columns: ColumnDef[] = [
    { field: 'created_at', header: 'security.audit.columns.created_at', width: '190px', tpl: 'date' },
    { field: 'action', header: 'security.audit.columns.action', width: '220px' },
    { field: 'action_label', header: 'security.audit.columns.action_label' },
    { field: 'user', header: 'security.audit.columns.user', tpl: 'user', width: '200px' },
    { field: 'ip_address', header: 'security.audit.columns.ip', width: '150px' },
    { field: 'details', header: 'security.audit.columns.details' },
  ];

  logsSubject = new BehaviorSubject<ActivityLog[]>([]);
  logs$ = this.logsSubject.asObservable();
  loading = false;

  showAdvanced = false;

  search = '';
  actionPreset = '';
  actionCustom = '';
  userId: number | null = null;
  selectedUser: User | null = null;
  dateFrom = '';
  dateTo = '';

  pagination = {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 15,
  };

  constructor(
    private activityLogsService: ActivityLogsService,
    private usersService: UsersService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.fetch(1);
  }

  fetch(page: number = 1): void {
    this.loading = true;
    this.activityLogsService.list({
      page,
      per_page: this.pagination.perPage,
      search: this.search || undefined,
      action: this.actionValue || undefined,
      user_id: this.userId ?? undefined,
      date_from: this.dateFrom || undefined,
      date_to: this.dateTo || undefined,
      sort_by: 'created_at',
      sort_dir: 'desc',
    }).subscribe({
      next: (res: PaginatedResponse<ActivityLog>) => {
        this.logsSubject.next(res.data);
        this.pagination = {
          currentPage: res.meta?.current_page || page,
          totalPages: res.meta?.last_page || 1,
          total: res.meta?.total || 0,
          perPage: res.meta?.per_page || this.pagination.perPage,
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('common.errorLoad', 'error');
      },
    });
  }

  onPageChange(page: number): void {
    this.fetch(page);
  }

  onApplyFilters(): void {
    this.fetch(1);
  }

  onClearFilters(): void {
    this.search = '';
    this.actionPreset = '';
    this.actionCustom = '';
    this.userId = null;
    this.selectedUser = null;
    this.dateFrom = '';
    this.dateTo = '';
    this.fetch(1);
  }

  get actionValue(): string {
    if (this.actionPreset === '__custom__') {
      return (this.actionCustom ?? '').trim();
    }
    return (this.actionPreset ?? '').trim();
  }

  onActionPresetChange(value: string): void {
    this.actionPreset = value;
    if (value !== '__custom__') {
      this.actionCustom = '';
    }
  }

  searchUsers = (query: string): Observable<User[]> => {
    return this.usersService.list(1, 10, query).pipe(map(res => res.data ?? []));
  };

  userLabel = (u: User) => u?.name || u?.username;
  userSubLabel = (u: User) => (u?.username ? (u.username + ' · ') : '') + (u?.email || '');

  onUserChange(user: User | null): void {
    this.selectedUser = user;
    this.userId = user?.id ?? null;
  }
}
