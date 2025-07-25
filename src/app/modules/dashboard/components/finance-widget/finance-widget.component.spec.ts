import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceWidgetComponent } from './finance-widget.component';

describe('FinanceWidgetComponent', () => {
  let component: FinanceWidgetComponent;
  let fixture: ComponentFixture<FinanceWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinanceWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
