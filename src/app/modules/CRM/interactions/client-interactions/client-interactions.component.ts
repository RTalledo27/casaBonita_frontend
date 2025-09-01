import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { ColumnDef, SharedTableComponent } from '../../../../shared/components/shared-table/shared-table.component';
import { CrmInteraction } from '../../models/crm-interaction';
import { InteractionsService } from '../../services/interactions.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, catchError, map, of } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

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


  interactionSubject = new BehaviorSubject<CrmInteraction[]>([]);
  interactions$ = this.interactionSubject.asObservable();


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
    private toast: ToastService,
    private router: Router
  ) {
    this.clientId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit() {
    this.loadInteractions();
  }

  loadInteractions() {
    this.interactionsService
      .list(this.clientId)
      .pipe(
        catchError((error) => {
          this.toast.show('common.errorLoad', 'error');
          console.error('Error loading interactions:', error);
          return of([]);
        })
    ).subscribe((interactions:any) => {
      this.interactionSubject.next(interactions.data);
    });
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
