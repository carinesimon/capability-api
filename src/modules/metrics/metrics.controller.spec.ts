import { BadRequestException } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: Pick<MetricsService, 'stageSeriesByDay'>;

  beforeEach(() => {
    metricsService = {
      stageSeriesByDay: jest.fn(),
    };
    controller = new MetricsController(metricsService as MetricsService);
  });

  it('throws when stage is missing', async () => {
    await expect(
      controller.getStageSeries(undefined, '2026-01-01', '2026-01-31'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when stage is invalid', async () => {
    await expect(
      controller.getStageSeries('NOT_A_STAGE', '2026-01-01', '2026-01-31'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delegates to service when params are valid', async () => {
    const expected = { total: 0, byDay: [] };
    (metricsService.stageSeriesByDay as jest.Mock).mockResolvedValue(expected);
    const expectedStart = new Date('2026-01-01');
    const expectedEnd = new Date('2026-01-31');
    expectedEnd.setDate(expectedEnd.getDate() + 1);

    const result = await controller.getStageSeries(
      'CALL_REQUESTED',
      '2026-01-01',
      '2026-01-31',
    );

    expect(result).toEqual(expected);
    expect(metricsService.stageSeriesByDay).toHaveBeenCalledWith({
      start: expectedStart,
      end: expectedEnd,
      stage: LeadStage.CALL_REQUESTED,
      sourcesCsv: undefined,
      sourcesExcludeCsv: undefined,
      setterIdsCsv: undefined,
      closerIdsCsv: undefined,
      tagsCsv: undefined,
      leadCreatedFrom: undefined,
      leadCreatedTo: undefined,
    });
  });

  it('returns lead stages for metrics/stages', () => {
    expect(controller.getStages()).toEqual({
      stages: Object.values(LeadStage),
    });
  });
});
