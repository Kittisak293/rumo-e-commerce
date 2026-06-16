import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentEventsController } from './shipment_events.controller';
import { ShipmentEventsService } from './shipment_events.service';

describe('ShipmentEventsController', () => {
  let controller: ShipmentEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShipmentEventsController],
      providers: [ShipmentEventsService],
    }).compile();

    controller = module.get<ShipmentEventsController>(ShipmentEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
