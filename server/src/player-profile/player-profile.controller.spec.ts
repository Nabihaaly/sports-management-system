import { Test, TestingModule } from '@nestjs/testing';
import { PlayerProfileController } from './player-profile.controller';

describe('PlayerProfileController', () => {
  let controller: PlayerProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerProfileController],
    }).compile();

    controller = module.get<PlayerProfileController>(PlayerProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
