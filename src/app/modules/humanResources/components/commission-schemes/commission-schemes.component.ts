/** 
 * Commission Schemes Component
 * 
 * Este componente maneja la gestión completa de esquemas de comisión y sus reglas.
 * Permite crear, editar y eliminar esquemas de comisión, así como definir reglas
 * específicas basadas en rangos de ventas, plazos y tipos de venta.
 * 
 * @module CommissionSchemesComponent
 */

import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Shared Components
import { TooltipPopoverComponent } from '../../../../shared/components/tooltip-popover/tooltip-popover.component';

// Services & Models
import { HrCommissionService, CommissionScheme } from '../../services/hr-commission.service';

/**
 * Componente principal para la gestión de esquemas de comisión
 * 
 * Features:
 * - Listado y gestión de esquemas de comisión
 * - CRUD completo de reglas de comisión
 * - Modales con accesibilidad (trap focus, keyboard navigation)
 * - Validación cruzada de campos (rangos de fechas y términos)
 * - Dark mode support
 * - Responsive design
 */
@Component({
  selector: 'app-commission-schemes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TooltipPopoverComponent],
  templateUrl: './commission-schemes.component.html',
  styleUrls: ['./commission-schemes.component.css']
})
export class CommissionSchemesComponent implements OnInit {
  // ==========================================
  // DEPENDENCY INJECTION
  // ==========================================
  private svc = inject(HrCommissionService);
  private fb = inject(FormBuilder);

  // ==========================================
  // STATE PROPERTIES
  // ==========================================

  /** Lista de todos los esquemas de comisión */
  schemes: CommissionScheme[] = [];

  /** Lista de todas las reglas de comisión */
  rules: any[] = [];

  /** Indicador de carga */
  isLoading = false;

  /** Mensaje de error general */
  error: string | null = null;

  // ==========================================
  // MODAL STATE
  // ==========================================

  /** Controla visibilidad del modal de esquemas */
  showForm = false;

  /** Controla visibilidad del modal de reglas */
  showRuleFormFlag = false;

  /** Elemento que tenía focus antes de abrir modal (para restaurar) */
  lastFocusedElement: HTMLElement | null = null;

  /** Esquema siendo editado (null si es creación) */
  editing: CommissionScheme | null = null;

  /** Regla siendo editada (null si es creación) */
  editingRule: any = null;

  // ==========================================
  // FORMS
  // ==========================================

  /** Formulario reactivo para esquemas */
  form: FormGroup;

  /** Formulario reactivo para reglas */
  ruleForm: FormGroup;

  /** Error específico del formulario de reglas */
  ruleFormError: string | null = null;

  /** ID del tooltip abierto actualmente */
  tooltipOpenId: string | null = null;

