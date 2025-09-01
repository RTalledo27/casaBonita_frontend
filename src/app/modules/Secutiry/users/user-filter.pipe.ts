import { Pipe, PipeTransform } from '@angular/core';
import { User } from './models/user';

@Pipe({
  name: 'userFilter'
})
export class UserFilterPipe implements PipeTransform {

  transform(users: User[], search: string, status: string): User[] {
    if (!users) return [];

    return users.filter(user => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = !status || user.status === status;

      return matchesSearch && matchesStatus;
    });
  }

}
