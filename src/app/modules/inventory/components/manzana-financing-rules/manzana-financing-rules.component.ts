import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../../core/services/toast.service';
import { Manzana } from '../../models/manzana';
import {
  FinancingType,
  ManzanaFinancingRule,
  ManzanaFinancingRulesService,
} from '../../services/manzana-financing-rules.service';
import { ManzanasService } from '../../services/manzanas.service';
import { lastValueFrom } from 'rxjs';

type Row = {
  manzana_id: number;
  manzana_name: string;
  ruleId?: number;
  financing_type?: FinancingType;
  max_installments?: number | null;
  min_down_payment_percentage?: number | null;
  allows_balloon_payment: boolean;
  allows_bpp_bonus: boolean;
  saving: boolean;
};

@Component({
  selector: 'app-manzana-financing-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './manzana-financing-rules.component.html',
  styleUrl: './manzana-financing-rules.component.scss',
})
export class ManzanaFinancingRulesComponent implements OnInit {
  rows: Row[] = [];
  loading = false;
  importing = false;
  createMissingManzanas = false;
  selectedFile?: File;

  financingTypeOptions: Array<{ value: FinancingType; label: string }> = [
    { value: 'cash_only', label: 'Contado' },
    { value: 'installments', label: 'Cuotas' },
    { value: 'mixed', label: 'Mixto' },
  ];

  installmentOptions = [24, 40, 44, 55];

  constructor(
    private manzanasService: ManzanasService,
    private rulesService: ManzanaFinancingRulesService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;

    Promise.all([
      lastValueFrom(this.manzanasService.list()),
      lastValueFrom(this.rulesService.list()),
    ])
      .then(([manzanas, rules]) => {
        const rulesByManzana = new Map<number, ManzanaFinancingRule>();
        (rules || []).forEach((r) => rulesByManzana.set(r.manzana_id, r));

        const safeManzanas: Manzana[] = manzanas || [];
        this.rows = safeManzanas
          .slice()
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          .map((m) => {
            const rule = rulesByManzana.get(m.manzana_id);
            return {
              manzana_id: m.manzana_id,
              manzana_name: m.name,
              ruleId: rule?.id,
              financing_type: rule?.financing_type,
              max_installments: rule?.max_installments ?? null,
              min_down_payment_percentage: rule?.min_down_payment_percentage ?? null,
              allows_balloon_payment: rule?.allows_balloon_payment ?? false,
              allows_bpp_bonus: rule?.allows_bpp_bonus ?? false,
              saving: false,
            };
          });
      })
      .catch((err) => {
        this.toast.error('Error cargando reglas de manzana');
        console.error(err);
      })
      .finally(() => {
        this.loading = false;
      });
  }

  onTypeChange(row: Row): void {
    if (row.financing_type === 'cash_only') {
      row.max_installments = null;
    }
  }

  canSave(row: Row): boolean {
    if (!row.financing_type) return false;
    if (row.financing_type === 'cash_only') return true;
    return !!row.max_installments;
  }

  save(row: Row): void {
    if (!this.canSave(row) || row.saving) return;
    row.saving = true;

    this.rulesService
      .upsert({
        manzana_id: row.manzana_id,
        financing_type: row.financing_type!,
        max_installments: row.financing_type === 'cash_only' ? null : row.max_installments ?? null,
        min_down_payment_percentage: row.min_down_payment_percentage ?? null,
        allows_balloon_payment: row.allows_balloon_payment,
        allows_bpp_bonus: row.allows_bpp_bonus,
      })
      .subscribe({
        next: (saved) => {
          row.ruleId = saved.id;
          row.financing_type = saved.financing_type;
          row.max_installments = saved.max_installments ?? null;
          row.min_down_payment_percentage = saved.min_down_payment_percentage ?? null;
          row.allows_balloon_payment = saved.allows_balloon_payment;
          row.allows_bpp_bonus = saved.allows_bpp_bonus;
          this.toast.success('Regla guardada');
        },
        error: (e) => {
          this.toast.error(e?.error?.message || 'Error al guardar regla');
        },
        complete: () => {
          row.saving = false;
        },
      });
  }

  remove(row: Row): void {
    if (!row.ruleId || row.saving) return;
    row.saving = true;

    this.rulesService.delete(row.ruleId).subscribe({
      next: () => {
        row.ruleId = undefined;
        row.financing_type = undefined;
        row.max_installments = null;
        row.min_down_payment_percentage = null;
        row.allows_balloon_payment = false;
        row.allows_bpp_bonus = false;
        this.toast.success('Regla eliminada');
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Error al eliminar regla');
      },
      complete: () => {
        row.saving = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile = file || undefined;
  }

  downloadTemplate(): void {
    window.open(this.rulesService.downloadTemplateUrl(), '_blank');
  }

  importExcel(): void {
    if (!this.selectedFile || this.importing) return;
    this.importing = true;

    this.rulesService.importExcel(this.selectedFile, this.createMissingManzanas).subscribe({
      next: (res) => {
        const stats = res?.data?.stats;
        if (stats) {
          this.toast.success(`Import OK: ${stats.created} creadas, ${stats.updated} actualizadas, ${stats.errors} errores`);
        } else {
          this.toast.success('Importación completada');
        }
        this.load();
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Error al importar');
      },
      complete: () => {
        this.importing = false;
      },
    });
  }
}