  // ==========================================
  // CONSTRUCTOR
  // ==========================================
  constructor() {
    // Inicializar formulario de esquemas
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      effective_from: [null],
      effective_to: [null],
      is_default: [false]
    });

    // Inicializar formulario de reglas con validador custom
    this.ruleForm = this.fb.group({
      scheme_id: [null, Validators.required],
      min_sales: [0, Validators.required],
      max_sales: [null],
      term_min_months: [null],
      term_max_months: [null],
      effective_from: [null],
      effective_to: [null],
      term_group: ['short', Validators.required],
      sale_type: ['both'],
      percentage: [0, Validators.required],
      priority: [10]
    }, {
      validators: this.ruleRangeValidator.bind(this)
    });
  }

  // ==========================================
  // LIFECYCLE HOOKS
  // ==========================================

  ngOnInit(): void {
    this.loadAll();
  }

  // ==========================================
  // VALIDATORS
  // ==========================================

  /**
   * Validador cruzado para rangos de términos y fechas efectivas
   * Valida que:
   * - term_max_months >= term_min_months
   * - effective_to >= effective_from
   */
  ruleRangeValidator(group: FormGroup) {
    // Validar rango de términos (meses)
    const min = group.get('term_min_months')?.value;
    const max = group.get('term_max_months')?.value;
    if (min != null && max != null && max < min) {
      return { termRange: true };
    }

    // Validar rango de fechas efectivas
    const from = group.get('effective_from')?.value;
    const to = group.get('effective_to')?.value;
    if (from && to) {
      const fromTs = Date.parse(from);
      const toTs = Date.parse(to);
      if (!isNaN(fromTs) && !isNaN(toTs) && toTs < fromTs) {
        return { effectiveRange: true };
      }
    }

    return null;
  }

  // ==========================================
  // TOOLTIP METHODS
  // ==========================================

  /**
   * Toggle tooltip visibility
   * @param id - ID único del tooltip
   */
  toggleTooltip(id: string) {
    this.tooltipOpenId = this.tooltipOpenId === id ? null : id;
  }

  /**
   * Verifica si un tooltip está abierto
   * @param id - ID del tooltip a verificar
   */
  isTooltipOpen(id: string): boolean {
    return this.tooltipOpenId === id;
  }

  // ==========================================
  // KEYBOARD & ACCESSIBILITY
  // ==========================================

  /**
   * Maneja la tecla ESC para cerrar modales
   * Prioriza el modal de reglas si ambos están abiertos
   */
  @HostListener('document:keydown.escape', [])
  onEscape() {
    if (this.showRuleFormFlag) {
      this.closeRuleForm();
      return;
    }

    if (this.showForm) {
      this.closeForm();
    }
  }

  /**
   * Maneja eventos de teclado dentro de modales
   * @param event - Evento de teclado
   */
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      this.trapFocus(event, 'ruleModal');
    }
  }

  /**
   * Trap focus dentro del modal para accesibilidad
   * Asegura que el Tab solo circule por elementos del modal
   * 
   * @param event - Evento de teclado (Tab)
   * @param modalId - ID del modal donde hacer trap del focus
   */
  trapFocus(event: KeyboardEvent, modalId: string) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  }

  /** ID del esquema expandido actualmente */
  expandedSchemeId: number | null = null;

  // ==========================================
  // DATA LOADING
  // ==========================================

  /**
   * Carga todos los esquemas y reglas desde el backend
   */
  loadAll() {
    this.isLoading = true;

    // Cargar esquemas
    this.svc.listSchemes().subscribe({
      next: (r) => {
        let schemes = r.data || [];

        // Ordenar esquemas por relevancia: Activos > Futuros > Default > Pasados
        schemes.sort((a: CommissionScheme, b: CommissionScheme) => {
          const statusA = this.getSchemeStatus(a);
          const statusB = this.getSchemeStatus(b);

          const priority = { 'active': 1, 'future': 2, 'past': 3 };
          if (statusA !== statusB) {
            return priority[statusA] - priority[statusB];
          }

          // Si tienen el mismo estado, el más nuevo primero
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

        this.schemes = schemes;

        // Auto-expandir el primer esquema activo
        const activeScheme = this.schemes.find(s => this.getSchemeStatus(s) === 'active');
        if (activeScheme) {
          this.expandedSchemeId = activeScheme.id!;
        } else if (this.schemes.length > 0) {
          this.expandedSchemeId = this.schemes[0].id!;
        }

        this.isLoading = false;
      },
      error: (e) => {
        this.error = 'Error cargando esquemas';
        this.isLoading = false;
      }
    });

    // Cargar reglas
    this.svc.listRules().subscribe({
      next: (r) => {
        this.rules = r.data || [];
      },
      error: () => { }
    });
  }

  // ==========================================
  // VIEW HELPERS
  // ==========================================

  /**
   * Determina el estado de un esquema basado en sus fechas
   */
  getSchemeStatus(scheme: CommissionScheme): 'active' | 'future' | 'past' {
    const now = new Date();
    // Resetear hora para comparar solo fechas
    now.setHours(0, 0, 0, 0);

    const from = scheme.effective_from ? new Date(scheme.effective_from) : null;
    if (from) from.setHours(0, 0, 0, 0);

    const to = scheme.effective_to ? new Date(scheme.effective_to) : null;
    if (to) to.setHours(0, 0, 0, 0);

    // Futuro: empieza después de hoy
    if (from && from > now) {
      return 'future';
    }

    // Pasado: terminó antes de hoy
    if (to && to < now) {
      return 'past';
    }

    // Activo: dentro del rango (o indefinido)
    return 'active';
  }

  getRulesForScheme(schemeId: number): any[] {
    return this.rules.filter(r => r.scheme_id === schemeId)
      .sort((a, b) => b.priority - a.priority); // Ordenar por prioridad
  }

  toggleScheme(id: number) {
    if (this.expandedSchemeId === id) {
      this.expandedSchemeId = null;
    } else {
      this.expandedSchemeId = id;
    }
  }

  // ==========================================
  // SCHEME CRUD OPERATIONS
  // ==========================================

  /**
   * Abre el modal para crear un nuevo esquema
   */
  openCreate() {
    this.editing = null;
    this.form.reset({
      name: '',
      description: '',
      effective_from: null,
      effective_to: null,
      is_default: false
    });

    // Guardar elemento con focus y abrir modal
    this.lastFocusedElement = document.activeElement as HTMLElement | null;
    this.showForm = true;

    // Dar focus al modal después de renderizar
    setTimeout(() => document.getElementById('schemeModal')?.focus(), 50);
  }

  /**
   * Cierra el modal de esquemas
   * Restaura el focus al elemento anterior
   */
  closeForm() {
    this.showForm = false;
    setTimeout(() => this.lastFocusedElement?.focus(), 0);
  }

  /**
   * Abre el modal para editar un esquema existente
   * @param s - Esquema a editar
   */
  edit(s: CommissionScheme) {
    this.editing = s;
    this.form.patchValue(s);
    this.showForm = true;
  }

  /**
   * Guarda el esquema (crear o actualizar según el estado)
   */
  save() {
    if (this.form.invalid) return;

    const payload = this.form.value;

    if (this.editing) {
      // Actualizar esquema existente
      this.svc.updateScheme(this.editing.id!, payload).subscribe(() => {
        this.closeForm();
        this.loadAll();
      });
    } else {
      // Crear nuevo esquema
      this.svc.createScheme(payload).subscribe(() => {
        this.closeForm();
        this.loadAll();
      });
    }
  }

  /**
   * Elimina un esquema con confirmación
   * @param s - Esquema a eliminar
   */
  remove(s: CommissionScheme) {
    if (!confirm('¿Eliminar esquema?')) return;
    this.svc.deleteScheme(s.id!).subscribe(() => this.loadAll());
  }

  /**
   * Obtiene el nombre de un esquema por su ID
   * @param id - ID del esquema
   * @returns Nombre del esquema o 'N/A'
   */
  getSchemeName(id: number): string {
    const s = this.schemes.find(x => x.id === id);
    return s ? s.name : 'N/A';
  }

  // ==========================================
  // RULE CRUD OPERATIONS
  // ==========================================

  /**
   * Abre el modal para crear una nueva regla
   * @param schemeId - Opcional: ID del esquema preseleccionado
   */
  openRuleForm(schemeId?: number) {
    this.editingRule = null;
    this.ruleFormError = null;

    // Si se pasa un schemeId, usarlo como default. Si no, usar el expandido o el primero.
    const defaultSchemeId = schemeId || this.expandedSchemeId || this.schemes[0]?.id || null;

    this.ruleForm.reset({
      scheme_id: defaultSchemeId,
      min_sales: 0,
      max_sales: null,
      term_min_months: null,
      term_max_months: null,
      effective_from: null,
      effective_to: null,
      term_group: 'short',
      sale_type: 'both',
      percentage: 0,
      priority: 10
    });

    // Guardar elemento con focus y abrir modal
    this.lastFocusedElement = document.activeElement as HTMLElement | null;
    this.showRuleFormFlag = true;

    // Dar focus al modal después de renderizar
    setTimeout(() => document.getElementById('ruleModal')?.focus(), 50);
  }

  /**
   * Cierra el modal de reglas
   * Restaura el focus y limpia errores
   */
  closeRuleForm() {
    this.showRuleFormFlag = false;
    this.ruleFormError = null;
    setTimeout(() => this.lastFocusedElement?.focus(), 0);
  }

  /**
   * Abre el modal para editar una regla existente
   * @param r - Regla a editar
   */
  editRule(r: any) {
    this.editingRule = r;
    this.ruleFormError = null;
    this.ruleForm.patchValue(r);
    this.showRuleFormFlag = true;
  }

  /**
   * Guarda la regla (crear o actualizar según el estado)
   */
  saveRule() {
    this.ruleFormError = null;
    if (this.ruleForm.invalid) return;

    const payload = this.ruleForm.value;

    if (this.editingRule) {
      // Actualizar regla existente
      this.svc.updateRule(this.editingRule.id, payload).subscribe({
        next: () => {
          this.closeRuleForm();
          this.loadAll();
        },
        error: (err) => {
          this.ruleFormError = err?.error?.message || 'Error guardando regla';
        }
      });
    } else {
      // Crear nueva regla
      this.svc.createRule(payload).subscribe({
        next: () => {
          this.closeRuleForm();
          this.loadAll();
        },
        error: (err) => {
          this.ruleFormError = err?.error?.message || 'Error creando regla';
        }
      });
    }
  }

  /**
   * Elimina una regla con confirmación
   * @param r - Regla a eliminar
   */
  deleteRule(r: any) {
    if (!confirm('¿Eliminar regla?')) return;
    this.svc.deleteRule(r.id).subscribe(() => this.loadAll());
  }
}
