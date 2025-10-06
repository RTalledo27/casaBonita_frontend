import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashhooardComponent } from './admin-dashhoard.component';

describe('AdminDashhoardComponent', () => {
  let component: AdminDashhooardComponent;
  let fixture: ComponentFixture<AdminDashhooardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashhooardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashhooardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
