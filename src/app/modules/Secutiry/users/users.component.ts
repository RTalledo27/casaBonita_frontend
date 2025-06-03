import { Component, ViewChild } from '@angular/core';
import { UsersService } from '../services/users.service';
import { User } from './models/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserFilterPipe } from './user-filter.pipe';
import { HttpClient } from '@angular/common/http';
import { UserFormComponent } from './components/user-form/user-form.component';
import { Role } from './models/role';
import {  ToastService } from '../../../core/services/toast.service';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container/toast-container.component';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { PusherListenerService } from '../../../core/services/pusher-listener.service';
import { PusherService } from '../../../core/services/pusher.service';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserFilterPipe,
    RouterLink,
    RouterOutlet,
    TranslateModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  users: User[] = [];
  loading = true;
  filter = '';
  status = '';
  showForm = false;
  editingUser: any = null;
  isModalOpen = false;

  //pusher
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();
  events = ['created', 'updated', 'deleted'];
  idField = 'id';
  pusherListenersInitialized = false;
  private modalSub?: Subscription;
  @ViewChild('modalOutlet', { read: RouterOutlet })
  modalOutlet!: RouterOutlet; // Usa el estado nativo del RouterOutlet
  constructor(
    private userService: UsersService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private pusherService: PusherService,
    private pusherListenerService: PusherListenerService
  ) {}

  ngOnInit(): void {
    this.getUsers();
   this.pusherService.resubscribe('user', this.events);
    this.pusherService.subscribeToChannel('user', this.events);
    this.setupPusherListeners();
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.showForm = false;
    }
  }

  getUsers(): void {
    this.loading = true;
    this.userService.list().subscribe({
      next: (res: any) => {
        console.log('[UsersComponent] Usuarios recibidos:', res.data);
        this.usersSubject.next(res.data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Could not load users', 'error');
      },
    });
  }

  onCreate() {
    /*this.editingUser = undefined;
    this.showForm = true;*/
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: 'create' } }], {
      relativeTo: this.route,
    });
  }

  onEdit(user: User) {
    this.isModalOpen = true;
    this.router.navigate(
      [{ outlets: { modal: [user.id.toString(), 'edit'] } }],
      { relativeTo: this.route }
    );
  }

  //MOSTRAR Y SUPERPONER DIV CONTENEDOR DE FORM(EDIT-CREATE)

  //RECIBIR EL EMIT DE RECARGA
  reloadUsers(component: any) {
    if (component instanceof UserFormComponent) {
      // Escuchar el evento de submit exitoso
    }
  }

  onModalActivate(component: any) {
    console.log('oa');
    if (component instanceof UserFormComponent) {
      component.modalClosed.subscribe((isOpen: boolean) => {
        //this.getUsers(); // Vuelve a cargar la lista completa

        this.isModalOpen = isOpen; // Actualiza el estado
        console.log(this.isModalOpen);
        this.router.navigate(['security/users']); // Opcional: Navega
      });

      component.submitForm.subscribe(({ data, isEdit }) => {
        this.isModalOpen = false; // Cierra el modal
        console.log(this.isModalOpen);
        //this.getUsers();
      });
    }
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    console.log(this.isModalOpen);
  }

  // Método para configurar los listeners de Pusher
  private setupPusherListeners(): void {
    if (this.pusherListenersInitialized) return; // ✅ evitar duplicación
    this.pusherListenersInitialized = true;

    // Configuramos los listeners para eventos genericos (created, updated, deleted)
    this.pusherListenerService.setupPusherListeners(
      'user',
      this.events,
      this.idField,
      this.usersSubject,
      this.usersSubject, // Actualizamos roles tanto en 'created' como en 'updated'
      this.usersSubject // Eliminamos roles en 'deleted'
    );
  }

  /*onFormSubmit(payload: { data: any; isEdit: boolean }) {
    const { data, isEdit } = payload;
    const fd = new FormData();
    console.log("enviando");
    Object.entries(data).forEach(([key, val]) => {
      if (val == null) return;
      if (Array.isArray(val)) {
        val.forEach((v) => fd.append(`${key}[]`, v));
      } else if (val instanceof File) {
        fd.append(key, val, val.name);
      } else {
        fd.append(key, val.toString());
      }
    });

    if (isEdit && this.editingUser) {
      // **no** id in the FormData!
      console.log('updating user', fd);
      fd.append('_method', 'PATCH');

      this.userService.update(this.editingUser.id, fd).subscribe({
        next: () => {
          this.toast.show('User updated', 'success');
          this.showForm = false;
          this.getUsers();
        },
        error: (err) => {
          // Si Laravel envía validación, vienen en err.error.errors
          const errors: Record<string, string[]> = err.error?.errors || {};
          // Recorremos todos los arrays de mensajes
          Object.values(errors).forEach((fieldMsgs) => {
            // Mostramos cada mensaje en un toast de error
            fieldMsgs.forEach((msg) => this.toast.show(msg, 'error', 5000));
          });
          // Si no viene detalle de validación, mostramos un genérico
          if (!Object.keys(errors).length) {
            this.toast.show('Error al procesar la solicitud', 'error');
          }
        },
      });
    } else {
      this.userService.create(fd).subscribe({
        next: () => {
          this.toast.show('User created', 'success');
          this.showForm = false;
          this.getUsers();
        },
        error: (err) => {
          // Si Laravel envía validación, vienen en err.error.errors
          const errors: Record<string, string[]> = err.error?.errors || {};
          // Recorremos todos los arrays de mensajes
          Object.values(errors).forEach((fieldMsgs) => {
            // Mostramos cada mensaje en un toast de error
            fieldMsgs.forEach((msg) => this.toast.show(msg, 'error', 5000));
          });
          // Si no viene detalle de validación, mostramos un genérico
          if (!Object.keys(errors).length) {
            this.toast.show('Error al procesar la solicitud', 'error');
          }
        },
      });
    }
  }*/
}
