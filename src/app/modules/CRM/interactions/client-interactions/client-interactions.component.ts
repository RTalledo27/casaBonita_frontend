import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { CrmInteraction } from '../../models/crm-interaction';
import { InteractionsService } from '../../services/interactions.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-client-interactions',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './client-interactions.component.html',
  styleUrl: './client-interactions.component.scss',
})
export class ClientInteractionsComponent {
  allInteractions: CrmInteraction[] = [];
  filteredInteractions: CrmInteraction[] = [];
  searchTerm = '';
  filterChannel = '';
  isModalOpen = false;
  clientId: number;

  readonly availableChannels = ['call', 'email', 'whatsapp', 'visit', 'other'];

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
      )
      .subscribe((interactions: any) => {
        this.allInteractions = interactions.data || interactions;
        this.applyFilter();
      });
  }

  applyFilter() {
    let result = [...this.allInteractions];
    if (this.filterChannel) {
      result = result.filter((i) => i.channel === this.filterChannel);
    }
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(
        (i) =>
          i.notes?.toLowerCase().includes(term) ||
          i.channel?.toLowerCase().includes(term) ||
          i.date?.toLowerCase().includes(term) ||
          i.user?.name?.toLowerCase().includes(term)
      );
    }
    this.filteredInteractions = result;
  }

  countByChannel(channel: string): number {
    return this.allInteractions.filter((i) => i.channel === channel).length;
  }

  get uniqueChannels(): number {
    return new Set(this.allInteractions.map((i) => i.channel).filter(Boolean)).size;
  }

  getChannelLabel(channel: string): string {
    const labels: Record<string, string> = {
      call: 'Llamada',
      email: 'Email',
      whatsapp: 'WhatsApp',
      visit: 'Visita',
      other: 'Otro',
    };
    return labels[channel] || channel;
  }

  getChannelClasses(channel: string): string {
    const map: Record<string, string> = {
      call: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
      email: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
      whatsapp: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
      visit: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
      other: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
    };
    return map[channel] || map['other'];
  }

  getChannelDot(channel: string): string {
    const map: Record<string, string> = {
      call: 'bg-blue-500',
      email: 'bg-amber-500',
      whatsapp: 'bg-emerald-500',
      visit: 'bg-violet-500',
      other: 'bg-gray-500',
    };
    return map[channel] || 'bg-gray-500';
  }

  trackInteraction(_: number, ix: CrmInteraction): number {
    return ix.interaction_id;
  }

  onCreate() {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: 'create' } }], {
      relativeTo: this.route,
    });
  }

  onEdit(ix: CrmInteraction) {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: ['edit', ix.interaction_id] } }], {
      relativeTo: this.route,
    });
  }

  onDelete(ix: CrmInteraction) {
    if (!confirm(`¿Eliminar interacción del ${ix.date}?`)) return;
    this.interactionsService.delete(ix.interaction_id).subscribe(() => this.loadInteractions());
  }

  onModalActivate() {
    this.loadInteractions();
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  onModalBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.isModalOpen = false;
      this.router.navigate([{ outlets: { modal: null } }], {
        relativeTo: this.route,
      });
    }
  }
}
