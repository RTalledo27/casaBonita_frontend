import { TestBed } from '@angular/core/testing';

import { ServicedeskService } from './servicedesk.service';

describe('ServicedeskService', () => {
  let service: ServicedeskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicedeskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
