import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PusherService } from './pusher.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class PusherListenerService {
  private pusherSubscriptions = new Set<any>(); // Para evitar duplicación de suscripciones

  constructor(
    private pusherService: PusherService,
    private toast: ToastService
  ) {}

  // Configura los listeners de Pusher para cualquier tipo de entidad y evento
  setupPusherListeners<T extends { [key: string]: any }>( // Usamos un índice dinámico para las propiedades
    entityName: string, // El nombre de la entidad para el canal (por ejemplo, 'user', 'product')
    events: string[], // Eventos como ['created', 'updated', 'deleted']
    idField: string, // El nombre del campo de ID (por ejemplo, 'role_id', 'user_id')
    created$: BehaviorSubject<T[]>,
    updated$: BehaviorSubject<T[]>,
    deleted$: BehaviorSubject<T[]>
  ): void {
    events.forEach((event) => {
      const eventObservable = this.pusherService.getEventObservable(entityName,event);
    console.log(`[PusherListenerService] Seteando listeners para entidad: ${entityName}, eventos: ${events}`);
    if (event === 'created') {
      this.pusherSubscriptions.add(
        eventObservable.subscribe((data) => {
          const newItem = data[entityName] || data;
          console.log(`[PusherListenerService][${entityName}] created →`, newItem);
    
          const currentItems = created$.value;
    
          const alreadyExists = currentItems.some(item => item[idField] === newItem[idField]);
    
          if (!alreadyExists) {
            created$.next([newItem, ...currentItems]);
            this.toast.show(`Se ha creado un nuevo ${entityName}`, 'info');
          } else {
            console.log(`[PusherListenerService][${entityName}] ya existía, no se duplica`);
          }
        })
      );
    }
    
      
      
    if (event === 'updated') {
      this.pusherSubscriptions.add(
        eventObservable.subscribe((data) => {
          const updatedItem = data[entityName] || data;
          console.log(
            `[PusherListenerService][${entityName}] updated →`,
            updatedItem
          );

          const currentItems = updated$.value;

          const index = currentItems.findIndex(
            (item) => item[idField] === updatedItem[idField]
          );

          if (index !== -1) {
            const existingItem = currentItems[index];

            // Comparar si ya están iguales (evita duplicación de toast + render)
            const isEqual =
              JSON.stringify(existingItem) === JSON.stringify(updatedItem);

            if (isEqual) {
              console.log(
                `[PusherListenerService][${entityName}] ya estaba actualizado, no se repite`
              );
              return;
            }

            const newItems = [...currentItems];
            newItems[index] = {
              ...existingItem,
              ...updatedItem, // Mezcla para evitar pérdida de campos
            };

            updated$.next(newItems);
            this.toast.show(`${entityName} actualizado`, 'info');
          } else {
            console.warn(
              `[PusherListenerService][${entityName}] no se encontró item con ID ${updatedItem[idField]}`
            );
          }
        })
      );
    }
    

    if (event === 'deleted') {
      this.pusherSubscriptions.add(
        eventObservable.subscribe((data) => {
          const deletedItem = data[entityName] || data;
          console.log(
            `[PusherListenerService][${entityName}] deleted →`,
            deletedItem
          );

          const currentItems = deleted$.value;

          const alreadyRemoved = !currentItems.some(
            (item) => item[idField] === deletedItem[idField]
          );

          if (alreadyRemoved) {
            console.log(
              `[PusherListenerService][${entityName}] ya estaba eliminado`
            );
            return;
          }

          const newItems = currentItems.filter(
            (item) => item[idField] !== deletedItem[idField]
          );

          deleted$.next(newItems);
          this.toast.show(`${entityName} eliminado`, 'info');
        })
      );
    }
    


    });
  
  }
}
