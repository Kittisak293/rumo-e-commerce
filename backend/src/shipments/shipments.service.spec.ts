import { ShipmentsService } from './shipments.service';
import { ShipmentStatus } from './shipment-status.enum';
import { OrderStatus } from 'src/orders/order-status.enum';
import type { CreateShipmentDto } from './dto/create-shipment.dto';

describe('ShipmentsService', () => {
  const order = {
    id: 5,
    orderNumber: 'ORD-1',
    user: { email: 'buyer@example.com' },
  };
  const carrier = {
    id: 2,
    name: 'Kerry Express',
    trackingUrlTemplate: 'https://track/?n={trackingNumber}',
  };
  const dto: CreateShipmentDto = {
    orderId: 5,
    carrierId: 2,
    trackingNumber: 'TH123',
    status: ShipmentStatus.PENDING,
    estimatedDeliveryAt: '2026-08-12T00:00:00Z',
  };

  const shipmentsRepo = {
    create: jest.fn((v: unknown) => v),
    save: jest.fn((v: unknown) => Promise.resolve({ id: 1, ...(v as object) })),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
  };
  const ordersRepo = { findOneOrFail: jest.fn() };
  const carriersRepo = { findOneByOrFail: jest.fn() };
  const mailService = { sendShipmentNotification: jest.fn() };
  const ordersService = { transitionStatus: jest.fn() };

  const buildService = () =>
    new ShipmentsService(
      shipmentsRepo as never,
      ordersRepo as never,
      carriersRepo as never,
      mailService as never,
      ordersService as never,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    ordersRepo.findOneOrFail.mockResolvedValue(order);
    carriersRepo.findOneByOrFail.mockResolvedValue(carrier);
    mailService.sendShipmentNotification.mockResolvedValue(undefined);
  });

  it('moves the order to SHIPPED once the shipment is created', async () => {
    await buildService().create(dto);
    expect(ordersService.transitionStatus).toHaveBeenCalledWith(
      order.id,
      OrderStatus.SHIPPED,
    );
  });

  it('sends the dispatch email with a resolved tracking URL', async () => {
    await buildService().create(dto);
    expect(mailService.sendShipmentNotification).toHaveBeenCalledWith(
      'buyer@example.com',
      expect.objectContaining({
        orderNumber: 'ORD-1',
        carrierName: 'Kerry Express',
        trackingNumber: 'TH123',
        trackingUrl: 'https://track/?n=TH123',
      }),
    );
  });

  it('still creates the shipment when the dispatch email fails', async () => {
    mailService.sendShipmentNotification.mockRejectedValue(
      new Error('smtp down'),
    );
    await expect(buildService().create(dto)).resolves.toEqual(
      expect.objectContaining({ trackingNumber: 'TH123' }),
    );
    expect(ordersService.transitionStatus).toHaveBeenCalled();
  });
});
