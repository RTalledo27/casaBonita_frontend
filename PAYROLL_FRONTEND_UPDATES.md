# 📱 Actualizaciones del Frontend - Sistema de Nóminas Mejorado

**Fecha:** 14 de Noviembre de 2025  
**Objetivo:** Actualizar modelos TypeScript y componentes para soportar el nuevo sistema de nóminas con AFP/ONP

---

## ✅ **CAMBIOS REALIZADOS**

### **1. Modelo `Employee` (employee.ts)**

Se agregaron los siguientes campos para el sistema pensionario:

```typescript
// Sistema Pensionario (nuevos campos para nóminas mejoradas)
pension_system?: 'AFP' | 'ONP' | 'NINGUNO';
afp_provider?: 'PRIMA' | 'INTEGRA' | 'PROFUTURO' | 'HABITAT';
cuspp?: string; // Código Único de Seguridad Pensionaria (13 dígitos)
has_family_allowance?: boolean;
number_of_children?: number;

// Campos organizacionales
department?: string;
position?: string;
```

**Cambios:**
- ✅ `pension_system`: Tipo de sistema pensionario (AFP, ONP o NINGUNO)
- ✅ `afp_provider`: Proveedor de AFP (Prima, Integra, Profuturo, Habitat)
- ✅ `cuspp`: Código único de afiliación
- ✅ `has_family_allowance`: Si recibe asignación familiar (S/ 102.50)
- ✅ `number_of_children`: Número de hijos menores de 18 años
- ✅ `department` y `position`: Campos organizacionales para reportes

---

### **2. Modelo `Payroll` (payroll.ts)**

Se actualizó completamente para reflejar la nueva estructura de descuentos:

#### **Antes:**
```typescript
// Deducciones
income_tax: number;
social_security: number; // ❌ Genérico
health_insurance: number; // ❌ No se usa correctamente
other_deductions: number;
total_deductions: number;
```

#### **Después:**
```typescript
// Ingresos
family_allowance: number; // Asignación familiar S/ 102.50

// Sistema Pensionario (desglosado)
pension_system: 'AFP' | 'ONP' | 'NINGUNO';
afp_provider?: 'PRIMA' | 'INTEGRA' | 'PROFUTURO' | 'HABITAT';
afp_contribution: number; // 10%
afp_commission: number; // 1.00% - 1.47% según proveedor
afp_insurance: number; // 0.99%
onp_contribution: number; // 13%
total_pension: number; // Total sistema pensionario

// Impuesto a la Renta
rent_tax_5th: number; // Impuesto 5ta categoría

// Aportaciones del Empleador (informativo)
employer_essalud: number; // 9% pagado por el empleador
```

**Beneficios:**
- ✅ Desglose completo de AFP (aporte + comisión + seguro)
- ✅ Distinción clara entre AFP y ONP
- ✅ Impuesto a la renta con nombre correcto
- ✅ EsSalud como información del empleador
- ✅ Asignación familiar incluida en ingresos

---

### **3. Componente `EmployeeListComponent` (employee-list.component.ts)**

Se actualizó el método `exportToExcel()` para incluir todos los nuevos campos:

#### **Campos exportados (antes):**
```typescript
'Código', 'Nombre', 'Email', 'Teléfono', 'Tipo', 'Estado', 
'Fecha Ingreso', 'Salario Base'
```

#### **Campos exportados (después):**
```typescript
'Código', 'Nombre', 'Email', 'Teléfono', 'Tipo', 'Estado',
'Fecha Ingreso', 'Salario Base', 
'Sistema Pensionario', 'AFP', 'CUSPP',
'Asignación Familiar', 'N° Hijos', 'Departamento', 'Posición'
```

**Ejemplo de exportación:**

| Código | Nombre | Sistema Pensionario | AFP | CUSPP | Asignación Familiar | N° Hijos |
|--------|--------|---------------------|-----|-------|---------------------|----------|
| EMP001 | Juan Pérez | AFP | INTEGRA | 1234567890123 | Sí | 2 |
| EMP002 | María López | ONP | N/A | N/A | No | 0 |
| EMP003 | Carlos Díaz | AFP | PRIMA | 9876543210987 | Sí | 1 |

