import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FamilyMemberFormComponent } from './family-member-form.component';

describe('FamilyMemberFormComponent', () => {
  let component: FamilyMemberFormComponent;
  let fixture: ComponentFixture<FamilyMemberFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyMemberFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FamilyMemberFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
