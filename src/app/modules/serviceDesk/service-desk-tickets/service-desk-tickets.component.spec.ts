import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceDeskTicketsComponent } from './service-desk-tickets.component';

describe('ServiceDeskTicketsComponent', () => {
  let component: ServiceDeskTicketsComponent;
  let fixture: ComponentFixture<ServiceDeskTicketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceDeskTicketsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceDeskTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
