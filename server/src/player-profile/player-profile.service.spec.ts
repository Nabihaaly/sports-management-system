import { Test, TestingModule } from '@nestjs/testing';
import { PlayerProfileService } from './player-profile.service';

describe('PlayerProfileService', () => {
  let service: PlayerProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerProfileService],
    }).compile();

    service = module.get<PlayerProfileService>(PlayerProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
