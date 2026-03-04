import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-followup-commitment',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    @if (visible) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" (click)="cancel.emit()"></div>
      <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,28rem)] bg-white dark:bg-gray-900 z-50 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-6 py-4 bg-amber-600 dark:bg-amber-700 text-white flex items-center justify-between">
          <h3 class="text-lg font-semibold">{{ 'collections.followups.commitment.title' | translate }}</h3>
          <button type="button" class="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30" (click)="cancel.emit()">
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form (ngSubmit)="submit()" class="p-6 space-y-4">
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{{ 'collections.followups.commitment.date' | translate }}</label>
            <input type="date" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 font-semibold" [(ngModel)]="date" name="date" required />
          </div>
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{{ 'collections.followups.commitment.amount' | translate }}</label>
            <input type="number" step="0.01" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 dark:text-gray-100 font-semibold" [(ngModel)]="amount" name="amount" required />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" (click)="cancel.emit()" class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">{{ 'common.cancel' | translate }}</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold">{{ 'common.save' | translate }}</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: []
})
export class FollowupCommitmentComponent {
  @Input() visible = false;
  @Output() save = new EventEmitter<{commitment_date: string, commitment_amount: number}>();
  @Output() cancel = new EventEmitter<void>();

  date = '';
  amount = 0;

  submit() {
    if (!this.date || !this.amount) return;
    this.save.emit({ commitment_date: this.date, commitment_amount: this.amount });
  }
}