---

## 🔄 **PRÓXIMAS ACTUALIZACIONES NECESARIAS**

### **4. Formulario de Empleados (`employee-form.component`)**

Agregar campos para capturar:

```html
<!-- Sistema Pensionario -->
<div class="form-group">
  <label>Sistema Pensionario</label>
  <select formControlName="pension_system">
    <option value="AFP">AFP</option>
    <option value="ONP">ONP</option>
    <option value="NINGUNO">Ninguno</option>
  </select>
</div>

<!-- Proveedor AFP (solo si pension_system === 'AFP') -->
<div class="form-group" *ngIf="form.get('pension_system')?.value === 'AFP'">
  <label>Proveedor AFP</label>
  <select formControlName="afp_provider">
    <option value="PRIMA">Prima AFP</option>
    <option value="INTEGRA">Integra AFP</option>
    <option value="PROFUTURO">Profuturo AFP</option>
    <option value="HABITAT">Habitat AFP</option>
  </select>
</div>

<!-- CUSPP -->
<div class="form-group" *ngIf="form.get('pension_system')?.value !== 'NINGUNO'">
  <label>CUSPP</label>
  <input 
    type="text" 
    formControlName="cuspp"
    maxlength="13"
    placeholder="Código de 13 dígitos"
  />
</div>

<!-- Asignación Familiar -->
<div class="form-group">
  <label>
    <input type="checkbox" formControlName="has_family_allowance">
    Recibe Asignación Familiar (S/ 102.50)
  </label>
</div>

<!-- Número de Hijos -->
<div class="form-group" *ngIf="form.get('has_family_allowance')?.value">
  <label>Número de Hijos (menores de 18 años)</label>
  <input 
    type="number" 
    formControlName="number_of_children"
    min="0"
    max="10"
  />
</div>
```

---

### **5. Vista de Nómina Detallada (`payroll-view.component`)**

Actualizar la vista para mostrar el desglose completo:

