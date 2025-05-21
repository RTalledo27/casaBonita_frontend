import { Component } from '@angular/core';
import { Toast, ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent {
  toasts: Toast[] = [];
  constructor(private ts: ToastService) {}
  ngOnInit() {
    this.ts.toasts$.subscribe(list => this.toasts = list);
  }
  dismiss(id: number) { this.ts.dismiss(id); }
}
