import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LotService } from '../../services/lot.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Lot } from '../../models/lot';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-lot-detail',
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

  back() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
