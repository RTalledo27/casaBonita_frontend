import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { ColumnDef, SharedTableComponent } from '../../../../shared/components/shared-table/shared-table.component';
import { CrmInteraction } from '../../models/crm-interaction';
import { InteractionsService } from '../../services/interactions.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';

@Component({
  selector: 'app-client-interactions',
  imports: [
    CommonModule,
    RouterOutlet,
    TranslateModule,
    LucideAngularModule,
    SharedTableComponent,
  ],
  templateUrl: './client-interactions.component.html',
  styleUrl: './client-interactions.component.scss',
})
export class ClientInteractionsComponent {
  interactions: CrmInteraction[] = [];
  columns: ColumnDef[] = [
    { field: 'date', header: 'common.date' },
    { field: 'channel', header: 'Channel' },
    { field: 'notes', header: 'Notes' },
  ];
  isModalOpen = false;
  plus = Plus;
  clientId: number;

  constructor(
    private route: ActivatedRoute,
    private interactionsService: InteractionsService,
    private router: Router
  ) {
    this.clientId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit() {
    this.loadInteractions();
  }

  loadInteractions() {
    this.interactionsService
      .list(this.clientId).pipe(
        map((res:any) => res.data)) // Asegúrate que lo que se emite sea un array
  }

  onCreate() {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: 'create' } }], {
      relativeTo: this.route,
    });
  }

  onModalActivate() {
    this.loadInteractions();
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
