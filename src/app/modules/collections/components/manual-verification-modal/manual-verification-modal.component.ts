import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { 
  CommissionVerificationService, 
  CommissionRequiringVerification,
  VerifyPaymentRequest 
} from '../../services/commission-verification.service';
import { CollectionService } from '../../services/collection.service';
import { CustomerPayment } from '../../models/customer-payment';

export interface ManualVerificationModalData {
  commission: CommissionRequiringVerification;
}

@Component({
  selector: 'app-manual-verification-modal',
  templateUrl: './manual-verification-modal.component.html',
  styleUrls: ['./manual-verification-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule
  ]
})
export class ManualVerificationModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  verificationForm: FormGroup;
  loading = false;
  customerPayments: CustomerPayment[] = [];
  loadingPayments = false;
  
  // Opciones de cuota de pago
  installmentOptions = [
    { value: 'first', label: 'Primera cuota' },
    { value: 'second', label: 'Segunda cuota' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ManualVerificationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManualVerificationModalData,
    private commissionVerificationService: CommissionVerificationService,
    private collectionService: CollectionService,
    private snackBar: MatSnackBar
  ) {
    this.verificationForm = this.fb.group({
      customer_payment_id: ['', Validators.required],
      payment_installment: ['', Validators.required],
      verification_notes: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadCustomerPayments();
    this.setDefaultInstallment();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Establece la cuota por defecto basada en el estado actual
   */
  private setDefaultInstallment(): void {
    const status = this.data.commission.payment_verification_status;
    
    if (status === 'pending_verification') {
      this.verificationForm.patchValue({ payment_installment: 'first' });
    } else if (status === 'first_payment_verified') {
      this.verificationForm.patchValue({ payment_installment: 'second' });
    }
  }
  
  /**
   * Carga los pagos del cliente relacionados con el contrato
   */
  private loadCustomerPayments(): void {
    this.loadingPayments = true;
    
    // Buscar pagos del cliente relacionados con el contrato
    this.collectionService.getCustomerPaymentsByContract(this.data.commission.contract_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payments) => {
          this.customerPayments = payments;
          this.loadingPayments = false;
        },
        error: (error) => {
          console.error('Error loading customer payments:', error);
          this.showError('Error al cargar los pagos del cliente');
          this.loadingPayments = false;
        }
      });
  }
  
  /**
   * Obtiene las cuotas disponibles basadas en el estado actual
   */
  getAvailableInstallments(): {value: string, label: string}[] {
    const status = this.data.commission.payment_verification_status;
    
    if (status === 'pending_verification') {
      return [{ value: 'first', label: 'Primera cuota' }];
    } else if (status === 'first_payment_verified') {
      return [{ value: 'second', label: 'Segunda cuota' }];
    }
    
    return this.installmentOptions;
  }
  
  /**
   * Verifica si un pago puede ser seleccionado
   */
  canSelectPayment(payment: CustomerPayment): boolean {
    // Todos los pagos registrados pueden ser seleccionados
    return true;
  }
  
  /**
   * Obtiene el texto descriptivo del pago
   */
  getPaymentDescription(payment: CustomerPayment): string {
    const date = new Date(payment.payment_date).toLocaleDateString('es-ES');
    const amount = payment.amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'PEN'
    });
    return `${date} - ${amount} (${payment.payment_method})`;
  }
  
  /**
   * Procesa la verificación manual
   */
  onSubmit(): void {
    if (this.verificationForm.valid) {
      this.loading = true;
      
      const request: VerifyPaymentRequest = {
        commission_id: this.data.commission.commission_id,
        customer_payment_id: this.verificationForm.value.customer_payment_id,
        payment_installment: this.verificationForm.value.payment_installment,
        verification_notes: this.verificationForm.value.verification_notes
      };
      
      this.commissionVerificationService.verifyPayment(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.showSuccess('Verificación procesada exitosamente');
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error verifying payment:', error);
            this.showError(error.error?.message || 'Error al procesar la verificación');
            this.loading = false;
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }
  
  /**
   * Cancela la verificación
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
  
  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched(): void {
    Object.keys(this.verificationForm.controls).forEach(key => {
      this.verificationForm.get(key)?.markAsTouched();
    });
  }
  
  /**
   * Obtiene el mensaje de error para un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.verificationForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    
    return '';
  }
  
  /**
   * Obtiene la etiqueta de un campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: {[key: string]: string} = {
      customer_payment_id: 'Pago del cliente',
      payment_installment: 'Cuota de pago'
    };
    return labels[fieldName] || fieldName;
  }
  
  /**
   * Verifica si un campo tiene errores
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.verificationForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
  
  /**
   * Obtiene el estado de verificación actual en texto
   */
  getCurrentStatusText(): string {
    return this.commissionVerificationService.getVerificationStatusText(
      this.data.commission.payment_verification_status
    );
  }
  
  /**
   * Obtiene la clase CSS del estado actual
   */
  getCurrentStatusClass(): string {
    return this.commissionVerificationService.getVerificationStatusClass(
      this.data.commission.payment_verification_status
    );
  }
  
  /**
   * Muestra mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }
  
  /**
   * Muestra mensaje de error
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}