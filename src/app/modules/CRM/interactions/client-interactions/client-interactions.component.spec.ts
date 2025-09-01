import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientInteractionsComponent } from './client-interactions.component';

describe('ClientInteractionsComponent', () => {
  let component: ClientInteractionsComponent;
  let fixture: ComponentFixture<ClientInteractionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientInteractionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientInteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
