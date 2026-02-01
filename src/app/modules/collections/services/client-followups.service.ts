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
    
    // ===== HOJA 1: DATOS PRINCIPALES =====
    const sheet = workbook.addWorksheet('Datos de Seguimiento', {
      properties: { tabColor: { argb: 'FF6366F1' } }
    });

    // Título principal con gradiente moderno
    sheet.mergeCells('A1:AJ1');
    const title = sheet.getCell('A1');
    title.value = '📊 GESTIÓN DE COBRANZAS - SEGUIMIENTO DE CLIENTES';
    title.font = { bold: true, size: 20, color: { argb: 'FFFFFFFF' } };
    title.alignment = { vertical: 'middle', horizontal: 'center' };
    title.fill = { type: 'gradient', gradient: 'angle', degree: 90, stops: [
      { position: 0, color: { argb: 'FF6366F1' } },
      { position: 0.5, color: { argb: 'FF8B5CF6' } },
      { position: 1, color: { argb: 'FFA855F7' } }
    ]};
    sheet.getRow(1).height = 35;

    // Subtítulo con fecha
    sheet.mergeCells('A2:AJ2');
    const subtitle = sheet.getCell('A2');
    subtitle.value = `📅 Generado: ${new Date().toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'short' })} | Total registros: ${data.length}`;
    subtitle.font = { italic: true, size: 11, color: { argb: 'FF64748B' }, bold: true };
    subtitle.alignment = { horizontal: 'center', vertical: 'middle' };
    subtitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    sheet.getRow(2).height = 25;

    // Espacio
    sheet.addRow([]);

    // Sección 1: INFORMACIÓN DEL CLIENTE
    sheet.mergeCells('A4:K4');
    const section1 = sheet.getCell('A4');
    section1.value = '👤 INFORMACIÓN DEL CLIENTE';
    section1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    section1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    section1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    sheet.getRow(4).height = 25;

    const clientHeaders = ['COD.VENTA', 'Cliente', 'DNI', 'Teléfono 1', 'Teléfono 2', 'Correo', 'Dirección', 'Distrito', 'Provincia', 'Departamento', 'Asesor'];
    const headerRow1 = sheet.addRow(clientHeaders);
    headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    headerRow1.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow1.height = 30;

    // Sección 2: INFORMACIÓN DEL LOTE
    sheet.mergeCells('L4:L4');
    const section2 = sheet.getCell('L4');
    section2.value = '🏡 LOTE';
    section2.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    section2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
    section2.alignment = { horizontal: 'center', vertical: 'middle' };

    // Sección 3: ESTADO FINANCIERO
    sheet.mergeCells('M4:U4');
    const section3 = sheet.getCell('M4');
    section3.value = '💰 ESTADO FINANCIERO';
    section3.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    section3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
    section3.alignment = { horizontal: 'center', vertical: 'middle' };

    // Sección 4: GESTIÓN
    sheet.mergeCells('V4:AJ4');
    const section4 = sheet.getCell('V4');
    section4.value = '📝 GESTIÓN Y SEGUIMIENTO';
    section4.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    section4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
    section4.alignment = { horizontal: 'center', vertical: 'middle' };

    const financialHeaders = ['Lote', 'Precio Venta', 'Monto Pagado', 'Monto por Pagar', 'Cuota Mensual', 'Cuotas Pagadas', 'Cuotas Pendientes', 'Total Cuotas', 'Cuotas Vencidas'];
    const managementHeaders = ['Fecha Vencimiento', 'Estado Contrato', 'Último Contacto', 'Acción Tomada', 'Resultado', 'Observaciones', 'Fecha Visita', 'Motivo Visita', 'Resultado Visita', 'Notas Visita', 'Estado Gestión', 'Próxima Acción', 'Responsable', 'Notas Generales', 'Motivo General'];
    
    const allHeaders = [...clientHeaders, ...financialHeaders, ...managementHeaders];
    const headerRow2 = sheet.getRow(5);
    allHeaders.forEach((h, i) => {
      const cell = headerRow2.getCell(i + 1);
      cell.value = h;
    });

    // Agregar datos
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
      
      // Zebra striping con colores más suaves
      const bgColor = (idx % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      row.font = { color: { argb: 'FF1E293B' }, size: 10 };
      row.alignment = { vertical: 'middle', wrapText: true };
      row.height = 45;

      // Bordes elegantes
      row.eachCell((cell, colNum) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });

      // Formatos numéricos para montos
      [13, 14, 15, 16].forEach(col => {
        const cell = row.getCell(col);
        cell.numFmt = 'S/ #,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // Formatos de número para cuotas
      [17, 18, 19, 20].forEach(col => {
        const cell = row.getCell(col);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { ...cell.font, bold: true };
      });

      // Colorear cuotas vencidas
      const overdueCell = row.getCell(20);
      const overdueVal = Number(overdueCell.value || 0);
      if (overdueVal > 0) {
        overdueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
        overdueCell.font = { color: { argb: 'FFDC2626' }, bold: true, size: 11 };
      }

      // Estado de gestión con colores
      const statusCell = row.getCell(31);
      const status = String(statusCell.value || '').toLowerCase();
      const statusStyles: Record<string, {bg: string, fg: string, text: string}> = {
        pending: { bg: 'FFFEF3C7', fg: 'FF92400E', text: '⏳ Pendiente' },
        in_progress: { bg: 'FFDBEAFE', fg: 'FF5B21B6', text: '🔄 En Proceso' },
        resolved: { bg: 'FFD1FAE5', fg: 'FF065F46', text: '✅ Resuelto' },
        unreachable: { bg: 'FFF1F5F9', fg: 'FF475569', text: '❌ No Contactado' },
        escalated: { bg: 'FFFECACA', fg: 'FFDC2626', text: '⚠️ Escalado' },
      };
      const style = statusStyles[status] || { bg: 'FFF1F5F9', fg: 'FF64748B', text: String(statusCell.value || '—') };
      statusCell.value = style.text;
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.bg } };
      statusCell.font = { color: { argb: style.fg }, bold: true, size: 10 };
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Anchos de columna optimizados
    const columnWidths = [15, 30, 12, 15, 15, 30, 35, 20, 20, 20, 25, 20, 15, 15, 15, 15, 12, 12, 12, 12, 18, 20, 18, 20, 20, 40, 18, 30, 25, 40, 18, 30, 25, 40, 30];
    columnWidths.forEach((w, i) => sheet.getColumn(i + 1).width = w);

    sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: allHeaders.length } };
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

    // ===== HOJA 2: HISTORIAL DE ACCIONES =====
    if (logsData && logsData.length > 0) {
      const logsSheet = workbook.addWorksheet('Historial de Gestiones', {
        properties: { tabColor: { argb: 'FF10B981' } }
      });

      // Título
      logsSheet.mergeCells('A1:G1');
      const logsTitle = logsSheet.getCell('A1');
      logsTitle.value = '📋 HISTORIAL DETALLADO DE GESTIONES Y ACCIONES';
      logsTitle.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
      logsTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      logsTitle.fill = { type: 'gradient', gradient: 'angle', degree: 90, stops: [
        { position: 0, color: { argb: 'FF10B981' } },
        { position: 1, color: { argb: 'FF059669' } }
      ]};
      logsSheet.getRow(1).height = 35;

      // Subtítulo
      logsSheet.mergeCells('A2:G2');
      const logsSubtitle = logsSheet.getCell('A2');
      logsSubtitle.value = `Total de gestiones registradas: ${logsData.length}`;
      logsSubtitle.font = { italic: true, size: 11, color: { argb: 'FF64748B' }, bold: true };
      logsSubtitle.alignment = { horizontal: 'center', vertical: 'middle' };
      logsSubtitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      logsSheet.getRow(2).height = 22;

      logsSheet.addRow([]);

      // Headers
      const logsHeaders = ['Fecha y Hora', 'Canal', 'Resultado', 'Responsable', 'Cliente', 'Contrato', 'Observaciones'];
      const logsHeaderRow = logsSheet.addRow(logsHeaders);
      logsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      logsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      logsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      logsHeaderRow.height = 30;

      // Datos
      logsData.forEach((log, idx) => {
        const channelMap: Record<string, string> = {
          call: '📞 Llamada',
          whatsapp: '💬 WhatsApp',
          email: '📧 Email',
          letter: '✉️ Carta',
          home_visit: '🏠 Visita',
          sms: '💬 SMS'
        };
        const resultMap: Record<string, string> = {
          contacted: '✅ Contactado',
          sent: '📤 Enviado',
          letter_sent: '📮 Carta Enviada',
          unreachable: '❌ No Responde',
          resolved: '✔️ Resuelto',
          promise: '🤝 Compromiso'
        };

        const rowData = [
          log.logged_at || '',
          channelMap[log.channel] || log.channel || '—',
          resultMap[log.result] || log.result || '—',
          log.employee_name || '—',
          log.client_name || '—',
          log.sale_code || '—',
          log.notes || '—'
        ];

        const logRow = logsSheet.addRow(rowData);
        
        // Zebra striping
        const bgColor = (idx % 2 === 0) ? 'FFFFFFFF' : 'FFF0FDF4';
        logRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        logRow.font = { color: { argb: 'FF1E293B' }, size: 10 };
        logRow.alignment = { vertical: 'middle', wrapText: true };
        logRow.height = 40;

        // Bordes
        logRow.eachCell(cell => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1FAE5' } },
            left: { style: 'thin', color: { argb: 'FFD1FAE5' } },
            bottom: { style: 'thin', color: { argb: 'FFD1FAE5' } },
            right: { style: 'thin', color: { argb: 'FFD1FAE5' } }
          };
        });

        // Formato de fecha
        const dateCell = logRow.getCell(1);
        if (dateCell.value) {
          try {
            const date = new Date(dateCell.value as string);
            dateCell.value = date;
            dateCell.numFmt = 'dd/mm/yyyy hh:mm AM/PM';
          } catch (e) {}
        }

        // Color por canal
        const channelCell = logRow.getCell(2);
        const channelColors: Record<string, string> = {
          '📞 Llamada': 'FFDBEAFE',
          '💬 WhatsApp': 'FFD1FAE5',
          '📧 Email': 'FFFEF3C7',
          '✉️ Carta': 'FFFECACA',
          '🏠 Visita': 'FFE0E7FF'
        };
        const channelColor = channelColors[String(channelCell.value)] || 'FFF1F5F9';
        channelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: channelColor } };
        channelCell.font = { ...channelCell.font, bold: true };
        channelCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Color por resultado
        const resultCell = logRow.getCell(3);
        const resultColors: Record<string, {bg: string, fg: string}> = {
          '✅ Contactado': { bg: 'FFD1FAE5', fg: 'FF065F46' },
          '✔️ Resuelto': { bg: 'FFBEF264', fg: 'FF3F6212' },
          '❌ No Responde': { bg: 'FFFECACA', fg: 'FFDC2626' },
          '📤 Enviado': { bg: 'FFDBEAFE', fg: 'FF5B21B6' },
          '🤝 Compromiso': { bg: 'FFFEF3C7', fg: 'FF92400E' }
        };
        const resultStyle = resultColors[String(resultCell.value)] || { bg: 'FFF1F5F9', fg: 'FF64748B' };
        resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: resultStyle.bg } };
        resultCell.font = { color: { argb: resultStyle.fg }, bold: true, size: 10 };
        resultCell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Anchos
      [25, 20, 20, 25, 30, 18, 50].forEach((w, i) => logsSheet.getColumn(i + 1).width = w);
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
