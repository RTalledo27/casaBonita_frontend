import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashhoardComponent } from './admin-dashhoard.component';

describe('AdminDashhoardComponent', () => {
  let component: AdminDashhoardComponent;
  let fixture: ComponentFixture<AdminDashhoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashhoardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashhoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