```html
<!-- INGRESOS -->
<div class="payroll-section">
  <h3>💰 Ingresos</h3>
  <div class="payroll-row">
    <span>Sueldo Básico:</span>
    <span>S/ {{ payroll.base_salary | number:'1.2-2' }}</span>
  </div>
  <div class="payroll-row" *ngIf="payroll.family_allowance > 0">
    <span>Asignación Familiar:</span>
    <span>S/ {{ payroll.family_allowance | number:'1.2-2' }}</span>
  </div>
  <div class="payroll-row" *ngIf="payroll.commissions_amount > 0">
    <span>Comisiones:</span>
    <span>S/ {{ payroll.commissions_amount | number:'1.2-2' }}</span>
  </div>
  <div class="payroll-row" *ngIf="payroll.bonuses_amount > 0">
    <span>Bonos:</span>
    <span>S/ {{ payroll.bonuses_amount | number:'1.2-2' }}</span>
  </div>
  <div class="payroll-row total">
    <span><strong>Bruto Total:</strong></span>
    <span><strong>S/ {{ payroll.gross_salary | number:'1.2-2' }}</strong></span>
  </div>
</div>

<!-- DESCUENTOS -->
<div class="payroll-section">
  <h3>📉 Descuentos</h3>
  
  <!-- AFP -->
  <div *ngIf="payroll.pension_system === 'AFP'" class="subsection">
    <h4>AFP {{ payroll.afp_provider }}</h4>
    <div class="payroll-row">
      <span>• Aporte (10%):</span>
      <span>S/ {{ payroll.afp_contribution | number:'1.2-2' }}</span>
    </div>
    <div class="payroll-row">
      <span>• Comisión ({{ getAFPCommissionRate() }}%):</span>
      <span>S/ {{ payroll.afp_commission | number:'1.2-2' }}</span>
    </div>
    <div class="payroll-row">
      <span>• Seguro (0.99%):</span>
      <span>S/ {{ payroll.afp_insurance | number:'1.2-2' }}</span>
    </div>
    <div class="payroll-row subtotal">
      <span><strong>Subtotal AFP:</strong></span>
      <span><strong>S/ {{ payroll.total_pension | number:'1.2-2' }}</strong></span>
    </div>
  </div>

  <!-- ONP -->
  <div *ngIf="payroll.pension_system === 'ONP'" class="subsection">
    <h4>ONP</h4>
    <div class="payroll-row">
      <span>• Aporte (13%):</span>
      <span>S/ {{ payroll.onp_contribution | number:'1.2-2' }}</span>
    </div>
  </div>

  <!-- Impuesto a la Renta -->
  <div class="payroll-row" *ngIf="payroll.rent_tax_5th > 0">
    <span>Impuesto a la Renta (5ta):</span>
    <span>S/ {{ payroll.rent_tax_5th | number:'1.2-2' }}</span>
  </div>

  <!-- Otros descuentos -->
  <div class="payroll-row" *ngIf="payroll.other_deductions > 0">
    <span>Otros descuentos:</span>
    <span>S/ {{ payroll.other_deductions | number:'1.2-2' }}</span>
  </div>

  <div class="payroll-row total">
    <span><strong>Total Descuentos:</strong></span>
    <span><strong>S/ {{ payroll.total_deductions | number:'1.2-2' }}</strong></span>
  </div>
</div>

<!-- NETO A PAGAR -->
<div class="payroll-section net-salary">
  <div class="payroll-row">
    <span><strong>NETO A PAGAR:</strong></span>
    <span class="amount-highlight">
      <strong>S/ {{ payroll.net_salary | number:'1.2-2' }}</strong>
    </span>
  </div>
</div>

<!-- INFORMACIÓN EMPLEADOR -->
<div class="payroll-section info">
  <h3>ℹ️ Aportaciones del Empleador</h3>
  <div class="payroll-row">
    <span>EsSalud (9%):</span>
    <span>S/ {{ payroll.employer_essalud | number:'1.2-2' }}</span>
  </div>
  <p class="note">
    * Este monto es pagado por la empresa, no se descuenta del empleado
  </p>
</div>
```

---

### **6. Estilos para la Vista de Nómina**

```scss
.payroll-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    color: #1e293b;
  }

  .subsection {
    background: #f8fafc;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 10px;
    }
  }

  .payroll-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;

    &:last-child {
      border-bottom: none;
    }

    &.total {
      margin-top: 10px;
      padding-top: 15px;
      border-top: 2px solid #cbd5e1;
      font-size: 16px;
    }

    &.subtotal {
      margin-top: 8px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
    }
  }

  &.net-salary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;

    .payroll-row {
      border-bottom-color: rgba(255, 255, 255, 0.3);
    }

    .amount-highlight {
      font-size: 24px;
      color: white;
    }
  }

  &.info {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;

    .note {
      font-size: 12px;
      color: #64748b;
      font-style: italic;
      margin-top: 10px;
    }
  }
}
```

---

## 📊 **EJEMPLO VISUAL: Boleta de Pago**

