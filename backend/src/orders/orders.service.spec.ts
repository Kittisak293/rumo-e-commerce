import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const ordersRepo = {
    findOne: jest.fn(),
    findOneByOrFail: jest.fn(),
    save: jest.fn(),
  };
  const noop = {};

  const buildService = () =>
    new OrdersService(
      ordersRepo as never,
      noop as never,
      noop as never,
      noop as never,
      noop as never,
      noop as never,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOneForUser', () => {
    it('returns the order when it belongs to the requesting user', async () => {
      const order = { id: 10, user: { id: 1 } };
      ordersRepo.findOne.mockResolvedValue(order);

      await expect(buildService().findOneForUser(10, 1)).resolves.toBe(order);
      expect(ordersRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 10, user: { id: 1 } } }),
      );
    });

    it("throws NotFoundException for another user's order (not a leak)", async () => {
      ordersRepo.findOne.mockResolvedValue(null);
      await expect(
        buildService().findOneForUser(10, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findTracking', () => {
    it('returns the order graph when owned by the requesting user', async () => {
      const order = { id: 10, user: { id: 1 }, shipments: [] };
      ordersRepo.findOne.mockResolvedValue(order);

      await expect(buildService().findTracking(10, 1)).resolves.toBe(order);
    });

    it("throws NotFoundException instead of leaking another user's shipment data", async () => {
      ordersRepo.findOne.mockResolvedValue(null);
      await expect(buildService().findTracking(10, 999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
