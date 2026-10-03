import { Test, TestingModule } from '@nestjs/testing';
import { StudentTestService } from './student-test.service';

describe('StudentTestService', () => {
  let service: StudentTestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentTestService],
    }).compile();

    service = module.get<StudentTestService>(StudentTestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
