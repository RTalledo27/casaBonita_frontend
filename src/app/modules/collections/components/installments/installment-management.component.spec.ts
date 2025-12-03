import { TestBed } from '@angular/core/testing';
import { InstallmentManagementComponent } from './installment-management.component';
import { CollectionsSimplifiedService } from '../../services/collections-simplified.service';
import { of } from 'rxjs';

describe('InstallmentManagementComponent', () => {
  let component: InstallmentManagementComponent;
  let serviceSpy: jasmine.SpyObj<CollectionsSimplifiedService>;

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('CollectionsSimplifiedService', ['sendCustomEmailForSchedule']);
    TestBed.configureTestingModule({
      imports: [InstallmentManagementComponent],
      providers: [{ provide: CollectionsSimplifiedService, useValue: serviceSpy }]
    });
    const fixture = TestBed.createComponent(InstallmentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate custom message length', () => {
    component.openCustomMessageModal({ schedule_id: 1 } as any);
    component.customMessageForm.controls['message'].setValue('abcd');
    expect(component.customMessageForm.valid).toBeFalse();
    component.customMessageForm.controls['message'].setValue('mensaje válido con más de diez caracteres');
    expect(component.customMessageForm.valid).toBeTrue();
  });

  it('should build preview html', () => {
    component.openCustomMessageModal({ schedule_id: 1 } as any);
    component.customMessageForm.setValue({
      subject: 's', template: '', message: 'hola', font: 'Arial', color: '#111827', imageUrl: ''
    });
    const html = component.previewHtml();
    expect(html).toContain('hola');
  });

  it('should call service to send custom message', () => {
    component.selectedScheduleForMessage.set({ schedule_id: 5 } as any);
    component.customMessageForm.setValue({
      subject: 's', template: '', message: 'mensaje válido con más de diez caracteres', font: 'Arial', color: '#111827', imageUrl: ''
    });
    serviceSpy.sendCustomEmailForSchedule.and.returnValue(of({ success: true }));
    component.sendCustomMessage();
    expect(serviceSpy.sendCustomEmailForSchedule).toHaveBeenCalled();
  });
});

