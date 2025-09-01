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
  private events: {
    [entity: string]: { [event: string]: ReplaySubject<any> };
  } = {};

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

    this.pusher.connection.bind('connected', () => {
      console.log(
        '[PusherService] Conectado con ID:',
        this.pusher.connection.socket_id
      );
    });

    // Reintenta conexión si se pierde
    this.pusher.connection.bind('disconnected', () => {
      console.warn('[PUSHER] Socket desconectado, reconectando...');
      this.pusher.connect();
    });
  }

  private initChannel(entity: string, events: string[]): void {
    const channelName = `${entity}-channel`;
    console.log(`[PusherService] Intentando inicializar canal: ${channelName}`);

    // Nos aseguramos de suscribirnos solo una vez
    const channel = this.channels.has(channelName)
      ? this.channels.get(channelName)!
      : this.pusher.subscribe(channelName);

    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, channel);
    }

    // Crear eventos por entidad
    if (!this.events[entity]) this.events[entity] = {};
    console.log(`[PusherService] Canal ${channelName} suscrito`);

    events.forEach((event) => {
      console.log(
        `[PusherService] Bind evento "${event}" para entidad "${entity}"`
      );

      this.events[entity][event] = new ReplaySubject<any>(1);

      channel.bind(event, (data: any) => {
        console.log(`[PusherService][RECEIVED] ${entity}-${event}`, data);
        this.events[entity][event].next(data);
      });
    });
  }

  subscribeToChannel(entity: string, events: string[]): void {
    console.log(
      `[PusherService] subscribeToChannel → entity: ${entity}, events: ${events}`
    );
    this.initChannel(entity, events);
  }

  resubscribe(entity: string, events: string[]): void {
    const channelName = `${entity}-channel`;
    console.log(`[PusherService] resubscribe → ${channelName}`);

    if (this.channels.has(channelName)) {
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);
      console.log(`[PusherService] Canal ${channelName} eliminado`);
    }

    if (this.events[entity]) {
      events.forEach((event) => {
        delete this.events[entity][event];
        console.log(`[PusherService] ReplaySubject ${event} eliminado`);
      });
    }

    this.initChannel(entity, events);
  }

  getEventObservable(entity: string, event: string): ReplaySubject<any> {
    console.log(`[PusherService] getEventObservable → entity: ${entity}, event: ${event}`);
    return this.events[entity]?.[event];
  }

  disconnect(): void {
    console.log('[PusherService] Desconectando Pusher...');
    this.pusher.disconnect();
    this.channels.clear();
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
