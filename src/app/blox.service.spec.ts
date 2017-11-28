import { TestBed, inject } from '@angular/core/testing';

import { BloxService } from './blox.service';

describe('BloxService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BloxService]
    });
  });

  it('should be created', inject([BloxService], (service: BloxService) => {
    expect(service).toBeTruthy();
  }));
});
