import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardServiceDeskComponent } from './dashboard-service-desk.component';

describe('DashboardServiceDeskComponent', () => {
  let component: DashboardServiceDeskComponent;
  let fixture: ComponentFixture<DashboardServiceDeskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardServiceDeskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardServiceDeskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
