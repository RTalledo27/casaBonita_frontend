import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'crmFilter',
})
export class CrmFilterPipe implements PipeTransform {
  transform(clients: any[], search: string, type: string): any[] {
    if (!clients) return [];
    return clients.filter(
      (client) =>
        (client.first_name + ' ' + client.last_name)
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (type ? client.type === type : true)
    );
  }
}
