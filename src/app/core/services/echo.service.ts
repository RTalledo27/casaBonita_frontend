import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { environment } from '../../../environments/environment';

// Make Pusher available globally for Echo
(window as any).Pusher = Pusher;

export interface RealtimeNotification {
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    is_read: boolean;
    related_module: string;
    related_id: number;
    related_url: string;
    icon: string;
    time_ago: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class EchoService implements OnDestroy {
    private echo: any = null; // Using 'any' to avoid Echo generic type issues
    private authService = inject(AuthService);
    private isConnectedSubject = new BehaviorSubject<boolean>(false);
    private notificationSubject = new Subject<RealtimeNotification>();
    private ticketUpdateSubject = new Subject<any>();

    isConnected$ = this.isConnectedSubject.asObservable();
    notification$ = this.notificationSubject.asObservable();
    ticketUpdate$ = this.ticketUpdateSubject.asObservable();

    constructor() {
        // Subscribe to auth changes to connect/disconnect
        this.authService.user$.subscribe(user => {
            if (user && (environment as any).reverb?.enabled) {
                this.connect();
            } else {
                this.disconnect();
            }
        });
    }

    /**
     * Connect to Laravel Reverb WebSocket server
     */
    connect(): void {
        if (this.echo) {
            console.log('🔌 Echo: Already connected');
            return;
        }

        const reverb = (environment as any).reverb;

        // Check if Reverb is enabled
        if (!reverb?.enabled) {
            console.log('🔌 Echo: Reverb is disabled in environment');
            return;
        }

        const token = this.authService.getToken();
        if (!token) {
            console.warn('🔌 Echo: No auth token available');
            return;
        }

        console.log('🔌 Echo: Connecting to Reverb...', {
            host: reverb.wsHost,
            port: reverb.wsPort
        });

        try {
            this.echo = new Echo({
                broadcaster: 'reverb',
                key: reverb.key,
                wsHost: reverb.wsHost,
                wsPort: reverb.wsPort,
                wssPort: reverb.wssPort,
                forceTLS: reverb.forceTLS,
                enabledTransports: ['ws', 'wss'],
                authEndpoint: `${(environment as any).BACKEND_BASE_URL}/broadcasting/auth`,
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    }
                }
            });

            this.isConnectedSubject.next(true);
            console.log('✅ Echo: Connected successfully');

            // Subscribe to user's notification channel
            this.subscribeToNotifications();

            // Subscribe to service desk updates
            this.subscribeToServiceDesk();

        } catch (error) {
            console.error('❌ Echo: Connection failed', error);
            this.isConnectedSubject.next(false);
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        if (this.echo) {
            console.log('🔌 Echo: Disconnecting...');
            this.echo.disconnect();
            this.echo = null;
            this.isConnectedSubject.next(false);
        }
    }

    /**
     * Subscribe to user's notification channel
     */
    private subscribeToNotifications(): void {
        const user = this.authService.getCurrentUser();
        if (!user || !this.echo) return;

        const channelName = `notifications.${user.id}`;
        console.log(`📡 Echo: Subscribing to ${channelName}`);

        this.echo.channel(channelName)
            .listen('.notification.created', (data: RealtimeNotification) => {
                console.log('🔔 Notification received:', data);
                this.notificationSubject.next(data);
            });
    }

    /**
     * Subscribe to service desk updates channel
     */
    private subscribeToServiceDesk(): void {
        const user = this.authService.getCurrentUser();
        if (!user || !this.echo) return;

        // Subscribe to user-specific channel
        const userChannel = `servicedesk.${user.id}`;
        console.log(`📡 Echo: Subscribing to ${userChannel}`);
        this.subscribeToTicketEvents(userChannel);

        // Subscribe to global updates channel (for admins to see all updates)
        const globalChannel = 'servicedesk.updates';
        console.log(`📡 Echo: Subscribing to ${globalChannel}`);
        this.subscribeToTicketEvents(globalChannel);
    }

    /**
     * Subscribe to ticket events on a channel
     */
    private subscribeToTicketEvents(channelName: string): void {
        if (!this.echo) return;

        this.echo.channel(channelName)
            .listen('.ticket.created', (data: any) => {
                console.log('🎫 Ticket created:', data);
                this.ticketUpdateSubject.next({ ...data, action: 'created' });
            })
            .listen('.ticket.updated', (data: any) => {
                console.log('🎫 Ticket updated:', data);
                this.ticketUpdateSubject.next({ ...data, action: 'updated' });
            })
            .listen('.ticket.deleted', (data: any) => {
                console.log('🎫 Ticket deleted:', data);
                this.ticketUpdateSubject.next({ ...data, action: 'deleted' });
            })
            .listen('.ticket.assigned', (data: any) => {
                console.log('🎫 Ticket assigned:', data);
                this.ticketUpdateSubject.next({ ...data, action: 'assigned' });
            });
    }

    /**
     * Get observable for notifications
     */
    getNotifications(): Observable<RealtimeNotification> {
        return this.notification$;
    }

    /**
     * Get observable for ticket updates
     */
    getTicketUpdates(): Observable<any> {
        return this.ticketUpdate$;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.isConnectedSubject.value;
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
