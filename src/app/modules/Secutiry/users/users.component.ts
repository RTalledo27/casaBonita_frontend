import { Component } from '@angular/core';
import { UsersService } from './users.service';
import { User } from './user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserFilterPipe } from './user-filter.pipe';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule,UserFilterPipe, ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  users: User[] = [];
  loading = true;
  filter = '';
  status = '';

  constructor(private userService: UsersService) {}

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (res) => {
        this.users = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }


  openModalCreateUser() {
    // Implementar la lógica para abrir el modal de creación de usuario
    console.log('Abrir modal de creación de usuario');
  }

}
