import { Injectable } from '@angular/core';
import Pusher, { Channel } from 'pusher-js';
import { environment } from '../../../environments/environment';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PusherService {
  private pusher: Pusher;
  private channels: Map<string, Channel> = new Map();
  // Add subjects for role events
  public roleCreated$ = new ReplaySubject<any>(1);
  public roleUpdated$ = new ReplaySubject<any>(1);
  public roleDeleted$ = new ReplaySubject<any>(1);
  constructor() {
    this.pusher = new Pusher(environment.pusher.key, {
      cluster: environment.pusher.cluster,
      forceTLS: true,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    });

    this.initChannel('role-channel');

    // 🔌 Detecta desconexión y reconecta
    this.pusher.connection.bind('disconnected', () => {
      console.warn('[Pusher] desconectado. Reconectando...');
      this.pusher.connect();
    });
  }

  private initChannel(channelName: string): Channel {
    if (!this.channels.has(channelName)) {
      const channel = this.pusher.subscribe(channelName);
      this.channels.set(channelName, channel);

      // Bind events to subjects
      // Bind events
      channel.bind('role-created', (data: any) => this.roleCreated$.next(data));
      channel.bind('role-updated', (data: any) => this.roleUpdated$.next(data));
      channel.bind('role-deleted', (data: any) => this.roleDeleted$.next(data));
    
    }
    return this.channels.get(channelName)!;
  }

  resubscribe(channelName: string): void {
    if (this.channels.has(channelName)) {
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);
    }

    this.initChannel(channelName);
  }

  /* unsubscribe(channelName: string): void {
    if (this.channels.has(channelName)) {
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);
    }
  }

  disconnect() {
    this.pusher.disconnect();
    this.channels.clear();
  }*/
}
