import { TestBed } from '@angular/core/testing';

import { StreetTypeService } from './street-type.service';

describe('StreetTypeService', () => {
  let service: StreetTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreetTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
