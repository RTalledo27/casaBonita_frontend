import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'crmFilter',
})
export class CrmFilterPipe implements PipeTransform {
  transform(clients: any[], search: string, type: string): any[] {
    if (!clients) return [];
    const q = (search || '').trim().toLowerCase();
    const norm = (s: any) => (s ?? '').toString().toLowerCase();
    return clients.filter((c) => {
      const haystack = [
        `${norm(c.first_name)} ${norm(c.last_name)}`,
        norm(c.email),
        norm(c.primary_phone),
        norm(c.secondary_phone),
        norm(c.doc_number),
        norm(c.type),
      ];
      const matchesSearch = q ? haystack.some((h) => h.includes(q)) : true;
      const matchesType = type ? c.type === type : true;
      return matchesSearch && matchesType;
    });
  }
}
