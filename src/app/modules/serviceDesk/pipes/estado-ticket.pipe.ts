import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoTicket',
})
export class EstadoTicketPipe implements PipeTransform {
  transform(status: string): string {
    switch (status) {
      case 'abierto':
        return 'Abierto';
      case 'en_proceso':
        return 'En Proceso';
      case 'cerrado':
        return 'Resuelto';
      default:
        return status;
    }
  }
}
