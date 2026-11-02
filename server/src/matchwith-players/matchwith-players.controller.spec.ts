import { Test, TestingModule } from '@nestjs/testing';
import { MatchwithPlayersController } from './matchwith-players.controller';

describe('MatchwithPlayersController', () => {
  let controller: MatchwithPlayersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchwithPlayersController],
    }).compile();

    controller = module.get<MatchwithPlayersController>(MatchwithPlayersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
