import { Component, OnInit } from '@angular/core';
import { Toast, ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { CheckCircle, Info, LucideAngularModule, X, XCircle } from 'lucide-angular';


@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        animate(
          '300ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(-20px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1 }),
          ])
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          keyframes([
            style({ opacity: 1, transform: 'translateY(0)', offset: 0 }),
            style({ opacity: 0, transform: 'translateY(-20px)', offset: 1 }),
          ])
        ),
      ]),
    ]),
  ],
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];

  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Info = Info;
  X = X;

  constructor(private ts: ToastService) {}
  ngOnInit() {
    this.ts.toasts$.subscribe((list) => (this.toasts = list));
  }
  dismiss(id: number) {
    this.ts.dismiss(id);
  }
}