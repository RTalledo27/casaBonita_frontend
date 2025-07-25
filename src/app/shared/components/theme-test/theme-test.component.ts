import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-theme-test',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="p-6 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Prueba del Modo Oscuro
        </h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Card 1 -->
          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Información del Tema
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Tema actual: <span class="font-bold">{{ theme.isDark ? 'Oscuro' : 'Claro' }}</span>
            </p>
            <button 
              (click)="theme.toggle()"
              class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
              <lucide-icon [name]="theme.isDark ? 'Sun' : 'Moon'" class="w-4 h-4 inline mr-2"></lucide-icon>
              Cambiar a {{ theme.isDark ? 'Claro' : 'Oscuro' }}
            </button>
          </div>
          
          <!-- Card 2 -->
          <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4">
              Elementos de UI
            </h2>
            <div class="space-y-3">
              <input 
                type="text" 
                placeholder="Campo de texto"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400">
              <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Opción 1</option>
                <option>Opción 2</option>
              </select>
            </div>
          </div>
          
          <!-- Card 3 -->
          <div class="bg-green-50 dark:bg-green-900 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold text-green-800 dark:text-green-200 mb-4">
              Estados
            </h2>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="text-green-700 dark:text-green-300">Activo</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span class="text-yellow-700 dark:text-yellow-300">Pendiente</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <span class="text-red-700 dark:text-red-300">Inactivo</span>
              </div>
            </div>
          </div>
          
          <!-- Card 4 -->
          <div class="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
              Botones
            </h2>
            <div class="space-y-2">
              <button class="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors">
                Botón Secundario
              </button>
              <button class="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                Botón Peligro
              </button>
              <button class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                Botón Éxito
              </button>
            </div>
          </div>
        </div>
        
        <!-- Información adicional -->
        <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Información Técnica
          </h3>
          <ul class="text-blue-700 dark:text-blue-300 space-y-1">
            <li>• El modo oscuro se aplica automáticamente a toda la aplicación</li>
            <li>• Los cambios se guardan en localStorage</li>
            <li>• Se respeta la preferencia del sistema por defecto</li>
            <li>• Todas las clases de Tailwind CSS dark: funcionan correctamente</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ThemeTestComponent {
  constructor(public theme: ThemeService) {}
}