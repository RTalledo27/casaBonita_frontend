import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientFamilyMembersComponent } from './client-family-members.component';

describe('ClientFamilyMembersComponent', () => {
  let component: ClientFamilyMembersComponent;
  let fixture: ComponentFixture<ClientFamilyMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientFamilyMembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientFamilyMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
