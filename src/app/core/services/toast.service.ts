import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';


export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
  
  
  
export class ToastService {

  constructor() { }

  private toasts: Toast[] = [];
  private changes = new BehaviorSubject<Toast[]>([]);
  // Cambié de Subject a BehaviorSubject para que emita el último valor al subscribirse
get toasts$(): Observable<Toast[]> {
  return this.changes.asObservable();
}


  show(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = Date.now();
    const toast: Toast = { id, message, type };
    this.toasts.push(toast);
    this.changes.next(this.toasts);

    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3000) {
    this.show(message, 'info', duration);
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.changes.next(this.toasts);
  }
}
