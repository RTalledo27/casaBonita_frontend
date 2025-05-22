import { Component } from '@angular/core';
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
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserFilterPipe,
    UserFormComponent,
    ToastContainerComponent,
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

  constructor(private userService: UsersService, private toast: ToastService) {}

  ngOnInit(): void {
    this.getUsers();

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
        this.users = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Could not load users', 'error');
      },
    });
  }

  onCreate() {
    this.editingUser = undefined;
    this.showForm = true;
  }

  onEdit(user: any) {
    // map API payload into form shape
    this.editingUser = { ...user };
    this.showForm = true;
  }

  onFormSubmit(payload: { data: any; isEdit: boolean }) {
    const { data, isEdit } = payload;
    const fd = new FormData();
    fd.append('_method', 'PATCH');
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
      this.userService.update(this.editingUser.id, fd).subscribe({
        next: () => {
          this.toast.show('User updated', 'success');
          this.showForm = false;
          this.getUsers();
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Error updating user', 'error');
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
          console.error(err);
          this.toast.show('Error creating user', 'error');
        },
      });
    }
  }
  onFormCancel(): void {
    this.showForm = false;
  }
}
