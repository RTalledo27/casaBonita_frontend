# 🚀 Guía Rápida - Parámetros Tributarios

## Acceso Rápido
```
URL: http://localhost:4200/hr/tax-parameters
Módulo: Recursos Humanos > Parámetros Tributarios
```

---

## 📋 **CASOS DE USO COMUNES**

### 1️⃣ **Diciembre 2025: Actualizar UIT para 2026**

**MEF publica:** UIT 2026 = S/ 5,500

**Pasos:**
1. Click en **"Nuevo Año"** (se crea 2026)
2. Click en **"Copiar 2025"** (copia valores actuales)
3. Modificar solo: **UIT** → `5500`
4. Click en **"Guardar Parámetros"**
5. ✅ Listo! Sistema usará S/ 5,500 para planillas de 2026

**Tiempo:** 30 segundos

---

### 2️⃣ **Gobierno aumenta RMV de S/ 1,130 a S/ 1,200**

**Decreto Supremo:** RMV aumenta

**Pasos:**
1. Seleccionar año actual (**2025**)
2. Modificar: **RMV** → `1200`
3. Sistema calcula automáticamente: **Asignación Familiar** = `120` (10%)
4. Click en **"Guardar Parámetros"**
5. ✅ Listo! Nuevos empleados recibirán S/ 120 de AF

**Tiempo:** 20 segundos

---

### 3️⃣ **SBS actualiza comisiones AFP (trimestral)**

**SBS publica nuevas comisiones:**
- AFP Prima: 1.47% → 1.52%
- AFP Integra: 1.00% → 1.05%

**Pasos:**
1. Seleccionar año actual
2. Modificar:
   - **AFP Prima** → `1.52`
   - **AFP Integra** → `1.05`
3. Click en **"Guardar Parámetros"**
4. ✅ Listo! Planillas siguientes usarán nuevas tasas

**Tiempo:** 15 segundos

---

### 4️⃣ **Ver parámetros históricos (auditoría)**

**Necesitas ver qué valores se usaron en 2024:**

**Pasos:**
1. En selector de años, click en **2024**
2. Ver todos los valores que estaban vigentes
3. Sin modificar nada, cambiar a otro año

**Uso:** Auditorías, verificar cálculos históricos

---

## 🎯 **VALORES QUE CAMBIAS MÁS FRECUENTEMENTE**

### **Anualmente (cada diciembre):**
- ✅ UIT (MEF lo publica ~Diciembre 15)
- ✅ Deducción Impuesto Renta (si MEF cambia de 7 UIT)

### **Ocasionalmente (por decreto):**
- ✅ RMV (Remuneración Mínima Vital)
- ✅ Asignación Familiar (se calcula automáticamente del RMV)

### **Trimestralmente (SBS):**
- ✅ Comisiones AFP (4 proveedores)

### **Raramente (cambios legislativos):**
- ⚠️ Tasas AFP (aporte, seguro)
- ⚠️ Tasa ONP
- ⚠️ Tasa EsSalud
- ⚠️ Tramos Impuesto a la Renta

---

## 💡 **TIPS**

### **Tip 1: Preparar año siguiente con anticipación**
En noviembre, crea el año 2026 y copia valores de 2025. Así tienes base lista para actualizar UIT cuando MEF lo publique.

### **Tip 2: Verificar conversión UIT → Soles**
El sistema muestra en tiempo real cuánto vale cada tramo en soles. Ejemplo:
- 7 UIT × S/ 5,350 = S/ 37,450 (deducción anual)

### **Tip 3: RMV y Asignación Familiar vinculados**
Al cambiar RMV, la asignación familiar se actualiza automáticamente (10%). No necesitas calcular manualmente.

### **Tip 4: Guardar antes de cambiar de año**
Si modificaste valores y cambias de año, el sistema te preguntará si quieres descartar cambios.

---

## ⚙️ **CÓMO AFECTA A LAS PLANILLAS**

### **Sistema de Cálculo de Planillas usa estos parámetros:**

```typescript
// Ejemplo interno (NO necesitas código, solo entender el flujo)
const taxParams = TaxParameter.getActiveForYear(2025);

// Calcular AFP
const afpAporte = salarioBruto * (taxParams.afp_contribution_rate / 100);
const afpComision = salarioBruto * (taxParams.afp_prima_commission / 100);

// Asignación Familiar (si aplica)
if (employee.has_family_allowance) {
  salarioBruto += taxParams.family_allowance;
}

// Impuesto a la Renta (usando tramos UIT)
const deduccion = taxParams.uit_amount * taxParams.rent_tax_deduction_uit;
// ... cálculo progresivo por tramos
```

**Resultado:** Cuando cambias UIT de 5,350 a 5,500:
- Deducción pasa de S/ 37,450 a S/ 38,500
- Tramos de impuesto se recalculan automáticamente
- Empleados pagan menos impuesto (mayor deducción)

---

## 🔍 **PREGUNTAS FRECUENTES**

### **¿Puedo modificar años pasados?**
Sí, pero con precaución. Cambiar valores históricos afecta recálculos de planillas antiguas. Solo hazlo si hubo un error.

### **¿Qué pasa si no existen parámetros para un año?**
El sistema lo detecta y te permite:
1. Crear desde cero
2. Copiar desde otro año

### **¿Puedo ver quién modificó los parámetros?**
Actualmente no (fase 1). Se puede agregar auditoría en fase 2.

### **¿Los cambios son instantáneos?**
Sí. Al guardar, el sistema inmediatamente usa los nuevos valores para planillas siguientes.

### **¿Puedo exportar los parámetros?**
Actualmente no, pero se puede agregar exportación a Excel/PDF.

---

## 🎨 **GUÍA VISUAL DE BADGES**

### **Selector de Años:**

| Badge | Color | Significado |
|-------|-------|-------------|
| **2025** `Actual` | 🔵 Azul | Año en curso |
| **2026** `Futuro` | 🟡 Amarillo | Año próximo |
| **2024** `Histórico` | ⚪ Gris | Año pasado |
| **+ Nuevo Año** | 🟢 Verde | Crear año |

### **Campos del Formulario:**

| Badge | Significado |
|-------|-------------|
| `Ley` 🔴 | Valor fijado por ley (raramente cambia) |
| `SBS` 🟣 | Valor actualizado por SBS (trimestral) |

---

## 📞 **SOPORTE**

### **Problemas comunes:**

❌ **Error: "No existen parámetros para 2025"**  
✅ Solución: Click en "Copiar 2024" o crear desde cero

❌ **Error al guardar**  
✅ Solución: Verifica que todos los campos tengan valores válidos (números positivos)

❌ **Asignación Familiar no se calcula**  
✅ Solución: Usa el botón 🧮 al lado del campo o modifica RMV

---

## 🚀 **¡LISTO!**

Ahora tienes un sistema profesional para administrar parámetros tributarios sin tocar código.

**Beneficios:**
- ⚡ Actualizaciones instantáneas
- 📊 Historial completo
- 🔄 Cálculos automáticos
- 🎨 Interfaz intuitiva
- ✅ Sin deployments

**¡Disfruta del sistema!** 🎉
