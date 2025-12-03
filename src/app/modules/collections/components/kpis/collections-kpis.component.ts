import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { API_ROUTES } from '../../../../core/constants/api.routes';

@Component({
  selector: 'app-collections-kpis',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="rounded-xl p-4 bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700">
        <div class="text-slate-500">Total seguimientos</div>
        <div class="text-3xl font-bold">{{ kpis.total_followups || 0 }}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700">
        <div class="text-slate-500">En mora</div>
        <div class="text-3xl font-bold">{{ kpis.overdue_followups || 0 }}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700">
        <div class="text-slate-500">En progreso</div>
        <div class="text-3xl font-bold">{{ kpis.in_progress_followups || 0 }}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700">
        <div class="text-slate-500">Gestiones registradas</div>
        <div class="text-3xl font-bold">{{ kpis.total_logs || 0 }}</div>
      </div>
    </div>
  `,
})
export class CollectionsKpisComponent {
  kpis: any = {};
  constructor(private http: HttpClient) {}
  ngOnInit(){
    this.http.get<any>(`${API_ROUTES.COLLECTIONS.BASE}/kpis`).subscribe(res => this.kpis = res?.data || {});
  }
}
