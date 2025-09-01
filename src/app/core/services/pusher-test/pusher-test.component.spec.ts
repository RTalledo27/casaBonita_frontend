import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PusherTestComponent } from './pusher-test.component';

describe('PusherTestComponent', () => {
  let component: PusherTestComponent;
  let fixture: ComponentFixture<PusherTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PusherTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PusherTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
