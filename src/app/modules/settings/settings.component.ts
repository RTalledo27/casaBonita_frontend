import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarChart3, Building2, Check, HardDrive, LucideAngularModule, Palette, Plug, Save, Settings, Shield } from 'lucide-angular';


interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface ConfigItem {
  label: string;
  type: 'input' | 'number' | 'select' | 'toggle';
  value: any;
  description?: string;
  options?: { label: string; value: any }[];
  placeholder?: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2">
            <lucide-angular [img]="Settings" class="w-8 h-8 text-blue-600"></lucide-angular>
            <h1 class="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          </div>
          <p class="text-gray-600">Personaliza y configura todos los aspectos del sistema Casa Bonita</p>
        </div>

        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Sidebar -->
          <div class="lg:w-80 flex-shrink-0">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 class="font-semibold text-gray-900 mb-4">Secciones</h2>
              <nav class="space-y-2">
                <button
                  *ngFor="let section of sections"
                  (click)="activeSection.set(section.id)"
                  [class]="getNavButtonClass(section.id)"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                >
                  <lucide-angular [img]="section.icon" class="w-5 h-5"></lucide-angular>
                  <div>
                    <div class="font-medium">{{ section.title }}</div>
                    <div class="text-xs text-gray-500">{{ section.description }}</div>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          <!-- Main Content -->
          <div class="flex-1">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <!-- Section Header -->
              <div class="border-b border-gray-200 p-6">
                <div class="flex items-center gap-3">
                  <lucide-angular [img]="getCurrentSection()?.icon" class="w-6 h-6 text-blue-600"></lucide-angular>
                  <div>
                    <h2 class="text-xl font-semibold text-gray-900">{{ getCurrentSection()?.title }}</h2>
                    <p class="text-gray-600 text-sm">{{ getCurrentSection()?.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Configuration Content -->
              <div class="p-6">
                <!-- Business Settings -->
                <div *ngIf="activeSection() === 'business'" class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                      <h3 class="font-medium text-gray-900">Configuraciones Generales</h3>
                      <div *ngFor="let item of businessConfig" class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">{{ item.label }}</label>
                        <div [ngSwitch]="item.type">
                          <input 
                            *ngSwitchCase="'input'"
                            [(ngModel)]="item.value"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input 
                            *ngSwitchCase="'number'"
                            type="number"
                            [(ngModel)]="item.value"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <select 
                            *ngSwitchCase="'select'"
                            [(ngModel)]="item.value"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option *ngFor="let option of item.options" [value]="option.value">{{ option.label }}</option>
                          </select>
                          <label *ngSwitchCase="'toggle'" class="flex items-center">
                            <input 
                              type="checkbox" 
                              [(ngModel)]="item.value"
                              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span class="ml-2 text-sm text-gray-600">{{ item.description }}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Save Button -->
                <div class="mt-8 flex items-center justify-end gap-4">
                  <button
                    (click)="saveConfiguration()"
                    [disabled]="isSaving()"
                    class="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <lucide-angular 
                      *ngIf="!isSaving() && saveStatus() !== 'saved'"
                      [img]="Save" 
                      class="w-4 h-4"
                    ></lucide-angular>
                    <lucide-angular 
                      *ngIf="saveStatus() === 'saved'"
                      [img]="Check" 
                      class="w-4 h-4 text-green-600"
                    ></lucide-angular>
                    <span>{{ getSaveButtonText() }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {

  Settings = Settings;
  Save = Save;
  Check = Check;

  activeSection = signal('business');
  isSaving = signal(false);
  saveStatus = signal<'idle' | 'saving' | 'saved'>('idle');

  sections: ConfigSection[] = [
    {
      id: 'business',
      title: 'Empresa',
      description: 'Configuración general del negocio',
      icon: Building2
    },
    {
      id: 'modules',
      title: 'Módulos',
      description: 'Gestión de módulos del sistema',
      icon: Plug
    },
    {
      id: 'security',
      title: 'Seguridad',
      description: 'Configuración de seguridad',
      icon: Shield
    },
    {
      id: 'integrations',
      title: 'Integraciones',
      description: 'APIs y servicios externos',
      icon: Plug
    },
    {
      id: 'ui',
      title: 'Interfaz',
      description: 'Personalización de la UI',
      icon: Palette
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Configuración de reportes',
      icon: BarChart3
    },
    {
      id: 'backup',
      title: 'Respaldos',
      description: 'Gestión de copias de seguridad',
      icon: HardDrive
    }
  ];

  businessConfig: ConfigItem[] = [
    {
      label: 'Nombre de la Empresa',
      type: 'input',
      value: 'Casa Bonita'
    },
    {
      label: 'RUC/NIT',
      type: 'input',
      value: '12345678901'
    },
    {
      label: 'Dirección',
      type: 'input',
      value: 'Av. Principal 123'
    },
    {
      label: 'Teléfono',
      type: 'input',
      value: '+51 999 888 777'
    },
    {
      label: 'Email',
      type: 'input',
      value: 'contacto@casabonita.com'
    },
    {
      label: 'Moneda Principal',
      type: 'select',
      value: 'PEN',
      options: [
        { label: 'Soles (PEN)', value: 'PEN' },
        { label: 'Dólares (USD)', value: 'USD' },
        { label: 'Euros (EUR)', value: 'EUR' }
      ]
    },
    {
      label: 'Zona Horaria',
      type: 'select',
      value: 'America/Lima',
      options: [
        { label: 'Lima (UTC-5)', value: 'America/Lima' },
        { label: 'Bogotá (UTC-5)', value: 'America/Bogota' },
        { label: 'México (UTC-6)', value: 'America/Mexico_City' }
      ]
    }
  ];

  getCurrentSection(): ConfigSection | undefined {
    return this.sections.find(section => section.id === this.activeSection());
  }

  getNavButtonClass(sectionId: string): string {
    const isActive = this.activeSection() === sectionId;
    return isActive 
      ? 'bg-blue-50 text-blue-700 border-blue-200' 
      : 'text-gray-700 hover:bg-gray-50';
  }

  saveConfiguration(): void {
    this.isSaving.set(true);
    this.saveStatus.set('saving');
    
    // Simular guardado
    setTimeout(() => {
      this.isSaving.set(false);
      this.saveStatus.set('saved');
      
      // Reset status después de 3 segundos
      setTimeout(() => {
        this.saveStatus.set('idle');
      }, 3000);
    }, 2000);
  }

  getSaveButtonText(): string {
    switch (this.saveStatus()) {
      case 'saving': return 'Guardando...';
      case 'saved': return 'Guardado';
      default: return 'Guardar Configuración';
    }
  }
}