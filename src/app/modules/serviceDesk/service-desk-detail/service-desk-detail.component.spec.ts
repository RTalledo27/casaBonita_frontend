import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceDeskDetailComponent } from './service-desk-detail.component';

describe('ServiceDeskDetailComponent', () => {
  let component: ServiceDeskDetailComponent;
  let fixture: ComponentFixture<ServiceDeskDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceDeskDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceDeskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
