import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PusherService } from './pusher.service';
import { API_ROUTES } from '../constants/api.routes';

interface NotificationCountResponse {
  unread: number;
}


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadSubject.asObservable();

  constructor(private http: HttpClient, private pusher: PusherService) { }

  init(): void {
    this.http
      .get<NotificationCountResponse>(API_ROUTES.SECURITY.NOTIFICATIONS)
      .subscribe((res) => this.unreadSubject.next(res.unread));

    this.pusher.subscribeToChannel('notification', ['new']);
    const obs = this.pusher.getEventObservable('notification', 'new');
    if (obs) {
      obs.subscribe(() => this.unreadSubject.next(this.unreadSubject.value + 1));
    }
  }
}