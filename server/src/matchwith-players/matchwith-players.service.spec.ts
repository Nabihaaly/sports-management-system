import { Test, TestingModule } from '@nestjs/testing';
import { MatchwithPlayersService } from './matchwith-players.service';

describe('MatchwithPlayersService', () => {
  let service: MatchwithPlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchwithPlayersService],
    }).compile();

    service = module.get<MatchwithPlayersService>(MatchwithPlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
