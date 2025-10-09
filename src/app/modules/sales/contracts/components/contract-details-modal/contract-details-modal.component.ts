import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal } from '@angular/core';
import { LucideAngularModule, X, User, MapPin, DollarSign, Calendar, FileText, CreditCard } from 'lucide-angular';
import { ContractsService } from '../../../services/contracts.service';
import { Contract } from '../../../models/contract';
import { ClientsService } from '../../../../CRM/services/clients.service';
import { Client } from '../../../../CRM/models/client';

@Component({
  selector: 'app-contract-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './contract-details-modal.component.html',
  styleUrl: './contract-details-modal.component.scss'
})
export class ContractDetailsModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() contractId: number | null = null;
  @Output() closeModal = new EventEmitter<void>();

  // Icons
  XIcon = X;
  UserIcon = User;
  MapPinIcon = MapPin;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  FileTextIcon = FileText;
  CreditCardIcon = CreditCard;

  // State
  contract = signal<Contract | null>(null);
  data = signal<any | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  clientData = signal<Client | null>(null);
  clientLoading = signal(false);

  constructor(
    private contractsService: ContractsService,
    private clientsService: ClientsService
  ) {}

  ngOnInit() {
    console.log('🚀 CONTRACT MODAL INIT 🚀');
    console.log('ContractDetailsModal ngOnInit - isOpen:', this.isOpen, 'contractId:', this.contractId);
    console.log('Modal component initialized');
    if (this.contractId && this.isOpen) {
      this.loadContractDetails();
    }
  }

  ngOnChanges() {
    console.log('🔄 CONTRACT MODAL CHANGES 🔄');
    console.log('ContractDetailsModal ngOnChanges - isOpen:', this.isOpen, 'contractId:', this.contractId);
    console.log('Modal inputs changed');
    console.log('Should show modal?', this.isOpen && this.contractId);
    if (this.contractId && this.isOpen) {
      console.log('Loading contract details...');
      this.loadContractDetails();
    } else {
      console.log('Not loading contract details - missing contractId or modal not open');
    }
  }

  private loadContractDetails() {
    if (!this.contractId) {
      console.error('❌ No contract ID provided');
      this.error.set('No se proporcionó un ID de contrato válido');
      return;
    }

    console.log('🔄 Loading contract details for ID:', this.contractId);
    this.loading.set(true);
    this.error.set(null);
    this.contract.set(null);

    this.contractsService.get(this.contractId).subscribe({
      next: (contract) => {
        this.data.set(contract);
        console.log('✅ Contract loaded successfully:', contract);
        console.log('📊 Contract data structure:', JSON.stringify(contract, null, 2));
        this.contract.set(contract);
        this.loading.set(false);
        
        // Buscar información adicional del cliente
        if (contract.client_name) {
          this.searchClientByName(contract.client_name);
        }
      },
      error: (err) => {
        console.error('❌ Error loading contract:', err);
        console.error('📋 Error details:', JSON.stringify(err, null, 2));
        this.error.set(`Error al cargar los detalles del contrato: ${err.message || err.error?.message || 'Error desconocido'}`);
        this.loading.set(false);
      }
    });
  }

  private searchClientByName(clientName: string) {
    console.log('🔍 Searching for client:', clientName);
    this.clientLoading.set(true);
    
    this.clientsService.searchByName(clientName).subscribe({
      next: (clients) => {
        console.log('✅ Client search results:', clients);
        if (clients && clients.length > 0) {
          // Buscar coincidencia exacta o la más cercana
          const exactMatch = clients.find(client => 
            `${client.first_name} ${client.last_name}`.toLowerCase() === clientName.toLowerCase()
          );
          
          const selectedClient = exactMatch || clients[0];
          this.clientData.set(selectedClient);
          console.log('📋 Selected client data:', selectedClient);
        } else {
          console.log('⚠️ No client found for name:', clientName);
          this.clientData.set(null);
        }
        this.clientLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error searching client:', err);
        this.clientData.set(null);
        this.clientLoading.set(false);
      }
    });
  }

  onClose() {
    this.closeModal.emit();
    this.contract.set(null);
    this.error.set(null);
    this.clientData.set(null);
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'active': 'Activo',
      'pending': 'Pendiente',
      'cancelled': 'Cancelado',
      'completed': 'Completado'
    };
    return statusTexts[status] || status;
  }

  getAdvisorInitials(): string {
    const fullName = this.contract()?.advisor?.full_name;
    if (!fullName) return 'SA';
    
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}