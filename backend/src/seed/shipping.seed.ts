/**
 * Seeds the shipping domain so the customer tracking pages have something real
 * to render before an admin UI exists.
 *
 *   npm run seed:shipping                 # carriers only
 *   npm run seed:shipping -- --order=12   # + a shipment with a full timeline
 *
 * Runs through `createApplicationContext` rather than a standalone DataSource
 * so it picks up exactly the same env/DB config as the app (see app.module.ts).
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Carrier } from '../carriers/entities/carrier.entity';
import { Order } from '../orders/entities/order.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { ShipmentEvent } from '../shipment_events/entities/shipment_event.entity';
import { ShipmentStatus } from '../shipments/shipment-status.enum';
import { OrderStatus } from '../orders/order-status.enum';

const logger = new Logger('ShippingSeed');

const CARRIERS: Array<Partial<Carrier>> = [
  {
    name: 'Kerry Express',
    code: 'KERRY',
    website: 'https://th.kerryexpress.com',
    trackingUrlTemplate:
      'https://th.kerryexpress.com/th/track/?track={trackingNumber}',
    isActive: true,
  },
  {
    name: 'Flash Express',
    code: 'FLASH',
    website: 'https://www.flashexpress.com',
    trackingUrlTemplate:
      'https://www.flashexpress.com/tracking/?se={trackingNumber}',
    isActive: true,
  },
  {
    name: 'J&T Express',
    code: 'JNT',
    website: 'https://www.jtexpress.co.th',
    trackingUrlTemplate:
      'https://www.jtexpress.co.th/index/query/gzquery.html?bills={trackingNumber}',
    isActive: true,
  },
];

/** Mirrors the sample timeline in the design doc (turn 3a), newest last. */
const TIMELINE: Array<{
  status: ShipmentStatus;
  description: string;
  location: string | null;
  /** Hours before "now" that this event happened. */
  hoursAgo: number;
}> = [
  {
    status: ShipmentStatus.PENDING,
    description: 'ระบบยืนยันการชำระเงินและแจ้งร้านค้าให้เตรียมจัดส่ง',
    location: null,
    hoursAgo: 52,
  },
  {
    status: ShipmentStatus.PICKED_UP,
    description: 'ผู้ขายส่งมอบพัสดุให้ Kerry Express เรียบร้อย',
    location: 'คลังสินค้า RUMO บางนา',
    hoursAgo: 33,
  },
  {
    status: ShipmentStatus.IN_TRANSIT,
    description: 'พัสดุถูกนำขึ้นรถขนส่งมุ่งหน้าปลายทาง',
    location: 'ศูนย์กระจายสินค้าลาดกระบัง',
    hoursAgo: 29,
  },
  {
    status: ShipmentStatus.IN_TRANSIT,
    description: 'พัสดุถึงศูนย์คัดแยกปลายทางแล้ว กำลังรอจัดรอบส่งถึงผู้รับ',
    location: 'ศูนย์คัดแยกสินค้าชลบุรี',
    hoursAgo: 24,
  },
];

function parseOrderId(): number | null {
  const arg = process.argv.find((a) => a.startsWith('--order='));
  if (!arg) return null;
  const id = Number(arg.split('=')[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function seedCarriers(dataSource: DataSource): Promise<Carrier[]> {
  const repo = dataSource.getRepository(Carrier);
  const saved: Carrier[] = [];

  for (const data of CARRIERS) {
    const existing = await repo.findOne({ where: { code: data.code } });
    if (existing) {
      // Refresh the template — the old seed data used a `{tracking}`
      // placeholder that buildTrackingUrl never substitutes.
      existing.trackingUrlTemplate = data.trackingUrlTemplate;
      existing.website = data.website;
      existing.isActive = true;
      saved.push(await repo.save(existing));
      logger.log(`Updated carrier ${data.code}`);
    } else {
      saved.push(await repo.save(repo.create(data)));
      logger.log(`Created carrier ${data.code}`);
    }
  }
  return saved;
}

async function seedShipmentForOrder(
  dataSource: DataSource,
  orderId: number,
  carrier: Carrier,
): Promise<void> {
  const ordersRepo = dataSource.getRepository(Order);
  const shipmentsRepo = dataSource.getRepository(Shipment);
  const eventsRepo = dataSource.getRepository(ShipmentEvent);

  const order = await ordersRepo.findOne({ where: { id: orderId } });
  if (!order) {
    logger.error(`Order #${orderId} not found — skipping shipment seed`);
    return;
  }

  const existing = await shipmentsRepo.findOne({
    where: { order: { id: orderId } },
  });
  if (existing) {
    logger.warn(`Order #${orderId} already has shipment #${existing.id}`);
    return;
  }

  const now = Date.now();
  const hoursFromNow = (h: number) => new Date(now + h * 3_600_000);
  const last = TIMELINE[TIMELINE.length - 1];

  const shipment = await shipmentsRepo.save(
    shipmentsRepo.create({
      order,
      carrier,
      trackingNumber: `TH${String(orderId).padStart(6, '0')}RUMO01`,
      status: last.status,
      lastLocation: last.location,
      estimatedDeliveryAt: hoursFromNow(24),
    }),
  );

  await eventsRepo.save(
    TIMELINE.map((event) =>
      eventsRepo.create({
        shipment,
        status: event.status,
        description: event.description,
        location: event.location,
        occurredAt: hoursFromNow(-event.hoursAgo),
      }),
    ),
  );

  // Straight assignment rather than transitionStatus: a seeded order may sit
  // in any state, and the point here is to land on a realistic one.
  order.status = OrderStatus.SHIPPING;
  await ordersRepo.save(order);

  logger.log(
    `Created shipment #${shipment.id} (${shipment.trackingNumber}) with ${TIMELINE.length} events for order #${orderId}`,
  );
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const dataSource = app.get(DataSource);
    const carriers = await seedCarriers(dataSource);

    const orderId = parseOrderId();
    if (orderId === null) {
      logger.log('No --order=<id> given — carriers only. Done.');
      return;
    }
    await seedShipmentForOrder(dataSource, orderId, carriers[0]);
  } finally {
    await app.close();
  }
}

void main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
