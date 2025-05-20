import { Component } from '@angular/core';
import { UsersService } from './users.service';
import { User } from './user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserFilterPipe } from './user-filter.pipe';
import { HttpClient } from '@angular/common/http';
import { UserFormComponent } from './components/user-form/user-form.component';

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



onCreate(): void {
  this.showForm = true;
}

onFormSubmit(data: any): void {
  console.log('User submitted:', data);
  this.showForm = false;
  // Aquí puedes llamar a this.userService.create(data)
}

onFormCancel(): void {
  this.showForm = false;
}


  

}
