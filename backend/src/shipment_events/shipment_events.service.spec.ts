import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentEventsService } from './shipment_events.service';

describe('ShipmentEventsService', () => {
  let service: ShipmentEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShipmentEventsService],
    }).compile();

    service = module.get<ShipmentEventsService>(ShipmentEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
