import { Test, TestingModule } from '@nestjs/testing';
import { VenueApplicationController } from './venue-application.controller';

describe('VenueApplicationController', () => {
  let controller: VenueApplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenueApplicationController],
    }).compile();

    controller = module.get<VenueApplicationController>(VenueApplicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
