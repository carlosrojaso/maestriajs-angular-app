import { TestBed } from '@angular/core/testing';

import { AppsyncService } from './appsync.service';

describe('AppsyncService', () => {
  let service: AppsyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppsyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
