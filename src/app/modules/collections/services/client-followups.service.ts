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

  async exportPersonalReport(record: ClientFollowupRecord): Promise<void> {
    const filename = `reporte-seguimiento-${record.sale_code || 'cliente'}`;
    // Obtener historial de logs para este cliente
    const fid = (record as any).followup_id;
    const cid = (record as any).client_id;
    let logs: any[] = [];
    if (fid || cid) {
      try {
        const response = await this.listLogs({ followup_id: fid, client_id: cid }).toPromise();
        logs = response || [];
      } catch (e) {
        logs = [];
      }
    }
    return this.exportToExcel([record], filename, logs);
  }

  async exportToExcel(data: ClientFollowupRecord[], filename: string = 'gestion-cobranzas', logsData?: any[]): Promise<void> {
    const workbook = new Workbook();
    workbook.creator = 'Casa Bonita - Cobranzas';

    // Paleta Casa Bonita (logo: negro, blanco, dorado)
    const gold = 'FFCC9933';                 // dorado del marco del logo
    const black = 'FF000000';
    const creamLight = 'FFFFFBF5';           // crema muy suave (zebra)
    const creamBorder = 'FFE8DCC4';           // borde dorado suave
    const headerBg = gold;
    const headerFg = black;
    const subtitleBg = creamLight;
    const subtitleFg = black;
    const borderColor = creamBorder;
    const zebraBg = creamLight;
    const textColor = black;
    const overdueBg = 'FFFFF5F5';            // rojo muy suave para vencidas
    const tabColor = gold;

    // ===== HOJA 1: DATOS PRINCIPALES =====
    const sheet = workbook.addWorksheet('Seguimiento', {
      properties: { tabColor: { argb: tabColor } }
    });

    sheet.mergeCells('A1:AJ1');
    const title = sheet.getCell('A1');
    title.value = 'Gestión de cobranzas – Seguimiento de clientes';
    title.font = { bold: true, size: 14, color: { argb: headerFg } };
    title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:AJ2');
    const subtitle = sheet.getCell('A2');
    subtitle.value = `Generado: ${new Date().toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}  |  Registros: ${data.length}`;
    subtitle.font = { size: 10, color: { argb: subtitleFg } };
    subtitle.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    subtitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subtitleBg } };
    sheet.getRow(2).height = 22;

    sheet.addRow([]);

    const clientHeaders = ['Cód. venta', 'Cliente', 'DNI', 'Tel. 1', 'Tel. 2', 'Correo', 'Dirección', 'Distrito', 'Provincia', 'Departamento', 'Asesor'];
    const financialHeaders = ['Lote', 'Precio venta', 'Pagado', 'Por pagar', 'Cuota mens.', 'Cuotas pag.', 'Cuotas pend.', 'Total cuotas', 'Cuotas venc.'];
    const managementHeaders = ['Vencimiento', 'Estado contrato', 'Últ. contacto', 'Acción', 'Resultado', 'Observaciones', 'Fecha visita', 'Motivo visita', 'Resultado visita', 'Notas visita', 'Estado gestión', 'Próxima acción', 'Responsable', 'Notas generales', 'Motivo'];
    const allHeaders = [...clientHeaders, ...financialHeaders, ...managementHeaders];

    const headerRow = sheet.addRow(allHeaders);
    headerRow.font = { bold: true, size: 10, color: { argb: headerFg } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    headerRow.height = 24;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, size: 10, color: { argb: headerFg } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: borderColor } },
        bottom: { style: 'thin', color: { argb: borderColor } },
        left: { style: 'thin', color: { argb: borderColor } },
        right: { style: 'thin', color: { argb: borderColor } }
      };
    });

    data.forEach((r, idx) => {
      const rowData = [
        r.sale_code, r.client_name, r.dni, r.phone1, r.phone2 ?? '', r.email ?? '', r.address ?? '',
        r.district ?? '', r.province ?? '', r.department ?? '', r.advisor_name ?? '',
        r.lot ?? '', r.sale_price ?? 0, r.amount_paid ?? 0, r.amount_due ?? 0, r.monthly_quota ?? 0,
        r.paid_installments ?? 0, r.pending_installments ?? 0, r.total_installments ?? 0, r.overdue_installments ?? 0,
        r.due_date ?? '', r.contract_status ?? '', r.contact_date ?? '', r.action_taken ?? '', r.management_result ?? '',
        r.management_notes ?? '', r.home_visit_date ?? '', r.home_visit_reason ?? '', r.home_visit_result ?? '',
        r.home_visit_notes ?? '', r.management_status ?? '', r.next_action ?? '', r.owner ?? '',
        r.general_notes ?? '', r.general_reason ?? ''
      ];

      const row = sheet.addRow(rowData);
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : zebraBg;
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      row.font = { color: { argb: textColor }, size: 10 };
      row.alignment = { vertical: 'middle', wrapText: true };
      row.height = 22;

      row.eachCell(cell => {
        cell.font = { color: { argb: textColor }, size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: borderColor } },
          left: { style: 'thin', color: { argb: borderColor } },
          bottom: { style: 'thin', color: { argb: borderColor } },
          right: { style: 'thin', color: { argb: borderColor } }
        };
      });

      [13, 14, 15, 16].forEach(col => {
        const cell = row.getCell(col);
        cell.numFmt = 'S/ #,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      });
      [17, 18, 19, 20].forEach(col => {
        row.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const overdueCell = row.getCell(20);
      const overdueVal = Number(overdueCell.value ?? 0);
      if (overdueVal > 0) {
        overdueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: overdueBg } };
      }

      const statusCell = row.getCell(31);
      const statusLabels: Record<string, string> = {
        pending: 'Pendiente',
        in_progress: 'En proceso',
        resolved: 'Resuelto',
        unreachable: 'No contactado',
        escalated: 'Escalado'
      };
      const status = String(statusCell.value ?? '').toLowerCase();
      statusCell.value = statusLabels[status] || statusCell.value || '—';
      statusCell.alignment = { horizontal: 'left', vertical: 'middle' };
    });

    const columnWidths = [14, 28, 11, 14, 14, 26, 32, 18, 18, 18, 22, 18, 14, 14, 14, 14, 11, 11, 11, 11, 16, 18, 16, 18, 18, 36, 16, 26, 22, 36, 16, 26, 22, 36, 26];
    columnWidths.forEach((w, i) => sheet.getColumn(i + 1).width = w);

    sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: allHeaders.length } };
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    // ===== HOJA 2: HISTORIAL =====
    if (logsData && logsData.length > 0) {
      const logsSheet = workbook.addWorksheet('Historial', {
        properties: { tabColor: { argb: tabColor } }
      });

      logsSheet.mergeCells('A1:G1');
      const logsTitle = logsSheet.getCell('A1');
      logsTitle.value = 'Historial de gestiones';
      logsTitle.font = { bold: true, size: 14, color: { argb: headerFg } };
      logsTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      logsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
      logsSheet.getRow(1).height = 28;

      logsSheet.mergeCells('A2:G2');
      const logsSubtitle = logsSheet.getCell('A2');
      logsSubtitle.value = `Total: ${logsData.length} gestiones`;
      logsSubtitle.font = { size: 10, color: { argb: subtitleFg } };
      logsSubtitle.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      logsSubtitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subtitleBg } };
      logsSheet.getRow(2).height = 22;

      logsSheet.addRow([]);

      const logsHeaders = ['Fecha y hora', 'Canal', 'Resultado', 'Responsable', 'Cliente', 'Contrato', 'Observaciones'];
      const logsHeaderRow = logsSheet.addRow(logsHeaders);
      logsHeaderRow.font = { bold: true, size: 10, color: { argb: headerFg } };
      logsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
      logsHeaderRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      logsHeaderRow.height = 24;
      logsHeaderRow.eachCell(cell => {
        cell.font = { bold: true, size: 10, color: { argb: headerFg } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.border = {
          top: { style: 'thin', color: { argb: borderColor } },
          bottom: { style: 'thin', color: { argb: borderColor } },
          left: { style: 'thin', color: { argb: borderColor } },
          right: { style: 'thin', color: { argb: borderColor } }
        };
      });

      const channelLabels: Record<string, string> = {
        call: 'Llamada',
        whatsapp: 'WhatsApp',
        email: 'Email',
        letter: 'Carta',
        home_visit: 'Visita',
        sms: 'SMS'
      };
      const resultLabels: Record<string, string> = {
        contacted: 'Contactado',
        sent: 'Enviado',
        letter_sent: 'Carta enviada',
        unreachable: 'No responde',
        resolved: 'Resuelto',
        promise: 'Compromiso'
      };

      logsData.forEach((log, idx) => {
        const rowData = [
          log.logged_at ?? '',
          channelLabels[log.channel] ?? log.channel ?? '—',
          resultLabels[log.result] ?? log.result ?? '—',
          log.employee_name ?? '—',
          log.client_name ?? '—',
          log.sale_code ?? '—',
          log.notes ?? '—'
        ];

        const logRow = logsSheet.addRow(rowData);
        const bg = idx % 2 === 0 ? 'FFFFFFFF' : zebraBg;
        logRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        logRow.font = { color: { argb: textColor }, size: 10 };
        logRow.alignment = { vertical: 'middle', wrapText: true };
        logRow.height = 20;

        logRow.eachCell(cell => {
          cell.font = { color: { argb: textColor }, size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } }
          };
        });

        const dateCell = logRow.getCell(1);
        if (dateCell.value) {
          try {
            const date = new Date(dateCell.value as string);
            dateCell.value = date;
            dateCell.numFmt = 'dd/mm/yyyy hh:mm';
          } catch (_) {}
        }
      });

      [22, 14, 14, 22, 26, 14, 48].forEach((w, i) => logsSheet.getColumn(i + 1).width = w);
      logsSheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 7 } };
      logsSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
    }

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

  getPreventive(window = 15) {
    return this.listPreventive(window).pipe(
      map((arr) => Array.isArray(arr) ? arr as ClientFollowupRecord[] : []),
      tap((list) => this.subject.next(list))
    );
  }

  listMora(tramo: '1'|'2'|'3' = '1') {
    const url = `${API_ROUTES.COLLECTIONS.BASE}/segments/mora?tramo=${tramo}`;
    return this.http.get<any>(url).pipe(map(res => (res?.data ?? [])));
  }

  ensureFromContract(contractId: number) {
    const url = `${this.baseUrl}/from-contract/${contractId}`;
    return this.http.post(url, {});
  }

  getMora(tramo: number) {
    const tramoStr = String(tramo) as '1'|'2'|'3';
    return this.listMora(tramoStr).pipe(
      map((arr) => Array.isArray(arr) ? arr as ClientFollowupRecord[] : []),
      tap((list) => this.subject.next(list))
    );
  }

  logAction(payload: {followup_id?: number, client_id: number, employee_id?: number, channel: string, result?: string, notes?: string, logged_at?: string}) {
    const url = `${API_ROUTES.COLLECTIONS.BASE}/followup-logs`;
    return this.http.post(url, payload);
  }

  listLogs(params: {followup_id?: number|string, client_id?: number|string}) {
    const q: string[] = [];
    if (params.followup_id !== undefined && params.followup_id !== null) q.push(`followup_id=${encodeURIComponent(String(params.followup_id))}`);
    if (params.client_id !== undefined && params.client_id !== null) q.push(`client_id=${encodeURIComponent(String(params.client_id))}`);
    const url = `${API_ROUTES.COLLECTIONS.BASE}/followup-logs${q.length ? ('?' + q.join('&')) : ''}`;
    return this.http.get<any>(url).pipe(map(res => (res?.data ?? [])));
  }
  sendEmail(to: string, subject: string, html: string) {
    const url = `${API_ROUTES.COLLECTIONS.BASE}/notifications/send-custom`;
    return this.http.post(url, { email: to, subject, html });
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

  setCommitmentStatus(id: number, commitment_status: 'pending' | 'fulfilled' | 'broken' | 'cancelled') {
    const url = `${this.baseUrl}/${id}/commitment-status`;
    return this.http.put(url, { commitment_status }).pipe(tap((res: any) => {
      const updated: ClientFollowupRecord = res?.data;
      if (updated) {
        const next = this.subject.getValue().map(r => (String(r.sale_code) === String(updated.sale_code)) ? { ...r, ...updated } : r);
        this.subject.next(next);
      }
    }));
  }

  /**
   * Ejecutar acción rápida de comunicación
   */
  quickAction(
    followupId: number, 
    channel: 'whatsapp' | 'sms' | 'email' | 'call' | 'letter', 
    message?: string, 
    subject?: string,
    useContractId: boolean = false,
    meta?: { notes?: string; result?: string }
  ) {
    const url = `${this.baseUrl}/${followupId}/quick-action`;
    const payload: any = { channel };
    if (message) payload.message = message;
    if (subject) payload.subject = subject;
    if (useContractId) payload.use_contract_id = true;
    if (meta?.notes) payload.notes = meta.notes;
    if (meta?.result) payload.result = meta.result;
    return this.http.post(url, payload);
  }

  /**
   * Enviar WhatsApp con mensaje predeterminado o personalizado
   */
  sendWhatsApp(followupId: number, customMessage?: string, useContractId: boolean = false) {
    return this.quickAction(followupId, 'whatsapp', customMessage, undefined, useContractId);
  }

  /**
   * Enviar SMS con mensaje predeterminado o personalizado
   */
  sendSMS(followupId: number, customMessage?: string, useContractId: boolean = false) {
    return this.quickAction(followupId, 'sms', customMessage, undefined, useContractId);
  }

  /**
   * Enviar Email con asunto y mensaje personalizados
   */
  sendEmailAction(followupId: number, subject?: string, message?: string, useContractId: boolean = false) {
    return this.quickAction(followupId, 'email', message, subject, useContractId);
  }

  /**
   * Registrar llamada telefónica
   */
  registerCall(followupId: number, notes?: string, useContractId: boolean = false) {
    return this.quickAction(followupId, 'call', undefined, undefined, useContractId, { notes, result: 'contacted' });
  }

  /**
   * Registrar envío de carta
   */
  registerLetter(followupId: number, notes?: string, useContractId: boolean = false) {
    return this.quickAction(followupId, 'letter', undefined, undefined, useContractId, { notes, result: 'sent' });
  }
}
