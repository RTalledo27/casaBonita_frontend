import { TestBed } from '@angular/core/testing';

import { ManzanasService } from './manzanas.service';

describe('ManzanasService', () => {
  let service: ManzanasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManzanasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
