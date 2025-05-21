import { Component } from '@angular/core';
import { UsersService } from '../services/users.service';
import { User } from './models/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserFilterPipe } from './user-filter.pipe';
import { HttpClient } from '@angular/common/http';
import { UserFormComponent } from './components/user-form/user-form.component';
import { Role } from './models/role';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule,UserFilterPipe, UserFormComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  users: User[] = [];
  loading = true;
  filter = '';
  status = '';
  showForm = false;

  constructor(private userService: UsersService) {}

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
      next: (res:any) => {
        this.users = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }



onCreate(): void {
  this.showForm = true;
}

  onFormSubmit(data: Role): void {
  
    // preparamos FormData si hay foto
    const fd = new FormData();

    

    Object.entries(data).forEach(([k,v]) => v != null && fd.append(k, v));
    this.userService.create(fd).subscribe({
      next: () => {
        console.log(fd.values());
        console.log('User created');
        this.showForm = false;
        this.getUsers();
      }
    });
  }


onFormCancel(): void {
  this.showForm = false;
}


  

}
