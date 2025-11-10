import { Test, TestingModule } from '@nestjs/testing';
import { AttributionController } from './attribution.controller';

describe('AttributionController', () => {
  let controller: AttributionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributionController],
    }).compile();

    controller = module.get<AttributionController>(AttributionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  
});
