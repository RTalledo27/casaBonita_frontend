import { TestBed } from '@angular/core/testing';

import { ServicedeskActionService } from './servicedesk-action.service';

describe('ServicedeskActionService', () => {
  let service: ServicedeskActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicedeskActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
