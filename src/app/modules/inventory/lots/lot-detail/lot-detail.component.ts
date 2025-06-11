import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LotService } from '../../services/lot.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Lot } from '../../models/lot';

@Component({
  selector: 'app-lot-detail',
  imports: [CommonModule, TranslateModule],
  templateUrl: './lot-detail.component.html',
  styleUrl: './lot-detail.component.scss',
})
export class LotDetailComponent {
  lot?: Lot;
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

  back() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