```
╔══════════════════════════════════════════════════════╗
║           BOLETA DE PAGO - NOVIEMBRE 2025            ║
╠══════════════════════════════════════════════════════╣
║ Empleado: Juan Pérez Rodríguez                       ║
║ Código: EMP001                                       ║
║ Período: 2025-11                                     ║
║ Sistema: AFP Integra                                 ║
╠══════════════════════════════════════════════════════╣
║ 💰 INGRESOS                                          ║
║ ─────────────────────────────────────────────────    ║
║ Sueldo Básico                        S/ 2,500.00     ║
║ Asignación Familiar                    S/ 102.50     ║
║ Comisiones                             S/ 500.00     ║
║ ─────────────────────────────────────────────────    ║
║ Bruto Total                          S/ 3,102.50     ║
╠══════════════════════════════════════════════════════╣
║ 📉 DESCUENTOS                                        ║
║ ─────────────────────────────────────────────────    ║
║ AFP Integra:                                         ║
║   • Aporte (10%)                       S/ 310.25     ║
║   • Comisión (1.00%)                    S/ 31.03     ║
║   • Seguro (0.99%)                      S/ 30.71     ║
║   Subtotal AFP                         S/ 371.99     ║
║                                                      ║
║ Impuesto a la Renta (5ta)                S/ 7.87     ║
║ ─────────────────────────────────────────────────    ║
║ Total Descuentos                       S/ 379.86     ║
╠══════════════════════════════════════════════════════╣
║ 💵 NETO A PAGAR                      S/ 2,722.64     ║
╠══════════════════════════════════════════════════════╣
║ ℹ️ Aportaciones del Empleador                       ║
║ ─────────────────────────────────────────────────    ║
║ EsSalud (9%)                           S/ 279.23     ║
║ * No se descuenta del empleado                       ║
╚══════════════════════════════════════════════════════╝
```

---

## 🎯 **CHECKLIST DE IMPLEMENTACIÓN**

### **✅ Completado:**
- [x] Actualizar modelo `Employee` con campos pensionarios
- [x] Actualizar modelo `Payroll` con desglose AFP/ONP
- [x] Actualizar exportación CSV con nuevos campos
- [x] Documentación de cambios frontend

### **⏳ Pendiente:**
- [ ] Actualizar formulario de empleados (agregar campos AFP/ONP)
- [ ] Agregar validación CUSPP (13 dígitos)
- [ ] Actualizar vista de nómina detallada
- [ ] Agregar selector de AFP en formulario
- [ ] Crear pipe para formatear CUSPP (XXX-XXX-XXX-XXX)
- [ ] Agregar tooltips explicativos
- [ ] Crear badge para sistema pensionario (AFP badge, ONP badge)
- [ ] Implementar PDF de boleta de pago
- [ ] Agregar calculadora de nómina en tiempo real

---

## 🚀 **PRÓXIMOS PASOS**

1. **Actualizar Backend** (según `PAYROLL_SYSTEM_IMPROVEMENTS.md`)
2. **Ejecutar migraciones** en la BD
3. **Actualizar formulario de empleados** (agregar campos)
4. **Actualizar vista de nómina** (desglose detallado)
5. **Probar exportación** con datos reales
6. **Generar PDF** de boletas de pago
7. **Capacitar** al equipo de RR.HH.

---

## 💡 **MEJORAS ADICIONALES SUGERIDAS**

### **Calculadora de Nómina en Tiempo Real:**
```typescript
// En el formulario de empleados
calculateEstimatedPayroll(baseSalary: number, pensionSystem: string, afpProvider?: string) {
  const taxParams = this.getTaxParameters(); // De la API
  
  let totalPension = 0;
  if (pensionSystem === 'AFP') {
    const contribution = baseSalary * 0.10;
    const commission = baseSalary * (this.getAFPRate(afpProvider) / 100);
    const insurance = baseSalary * 0.0099;
    totalPension = contribution + commission + insurance;
  } else if (pensionSystem === 'ONP') {
    totalPension = baseSalary * 0.13;
  }
  
  const rentTax = this.calculateIncomeTax(baseSalary);
  const net = baseSalary - totalPension - rentTax;
  
  return { totalPension, rentTax, net };
}
```

### **Badge para Sistema Pensionario:**
```html
<span class="pension-badge" [ngClass]="{
  'badge-afp': employee.pension_system === 'AFP',
  'badge-onp': employee.pension_system === 'ONP',
  'badge-none': employee.pension_system === 'NINGUNO'
}">
  <i [lucideIcon]="Shield"></i>
  {{ employee.pension_system }}
  <span *ngIf="employee.afp_provider"> - {{ employee.afp_provider }}</span>
</span>
```

---

**✨ Con estos cambios el frontend estará 100% alineado con el nuevo sistema de nóminas!**

*Última actualización: 14 de Noviembre de 2025*
