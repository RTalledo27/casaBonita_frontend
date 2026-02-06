import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Invoice {
    invoice_id: number;
    document_type: string;
    series: string;
    correlative: number;
    full_number?: string;
    client_name: string;
    client_document_number: string;
    issue_date: string;
    total: number;
    currency: string;
    sunat_status: 'pendiente' | 'enviado' | 'aceptado' | 'observado' | 'rechazado' | 'anulado';
    cdr_description?: string;
    pdf_path?: string;
    xml_content?: string;
    items?: InvoiceItem[];
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price_with_igv: number;
    total?: number;
    unit_code?: string;
}

export interface BillingDashboardStats {
    today: { total: number; count: number; accepted: number; rejected: number };
    month: { total: number; count: number; boletas: number; facturas: number };
    pending: number;
    rejected: number;
    recent: Invoice[];
}

@Injectable({
    providedIn: 'root'
})
export class BillingService {
    private apiUrl = `${environment.apiUrl}/v1/accounting/billing`;
    private invoicesUrl = `${environment.apiUrl}/v1/accounting/invoices`;

    constructor(private http: HttpClient) { }

    getDashboardStats(): Observable<BillingDashboardStats> {
        return this.http.get<BillingDashboardStats>(`${this.apiUrl}/dashboard`);
    }

    getInvoices(filters: any = {}): Observable<any> {
        let params = new HttpParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) params = params.append(key, filters[key]);
        });
        return this.http.get(this.invoicesUrl, { params });
    }

    emitBoleta(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/emit-boleta`, data);
    }

    emitFactura(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/emit-factura`, data);
    }

    emitNotaCredito(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/emit-nota-credito`, data);
    }

    searchClient(document: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/search-client`, { params: { document } });
    }

    getPendingPayments(search?: string): Observable<any[]> {
        let params = new HttpParams();
        if (search) params = params.append('search', search);
        return this.http.get<any[]>(`${this.apiUrl}/pending-payments`, { params });
    }

    resendInvoice(id: number): Observable<any> {
        return this.http.post(`${this.invoicesUrl}/${id}/resend`, {});
    }

    downloadPdf(id: number): Observable<Blob> {
        return this.http.get(`${this.invoicesUrl}/${id}/pdf`, { responseType: 'blob' });
    }

    downloadXml(id: number): void {
        window.open(`${this.invoicesUrl}/${id}/xml`, '_blank');
    }
}
