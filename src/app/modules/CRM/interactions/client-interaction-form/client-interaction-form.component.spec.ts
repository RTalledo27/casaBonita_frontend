import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientInteractionFormComponent } from './client-interaction-form.component';

describe('ClientInteractionFormComponent', () => {
  let component: ClientInteractionFormComponent;
  let fixture: ComponentFixture<ClientInteractionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientInteractionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientInteractionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
