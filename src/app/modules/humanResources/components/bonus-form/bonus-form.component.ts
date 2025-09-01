import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Save, ArrowLeft, Gift, User, Calendar, DollarSign, XCircle, AlertCircle, FileText } from 'lucide-angular';
import { BonusService } from '../../services/bonus.service';
import { BonusTypeService } from '../../services/bonus-type.service';
import { EmployeeService } from '../../services/employee.service';
import { Bonus } from '../../models/bonus';
import { BonusType } from '../../models/bonus-type';
import { Employee } from '../../models/employee';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-bonus-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './bonus-form.component.html',
  styleUrls: ['./bonus-form.component.scss']
})
export class BonusFormComponent implements OnInit {
  private fb = inject(FormBuilder)
  private bonusService = inject(BonusService)
  private bonusTypeService = inject(BonusTypeService)
  private employeeService = inject(EmployeeService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private toastService = inject(ToastService)

  // Señales para el estado del componente
  bonusForm!: FormGroup
  loading = signal<boolean>(false)
  saving = signal<boolean>(false)
  error = signal<string | null>(null)
  isEditMode = signal<boolean>(false)
  bonusId = signal<number | null>(null)
  employees = signal<Employee[]>([])
  bonusTypes = signal<BonusType[]>([])

  // Iconos de Lucide
  Save = Save
  ArrowLeft = ArrowLeft
  Gift = Gift
  User = User
  Calendar = Calendar
  DollarSign = DollarSign
  XCircle = XCircle
  AlertCircle = AlertCircle
  FileText = FileText

  ngOnInit() {
    this.initializeForm()
    this.loadData()
    this.checkEditMode()

    // Debug logs
    console.log("Month options:", this.monthOptions)
    console.log("Year options:", this.yearOptions)
    console.log("Form value:", this.bonusForm.value)
  }

  initializeForm() {
    const currentDate = new Date()
    this.bonusForm = this.fb.group({
      employee_id: ["", [Validators.required]],
      bonus_type_id: ["", [Validators.required]],
      amount: ["", [Validators.required, Validators.min(0.01)]],
      month: ["", [Validators.required, Validators.min(1), Validators.max(12)]], // Cambiado: sin valor por defecto
      year: ["", [Validators.required, Validators.min(2020)]], // Cambiado: sin valor por defecto
      description: [""],
      notes: [""],
    })

    // Establecer valores por defecto después de crear el formulario
    setTimeout(() => {
      this.bonusForm.patchValue({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      })
    }, 0)
  }

  async loadData() {
    this.loading.set(true)
    try {
      await Promise.all([this.loadEmployees(), this.loadBonusTypes()])
    } catch (error) {
      console.error("Error loading data:", error)
      this.error.set("Error al cargar los datos")
    } finally {
      this.loading.set(false)
    }
  }

  async loadEmployees() {
    try {
      const response = await this.employeeService.getAllEmployees().toPromise()
      if (response && response.data) {
        this.employees.set(response.data)
      }
    } catch (error) {
      console.error("Error loading employees:", error)
      this.toastService.error("Error al cargar empleados")
    }
  }

  private loadBonusTypes(): void {
    this.bonusTypeService.getBonusTypes().subscribe({
      next: (response) => {
        this.bonusTypes.set(response.data || [])
      },
      error: (error) => {
        console.error("Error loading bonus types:", error)
        // Datos de ejemplo si falla la API
        this.bonusTypes.set([
          {
            bonus_type_id: 1,
            type_code: "PERFORMANCE",
            type_name: "Bono por Rendimiento",
            calculation_method: "percentage_of_goal",
            is_automatic: false,
            requires_approval: true,
            applicable_employee_types: ["full_time"],
            frequency: "monthly",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            bonus_type_id: 2,
            type_code: "ATTENDANCE",
            type_name: "Bono por Asistencia",
            calculation_method: "fixed_amount",
            is_automatic: true,
            requires_approval: false,
            applicable_employee_types: ["full_time", "part_time"],
            frequency: "monthly",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
      },
    })
  }

  checkEditMode() {
    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.isEditMode.set(true)
      this.bonusId.set(Number.parseInt(id))
      this.loadBonus(Number.parseInt(id))
    }
  }

  async loadBonus(id: number) {
    this.loading.set(true)
    try {
      const bonus = await this.bonusService.getBonus(id).toPromise()
      if (bonus) {
        this.bonusForm.patchValue({
          employee_id: bonus.employee_id,
          bonus_type_id: bonus.bonus_type_id,
          amount: bonus.bonus_amount,
          month: bonus.period_month || new Date().getMonth() + 1,
          year: bonus.period_year || new Date().getFullYear(),
          description: bonus.bonus_name || "",
          notes: bonus.notes || "",
        })
      }
    } catch (error) {
      console.error("Error loading bonus:", error)
      this.error.set("Error al cargar el bono")
      this.toastService.error("Error al cargar el bono")
    } finally {
      this.loading.set(false)
    }
  }

  async onSubmit() {
    if (this.bonusForm.invalid) {
      this.markFormGroupTouched()
      return
    }

    this.saving.set(true)
    try {
      const formData = this.bonusForm.value
      
      // Mapear los campos del formulario a los campos esperados por la API
      const bonusData = {
        employee_id: formData.employee_id,
        bonus_type_id: formData.bonus_type_id,
        bonus_amount: formData.amount, // Mapear amount a bonus_amount
        period_month: formData.month,
        period_year: formData.year,
        bonus_name: formData.description,
        notes: formData.notes
      }

      if (this.isEditMode()) {
        await this.bonusService.updateBonus(this.bonusId()!, bonusData).toPromise()
        this.toastService.success("Bono actualizado exitosamente")
      } else {
        await this.bonusService.createBonus(bonusData).toPromise()
        this.toastService.success("Bono creado exitosamente")
      }

      this.router.navigate(["/hr/bonuses"])
    } catch (error) {
      console.error("Error saving bonus:", error)
      this.toastService.error("Error al guardar el bono")
    } finally {
      this.saving.set(false)
    }
  }

  onCancel() {
    this.router.navigate(["/hr/bonuses"])
  }

  goBack() {
    this.router.navigate(["/hr/bonuses"])
  }

  private markFormGroupTouched() {
    Object.keys(this.bonusForm.controls).forEach((key) => {
      const control = this.bonusForm.get(key)
      control?.markAsTouched()
    })
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.bonusForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  getFieldError(fieldName: string): string {
    const field = this.bonusForm.get(fieldName)
    if (field?.errors) {
      if (field.errors["required"]) {
        return "Este campo es requerido"
      }
      if (field.errors["min"]) {
        return `El valor mínimo es ${field.errors["min"].min}`
      }
      if (field.errors["max"]) {
        return `El valor máximo es ${field.errors["max"].max}`
      }
    }
    return ""
  }

  // Opciones para los selectores
  get monthOptions() {
    return [
      { value: 1, label: "Enero" },
      { value: 2, label: "Febrero" },
      { value: 3, label: "Marzo" },
      { value: 4, label: "Abril" },
      { value: 5, label: "Mayo" },
      { value: 6, label: "Junio" },
      { value: 7, label: "Julio" },
      { value: 8, label: "Agosto" },
      { value: 9, label: "Septiembre" },
      { value: 10, label: "Octubre" },
      { value: 11, label: "Noviembre" },
      { value: 12, label: "Diciembre" },
    ]
  }

  get yearOptions() {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 10 }, (_, i) => {
      const year = currentYear - 5 + i
      return { value: year, label: year.toString() }
    })
  }

  formatCurrency(amount: number | string): string {
    // Convertir a número de forma segura
    let numericAmount: number

    if (typeof amount === "string") {
      // Si es string, intentar extraer solo el primer número válido
      const cleanAmount = amount.toString().replace(/[^\d.-]/g, "")
      const firstNumber = cleanAmount.split(".")[0] + "." + (cleanAmount.split(".")[1] || "0")
      numericAmount = Number.parseFloat(firstNumber) || 0
    } else {
      numericAmount = amount || 0
    }

    // Validar que sea un número válido
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      numericAmount = 0
    }

    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 0,
    }).format(numericAmount)
  }
}