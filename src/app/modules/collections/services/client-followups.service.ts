import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ClientFollowupRecord } from '../models/client-followup';
import { Workbook } from 'exceljs';
import { HttpClient } from '@angular/common/http';
import { API_ROUTES } from '../../../core/constants/api.routes';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ClientFollowupsService {
  private subject = new BehaviorSubject<ClientFollowupRecord[]>([]);
  records$: Observable<ClientFollowupRecord[]> = this.subject.asObservable();
  private baseUrl = `${API_ROUTES.COLLECTIONS.BASE}/followups`;

  constructor(private http: HttpClient) {}

  setData(data: ClientFollowupRecord[]): void {
    this.subject.next(data);
  }

  async exportToExcel(data: ClientFollowupRecord[], filename: string = 'gestion-cobranzas'): Promise<void> {
    const workbook = new Workbook();
    workbook.creator = 'Casa Bonita - Cobranzas';
    const sheet = workbook.addWorksheet('Gestión', {
      properties: { tabColor: { argb: 'FF4338CA' } }
    });

    const headers = [
      'COD.VENTA','Cliente','Lote','DNI','TELÉFONO','TELÉFONO 2','CORREO','DIRECCIÓN','DISTRITO','PROVINCIA','DEPARTAMENTO',
      'Fecha de vencimiento/última cuota','Precio de Venta','Monto Pagado','Monto por pagar','CUOTA MENSUAL','Cuotas Canceladas',
      'Cuotas Pendientes de pago','Total de Cuotas','N° de cuotas vencidas','Monto pendiente','FEC.CONTACTO','ACCIÓN REALIZADA',
      'Resultado de la gestión','Observaciones adicionales','Fecha de visita domiciliaria','Motivo de la visita','Resultado de la visita',
      'Observaciones adicionales','Estado de gestión','Último contacto','Próxima acción programada','Responsable','Observaciones generales','MOTIVO'
    ];

    // Title row
    sheet.mergeCells('A1:AI1');
    const title = sheet.getCell('A1');
    title.value = 'Gestión de Cobranzas - Seguimientos de Clientes';
    title.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    title.alignment = { vertical: 'middle', horizontal: 'center' };
    title.fill = { type: 'gradient', gradient: 'angle', degree: 0, stops: [
      { position: 0, color: { argb: 'FF1E3A8A' } },
      { position: 1, color: { argb: 'FF0EA5E9' } }
    ]};
    sheet.getRow(1).height = 28;

    // Subtitle/date row
    sheet.mergeCells('A2:AI2');
    const subtitle = sheet.getCell('A2');
    subtitle.value = `Generado: ${new Date().toLocaleString('es-PE')}`;
    subtitle.font = { italic: true, size: 10, color: { argb: 'FFCBD5E1' } };
    subtitle.alignment = { horizontal: 'center' };

    // Header row
    sheet.addRow(headers);
    sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    sheet.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(3).height = 22;

    // Data rows with zebra striping and number formats
    const currencyCols = [13,14,15,16,21]; // indices based on headers order
    const dateCols = [12,22,25,31,32];

    data.forEach((r, idx) => {
      const row = sheet.addRow([
        r.sale_code, r.client_name, r.lot, r.dni, r.phone1, r.phone2 ?? '', r.email ?? '', r.address ?? '', r.district ?? '', r.province ?? '', r.department ?? '',
        r.due_date ?? '', r.sale_price ?? 0, r.amount_paid ?? 0, r.amount_due ?? 0, r.monthly_quota ?? 0, r.paid_installments ?? 0,
        r.pending_installments ?? 0, r.total_installments ?? 0, r.overdue_installments ?? 0, r.pending_amount ?? 0, r.contact_date ?? '', r.action_taken ?? '',
        r.management_result ?? '', r.management_notes ?? '', r.home_visit_date ?? '', r.home_visit_reason ?? '', r.home_visit_result ?? '',
        r.home_visit_notes ?? '', r.management_status ?? '', r.last_contact ?? '', r.next_action ?? '', r.owner ?? '', r.general_notes ?? '', r.general_reason ?? ''
      ]);

      // Zebra row background
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (idx % 2 === 0) ? 'FF0B1220' : 'FF0F172A' } };
      row.font = { color: { argb: 'FFE5E7EB' } };
      row.alignment = { vertical: 'middle' };

      // Borders
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF233143' } },
          left: { style: 'thin', color: { argb: 'FF233143' } },
          bottom: { style: 'thin', color: { argb: 'FF233143' } },
          right: { style: 'thin', color: { argb: 'FF233143' } }
        };
      });

      // Number/date formats
      currencyCols.forEach(ci => row.getCell(ci).numFmt = '#,##0.00');
      dateCols.forEach(di => { const v = row.getCell(di).value; if (v) row.getCell(di).numFmt = 'dd/mm/yyyy'; });

      // Status color
      const statusCell = row.getCell(30);
      const status = String(statusCell.value || '').toLowerCase();
      const statusColors: Record<string, string> = {
        pending: 'FFF59E0B',
        in_progress: 'FF3B82F6',
        resolved: 'FF10B981',
        unreachable: 'FF64748B',
        escalated: 'FFEF4444',
      };
      const color = statusColors[status] ?? 'FF64748B';
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      statusCell.alignment = { horizontal: 'center' };
    });

    headers.forEach((_, i) => sheet.getColumn(i + 1).width = 20);
    sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: headers.length } };
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async saveRecordPatch(id: string, patch: Partial<ClientFollowupRecord>): Promise<ClientFollowupRecord | null> {
    try {
      const res: any = await this.http.put(`${this.baseUrl}/${encodeURIComponent(id)}`, patch).toPromise();
      const updated: ClientFollowupRecord = res?.data ?? null;
      if (updated) {
        const current = this.subject.getValue();
        const next = current.map(r => (String(r.sale_code) === String(id)) ? { ...r, ...updated } : r);
        this.subject.next(next);
      }
      return updated;
    } catch (e) {
      console.warn('Followups API not yet implemented, local patch only.', e);
      return null;
    }
  }

  async createRecord(record: ClientFollowupRecord): Promise<ClientFollowupRecord> {
    try {
      const res: any = await this.http.post(this.baseUrl, record).toPromise();
      const created: ClientFollowupRecord = res?.data ?? record;
      const current = this.subject.getValue();
      this.subject.next([created, ...current]);
      return created;
    } catch (e) {
      console.warn('Followups create API not yet implemented, local insert only.', e);
      const current = this.subject.getValue();
      this.subject.next([record, ...current]);
      return record;
    }
  }

  list() {
    return this.http.get<any>(this.baseUrl).pipe(
      map((res) => {
        const arr = res?.data?.data ?? res?.data ?? res;
        return Array.isArray(arr) ? arr as ClientFollowupRecord[] : [];
      }),
      tap((list) => this.subject.next(list))
    );
  }

  listPreventive(window = 15) {
    const url = `${API_ROUTES.COLLECTIONS.BASE}/segments/preventive?window=${window}`;
    return this.http.get<any>(url).pipe(map(res => (res?.data ?? [])));
  }

  listMora(tramo: '1'|'2'|'3' = '1') {
    const url = `${API_ROUTES.COLLECTIONS.BASE}/segments/mora?tramo=${tramo}`;
    return this.http.get<any>(url).pipe(map(res => (res?.data ?? [])));
  }

  logAction(payload: {followup_id?: number, client_id: number, employee_id?: number, channel: string, result?: string, notes?: string, logged_at?: string}) {
    const url = `${API_ROUTES.COLLECTIONS.BASE}/followup-logs`;
    return this.http.post(url, payload);
  }

  setCommitment(id: number, data: {commitment_date: string, commitment_amount: number}) {
    const url = `${this.baseUrl}/${id}/commitment`;
    return this.http.put(url, data).pipe(tap((res: any) => {
      const updated: ClientFollowupRecord = res?.data;
      if (updated) {
        const next = this.subject.getValue().map(r => (String(r.sale_code) === String(updated.sale_code)) ? { ...r, ...updated } : r);
        this.subject.next(next);
      }
    }));
  }
}
