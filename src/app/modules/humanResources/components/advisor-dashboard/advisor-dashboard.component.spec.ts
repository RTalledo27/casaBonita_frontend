import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvisorDashboardComponent } from './advisor-dashboard.component';

describe('AdvisorDashboardComponent', () => {
  let component: AdvisorDashboardComponent;
  let fixture: ComponentFixture<AdvisorDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvisorDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvisorDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
