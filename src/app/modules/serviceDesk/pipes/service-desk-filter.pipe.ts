import { Pipe, PipeTransform } from '@angular/core';
import { ServiceDeskTicket } from '../models/serviceDeskTicket';

@Pipe({
  name: 'serviceDeskFilter',
})
export class ServiceDeskFilterPipe implements PipeTransform {
  transform(
    tickets: ServiceDeskTicket[],
    filter: string,
    priority: string,
    status: string
  ): ServiceDeskTicket[] {
    if (!tickets) return [];
    return tickets.filter((ticket) => {
      const matchesFilter =
        !filter ||
        ticket.description?.toLowerCase().includes(filter.toLowerCase()) ||
        ticket.ticket_id.toString().includes(filter) ||
        ticket.ticket_type.toLowerCase().includes(filter.toLowerCase());
      const matchesPriority = !priority || ticket.priority === priority;
      const matchesStatus = !status || ticket.status === status;
      return matchesFilter && matchesPriority && matchesStatus;
    });
  }
}
