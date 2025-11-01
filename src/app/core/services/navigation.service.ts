import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  // Subject para comunicar la expansión de módulos
  private expandModuleSubject = new Subject<string>();
  
  // Observable público para que otros componentes se suscriban
  expandModule$ = this.expandModuleSubject.asObservable();

  // Método para emitir el evento de expansión
  expandModule(moduleName: string): void {
    this.expandModuleSubject.next(moduleName);
  }
}
