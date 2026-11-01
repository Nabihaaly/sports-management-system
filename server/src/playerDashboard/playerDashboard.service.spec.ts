import { Test, TestingModule } from '@nestjs/testing';
import { playerDashboardService } from './playerDashboard.service';

describe('playerDashboardService', () => {
  let service: playerDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [playerDashboardService],
    }).compile();

    service = module.get<playerDashboardService>(playerDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
