import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LotService } from '../../services/lot.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Lot } from '../../models/lot';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-lot-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './lot-detail.component.html',
  styleUrl: './lot-detail.component.scss',
})
export class LotDetailComponent {
  lot?: Lot;

  backendBaseUrl = environment.BACKEND_BASE_URL;

  constructor(
    private lotService: LotService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.lotService.get(id).subscribe((l) => (this.lot = l));
  }

  getFileName(url: string): string {
    console.log(url);
    return url.split('/').pop() ?? url;
  }

  getLotValue(key: string): any {
    if (!this.lot) return '';
    switch (key) {
      case 'funding':
        return this.lot.funding;
      case 'BPP':
        return this.lot.BPP;
      case 'BFH':
        return this.lot.BFH;
      default:
        return '';
    }
  }

  formatCurrency(value: number | string | undefined | null): string {
    if (value === undefined || value === null) return '-';
    const num = Number(value);
    if (isNaN(num)) return '-';
    return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  get template() {
    return this.lot?.financial_template;
  }

  get precioTotalReal(): number {
    return Number(this.template?.precio_total_real) || 0;
  }

  get fivePercent(): number {
    return this.precioTotalReal > 0 ? Math.round(this.precioTotalReal * 0.05 * 100) / 100 : 0;
  }

  getInstallmentOptions(): { months: number; amount: number }[] {
    const t = this.template;
    if (!t) return [];
    const options: { months: number; amount: number }[] = [];
    if (Number(t.installments_24) > 0) options.push({ months: 24, amount: Number(t.installments_24) });
    if (Number(t.installments_40) > 0) options.push({ months: 40, amount: Number(t.installments_40) });
    if (Number(t.installments_44) > 0) options.push({ months: 44, amount: Number(t.installments_44) });
    if (Number(t.installments_55) > 0) options.push({ months: 55, amount: Number(t.installments_55) });
    return options;
  }

  back() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
