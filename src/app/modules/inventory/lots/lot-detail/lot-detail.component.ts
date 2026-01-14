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
    return url.split('/').pop() ?? url;
  }

  formatNumber(value: any, digits = 2): string {
    const num = Number(value);
    if (Number.isNaN(num)) return '-';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(num);
  }

  formatMoney(value: any): string {
    const num = Number(value);
    if (Number.isNaN(num)) return '-';
    const currency = this.lot?.currency || 'PEN';
    const formatted = new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
    if (currency === 'USD') return `US$ ${formatted}`;
    if (currency === 'PEN') return `S/ ${formatted}`;
    return `${currency} ${formatted}`;
  }

  yesNo(value: any): string {
    if (value === true) return 'Sí';
    if (value === false) return 'No';
    return '-';
  }

  getAvailableInstallments(): Array<{ months: number; amount: number }> {
    const t = this.lot?.financial_template;
    if (!t) return [];
    const rows: Array<{ months: number; amount: number }> = [];

    const pushIf = (months: number, value: any) => {
      const num = Number(value);
      if (!Number.isNaN(num) && num > 0) rows.push({ months, amount: num });
    };

    pushIf(24, t.installments_24);
    pushIf(40, t.installments_40);
    pushIf(44, t.installments_44);
    pushIf(55, t.installments_55);

    return rows;
  }

  back() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
