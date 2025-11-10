import { Test, TestingModule } from '@nestjs/testing';
import { PdfExportService } from './pdf-export.service';

describe('PdfExportService', () => {
  let service: PdfExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfExportService],
    }).compile();

    service = module.get<PdfExportService>(PdfExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
