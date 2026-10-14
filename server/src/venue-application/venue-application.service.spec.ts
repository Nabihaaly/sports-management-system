import { Test, TestingModule } from '@nestjs/testing';
import { VenueApplicationService } from './venue-application.service';

describe('VenueApplicationService', () => {
  let service: VenueApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VenueApplicationService],
    }).compile();

    service = module.get<VenueApplicationService>(VenueApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
