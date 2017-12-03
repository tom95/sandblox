import { TestBed, inject } from '@angular/core/testing';

import { TextureService } from './texture.service';

describe('TextureService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TextureService]
    });
  });

  it('should be created', inject([TextureService], (service: TextureService) => {
    expect(service).toBeTruthy();
  }));
});
