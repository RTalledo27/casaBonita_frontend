import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-followup-commitment',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ 'collections.followups.commitment.title' | translate }}</h3>
        </div>
        <form (ngSubmit)="submit()" class="p-6 space-y-4">
          <div>
            <label class="label">{{ 'collections.followups.commitment.date' | translate }}</label>
            <input type="date" class="input" [(ngModel)]="date" name="date" required />
          </div>
          <div>
            <label class="label">{{ 'collections.followups.commitment.amount' | translate }}</label>
            <input type="number" step="0.01" class="input" [(ngModel)]="amount" name="amount" required />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" (click)="cancel.emit()" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{{ 'common.cancel' | translate }}</button>
            <button type="submit" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">{{ 'common.save' | translate }}</button>
          </div>
        </form>
      </div>
    </div>
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
