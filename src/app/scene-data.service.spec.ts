import { TestBed, inject } from '@angular/core/testing';

import { SceneDataService } from './scene-data.service';

describe('SceneDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SceneDataService]
    });
  });

  it('should be created', inject([SceneDataService], (service: SceneDataService) => {
    expect(service).toBeTruthy();
  }));
});
