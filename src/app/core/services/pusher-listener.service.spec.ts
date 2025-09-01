import { TestBed } from '@angular/core/testing';

import { PusherListenerService } from './pusher-listener.service';

describe('PusherListenerService', () => {
  let service: PusherListenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PusherListenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
