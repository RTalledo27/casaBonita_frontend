import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Collector {
  id: number;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  efficiency_rate?: number;
  total_collections?: number;
  assigned_contracts?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollectorsService {
  private collectors = signal<Collector[]>([
    {
      id: 1,
      name: 'María González',
      email: 'maria.gonzalez@casabonita.com',
      phone: '+1234567890',
      active: true,
      efficiency_rate: 85.5,
      total_collections: 125000,
      assigned_contracts: 45
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@casabonita.com',
      phone: '+1234567891',
      active: true,
      efficiency_rate: 92.3,
      total_collections: 180000,
      assigned_contracts: 38
    },
    {
      id: 3,
      name: 'Ana Martínez',
      email: 'ana.martinez@casabonita.com',
      phone: '+1234567892',
      active: true,
      efficiency_rate: 78.9,
      total_collections: 95000,
      assigned_contracts: 52
    },
    {
      id: 4,
      name: 'Luis Fernández',
      email: 'luis.fernandez@casabonita.com',
      phone: '+1234567893',
      active: false,
      efficiency_rate: 65.2,
      total_collections: 75000,
      assigned_contracts: 28
    }
  ]);

  getCollectors(): Observable<Collector[]> {
    return of(this.collectors());
  }

  getActiveCollectors(): Observable<Collector[]> {
    return of(this.collectors().filter(c => c.active));
  }

  getCollectorById(id: number): Observable<Collector | undefined> {
    return of(this.collectors().find(c => c.id === id));
  }

  getCollectorEfficiency(collectorId: number): Observable<{
    efficiency_rate: number;
    collections_this_month: number;
    target_amount: number;
    recovered_amount: number;
    pending_amount: number;
  }> {
    const collector = this.collectors().find(c => c.id === collectorId);
    
    // Mock data for efficiency metrics
    return of({
      efficiency_rate: collector?.efficiency_rate || 0,
      collections_this_month: Math.floor(Math.random() * 50) + 10,
      target_amount: 150000,
      recovered_amount: collector?.total_collections || 0,
      pending_amount: Math.floor(Math.random() * 50000) + 10000
    });
  }

  getCollectorProductivity(collectorId: number, dateFrom: string, dateTo: string): Observable<{
    calls_made: number;
    successful_contacts: number;
    payments_received: number;
    amount_collected: number;
    contracts_resolved: number;
    average_call_duration: number;
  }> {
    // Mock productivity data
    return of({
      calls_made: Math.floor(Math.random() * 200) + 50,
      successful_contacts: Math.floor(Math.random() * 100) + 25,
      payments_received: Math.floor(Math.random() * 30) + 5,
      amount_collected: Math.floor(Math.random() * 100000) + 20000,
      contracts_resolved: Math.floor(Math.random() * 15) + 3,
      average_call_duration: Math.floor(Math.random() * 300) + 120 // seconds
    });
  }

  updateCollector(collector: Collector): Observable<Collector> {
    const currentCollectors = this.collectors();
    const index = currentCollectors.findIndex(c => c.id === collector.id);
    
    if (index !== -1) {
      currentCollectors[index] = collector;
      this.collectors.set([...currentCollectors]);
    }
    
    return of(collector);
  }

  addCollector(collector: Omit<Collector, 'id'>): Observable<Collector> {
    const currentCollectors = this.collectors();
    const newId = Math.max(...currentCollectors.map(c => c.id)) + 1;
    const newCollector = { ...collector, id: newId };
    
    this.collectors.set([...currentCollectors, newCollector]);
    
    return of(newCollector);
  }

  deleteCollector(id: number): Observable<boolean> {
    const currentCollectors = this.collectors();
    const filteredCollectors = currentCollectors.filter(c => c.id !== id);
    
    this.collectors.set(filteredCollectors);
    
    return of(true);
  }
}