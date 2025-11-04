import { Injectable, OnDestroy } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { switchMap, takeUntil, filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionSyncService implements OnDestroy {
  private syncInterval$ = interval(300000); // Check every 5 minutes (300000ms) - desactivado temporalmente
  private destroy$ = new Subject<void>();
  private syncSubscription?: Subscription;
  private previousPermissions: string[] = [];
  private isEnabled = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  /**
   * Iniciar sincronización automática de permisos
   */
  startSync(): void {
    if (this.isEnabled) {
      console.log('🔄 Permission sync already running');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('⚠️ No user logged in, skipping permission sync');
      return;
    }

    // Store current permissions
    this.previousPermissions = [...currentUser.permissions];
    this.isEnabled = true;

    console.log('🔄 Starting permission sync service');

    this.syncSubscription = this.syncInterval$.pipe(
      takeUntil(this.destroy$),
      filter(() => {
        const isAuth = this.authService.isAuthenticated();
        console.log('🔍 Permission sync tick - Authenticated:', isAuth);
        return isAuth;
      }),
      switchMap(() => {
        console.log('🔄 Fetching fresh permissions from server...');
        return this.authService.refreshUserData();
      })
    ).subscribe({
      next: (user) => {
        console.log('✅ Fresh user data received:', {
          permissionCount: user.permissions.length,
          permissions: user.permissions
        });
        this.checkPermissionChanges(user.permissions);
      },
      error: (error) => {
        console.error('❌ Error syncing permissions:', error);
        // Don't show error to user, just log it
      }
    });
  }

  /**
   * Detener sincronización automática
   */
  stopSync(): void {
    console.log('⏹️ Stopping permission sync service');
    this.isEnabled = false;
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
      this.syncSubscription = undefined;
    }
  }

  /**
   * Verificar si hubo cambios en los permisos
   */
  private checkPermissionChanges(newPermissions: string[]): void {
    const added = newPermissions.filter(p => !this.previousPermissions.includes(p));
    const removed = this.previousPermissions.filter(p => !newPermissions.includes(p));

    if (added.length > 0 || removed.length > 0) {
      console.log('🔐 Permission changes detected:', {
        added,
        removed,
        previous: this.previousPermissions,
        new: newPermissions
      });

      // Notify user about permission changes
      if (added.length > 0 && removed.length > 0) {
        this.toastService.info('Tus permisos han sido actualizados');
        console.log('📢 Toast: Permisos actualizados');
      } else if (added.length > 0) {
        this.toastService.success('Se te han otorgado nuevos permisos');
        console.log('📢 Toast: Nuevos permisos otorgados');
      } else if (removed.length > 0) {
        this.toastService.error('Algunos de tus permisos han sido revocados');
        console.log('📢 Toast: Permisos revocados');
      }

      // Update stored permissions
      this.previousPermissions = [...newPermissions];

      // Trigger a sidebar refresh
      console.log('🔄 Triggering sidebar refresh...');
      this.triggerSidebarRefresh();
    } else {
      console.log('✅ No permission changes detected');
    }
  }

  /**
   * Forzar actualización manual de permisos
   */
  forceSync(): void {
    console.log('🔄 PermissionSync: Forcing manual permission sync');
    this.authService.refreshUserData().subscribe({
      next: (user) => {
        console.log('✅ PermissionSync: Got updated user with', user.permissions.length, 'permissions');
        
        // Actualizar permisos previos
        const oldPermissions = this.previousPermissions;
        this.previousPermissions = user.permissions;
        
        // Disparar evento para refrescar el sidebar
        console.log('📢 PermissionSync: Triggering sidebar refresh event');
        this.triggerSidebarRefresh();
        
        // Mostrar mensaje de éxito
        this.toastService.success('Permisos actualizados correctamente');
        
        // Log de cambios (sin mostrar notificaciones adicionales para refresh manual)
        const added = user.permissions.filter(p => !oldPermissions.includes(p));
        const removed = oldPermissions.filter(p => !user.permissions.includes(p));
        if (added.length > 0 || removed.length > 0) {
          console.log('📝 Permission changes:', { added, removed });
        }
      },
      error: (error) => {
        console.error('❌ PermissionSync: Error forcing sync:', error);
        this.toastService.error('Error al actualizar permisos');
      }
    });
  }

  /**
   * Disparar evento para refrescar el sidebar
   */
  private triggerSidebarRefresh(): void {
    // Emit event to refresh sidebar
    window.dispatchEvent(new CustomEvent('permissions-updated'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopSync();
  }
}
